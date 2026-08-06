const estado = vi.hoisted(() => ({ funcao: "ADMIN" }));

const verificarPermissao = (funcoes) => async (request, reply) => {
  if (!request.cookies?.access_token) {
    return reply.status(401).send({ erro: "Token de autenticação ausente." });
  }
  if (!funcoes.includes(estado.funcao)) {
    return reply.status(403).send({ erro: "Acesso negado." });
  }
  request.user = { id: "usuario-logado", funcao: estado.funcao };
};

const usuarioController = {
  listar: vi.fn(async (_request, reply) =>
    reply.send({ operacao: "listar", usuarios: [] }),
  ),
  listarACS: vi.fn(async (_request, reply) => reply.send({ usuarios: [] })),
  criar: vi.fn(async (_request, reply) =>
    reply.status(201).send({ operacao: "criar" }),
  ),
  atualizarAvatar: vi.fn(async (_request, reply) =>
    reply.send({ avatar_url: "https://cdn/avatar.webp" }),
  ),
  atualizar: vi.fn(),
  excluir: vi.fn(),
};

const Fastify = require("fastify");
const cookie = require("@fastify/cookie");
const rotasUsuarios = require("./rotasUsuarios");

const criarApp = async () => {
  const app = Fastify({ logger: false });
  await app.register(cookie);
  await app.register(rotasUsuarios, { verificarPermissao, usuarioController });
  return app;
};

describe("rotas de usuários", () => {
  beforeEach(() => {
    estado.funcao = "ADMIN";
  });

  it("deve negar a listagem sem sessão", async () => {
    const app = await criarApp();
    const resposta = await app.inject({ method: "GET", url: "/usuarios" });

    expect(resposta.statusCode).toBe(401);
    expect(resposta.json()).toEqual({ erro: "Token de autenticação ausente." });
    await app.close();
  });

  it.each(["ACS", "RECEPCAO"])(
    "deve negar a listagem para o perfil %s",
    async (funcao) => {
      estado.funcao = funcao;
      const app = await criarApp();
      const resposta = await app.inject({
        method: "GET",
        url: "/usuarios",
        cookies: { access_token: "jwt" },
      });

      expect(resposta.statusCode).toBe(403);
      await app.close();
    },
  );

  it("deve encaminhar GET e POST da mesma URL para operações distintas do ADMIN", async () => {
    const app = await criarApp();
    const sessao = { access_token: "jwt" };

    const listagem = await app.inject({
      method: "GET",
      url: "/usuarios",
      cookies: sessao,
    });
    const criacao = await app.inject({
      method: "POST",
      url: "/usuarios",
      cookies: sessao,
      payload: { nome: "Ana" },
    });

    expect(listagem.statusCode).toBe(200);
    expect(listagem.json()).toEqual({ operacao: "listar", usuarios: [] });
    expect(criacao.statusCode).toBe(201);
    expect(criacao.json()).toEqual({ operacao: "criar" });
    await app.close();
  });

  it.each(["ADMIN", "RECEPCAO", "ACS"])(
    "permite que %s atualize o próprio avatar",
    async (funcao) => {
      estado.funcao = funcao;
      const app = await criarApp();
      const resposta = await app.inject({
        method: "PATCH",
        url: "/usuarios/me/avatar",
        cookies: { access_token: "jwt" },
      });

      expect(resposta.statusCode).toBe(200);
      expect(resposta.json()).toEqual({
        avatar_url: "https://cdn/avatar.webp",
      });
      await app.close();
    },
  );
});
