const estado = vi.hoisted(() => ({ funcao: "ADMIN" }));

const verificarPermissao = (funcoes) => async (request, reply) => {
  if (!request.cookies?.access_token) return reply.status(401).send({ erro: "Sessão ausente." });
  if (!funcoes.includes(estado.funcao)) return reply.status(403).send({ erro: "Acesso negado." });
};

const consultaController = {
  listarAtrasadas: vi.fn(),
  listarTodas: vi.fn(),
  criar: vi.fn(),
  efetivarCancelamento: vi.fn(async (request, reply) =>
    reply.send({ consulta: { id: request.params.id, status_consulta: "CANCELADA" } }),
  ),
  registrarDesfecho: vi.fn(async (request, reply) =>
    reply.send({ consulta: { id: request.params.id, status_consulta: "REALIZADA" } }),
  ),
};

const Fastify = require("fastify");
const cookie = require("@fastify/cookie");
const rotasConsultas = require("./rotasConsultas");

describe("rotas de consultas", () => {
  it.each(["ADMIN", "RECEPCAO", "ACS"])(
    "permite efetivar cancelamento para %s",
    async (funcao) => {
      estado.funcao = funcao;
      const app = Fastify({ logger: false });
      await app.register(cookie);
      await app.register(rotasConsultas, {
        verificarPermissao,
        consultaController,
      });

      const resposta = await app.inject({
        method: "PATCH",
        url: "/consultas/11111111-1111-4111-8111-111111111111/cancelamento",
        cookies: { access_token: "jwt" },
      });

      expect(resposta.statusCode).toBe(200);
      await app.close();
    },
  );

  it.each(["ADMIN", "RECEPCAO"])(
    "permite registrar desfecho para %s",
    async (funcao) => {
      estado.funcao = funcao;
      const app = Fastify({ logger: false });
      await app.register(cookie);
      await app.register(rotasConsultas, { verificarPermissao, consultaController });

      const resposta = await app.inject({
        method: "PATCH",
        url: "/consultas/11111111-1111-4111-8111-111111111111/desfecho",
        cookies: { access_token: "jwt" },
        payload: { desfecho: "REALIZADA" },
      });

      expect(resposta.statusCode).toBe(200);
      await app.close();
    },
  );

  it("nega registro de desfecho para ACS", async () => {
    estado.funcao = "ACS";
    const app = Fastify({ logger: false });
    await app.register(cookie);
    await app.register(rotasConsultas, { verificarPermissao, consultaController });
    const resposta = await app.inject({
      method: "PATCH",
      url: "/consultas/11111111-1111-4111-8111-111111111111/desfecho",
      cookies: { access_token: "jwt" },
      payload: { desfecho: "FALTOU" },
    });
    expect(resposta.statusCode).toBe(403);
    await app.close();
  });
});
