const notificacaoRepository = require("../repositories/notificacaoRepository");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class NotificacaoService {
  async iniciarDisparoLote(dadosDisparo, authHeader) {
    const { pacientes, mensagemBase, usuario_id } = dadosDisparo;

    if (!pacientes || pacientes.length === 0) {
      throw new Error("A lista de pacientes está vazia.");
    }

    if (!mensagemBase || !mensagemBase.includes("{nome}")) {
      throw new Error(
        "A mensagem deve conter a variável {nome} para personalização.",
      );
    }

    this.processarFilaAssincrona(pacientes, mensagemBase, usuario_id);

    return {
      sucesso: true,
      mensagem: `Disparo em massa iniciado para ${pacientes.length} pacientes. O processo está rodando em segundo plano.`,
    };
  }

  async processarFilaAssincrona(pacientes, mensagemBase, usuario_id) {
    console.log(
      `[START] Iniciando fila de mensagens para ${pacientes.length} contatos.`,
    );

    for (const paciente of pacientes) {
      let primeiroNome = "";
      let textoFinal = "";
      let telefoneLimpo = "";

      try {
        const nomeReal = paciente.nome_completo || paciente.nome || "Paciente";
        primeiroNome = nomeReal.split(" ")[0];

        textoFinal = mensagemBase.replace("{nome}", primeiroNome);
        telefoneLimpo = this.sanitizarTelefone(paciente.telefone);
        const resultado = await this.enviarMensagemPaciente({
          paciente,
          mensagem: textoFinal,
          usuario_id,
        });
        telefoneLimpo = resultado.telefoneLimpo;

        console.log(
          `[OK] Mensagem enviada para ${primeiroNome} (ID: ${resultado.mensagem_id ?? "N/A"})`,
        );
      } catch (error) {
        console.error(
          `[ERRO] Falha ao enviar para paciente ID ${paciente.id}:`,
          error.message,
        );

        await this.registrarFalhaEnvio({
          paciente,
          telefone: telefoneLimpo,
          mensagem: textoFinal || mensagemBase,
          usuario_id,
          status: "ERRO",
        }).catch(() => null);
      }

      const tempoAleatorio =
        Math.floor(Math.random() * (9000 - 4000 + 1)) + 4000;
      await delay(tempoAleatorio);
    }

    console.log(`[FIM] Fila das mensagens finalizada.`);
  }

  sanitizarTelefone(telefone) {
    if (!telefone) {
      throw new Error("Paciente sem telefone cadastrado.");
    }

    const telefoneLimpo = telefone.replace(/\D/g, "");
    return telefoneLimpo.startsWith("55") ? telefoneLimpo : `55${telefoneLimpo}`;
  }

  async enviarMensagemPaciente({ paciente, mensagem, usuario_id }) {
    const telefoneLimpo = this.sanitizarTelefone(paciente.telefone);

    const payloadEvolution = {
      number: telefoneLimpo,
      text: mensagem,
      textMessage: { text: mensagem },
    };

    const respostaEvolution = await fetch(
      `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE_NAME}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.EVOLUTION_API_KEY,
        },
        body: JSON.stringify(payloadEvolution),
      },
    );

    const textData = await respostaEvolution.text();

    if (!respostaEvolution.ok) {
      throw new Error(
        `Status ${respostaEvolution.status} - Detalhe: ${textData}`,
      );
    }

    const jsonData = JSON.parse(textData);
    const idDaMensagem = jsonData?.key?.id || jsonData?.id || null;

    console.log("[EVOLUTION_DIAG] mensagem_id extraído do sendText:", {
      origem: "NotificacaoService",
      paciente_id: paciente.id,
      mensagem_id: idDaMensagem,
      temKeyId: Boolean(jsonData?.key?.id),
      temIdRaiz: Boolean(jsonData?.id),
    });

    if (!idDaMensagem) {
      console.error(
        "[NOTIFICACAO] ⚠️ mensagem_id ausente na resposta da Evolution. " +
          "O status ENTREGUE/LIDO não será atualizado para esta mensagem. " +
          "Resposta recebida: " +
          JSON.stringify(jsonData),
      );
    }

    await notificacaoRepository.registrarEnvio({
      paciente_id: paciente.id,
      telefone_destino: telefoneLimpo,
      texto_enviado: mensagem,
      status: "ENVIADO",
      usuario_id: usuario_id || null,
      mensagem_id: idDaMensagem,
    });

    return {
      telefoneLimpo,
      mensagem_id: idDaMensagem,
      resposta: jsonData,
    };
  }

  async registrarFalhaEnvio({
    paciente,
    telefone,
    mensagem,
    usuario_id,
    status = "ERRO",
  }) {
    const telefoneDestino = telefone || paciente.telefone || "N/A";

    return notificacaoRepository.registrarEnvio({
      paciente_id: paciente.id,
      telefone_destino: telefoneDestino,
      texto_enviado: mensagem,
      status,
      usuario_id: usuario_id || null,
      mensagem_id: null,
    });
  }
}

module.exports = new NotificacaoService();
