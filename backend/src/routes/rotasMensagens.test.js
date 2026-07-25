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
  enviarMensagem: vi.fn(async (_request, reply) => reply.send({ sucesso: true })),
  listarStatusMensagens: vi.fn(async (request, reply) =>
    reply.send({ consulta_ids: request.query.consulta_ids, mensagens: [] }),
  ),
  checarStatusWhatsApp: vi.fn(async (_request, reply) =>
    reply.send({ status: "connected" }),
  ),
};

const Fastify = require("fastify");
const cookie = require("@fastify/cookie");
const rotasMensagens = require("./rotasMensagens");

const consultaId = "11111111-1111-4111-8111-111111111111";

const criarApp = async () => {
  const app = Fastify({ logger: false });
  await app.register(cookie);
  await app.register(rotasMensagens, {
    mensagemController: controller,
    verificarPermissao,
  });
  return app;
};

describe("rotas de mensagens", () => {
  beforeEach(() => {
    estado.funcao = "ADMIN";
    vi.clearAllMocks();
  });

  it("rejeita consulta de status sem sessão", async () => {
    const app = await criarApp();
    const resposta = await app.inject({
      method: "GET",
      url: `/mensagens/status?consulta_ids=${consultaId}`,
    });

    expect(resposta.statusCode).toBe(401);
    expect(controller.listarStatusMensagens).not.toHaveBeenCalled();
    await app.close();
  });

  it.each(["ADMIN", "RECEPCAO", "ACS"])(
    "permite polling autenticado para %s",
    async (funcao) => {
      estado.funcao = funcao;
      const app = await criarApp();
      const resposta = await app.inject({
        method: "GET",
        url: `/mensagens/status?consulta_ids=${consultaId}`,
        cookies: { access_token: "jwt" },
      });

      expect(resposta.statusCode).toBe(200);
      expect(resposta.json()).toEqual({ consulta_ids: consultaId, mensagens: [] });
      await app.close();
    },
  );

  it("rejeita query sem consulta_ids antes do controller", async () => {
    const app = await criarApp();
    const resposta = await app.inject({
      method: "GET",
      url: "/mensagens/status",
      cookies: { access_token: "jwt" },
    });

    expect(resposta.statusCode).toBe(400);
    expect(controller.listarStatusMensagens).not.toHaveBeenCalled();
    await app.close();
  });
});
