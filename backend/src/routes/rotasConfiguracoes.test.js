const estado = { funcao: "ADMIN" };

const verificarPermissao = (funcoes) => async (request, reply) => {
  if (!request.cookies?.access_token) {
    return reply.status(401).send({ erro: "Token ausente." });
  }
  if (!funcoes.includes(estado.funcao)) {
    return reply.status(403).send({ erro: "Acesso negado." });
  }
};

const logController = {
  listar: vi.fn(async (request, reply) => reply.send({ query: request.query })),
};

const Fastify = require("fastify");
const cookie = require("@fastify/cookie");
const rotasConfiguracoes = require("./rotasConfiguracoes");

const criarApp = async () => {
  const app = Fastify({ logger: false });
  await app.register(cookie);
  await app.register(rotasConfiguracoes, {
    verificarPermissao,
    logController,
  });
  return app;
};

describe("rotas de configurações", () => {
  beforeEach(() => {
    estado.funcao = "ADMIN";
    vi.clearAllMocks();
  });

  it("aplica os valores padrão da paginação", async () => {
    const app = await criarApp();
    const resposta = await app.inject({
      method: "GET",
      url: "/logs",
      cookies: { access_token: "jwt" },
    });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toEqual({ query: { pagina: 1, limite: 5 } });
    await app.close();
  });

  it("aceita página e limite válidos", async () => {
    const app = await criarApp();
    const resposta = await app.inject({
      method: "GET",
      url: "/logs?pagina=3&limite=10",
      cookies: { access_token: "jwt" },
    });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toEqual({ query: { pagina: 3, limite: 10 } });
    await app.close();
  });

  it.each(["pagina=0", "pagina=abc", "limite=0", "limite=51"])(
    "rejeita paginação inválida: %s",
    async (query) => {
      const app = await criarApp();
      const resposta = await app.inject({
        method: "GET",
        url: `/logs?${query}`,
        cookies: { access_token: "jwt" },
      });

      expect(resposta.statusCode).toBe(400);
      expect(logController.listar).not.toHaveBeenCalled();
      await app.close();
    },
  );

  it.each(["RECEPCAO", "ACS"])("nega acesso para %s", async (funcao) => {
    estado.funcao = funcao;
    const app = await criarApp();
    const resposta = await app.inject({
      method: "GET",
      url: "/logs",
      cookies: { access_token: "jwt" },
    });

    expect(resposta.statusCode).toBe(403);
    await app.close();
  });
});
