const consultaService = require('../services/consultaService');
const { executarController } = require("./controllerExecutor");

class ConsultaController {
  
  async listarAtrasadas(request, reply) {
    const authHeader = request.headers.authorization;
    return executarController(request, reply, {
      executar: () => consultaService.obterConsultasAtrasadas(authHeader),
      responder: (resultado) => reply.send({
        regra_aplicada: `${resultado.dias_regra} dias sem consulta`,
        corte_de_data: resultado.corte_de_data,
        total_alertas: resultado.dados.length,
        consultas: resultado.dados
      }),
    });
  }

  async listarTodas(request, reply) {
    const authHeader = request.headers.authorization;
    return executarController(request, reply, {
      executar: () => consultaService.obterTodasConsultas(authHeader),
      responder: (consultas) => reply.send({ total: consultas.length, consultas }),
    });
  }

  async criar(request, reply) {
    const dadosBody = request.body;
    const authHeader = request.headers.authorization;
    return executarController(request, reply, {
      executar: () => consultaService.agendarConsulta(dadosBody, authHeader),
      auditoria: () => ({
        acao: "AGENDOU_CONSULTA",
        detalhes: `Agendamento para paciente ID: ${dadosBody.paciente_id} com ${dadosBody.tipo_profissional}`,
      }),
      responder: (consulta) => reply.status(201).send({
        mensagem: 'Consulta agendada com sucesso!',
        consulta
      }),
    });
  }

}

module.exports = new ConsultaController();
