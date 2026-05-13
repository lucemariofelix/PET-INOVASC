const consultaService = require('../services/consultaService');

class ConsultaController {
  
  // Como usamos classe, precisamos usar arrow function para não perder o 'this' se houver, 
  // ou apenas declarar o método e chamar limpo na rota.
  async listarAtrasadas(request, reply) {
    try {
      const resultado = await consultaService.obterConsultasAtrasadas();

      // Devolve a resposta estruturada
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

  async criar(request, reply) {
    try {
      const dadosBody = request.body;
      const consulta = await consultaService.agendarConsulta(dadosBody);
      
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