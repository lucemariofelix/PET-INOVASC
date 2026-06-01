const mensagemService = require("../services/mensagemService");

// PRIMEIRA FUNÇÃO: Enviar a mensagem
exports.enviarMensagem = async (request, reply) => {
  try {
    const dadosBody = request.body;
    const authHeader = request.headers.authorization; // Captura o token JWT do usuário

    // Encaminha a execução para o Service
    const resultado = await mensagemService.dispararMensagem(
      dadosBody,
      authHeader,
    );

    return reply.status(200).send({ sucesso: true, evolution: resultado });
  } catch (error) {
    request.log.error("Erro ao disparar WhatsApp:", error);

    // NOVA INTERCETAÇÃO: Avisa que precisa ler o QR Code
    if (error.message === "WHATSAPP_DESCONECTADO") {
      return reply.status(409).send({ 
        erro: "O WhatsApp do posto está desconectado. Por favor, vá à aba de configurações e leia o QR Code antes de enviar mensagens." 
      });
    }

    // Tratamento para o erro de validação do telefone
    if (error.message.includes("não possui um número")) {
      return reply.status(400).send({ erro: error.message });
    }

    // Tratamento caso o token expire no meio da gravação do histórico (RLS 42501)
    if (error.code === "42501") {
      return reply.status(401).send({
        erro: "Sessão expirada ou sem permissão para registrar mensagens. Faça login novamente.",
      });
    }

    return reply
      .status(500)
      .send({
        erro: "Falha interna ao tentar disparar ou registrar a mensagem.",
      });
  }
}; // <--- A CHAVE E O PONTO-E-VÍRGULA QUE SEPARAM AS FUNÇÕES ESTÃO AQUI!

// SEGUNDA FUNÇÃO: Checar o Status (AGORA ISOLADA E COM O EXPORTS CORRETO)
exports.checarStatusWhatsApp = async (request, reply) => {
  try {
    // Chama o service que criamos
    const status = await mensagemService.statusConexaoWhatsApp();
    return reply.send(status);
  } catch (error) {
    request.log.error(error);
    return reply
      .status(500)
      .send({ erro: "Falha interna ao checar WhatsApp." });
  }
};
