const pacienteService = require('../services/pacienteService');

class PacienteController {
  
  // Método atrelado ao POST
  async criar(request, reply) {
    try {
      const dadosBody = request.body; 
      
      const paciente = await pacienteService.cadastrarPaciente(dadosBody);
      
      // Controller define o status code e o formato da resposta
      return reply.status(201).send({ 
        mensagem: 'Paciente cadastrado com sucesso!', 
        paciente 
      });
    } catch (error) {
      // request.log é a forma recomendada de logar no Fastify dentro do ciclo da requisição
      request.log.error(error); 
      const statusCode = error.message.includes('obrigatório') ? 400 : 500;
      return reply.status(statusCode).send({ erro: error.message });
    }
  }

  // Método atrelado ao GET
  async listar(request, reply) {
    try {
      const pacientes = await pacienteService.listarPacientes();
      return reply.send({ total: pacientes.length, pacientes });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ erro: 'Falha ao buscar pacientes.' });
    }
  }
}

// Exportamos a instância da classe
module.exports = new PacienteController();