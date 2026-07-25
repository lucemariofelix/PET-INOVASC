const mensagemRepository = require("../repositories/mensagemRepository");
const notificacaoRepository = require("../repositories/notificacaoRepository");
const webhookRepository = require("../repositories/webhookRepository");
const { AppError } = require("../errors/AppError");
const { randomUUID } = require("node:crypto");

const TIPOS_MENSAGEM = Object.freeze({
  LEMBRETE_CONSULTA: "LEMBRETE_CONSULTA",
  AGENDAMENTO_CONSULTA: "AGENDAMENTO_CONSULTA",
  AVISO_GERAL: "AVISO_GERAL",
  GRUPO_ACOMPANHAMENTO: "GRUPO_ACOMPANHAMENTO",
});

const BOTAO_CONFIRMAR_PRESENCA = "CONFIRMAR_PRESENCA";
const MENSAGEM_WHATSAPP_DESCONECTADO =
  "O WhatsApp do posto está desconectado. Vá à aba de configurações e leia o QR Code antes de enviar mensagens.";

const erroWhatsAppDesconectado = () =>
  new AppError(
    MENSAGEM_WHATSAPP_DESCONECTADO,
    409,
    "WHATSAPP_DESCONECTADO",
  );

const respostaIndicaDesconexao = (texto) => {
  const mensagem = String(texto || "").toLowerCase();
  return (
    mensagem.includes("not connected") ||
    mensagem.includes("instance disconnected") ||
    mensagem.includes("connection closed") ||
    mensagem.includes("connection state is close")
  );
};

class MensageriaService {
  async retry(fn, tentativas = 3, intervaloMs = 300) {
    try {
      return await fn();
    } catch (err) {
      if (tentativas <= 1) throw err;
      console.warn(`⚠️ Retry... (${tentativas - 1} restantes)`);
      await new Promise((resolve) => setTimeout(resolve, intervaloMs));
      return this.retry(fn, tentativas - 1, intervaloMs);
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  calcularDelayDisparo(minMs = 4000, maxMs = 9000) {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  }

  sanitizarTelefone(telefone) {
    if (!telefone) {
      throw new Error("Paciente sem telefone cadastrado.");
    }

    const telefoneLimpo = telefone.replace(/\D/g, "");
    return telefoneLimpo.startsWith("55") ? telefoneLimpo : `55${telefoneLimpo}`;
  }

  validarConsentimento(paciente) {
    if (paciente?.consentimento_msg !== true) {
      throw new Error(
        "Paciente não autorizou o recebimento de mensagens via WhatsApp.",
      );
    }
  }

  formatarData(dataReferencia) {
    if (!dataReferencia) return "";

    const dataString = String(dataReferencia).split("T")[0];
    if (!dataString.includes("-")) return dataReferencia;

    const [ano, mes, dia] = dataString.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  montarTexto({
    tipo = TIPOS_MENSAGEM.LEMBRETE_CONSULTA,
    nome,
    profissional,
    status_consulta,
    data_referencia,
    templateOverride,
    mensagem,
  }) {
    const nomePaciente = nome || "Paciente";
    const primeiroNome = nomePaciente.split(" ")[0] || "Paciente";
    const dataFormatada = this.formatarData(data_referencia);

    if (templateOverride) {
      return templateOverride
        .replaceAll("{nome}", primeiroNome)
        .replaceAll("{nome_completo}", nomePaciente)
        .replaceAll("{profissional}", profissional || "equipe")
        .replaceAll("{data}", dataFormatada);
    }

    if (mensagem) {
      return mensagem.replaceAll("{nome}", primeiroNome);
    }

    if (tipo === TIPOS_MENSAGEM.AGENDAMENTO_CONSULTA) {
      return `Olá, *${nomePaciente}*! Sua consulta com o(a) profissional *${profissional}* foi agendada para *${dataFormatada}*.\n\nCaso não possa comparecer, avise a unidade de saúde com antecedência.`;
    }

    let texto = `Olá, *${nomePaciente}*! Aqui é do seu Posto Potengi.\n\n`;
    if (status_consulta === "atrasado" || status_consulta === "urgente") {
      texto += `Consta em nosso sistema que seu acompanhamento com o(a) profissional *${profissional}* está pendente desde *${dataFormatada}*.\n\nPor favor, procure o seu Agente Comunitário de Saúde (ACS) ou a recepção do posto para regularizar sua situação. Cuidar da sua saúde é fundamental!`;
    } else {
      texto += `Este é um lembrete de que você tem um acompanhamento previsto com o(a) profissional *${profissional}* para a data *${dataFormatada}*.\n\nContamos com a sua presença!`;
    }

    return texto;
  }

  obterConfigEvolution() {
    return {
      evolutionUrl: process.env.EVOLUTION_API_URL,
      apikey: process.env.EVOLUTION_API_KEY,
      instanceName: process.env.EVOLUTION_INSTANCE_NAME,
    };
  }

  async statusConexaoWhatsApp() {
    const { evolutionUrl, apikey, instanceName } = this.obterConfigEvolution();

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
          headers: { apikey },
        },
      );

      const stateData = await resState.json();
      const statusInstancia = stateData?.instance?.state || stateData?.state;

      if (statusInstancia === "open") return { status: "connected" };

      const resConnect = await fetch(
        `${evolutionUrl}/instance/connect/${instanceName}`,
        {
          method: "GET",
          headers: { apikey },
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

  async verificarConexaoWhatsApp() {
    const statusZap = await this.statusConexaoWhatsApp();

    if (statusZap.status !== "connected") {
      throw erroWhatsAppDesconectado();
    }

    return { conectado: true, estado: "open" };
  }

  montarPayloadEvolution({ telefone, texto, usarBotaoConfirmacao, botaoId }) {
    if (!usarBotaoConfirmacao) {
      return {
        endpoint: "sendText",
        body: {
          number: telefone,
          text: texto,
        },
      };
    }

    return {
      endpoint: "sendButtons",
      body: {
        number: telefone,
        title: "Confirmação de consulta",
        description: texto,
        footer: "Unidade de saúde",
        buttons: [
          {
            type: "reply",
            displayText: "Confirmar presença",
            id: botaoId,
          },
        ],
      },
    };
  }

  async enviarEvolution({ telefone, texto, usarBotaoConfirmacao, botaoId }) {
    const { evolutionUrl, apikey, instanceName } = this.obterConfigEvolution();

    const payload = this.montarPayloadEvolution({
      telefone,
      texto,
      usarBotaoConfirmacao,
      botaoId,
    });

    const resposta = await fetch(
      `${evolutionUrl}/message/${payload.endpoint}/${instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey,
        },
        body: JSON.stringify(payload.body),
      },
    );

    const textData = await resposta.text();

    if (!resposta.ok) {
      console.error("[EVOLUTION] Falha ao enviar mensagem.", {
        status: resposta.status,
        resposta: textData,
      });
      if (respostaIndicaDesconexao(textData)) {
        throw erroWhatsAppDesconectado();
      }
      throw new AppError(
        "Não foi possível enviar a mensagem pelo WhatsApp. Tente novamente mais tarde.",
        502,
        "WHATSAPP_PROVIDER_ERROR",
      );
    }

    return JSON.parse(textData);
  }

  async registrarHistorico(dadosHistorico, authHeader) {
    if (authHeader) {
      return mensagemRepository.salvarHistorico(dadosHistorico, authHeader);
    }

    return notificacaoRepository.registrarEnvio(dadosHistorico);
  }

  async registrarFalhaEnvio({
    paciente,
    telefone,
    mensagem,
    usuario_id,
    status = "ERRO",
    tipo = TIPOS_MENSAGEM.AVISO_GERAL,
  }) {
    const telefoneDestino = telefone || paciente?.telefone || "N/A";

    return notificacaoRepository.registrarEnvio({
      paciente_id: paciente?.id || null,
      telefone_destino: telefoneDestino,
      texto_enviado: mensagem,
      status,
      usuario_id: usuario_id || null,
      mensagem_id: null,
      tipo_mensagem: tipo,
      confirmacao_status: null,
      botao_id: null,
    });
  }

  async processarLote({
    pacientes,
    mensagemBase,
    usuario_id,
    tipo = TIPOS_MENSAGEM.AVISO_GERAL,
  }) {
    console.log(
      `[START] Iniciando fila de mensagens para ${pacientes.length} contatos.`,
    );

    for (const paciente of pacientes) {
      const nomeReal = paciente.nome_completo || paciente.nome || "Paciente";
      const primeiroNome = nomeReal.split(" ")[0];
      const textoFinal = mensagemBase.replace("{nome}", primeiroNome);
      let telefoneLimpo = "";

      try {
        telefoneLimpo = this.sanitizarTelefone(paciente.telefone);
        const resultado = await this.enviarMensagem({
          paciente,
          mensagem: textoFinal,
          usuario_id,
          tipo,
        });
        telefoneLimpo = resultado.telefoneLimpo;

        console.log(
          `[OK] Mensagem enviada para ${primeiroNome} (ID: ${resultado.mensagem_id ?? "N/A"})`,
        );
      } catch (error) {
        console.error(
          `[ERRO] Falha ao enviar para paciente ID ${paciente?.id}:`,
          error.message,
        );

        await this.registrarFalhaEnvio({
          paciente,
          telefone: telefoneLimpo,
          mensagem: textoFinal,
          usuario_id,
          status: "ERRO",
          tipo,
        }).catch(() => null);
      }

      await this.delay(this.calcularDelayDisparo());
    }

    console.log("[FIM] Fila das mensagens finalizada.");
  }

  async enviarMensagem({
    paciente,
    consulta_id,
    usuario_id,
    tipo = TIPOS_MENSAGEM.LEMBRETE_CONSULTA,
    profissional,
    status_consulta,
    data_referencia,
    mensagem,
    templateOverride,
    usarBotaoConfirmacao = false,
    authHeader,
  }) {
    if (!paciente?.id || !paciente?.telefone) {
      throw new Error("Paciente inválido para envio de mensagem.");
    }

    this.validarConsentimento(paciente);

    const telefoneLimpo = this.sanitizarTelefone(paciente.telefone);
    const texto = this.montarTexto({
      tipo,
      nome: paciente.nome_completo || paciente.nome,
      profissional,
      status_consulta,
      data_referencia,
      templateOverride,
      mensagem,
    });
    const botaoId = usarBotaoConfirmacao
      ? `${BOTAO_CONFIRMAR_PRESENCA}:${consulta_id || paciente.id}:${randomUUID()}`
      : null;

    const { evolutionUrl, apikey, instanceName } = this.obterConfigEvolution();

    if (!evolutionUrl || !apikey || !instanceName) {
      const historico = await this.registrarHistorico(
        {
          telefone_destino: telefoneLimpo,
          texto_enviado: texto,
          status: "SIMULADO",
          status_ordem: 0,
          paciente_id: paciente.id || null,
          consulta_id: consulta_id || null,
          usuario_id: usuario_id || null,
          tipo_mensagem: tipo,
          confirmacao_status: usarBotaoConfirmacao ? "PENDENTE" : null,
          botao_id: botaoId,
        },
        authHeader,
      );
      return {
        aviso: "Mensagem simulada. Configure as variáveis.",
        mensagem: historico,
      };
    }

    const jsonData = await this.enviarEvolution({
      telefone: telefoneLimpo,
      texto,
      usarBotaoConfirmacao,
      botaoId,
    });
    const idDaMensagem = jsonData?.key?.id || jsonData?.id || null;

    if (!idDaMensagem) {
      console.error(
        "[MENSAGERIA] mensagem_id ausente na resposta da Evolution. " +
          "O status ENTREGUE/LIDO não será atualizado para esta mensagem.",
      );
    }

    const historico = await this.registrarHistorico(
      {
        paciente_id: paciente.id,
        consulta_id: consulta_id || null,
        telefone_destino: telefoneLimpo,
        texto_enviado: texto,
        status: "ENVIADO",
        status_ordem: 1,
        usuario_id: usuario_id || null,
        mensagem_id: idDaMensagem,
        tipo_mensagem: tipo,
        confirmacao_status: usarBotaoConfirmacao ? "PENDENTE" : null,
        botao_id: botaoId,
      },
      authHeader,
    );

    return {
      telefoneLimpo,
      mensagem_id: idDaMensagem,
      resposta: jsonData,
      texto,
      mensagem: historico,
    };
  }

  normalizarEventoWebhook(evento) {
    return String(evento || "").toUpperCase().replace(/\./g, "_");
  }

  obterItensWebhook(payload) {
    return Array.isArray(payload?.data) ? payload.data : [payload?.data];
  }

  async processarEventoWebhook(payload) {
    const eventoNormalizado = this.normalizarEventoWebhook(payload?.event);

    if (eventoNormalizado === "MESSAGES_UPSERT") {
      await this.processarConfirmacoesRecebidas(payload);
      return;
    }

    if (eventoNormalizado === "MESSAGES_UPDATE") {
      await this.processarAtualizacoesStatus(payload);
      return;
    }

    console.log(`[WEBHOOK] Evento ignorado: "${payload?.event}"`);
  }

  async processarAtualizacoesStatus(payload) {
    const itensArray = this.obterItensWebhook(payload);

    for (const data of itensArray) {
      const messageId = data?.keyId;
      const statusBruto = data?.update?.status ?? data?.status;
      const statusFormatado = this.mapearStatusMensagem(statusBruto);
      const ordemStatus = this.obterOrdemStatus(statusFormatado);
      const dataEvento = this.obterDataEvento(payload, data);

      console.log(
        "[WEBHOOK_STATUS]",
        JSON.stringify({
          eventoOriginal: payload?.event,
          eventoNormalizado: this.normalizarEventoWebhook(payload?.event),
          messageId: messageId ?? null,
          statusBruto: statusBruto ?? null,
          isFromMe: data?.fromMe ?? data?.key?.fromMe ?? null,
        }),
      );

      if (!messageId) {
        console.warn("[WEBHOOK] Ignorado: keyId ausente", { statusBruto });
        continue;
      }

      if (!statusFormatado) {
        console.warn("[WEBHOOK] Ignorado: status não reconhecido", {
          messageId,
          statusBruto,
        });
        continue;
      }

      await this.retry(() =>
        webhookRepository.atualizarStatusMensagem(messageId, {
          status: statusFormatado,
          ordem: ordemStatus,
          dataEvento,
        }),
      );
    }
  }

  async processarConfirmacoesRecebidas(payload) {
    const itensArray = this.obterItensWebhook(payload);

    for (const data of itensArray) {
      const fromMe = data?.fromMe ?? data?.key?.fromMe ?? true;

      if (fromMe !== false) continue;

      const botaoId = this.extrairBotaoConfirmacaoId(data);

      if (botaoId) {
        const dataEvento = this.obterDataEvento(payload, data);
        await this.retry(() =>
          webhookRepository.registrarConfirmacaoMensagem(botaoId, dataEvento),
        );
        continue;
      }

      console.log("[WEBHOOK] Mensagem recebida sem confirmação reconhecida");
    }
  }

  extrairBotaoConfirmacaoId(data) {
    let respostaInterativa = null;
    const paramsJson =
      data?.message?.interactiveResponseMessage?.nativeFlowResponseMessage
        ?.paramsJson;

    if (paramsJson) {
      try {
        const params = JSON.parse(paramsJson);
        respostaInterativa = params.id;
      } catch {
        console.warn("[WEBHOOK] Resposta interativa com paramsJson inválido");
      }
    }

    const candidatos = [
      data?.message?.buttonsResponseMessage?.selectedButtonId,
      data?.message?.templateButtonReplyMessage?.selectedId,
      data?.message?.listResponseMessage?.singleSelectReply?.selectedRowId,
      data?.buttonId,
      data?.selectedButtonId,
      data?.body,
      data?.message?.conversation,
      respostaInterativa,
    ].filter(Boolean);

    return candidatos.find((valor) =>
      String(valor).startsWith(`${BOTAO_CONFIRMAR_PRESENCA}:`),
    );
  }

  mapearStatusMensagem(statusBruto) {
    const statusComparacao = String(statusBruto).toUpperCase();

    if (
      statusComparacao === "DELIVERED" ||
      statusComparacao === "SERVER_ACK" ||
      statusComparacao === "DELIVERY_ACK" ||
      statusComparacao === "RECEIVED" ||
      statusComparacao === "2" ||
      statusComparacao === "3"
    ) {
      return "ENTREGUE";
    }

    if (
      statusComparacao === "READ" ||
      statusComparacao === "VIEWED" ||
      statusComparacao === "PLAYED" ||
      statusComparacao === "4" ||
      statusComparacao === "5"
    ) {
      return "LIDO";
    }

    return null;
  }

  obterOrdemStatus(status) {
    if (status === "LIDO") return 3;
    if (status === "ENTREGUE") return 2;
    return 0;
  }

  obterDataEvento(payload, data) {
    const valor = data?.date_time || payload?.date_time;
    const dataEvento = valor ? new Date(valor) : new Date();

    return Number.isNaN(dataEvento.getTime())
      ? new Date().toISOString()
      : dataEvento.toISOString();
  }
}

module.exports = new MensageriaService();
module.exports.TIPOS_MENSAGEM = TIPOS_MENSAGEM;
module.exports.BOTAO_CONFIRMAR_PRESENCA = BOTAO_CONFIRMAR_PRESENCA;
