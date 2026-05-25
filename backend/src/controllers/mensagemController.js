const mensagemService = require('../services/mensagemService');

exports.enviarMensagem = async (request, reply) => {
  try {
    const dadosBody = request.body;
    
    // Entrega toda a responsabilidade para o Service
    const resultado = await mensagemService.dispararMensagem(dadosBody);

    return reply.status(200).send({ sucesso: true, evolution: resultado });
  } catch (error) {
    request.log.error('Erro ao disparar WhatsApp:', error);
    // Se for o nosso erro de telefone ausente, devolve 400. Se for erro da AWS, devolve 500.
    const statusCode = error.message.includes('não possui um número') ? 400 : 500;
    return reply.status(statusCode).send({ erro: error.message });
  }
};
