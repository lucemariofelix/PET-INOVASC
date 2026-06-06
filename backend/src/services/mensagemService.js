// IMPORTAÇÃO: Chamar o repositório de dados para salvar no banco
const mensagemRepository = require("../repositories/mensagemRepository");

class MensagemService {
  // ========================================================================
  // MÉTODO 1: DISPARO DE MENSAGENS (COM TÉCNICA DE OURO)
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
          paciente_id: paciente_id || null,
          consulta_id: consulta_id || null,
        },
        authHeader,
      );
      return { aviso: "Mensagem simulada. Configure as variáveis." };
    }

    // =======================================================
    // NOVA TRAVA DE SEGURANÇA: Verifica se o Zap está online
    // =======================================================
    const statusZap = await this.statusConexaoWhatsApp();
    if (statusZap.status !== "connected") {
      throw new Error("WHATSAPP_DESCONECTADO"); 
    }
    // =======================================================

    // Disparo Real
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

    // TÉCNICA DE OURO: Extrair a matrícula (ID) da mensagem recém disparada
    const idDaMensagem = jsonData?.key?.id || jsonData?.id || null;

    console.log("[EVOLUTION_DIAG] mensagem_id extraído do sendText:", {
      origem: "MensagemService",
      mensagem_id: idDaMensagem,
      temKeyId: Boolean(jsonData?.key?.id),
      temIdRaiz: Boolean(jsonData?.id),
    });

    // Salva o histórico Real no Supabase com o ID atrelado
    await mensagemRepository.salvarHistorico(
      {
        telefone_destino: telefoneFormatado,
        texto_enviado: texto,
        status: "ENVIADO",
        paciente_id: paciente_id || null,
        consulta_id: consulta_id || null,
        mensagem_id: idDaMensagem, // <-- Nova coluna
      },
      authHeader,
    );

    return jsonData;
  }

  // ========================================================================
  // MÉTODO 2: CHECAGEM DE STATUS E GERAÇÃO DO QR CODE (CORRIGIDO)
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

      // Se já conectou de vez, sucesso!
      if (statusInstancia === "open") return { status: "connected" };

      // Tenta obter o QR Code independentemente se o status é "connecting" ou "close"
      const resConnect = await fetch(
        `${evolutionUrl}/instance/connect/${instanceName}`,
        {
          method: "GET",
          headers: { apikey: apikey },
        },
      );

      const connectData = await resConnect.json();

      // O PULO DO GATO: Se existir um QR Code em base64 na resposta, ele ganha prioridade!
      // Isso evita que o QR Code pisque e suma quando o frontend fizer a checagem de 5 em 5 segundos
      if (connectData && connectData.base64) {
        return { status: "qrcode", qrcode: connectData.base64 };
      }

      // Só devolvemos o "connecting" genérico se realmente NÃO houver QR code para desenhar
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
