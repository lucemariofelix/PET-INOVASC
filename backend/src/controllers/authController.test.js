vi.mock("../services/authService");
vi.mock("../repositories/logRepository");

const authService = require("../services/authService");
const logRepository = require("../repositories/logRepository");
const authController = require("./authController");

const createReplyMock = () => {
  const reply = {
    setCookie: vi.fn(() => reply),
    clearCookie: vi.fn(() => reply),
    send: vi.fn(() => reply),
    status: vi.fn(() => reply),
  };
  return reply;
};

describe("AuthController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "test";
    logRepository.registrar = vi.fn().mockResolvedValue();
  });

  describe("login", () => {
    it("deve gravar access_token em cookie HttpOnly e responder apenas usuario", async () => {
      authService.login = vi.fn().mockResolvedValue({
        accessToken: "jwt-cookie",
        expiresIn: 3600,
        usuario: {
          id: "user-1",
          nome: "Admin",
          funcao: "ADMIN",
        },
      });

      const request = {
        body: { email: "admin@ubs.com", senha: "senha" },
        log: { error: vi.fn() },
      };
      const reply = createReplyMock();

      await authController.login(request, reply);

      expect(authService.login).toHaveBeenCalledWith("admin@ubs.com", "senha");
      expect(reply.setCookie).toHaveBeenCalledWith(
        "access_token",
        "jwt-cookie",
        {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 3600,
        },
      );
      expect(reply.send).toHaveBeenCalledWith({
        usuario: {
          id: "user-1",
          nome: "Admin",
          funcao: "ADMIN",
        },
      });
      expect(reply.send.mock.calls[0][0]).not.toHaveProperty("accessToken");
      expect(reply.send.mock.calls[0][0]).not.toHaveProperty("token");
    });

    it("deve usar cookie SameSite none e secure em produção", async () => {
      process.env.NODE_ENV = "production";
      authService.login = vi.fn().mockResolvedValue({
        accessToken: "jwt-cookie",
        expiresIn: 3600,
        usuario: { id: "user-1", nome: "Admin", funcao: "ADMIN" },
      });

      const request = {
        body: { email: "admin@ubs.com", senha: "senha" },
        log: { error: vi.fn() },
      };
      const reply = createReplyMock();

      await authController.login(request, reply);

      expect(reply.setCookie).toHaveBeenCalledWith(
        "access_token",
        "jwt-cookie",
        expect.objectContaining({
          secure: true,
          sameSite: "none",
        }),
      );
    });
  });

  describe("logout", () => {
    it("deve limpar o cookie access_token", async () => {
      const reply = createReplyMock();

      await authController.logout({}, reply);

      expect(reply.clearCookie).toHaveBeenCalledWith("access_token", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
      });
      expect(reply.send).toHaveBeenCalledWith({ sucesso: true });
    });
  });
});
