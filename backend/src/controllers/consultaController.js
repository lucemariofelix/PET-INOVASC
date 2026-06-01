const consultaService = require('../services/consultaService');
const logRepository = require("../repositories/logRepository"); // <-- IMPORTADO

class ConsultaController {
  
  async listarAtrasadas(request, reply) {
    try {
      const resultado = await consultaService.obterConsultasAtrasadas();
      return reply.send({ 
        regra_aplicada: `${resultado.dias_regra} dias sem consulta`,
        corte_de_data: resultado.corte_de_data,
        total_alertas: resultado.dados.length, 
        consultas: resultado.dados 
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ erro: 'Falha ao processar motor de regras de consultas.' });
    }
  }

  async listarTodas(request, reply) {
    try {
      const authHeader = request.headers.authorization; 
      const consultas = await consultaService.obterTodasConsultas(authHeader);
      return reply.send({ total: consultas.length, consultas });
    } catch (error) {
      request.log.error(error);
      if (error.code === 'PGRST303') {
        return reply.status(401).send({ erro: 'Sessão expirada. Por favor, faça login novamente.' });
      }
      return reply.status(500).send({ erro: 'Falha ao buscar consultas.' });
    }
  }

  async criar(request, reply) {
    try {
      const dadosBody = request.body;
      const authHeader = request.headers.authorization; 
      
      const consulta = await consultaService.agendarConsulta(dadosBody, authHeader);
      
      // RECUPERA O NOME DE QUEM ESTÁ LOGADO (Injetado pelo middleware)
      const nomeUsuario = request.user?.nome || 'Usuário Desconhecido';
      
      // REGISTO DE AUDITORIA CORRIGIDO
      await logRepository.registrar(
        nomeUsuario, // <-- Substituímos o 'null' pelo nome de quem agendou
        'AGENDOU_CONSULTA', 
        `Agendamento para paciente ID: ${dadosBody.paciente_id} com ${dadosBody.tipo_profissional}`
      );

      return reply.status(201).send({ 
        mensagem: 'Consulta agendada com sucesso!', 
        consulta 
      });
    } catch (error) {
      request.log.error(error);
      const statusCode = error.message.includes('obrigatório') ? 400 : 500;
      return reply.status(statusCode).send({ erro: error.message });
    }
  }

}

module.exports = new ConsultaController();
