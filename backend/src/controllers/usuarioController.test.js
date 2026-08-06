vi.mock("../services/usuarioService");
vi.mock("../services/avatarService");
vi.mock("../repositories/logRepository");

const avatarService = require("../services/avatarService");
const logRepository = require("../repositories/logRepository");
const usuarioController = require("./usuarioController");

describe("UsuarioController avatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("usa a identidade da sessão, responde a URL e registra auditoria", async () => {
    const arquivo = { fieldname: "avatar" };
    const request = {
      isMultipart: () => true,
      file: vi.fn().mockResolvedValue(arquivo),
      user: { id: "usuario-logado", funcao: "ACS" },
      headers: { authorization: "Bearer token" },
    };
    const reply = { send: vi.fn((payload) => payload) };
    avatarService.atualizarAvatar = vi
      .fn()
      .mockResolvedValue("https://cdn/avatar.webp?v=1");
    logRepository.registrar = vi.fn().mockResolvedValue(undefined);

    await usuarioController.atualizarAvatar(request, reply);

    expect(avatarService.atualizarAvatar).toHaveBeenCalledWith({
      arquivo,
      usuarioId: "usuario-logado",
      authHeader: "Bearer token",
    });
    expect(logRepository.registrar).toHaveBeenCalledWith(
      "usuario-logado",
      "ATUALIZOU_AVATAR",
      "Atualizou a própria foto de perfil.",
    );
    expect(reply.send).toHaveBeenCalledWith({
      avatar_url: "https://cdn/avatar.webp?v=1",
    });
  });

  it("trata requisição não multipart como avatar ausente", async () => {
    const request = {
      isMultipart: () => false,
      file: vi.fn(),
      user: { id: "usuario-logado" },
      headers: { authorization: "Bearer token" },
    };
    const reply = { send: vi.fn() };
    avatarService.atualizarAvatar = vi
      .fn()
      .mockRejectedValue(new Error("avatar ausente"));

    await expect(
      usuarioController.atualizarAvatar(request, reply),
    ).rejects.toThrow("avatar ausente");
    expect(request.file).not.toHaveBeenCalled();
    expect(avatarService.atualizarAvatar).toHaveBeenCalledWith(
      expect.objectContaining({ arquivo: undefined }),
    );
  });
});
