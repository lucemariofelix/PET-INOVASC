const mensagemRepository = require("../repositories/mensagemRepository");

class MensagemService {
  // ========================================================================
  // MÉTODO 1: DISPARO DE MENSAGENS
  // ========================================================================
  async dispararMensagem(
    {
      paciente_id,
      consulta_id,
      telefone,
      nome,
      profissional,
      status_consulta,
      data_referencia,
    },
    authHeader,
  ) {
    if (!telefone)
      throw new Error(
        "Este paciente não possui um número de telefone cadastrado.",
      );

    const numeroLimpo = telefone.replace(/\D/g, "");
    const telefoneFormatado = numeroLimpo.startsWith("55")
      ? numeroLimpo
      : `55${numeroLimpo}`;

    let dataFormatada = data_referencia;
    if (data_referencia && data_referencia.includes("-")) {
      const [ano, mes, dia] = data_referencia.split("-");
      dataFormatada = `${dia}/${mes}/${ano}`;
    }

    let texto = `Olá, *${nome}*! Aqui é do seu Posto Potengi.\n\n`;
    if (status_consulta === "atrasado" || status_consulta === "urgente") {
      texto += `Consta em nosso sistema que seu acompanhamento com o(a) profissional *${profissional}* está pendente desde *${dataFormatada}*.\n\nPor favor, procure o seu Agente Comunitário de Saúde (ACS) ou a recepção do posto para regularizar sua situação. Cuidar da sua saúde é fundamental!`;
    } else {
      texto += `Este é um lembrete de que você tem um acompanhamento previsto com o(a) profissional *${profissional}* para a data *${dataFormatada}*.\n\nContamos com a sua presença!`;
    }

    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const apikey = process.env.EVOLUTION_API_KEY;
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME;

    if (!evolutionUrl || !apikey || !instanceName) {
      console.log("Simulação de Envio:", { telefoneFormatado, texto });
      await mensagemRepository.salvarHistorico(
        {
          telefone_destino: telefoneFormatado,
          texto_enviado: texto,
          status: "SIMULADO",
          status_ordem: 1,
          paciente_id: paciente_id || null,
          consulta_id: consulta_id || null,
        },
        authHeader,
      );
      return { aviso: "Mensagem simulada. Configure as variáveis." };
    }

    // Verifica se o WhatsApp está online antes de disparar
    const statusZap = await this.statusConexaoWhatsApp();
    if (statusZap.status !== "connected") {
      throw new Error("WHATSAPP_DESCONECTADO");
    }

    const response = await fetch(
      `${evolutionUrl}/message/sendText/${instanceName}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: apikey },
        body: JSON.stringify({ number: telefoneFormatado, text: texto }),
      },
    );

    const textData = await response.text();

    if (!response.ok) {
      throw new Error(`Falha Evolution (${response.status}): ${textData}`);
    }

    const jsonData = JSON.parse(textData);

    const idDaMensagem = jsonData?.key?.id || jsonData?.id || null;

    console.log("[EVOLUTION_DIAG] mensagem_id extraído do sendText:", {
      origem: "MensagemService",
      mensagem_id: idDaMensagem,
      temKeyId: Boolean(jsonData?.key?.id),
      temIdRaiz: Boolean(jsonData?.id),
    });

    if (!idDaMensagem) {
      console.error(
        "[MENSAGEM] ⚠️ mensagem_id ausente na resposta da Evolution. " +
        "O status ENTREGUE/LIDO não será atualizado para esta mensagem. " +
        "Resposta recebida: " + JSON.stringify(jsonData),
      );
    }

    // PROBLEMA 3 CORRIGIDO: status_ordem incluído no insert para garantir
    // que o webhookRepository consiga atualizar via .lt("status_ordem", 2).
    // Sem esse campo, NULL < 2 retorna NULL no Postgres e nenhuma linha
    // é atualizada — status trava em ENVIADO para sempre.
    await mensagemRepository.salvarHistorico(
      {
        telefone_destino: telefoneFormatado,
        texto_enviado: texto,
        status: "ENVIADO",
        status_ordem: 1,
        paciente_id: paciente_id || null,
        consulta_id: consulta_id || null,
        mensagem_id: idDaMensagem,
      },
      authHeader,
    );

    return jsonData;
  }

  // ========================================================================
  // MÉTODO 2: CHECAGEM DE STATUS E GERAÇÃO DO QR CODE
  // ========================================================================
  async statusConexaoWhatsApp() {
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const apikey = process.env.EVOLUTION_API_KEY;
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME;

    if (!evolutionUrl || !apikey || !instanceName) {
      return {
        status: "unconfigured",
        mensagem: "Variáveis da Evolution não configuradas no .env",
      };
    }

    try {
      const resState = await fetch(
        `${evolutionUrl}/instance/connectionState/${instanceName}`,
        {
          method: "GET",
          headers: { apikey: apikey },
        },
      );

      const stateData = await resState.json();
      const statusInstancia = stateData?.instance?.state || stateData?.state;

      if (statusInstancia === "open") return { status: "connected" };

      const resConnect = await fetch(
        `${evolutionUrl}/instance/connect/${instanceName}`,
        {
          method: "GET",
          headers: { apikey: apikey },
        },
      );

      const connectData = await resConnect.json();

      if (connectData && connectData.base64) {
        return { status: "qrcode", qrcode: connectData.base64 };
      }

      if (statusInstancia === "connecting") {
        return {
          status: "connecting",
          mensagem: "A iniciar e sincronizar conexões...",
        };
      }

      return {
        status: "disconnected",
        mensagem: "A instância está desconectada.",
      };
    } catch (error) {
      console.error("Erro ao conectar com Evolution API:", error);
      return {
        status: "error",
        mensagem: "Servidor do WhatsApp (Evolution) offline.",
      };
    }
  }
}

module.exports = new MensagemService();
