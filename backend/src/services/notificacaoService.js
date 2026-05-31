// src/services/notificacaoService.js
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

        telefoneLimpo = paciente.telefone.replace(/\D/g, "");
        if (!telefoneLimpo.startsWith("55")) {
          telefoneLimpo = `55${telefoneLimpo}`;
        }

        const payloadEvolution = {
          number: telefoneLimpo,
          text: textoFinal,
          textMessage: { text: textoFinal },
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

        // Lemos como texto primeiro por segurança
        const textData = await respostaEvolution.text();

        if (!respostaEvolution.ok) {
          throw new Error(
            `Status ${respostaEvolution.status} - Detalhe: ${textData}`,
          );
        }

        // TÉCNICA DE OURO: Parse do JSON e captura da matrícula da mensagem
        const jsonData = JSON.parse(textData);
        const idDaMensagem = jsonData?.key?.id || jsonData?.id || null;

        await notificacaoRepository.registrarEnvio({
          paciente_id: paciente.id,
          telefone_destino: telefoneLimpo,
          texto_enviado: textoFinal,
          status: "ENVIADO",
          usuario_id: usuario_id || null,
          mensagem_id: idDaMensagem, // <-- Nova coluna
        });

        console.log(
          `[OK] Mensagem enviada para ${primeiroNome} (Tel: ${telefoneLimpo} | ID: ${idDaMensagem})`,
        );
      } catch (error) {
        console.error(
          `[ERRO] Falha ao enviar para paciente ID ${paciente.id}:`,
          error.message,
        );

        await notificacaoRepository
          .registrarEnvio({
            paciente_id: paciente.id,
            telefone_destino: telefoneLimpo || paciente.telefone || "N/A",
            texto_enviado: textoFinal || mensagemBase,
            status: "ERRO",
            usuario_id: usuario_id || null,
          })
          .catch(() => null);
      }

      const tempoAleatorio =
        Math.floor(Math.random() * (9000 - 4000 + 1)) + 4000;
      await delay(tempoAleatorio);
    }

    console.log(`[FIM] Fila das mensagens finalizada.`);
  }
}

module.exports = new NotificacaoService();
