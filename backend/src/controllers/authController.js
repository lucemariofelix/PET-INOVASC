const authService = require('../services/authService');
const { executarController } = require("./controllerExecutor");

const getAuthCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  ...(maxAge ? { maxAge } : {}),
});

class AuthController {
  async login(request, reply) {
    const { email, senha } = request.body;

    return executarController(request, reply, {
      executar: () => authService.login(email, senha),
      auditoria: ({ resultado }) => ({
        usuario_id: resultado.usuario?.id || null,
        acao: "LOGIN",
        detalhes: `Sessão iniciada pelo email: ${email}`,
      }),
      auditoriaFalha: () => ({
        usuario_id: null,
        acao: "FALHA_LOGIN",
        detalhes: `Tentativa de acesso falhada para o email: ${email}`,
      }),
      responder: (resultado) =>
        reply
        .setCookie(
          "access_token",
          resultado.accessToken,
          getAuthCookieOptions(resultado.expiresIn),
        )
        .send({ usuario: resultado.usuario }),
    });
  }

  async logout(request, reply) {
    return reply
      .clearCookie("access_token", getAuthCookieOptions())
      .send({ sucesso: true });
  }
}

module.exports = new AuthController();
