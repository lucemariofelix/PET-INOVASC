const Fastify = require("fastify");
const errorHandler = require("./errorHandler");
const { AppError } = require("../errors/AppError");

describe("errorHandler HTTP", () => {
  it("deve responder conflito de email sem expor detalhes internos", async () => {
    const app = Fastify({ logger: false });
    app.setErrorHandler(errorHandler);
    app.post("/usuarios", async () => {
      throw new AppError(
        "Este e-mail já está cadastrado.",
        409,
        "EMAIL_ALREADY_REGISTERED",
      );
    });

    const resposta = await app.inject({ method: "POST", url: "/usuarios" });

    expect(resposta.statusCode).toBe(409);
    expect(resposta.json()).toEqual({
      code: "EMAIL_ALREADY_REGISTERED",
      erro: "Este e-mail já está cadastrado.",
    });

    await app.close();
  });

  it("deve ocultar mensagem de falha interna inesperada", async () => {
    const app = Fastify({ logger: false });
    app.setErrorHandler(errorHandler);
    app.get("/falha", async () => {
      const error = new Error("Internal auth hook timeout");
      error.code = "hook_timeout";
      throw error;
    });

    const resposta = await app.inject({ method: "GET", url: "/falha" });

    expect(resposta.statusCode).toBe(500);
    expect(resposta.json()).toEqual({
      code: "INTERNAL_SERVER_ERROR",
      erro: "Ocorreu um erro interno no servidor. Por favor, tente novamente mais tarde.",
    });

    await app.close();
  });

  it("deve responder desconexão do WhatsApp como conflito amigável", async () => {
    const app = Fastify({ logger: false });
    app.setErrorHandler(errorHandler);
    app.post("/mensagens/enviar", async () => {
      throw new AppError(
        "O WhatsApp do posto está desconectado. Vá à aba de configurações e leia o QR Code antes de enviar mensagens.",
        409,
        "WHATSAPP_DESCONECTADO",
      );
    });

    const resposta = await app.inject({
      method: "POST",
      url: "/mensagens/enviar",
    });

    expect(resposta.statusCode).toBe(409);
    expect(resposta.json()).toMatchObject({
      code: "WHATSAPP_DESCONECTADO",
      erro: expect.stringContaining("WhatsApp do posto está desconectado"),
    });
    await app.close();
  });

  it("deve responder falha técnica do provedor sem detalhes internos", async () => {
    const app = Fastify({ logger: false });
    app.setErrorHandler(errorHandler);
    app.post("/mensagens/enviar", async () => {
      throw new AppError(
        "Não foi possível enviar a mensagem pelo WhatsApp. Tente novamente mais tarde.",
        502,
        "WHATSAPP_PROVIDER_ERROR",
      );
    });

    const resposta = await app.inject({
      method: "POST",
      url: "/mensagens/enviar",
    });

    expect(resposta.statusCode).toBe(502);
    expect(resposta.json()).toEqual({
      code: "WHATSAPP_PROVIDER_ERROR",
      erro: "Não foi possível enviar a mensagem pelo WhatsApp. Tente novamente mais tarde.",
    });
    await app.close();
  });

  it("deve preservar 400 quando uma requisição declara JSON mas envia corpo vazio", async () => {
    const app = Fastify({ logger: false });
    app.setErrorHandler(errorHandler);
    app.delete("/grupos-acompanhamento/:id", async () => ({ sucesso: true }));

    const resposta = await app.inject({
      method: "DELETE",
      url: "/grupos-acompanhamento/22222222-2222-2222-2222-222222222222",
      headers: { "content-type": "application/json" },
    });

    expect(resposta.statusCode).toBe(400);
    expect(resposta.json()).toEqual({
      code: "VALIDATION_ERROR",
      erro: "O corpo JSON da requisição não pode estar vazio.",
    });
    await app.close();
  });

  it("deve mapear limite multipart para erro público de avatar", async () => {
    const app = Fastify({ logger: false });
    app.setErrorHandler(errorHandler);
    app.post("/avatar", async () => {
      const error = new Error("arquivo excedeu o limite interno");
      error.code = "FST_REQ_FILE_TOO_LARGE";
      throw error;
    });

    const resposta = await app.inject({ method: "POST", url: "/avatar" });

    expect(resposta.statusCode).toBe(413);
    expect(resposta.json()).toEqual({
      code: "AVATAR_TOO_LARGE",
      erro: "A foto deve ter no máximo 200 KB.",
    });
    await app.close();
  });

  it("deve rejeitar múltiplos arquivos de avatar sem expor erro interno", async () => {
    const app = Fastify({ logger: false });
    app.setErrorHandler(errorHandler);
    app.post("/avatar", async () => {
      const error = new Error("files limit reached");
      error.code = "FST_FILES_LIMIT";
      throw error;
    });

    const resposta = await app.inject({ method: "POST", url: "/avatar" });

    expect(resposta.statusCode).toBe(400);
    expect(resposta.json()).toEqual({
      code: "INVALID_AVATAR_UPLOAD",
      erro: "Envie apenas uma foto de perfil por vez.",
    });
    await app.close();
  });
});
