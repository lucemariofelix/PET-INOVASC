const mensagemService = require('../services/mensagemService');

exports.enviarMensagem = async (request, reply) => {
  try {
    const dadosBody = request.body;
    const authHeader = request.headers.authorization; // Captura o token JWT do usuário

    // Encaminha a execução para o Service
    const resultado = await mensagemService.dispararMensagem(dadosBody, authHeader);

    return reply.status(200).send({ sucesso: true, evolution: resultado });
  } catch (error) {
    request.log.error('Erro ao disparar WhatsApp:', error);
    
    // Tratamento para o erro de validação do telefone
    if (error.message.includes('não possui um número')) {
      return reply.status(400).send({ erro: error.message });
    }

    // Tratamento caso o token expire no meio da gravação do histórico (RLS 42501)
    if (error.code === '42501') {
      return reply.status(401).send({ 
        erro: 'Sessão expirada ou sem permissão para registrar mensagens. Faça login novamente.' 
      });
    }

    return reply.status(500).send({ erro: 'Falha interna ao tentar disparar ou registrar a mensagem.' });
  }
};
