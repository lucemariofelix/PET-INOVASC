const estado = { funcao: "ADMIN" };

const verificarPermissao = (funcoes) => async (request, reply) => {
  if (!request.cookies?.access_token) {
    return reply.status(401).send({ erro: "Token ausente." });
  }
  if (!funcoes.includes(estado.funcao)) {
    return reply.status(403).send({ erro: "Acesso negado." });
  }
};

const controller = {
  listar: vi.fn(async (_request, reply) => reply.send({ grupos: [] })),
  criar: vi.fn(async (_request, reply) => reply.status(201).send({})),
  disparar: vi.fn(async (_request, reply) =>
    reply.send({ operacao: "disparar" }),
  ),
  excluir: vi.fn(async (_request, reply) =>
    reply.send({ operacao: "excluir" }),
  ),
};

const Fastify = require("fastify");
const cookie = require("@fastify/cookie");
const rotasGruposAcompanhamento = require("./rotasGruposAcompanhamento");

const grupoId = "22222222-2222-2222-2222-222222222222";

const criarApp = async () => {
  const app = Fastify({ logger: false });
  await app.register(cookie);
  await app.register(rotasGruposAcompanhamento, {
    grupoAcompanhamentoController: controller,
    verificarPermissao,
  });
  return app;
};

describe("rotas de grupos de acompanhamento", () => {
  beforeEach(() => {
    estado.funcao = "ADMIN";
    vi.clearAllMocks();
  });

  it.each(["ACS", "RECEPCAO"])(
    "deve negar exclusão para o perfil %s",
    async (funcao) => {
      estado.funcao = funcao;
      const app = await criarApp();
      const resposta = await app.inject({
        method: "DELETE",
        url: `/grupos-acompanhamento/${grupoId}`,
        cookies: { access_token: "jwt" },
      });

      expect(resposta.statusCode).toBe(403);
      expect(controller.excluir).not.toHaveBeenCalled();
      await app.close();
    },
  );

  it("deve permitir exclusão para ADMIN sem confundir com o disparo", async () => {
    const app = await criarApp();
    const sessao = { access_token: "jwt" };

    const exclusao = await app.inject({
      method: "DELETE",
      url: `/grupos-acompanhamento/${grupoId}`,
      cookies: sessao,
    });
    const disparo = await app.inject({
      method: "POST",
      url: `/grupos-acompanhamento/${grupoId}/disparo`,
      cookies: sessao,
      payload: { mensagem: "Olá" },
    });

    expect(exclusao.statusCode).toBe(200);
    expect(exclusao.json()).toEqual({ operacao: "excluir" });
    expect(disparo.statusCode).toBe(200);
    expect(disparo.json()).toEqual({ operacao: "disparar" });
    await app.close();
  });
});
