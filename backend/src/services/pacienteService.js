const pacienteService = require('../services/pacienteService');

class PacienteController {
  
  // Método atrelado ao POST
  async criar(request, reply) {
    try {
      const dadosBody = request.body; 
      const authHeader = request.headers.authorization; // <-- PEGANDO O TOKEN
      
      // Passa o token como segundo parâmetro
      const paciente = await pacienteService.cadastrarPaciente(dadosBody, authHeader);
      
      return reply.status(201).send({ 
        mensagem: 'Paciente cadastrado com sucesso!', 
        paciente 
      });
    } catch (error) {
      request.log.error(error); 
      const statusCode = error.message.includes('obrigatório') ? 400 : 500;
      return reply.status(statusCode).send({ erro: error.message });
    }
  }

  // Método atrelado ao GET
  async listar(request, reply) {
    try {
      const authHeader = request.headers.authorization; // <-- PEGANDO O TOKEN
      
      // Passa o token para o service
      const pacientes = await pacienteService.listarPacientes(authHeader);
      
      return reply.send({ total: pacientes.length, pacientes });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ erro: 'Falha ao buscar pacientes.' });
    }
  }
}

module.exports = new PacienteController();
