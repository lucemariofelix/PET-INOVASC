const pacienteService = require("../services/pacienteService");

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

  // LISTAR (GET)
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

  // ATUALIZAR (PUT) - NOVO
  async atualizar(request, reply) {
    try {
      const { id } = request.params; // Captura da URL (/pacientes/123)
      const dadosBody = request.body;
      const authHeader = request.headers.authorization;

      const paciente = await pacienteService.atualizarPaciente(
        id,
        dadosBody,
        authHeader,
      );

      return reply.status(200).send({
        mensagem: "Paciente atualizado com sucesso!",
        paciente,
      });
    } catch (error) {
      request.log.error(error);

      // Tratamento para CPF/CNS duplicado em outro paciente
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
