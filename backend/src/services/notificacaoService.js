// src/services/notificacaoService.js
const notificacaoRepository = require("../repositories/notificacaoRepository");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class NotificacaoService {
  async iniciarDisparoLote(dadosDisparo, authHeader) {
    // Extraímos também o usuario_id (quem apertou o botão) do corpo da requisição
    const { pacientes, mensagemBase, usuario_id } = dadosDisparo;

    if (!pacientes || pacientes.length === 0) {
      throw new Error("A lista de pacientes está vazia.");
    }

    if (!mensagemBase || !mensagemBase.includes("{nome}")) {
      throw new Error(
        "A mensagem deve conter a variável {nome} para personalização.",
      );
    }

    // Libera a requisição do frontend imediatamente e roda o envio em background
    // Passamos o usuario_id para que a fila saiba quem disparou a ação
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
      // Declaramos as variáveis fora do try para o catch conseguir acessá-las se falhar
      let primeiroNome = "";
      let textoFinal = "";
      let telefoneLimpo = "";

      try {
        // CORREÇÃO: Busca o nome_completo para evitar erro ao tentar fatiar a string
        const nomeReal = paciente.nome_completo || paciente.nome || "Paciente";
        primeiroNome = nomeReal.split(" ")[0];

        textoFinal = mensagemBase.replace("{nome}", primeiroNome);

        telefoneLimpo = paciente.telefone.replace(/\D/g, "");
        if (!telefoneLimpo.startsWith("55")) {
          telefoneLimpo = `55${telefoneLimpo}`;
        }

        const payloadEvolution = {
          number: telefoneLimpo,
          textMessage: { text: textoFinal },
        };

        // 1. Dispara para o WhatsApp via Evolution API
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

        if (!respostaEvolution.ok) {
          throw new Error("Falha na API da Evolution");
        }

        // 2. Grava no histórico com as colunas exatas da tabela do Supabase
        await notificacaoRepository.registrarEnvio({
          paciente_id: paciente.id,
          telefone_destino: telefoneLimpo,
          texto_enviado: textoFinal,
          status: "ENVIADO",
          usuario_id: usuario_id || null,
        });

        console.log(
          `[OK] Mensagem enviada e registrada para ${primeiroNome} (${telefoneLimpo})`,
        );
      } catch (error) {
        console.error(
          `[ERRO] Falha ao enviar para paciente ID ${paciente.id}:`,
          error.message,
        );

        // Em caso de erro, grava o status negativo no banco para auditoria
        await notificacaoRepository
          .registrarEnvio({
            paciente_id: paciente.id,
            telefone_destino: telefoneLimpo || paciente.telefone || "N/A",
            texto_enviado: textoFinal || mensagemBase,
            status: "ERRO",
            usuario_id: usuario_id || null,
          })
          .catch(() => null); // O .catch() vazio ignora se o banco também falhar
      }

      // Delay de segurança anti-ban (entre 4 e 9 segundos)
      const tempoAleatorio =
        Math.floor(Math.random() * (9000 - 4000 + 1)) + 4000;
      await delay(tempoAleatorio);
    }

    console.log(`[FIM] Fila de mensagens finalizada.`);
  }
}

module.exports = new NotificacaoService();
