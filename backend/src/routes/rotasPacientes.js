const pacienteController = require("../controllers/pacienteController");
const { verificarPermissao } = require("../middlewares/authMiddleware");

const esquemaPaciente = {
  body: {
    type: "object",
    required: ["nome_completo", "cpf_cns", "data_nascimento"], // Campos obrigatórios
    properties: {
      nome_completo: { type: "string", minLength: 4, maxLength: 100 },
      cpf_cns: { type: "string", minLength: 11, maxLength: 15 },
      data_nascimento: { type: "string" },
      telefone: { type: "string", maxLength: 20 },
      endereco: { type: "string", maxLength: 255 },
      acs: { type: "string" },
      agente_id: {
        anyOf: [{ type: "string", minLength: 36, maxLength: 36 }, { type: "null" }],
      },
      condicao: { type: "string" },
      grupos_ids: {
        type: "array",
        items: { type: "string", minLength: 36, maxLength: 36 },
      },
    },
    // O pulo do gato: bloqueia QUALQUER campo extra que um hacker tente injetar no banco
    additionalProperties: false,
  },
};

const esquemaFiltrosPacientes = {
  querystring: {
    type: "object",
    properties: {
      grupo_id: { type: "string", minLength: 36, maxLength: 36 },
      agente_id: { type: "string", minLength: 36, maxLength: 36 },
    },
    additionalProperties: false,
  },
};

async function rotasPacientes(fastify, options) {
  const todosAutenticados = {
    preHandler: [verificarPermissao(["ADMIN", "RECEPCAO", "ACS"])],
  };

  // ADMIN e RECEPCAO têm permissão para criar e editar pacientes
  const adminERecepcao = {
    preHandler: [verificarPermissao(["ADMIN", "RECEPCAO"])],
  };

  // Leitura aberta para todos os usuários autenticados (incluindo ACS)
  fastify.get("/pacientes", todosAutenticados, pacienteController.listar);
  fastify.get(
    "/pacientes/filtros",
    {
      ...todosAutenticados,
      schema: esquemaFiltrosPacientes,
    },
    pacienteController.filtrar,
  );

  // Escrita e atualização trancadas E validadas (Unimos tudo no 2º parâmetro)
  fastify.post(
    "/pacientes",
    {
      ...adminERecepcao, // Traz o preHandler de segurança
      schema: esquemaPaciente, // Traz a blindagem de dados
    },
    pacienteController.criar,
  );

  fastify.put(
    "/pacientes/:id",
    {
      ...adminERecepcao, // Traz o preHandler de segurança
      schema: esquemaPaciente, // Traz a blindagem de dados
    },
    pacienteController.atualizar,
  );
}

module.exports = rotasPacientes;
