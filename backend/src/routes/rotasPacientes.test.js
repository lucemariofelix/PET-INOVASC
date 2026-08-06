const estado = vi.hoisted(() => ({ funcao: "ADMIN" }));

const verificarPermissao = (funcoes) => async (request, reply) => {
  if (!funcoes.includes(estado.funcao)) {
    return reply.status(403).send({ erro: "Acesso negado." });
  }
  request.user = { id: "usuario-1", funcao: estado.funcao };
};

const pacienteController = {
  listar: vi.fn(),
  filtrar: vi.fn(),
  criar: vi.fn(),
  atualizar: vi.fn(async (_request, reply) =>
    reply.send({ paciente: { id: "paciente-1" } }),
  ),
};

const Fastify = require("fastify");
const rotasPacientes = require("./rotasPacientes");

const payload = {
  nome_completo: "Maria da Silva",
  cpf_cns: "12345678901",
  data_nascimento: "1990-01-01",
  agente_id: null,
};

const criarApp = async () => {
  const app = Fastify({ logger: false });
  await app.register(rotasPacientes, {
    verificarPermissao,
    pacienteController,
  });
  return app;
};

describe("rota de atualização de pacientes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(["ADMIN", "RECEPCAO"])(
    "permite atualização pelo perfil %s",
    async (funcao) => {
      estado.funcao = funcao;
      const app = await criarApp();
      const resposta = await app.inject({
        method: "PUT",
        url: "/pacientes/paciente-1",
        payload,
      });

      expect(resposta.statusCode).toBe(200);
      await app.close();
    },
  );

  it("nega atualização pelo perfil ACS", async () => {
    estado.funcao = "ACS";
    const app = await criarApp();
    const resposta = await app.inject({
      method: "PUT",
      url: "/pacientes/paciente-1",
      payload,
    });

    expect(resposta.statusCode).toBe(403);
    expect(pacienteController.atualizar).not.toHaveBeenCalled();
    await app.close();
  });
});
