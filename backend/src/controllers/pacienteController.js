const pacienteService = require('../services/pacienteService');

class PacienteController {
  
  // Método atrelado ao POST
  async criar(request, reply) {
    try {
      const dadosBody = request.body; 
      const authHeader = request.headers.authorization; 
      
      const paciente = await pacienteService.cadastrarPaciente(dadosBody, authHeader);
      
      return reply.status(201).send({ 
        mensagem: 'Paciente cadastrado com sucesso!', 
        paciente 
      });
    } catch (error) {
      request.log.error(error); 

      // NOVA INTERCEPTAÇÃO: Impede cadastro de CPF/CNS duplicado (Código 23505 do PostgreSQL)
      if (error.code === '23505' || error.message?.includes('pacientes_cpf_cns_key')) {
        return reply.status(400).send({ 
          erro: 'Este CPF ou CNS já está cadastrado para outro paciente no sistema.' 
        });
      }
      
      // INTERCEPTAÇÃO: Violação de Segurança (RLS) ou Token Expirado
      if (error.code === '42501') {
        return reply.status(401).send({ 
          erro: 'Sessão expirada ou sem permissão. Por favor, faça login novamente.' 
        });
      }

      const statusCode = error.message.includes('obrigatório') ? 400 : 500;
      return reply.status(statusCode).send({ erro: error.message });
    }
  }

  // Método atrelado ao GET
  async listar(request, reply) {
    try {
      const authHeader = request.headers.authorization; 
      
      const pacientes = await pacienteService.listarPacientes(authHeader);
      
      return reply.send({ total: pacientes.length, pacientes });
    } catch (error) {
      request.log.error(error);

      // INTERCEPTAÇÃO: Violação de Segurança (RLS) ou Token Expirado
      if (error.code === '42501') {
        return reply.status(401).send({ 
          erro: 'Sessão expirada ou sem permissão. Por favor, faça login novamente.' 
        });
      }

      return reply.status(500).send({ erro: 'Falha ao buscar pacientes.' });
    }
  }
}

module.exports = new PacienteController();
