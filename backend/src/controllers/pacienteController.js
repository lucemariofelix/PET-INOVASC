const pacienteService = require("../services/pacienteService");
const logRepository = require("../repositories/logRepository"); // <-- IMPORTADO

class PacienteController {
  // CRIAR (POST)
  async criar(request, reply) {
    try {
      const dadosBody = request.body;
      const authHeader = request.headers.authorization;

      const paciente = await pacienteService.cadastrarPaciente(
        dadosBody,
        authHeader,
      );

      // REGISTO DE AUDITORIA
      await logRepository.registrar(
        null, 
        'CRIOU_PACIENTE', 
        `Cadastrou o paciente com CPF/CNS: ${dadosBody.cpf_cns || 'Não informado'}`
      );

      return reply.status(201).send({
        mensagem: "Paciente cadastrado com sucesso!",
        paciente,
      });
    } catch (error) {
      request.log.error(error);

      if (
        error.code === "23505" ||
        error.message?.includes("pacientes_cpf_cns_key")
      ) {
        return reply.status(400).send({
          erro: "Este CPF ou CNS já está cadastrado para outro paciente no sistema.",
        });
      }

      if (error.code === "42501") {
        return reply.status(401).send({
          erro: "Sessão expirada ou sem permissão. Por favor, faça login novamente.",
        });
      }

      const statusCode = error.message.includes("obrigatório") ? 400 : 500;
      return reply.status(statusCode).send({ erro: error.message });
    }
  }

  // LISTAR (GET) - SEM LOG (Ação de leitura contínua)
  async listar(request, reply) {
    try {
      const authHeader = request.headers.authorization;
      const pacientes = await pacienteService.listarPacientes(authHeader);
      return reply.send({ total: pacientes.length, pacientes });
    } catch (error) {
      request.log.error(error);
      if (error.code === "42501") {
        return reply.status(401).send({
          erro: "Sessão expirada ou sem permissão. Por favor, faça login novamente.",
        });
      }
      return reply.status(500).send({ erro: "Falha ao buscar pacientes." });
    }
  }

  // ATUALIZAR (PUT)
  async atualizar(request, reply) {
    try {
      const { id } = request.params;
      const dadosBody = request.body;
      const authHeader = request.headers.authorization;

      const paciente = await pacienteService.atualizarPaciente(
        id,
        dadosBody,
        authHeader,
      );

      // REGISTO DE AUDITORIA
      await logRepository.registrar(
        null, 
        'ATUALIZOU_PACIENTE', 
        `Atualizou os dados do paciente ID: ${id}`
      );

      return reply.status(200).send({
        mensagem: "Paciente atualizado com sucesso!",
        paciente,
      });
    } catch (error) {
      request.log.error(error);

      if (
        error.code === "23505" ||
        error.message?.includes("pacientes_cpf_cns_key")
      ) {
        return reply.status(400).send({
          erro: "Este CPF ou CNS já está vinculado a outro paciente cadastrado.",
        });
      }

      if (error.code === "42501") {
        return reply.status(401).send({
          erro: "Sessão expirada ou sem permissão para edição. Por favor, faça login novamente.",
        });
      }

      if (error.message.includes("não encontrado")) {
        return reply.status(404).send({ erro: error.message });
      }

      return reply
        .status(500)
        .send({ erro: "Falha interna ao tentar atualizar o paciente." });
    }
  }
}

module.exports = new PacienteController();
