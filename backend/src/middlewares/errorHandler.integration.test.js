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
});
