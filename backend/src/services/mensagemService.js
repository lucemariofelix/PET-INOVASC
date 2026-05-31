// IMPORTAÇÃO: Chamar o repositório de dados para salvar no banco
const mensagemRepository = require("../repositories/mensagemRepository");

class MensagemService {
  // ========================================================================
  // MÉTODO 1: DISPARO DE MENSAGENS (CORRIGIDO PARA EVITAR CRASH DE JSON)
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

    let texto = `Olá, *${nome}*! Aqui é da sua Unidade Básica de Saúde.\n\n`;
    if (status_consulta === "atrasado" || status_consulta === "urgente") {
      texto += `Consta em nosso sistema que seu acompanhamento com o(a) profissional *${profissional}* está pendente desde *${dataFormatada}*.\n\nPor favor, procure o seu Agente Comunitário de Saúde (ACS) ou a recepção da UBS para regularizar sua situação. Cuidar da sua saúde é fundamental!`;
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

    // Disparo Real
    const response = await fetch(
      `${evolutionUrl}/message/sendText/${instanceName}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: apikey },
        body: JSON.stringify({ number: telefoneFormatado, text: texto }),
      },
    );

    // CORREÇÃO: Lemos como texto primeiro para não quebrar se a API devolver HTML de erro
    const textData = await response.text();

    if (!response.ok) {
      throw new Error(`Falha Evolution (${response.status}): ${textData}`);
    }

    // Salva o histórico Real no Supabase
    await mensagemRepository.salvarHistorico(
      {
        telefone_destino: telefoneFormatado,
        texto_enviado: texto,
        status: "ENVIADO",
        paciente_id: paciente_id || null,
        consulta_id: consulta_id || null,
      },
      authHeader,
    );

    // Tentamos devolver como JSON apenas se deu Sucesso (200 OK)
    return JSON.parse(textData);
  }

  // ========================================================================
  // MÉTODO 2: CHECAGEM DE STATUS E GERAÇÃO DO QR CODE (CORRIGIDO PARA A TELA DE CONFIGURAÇÕES)
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
      // 1. Tenta buscar o estado da conexão primeiro
      const resState = await fetch(
        `${evolutionUrl}/instance/connectionState/${instanceName}`,
        {
          method: "GET",
          headers: { apikey: apikey },
        },
      );

      const stateData = await resState.json();
      const statusInstancia = stateData?.instance?.state || stateData?.state;

      // Se já estiver conectado, devolvemos logo o sucesso
      if (statusInstancia === "open") return { status: "connected" };
      if (statusInstancia === "connecting")
        return { status: "connecting", mensagem: "A sincronizar mensagens..." };

      // 2. Se não está conectado, pedimos o QR Code
      const resConnect = await fetch(
        `${evolutionUrl}/instance/connect/${instanceName}`,
        {
          method: "GET",
          headers: { apikey: apikey },
        },
      );

      const connectData = await resConnect.json();

      // Se a API devolveu a imagem em base64, o WhatsApp precisa ser lido
      if (connectData.base64) {
        return { status: "qrcode", qrcode: connectData.base64 };
      }

      return {
        status: "disconnected",
        mensagem: "Por favor, gere um novo código.",
      };
    } catch (error) {
      console.error("Erro ao conectar com Evolution API:", error);
      return {
        status: "error",
        mensagem: "Servidor do WhatsApp (Evolution) parece estar offline.",
      };
    }
  }
}

module.exports = new MensagemService();
