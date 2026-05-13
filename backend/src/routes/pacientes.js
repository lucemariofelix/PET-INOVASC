const pacienteController = require('../controllers/pacienteController');

async function rotasPacientes(fastify, options) {
  
  // O mapeamento fica limpo, legível e direto ao ponto
  fastify.post('/pacientes', pacienteController.criar);
  fastify.get('/pacientes', pacienteController.listar);

}

module.exports = rotasPacientes;