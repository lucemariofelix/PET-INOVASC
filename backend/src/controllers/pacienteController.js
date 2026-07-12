const pacienteService = require("../services/pacienteService");
const { executarController } = require("./controllerExecutor");

class PacienteController {
  // CRIAR (POST)
  async criar(request, reply) {
    const dadosBody = request.body;
    const authHeader = request.headers.authorization;
    return executarController(request, reply, {
      executar: () => pacienteService.cadastrarPaciente(dadosBody, authHeader),
      auditoria: () => ({
        acao: "CRIOU_PACIENTE",
        detalhes: `Cadastrou o paciente com CPF/CNS: ${dadosBody.cpf_cns || "Não informado"}`,
      }),
      responder: (paciente) => reply.status(201).send({
        mensagem: "Paciente cadastrado com sucesso!",
        paciente,
      }),
    });
  }

  // LISTAR (GET) - SEM LOG (Ação de leitura contínua)
  async listar(request, reply) {
    const authHeader = request.headers.authorization;
    return executarController(request, reply, {
      executar: () => pacienteService.listarPacientes(authHeader),
      responder: (pacientes) => reply.send({ total: pacientes.length, pacientes }),
    });
  }

  async filtrar(request, reply) {
    const authHeader = request.headers.authorization;
    return executarController(request, reply, {
      executar: () => pacienteService.filtrarPacientes(
        request.query,
        authHeader,
      ),
      responder: (pacientes) => reply.send({ total: pacientes.length, pacientes }),
    });
  }

  // ATUALIZAR (PUT)
  async atualizar(request, reply) {
    const { id } = request.params;
    const dadosBody = request.body;
    const authHeader = request.headers.authorization;
    return executarController(request, reply, {
      executar: () => pacienteService.atualizarPaciente(id, dadosBody, authHeader),
      auditoria: () => ({
        acao: "ATUALIZOU_PACIENTE",
        detalhes: `Atualizou os dados do paciente ID: ${id}`,
      }),
      responder: (paciente) => reply.status(200).send({
        mensagem: "Paciente atualizado com sucesso!",
        paciente,
      }),
    });
  }
}

module.exports = new PacienteController();
