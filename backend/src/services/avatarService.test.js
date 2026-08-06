vi.mock("../repositories/avatarRepository");

const avatarRepository = require("../repositories/avatarRepository");
const avatarService = require("./avatarService");

const criarWebp = (tamanho = 20) => {
  const buffer = Buffer.alloc(tamanho);
  buffer.write("RIFF", 0, "ascii");
  buffer.write("WEBP", 8, "ascii");
  return buffer;
};

const criarArquivo = (sobrescritas = {}) => ({
  fieldname: "avatar",
  filename: "avatar.webp",
  mimetype: "image/webp",
  toBuffer: vi.fn().mockResolvedValue(criarWebp()),
  ...sobrescritas,
});

describe("AvatarService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    avatarRepository.salvar = vi.fn();
    avatarRepository.atualizarPerfil = vi.fn();
  });

  it("salva WebP no usuário autenticado e persiste URL versionada", async () => {
    vi.spyOn(Date, "now").mockReturnValue(123456);
    avatarRepository.salvar.mockResolvedValue(
      "https://projeto.supabase.co/storage/v1/object/public/avatars/u-1/avatar.webp",
    );
    avatarRepository.atualizarPerfil.mockResolvedValue(true);

    const resultado = await avatarService.atualizarAvatar({
      arquivo: criarArquivo(),
      usuarioId: "u-1",
      authHeader: "Bearer token",
    });

    expect(avatarRepository.salvar).toHaveBeenCalledWith(
      "u-1",
      expect.any(Buffer),
      "Bearer token",
    );
    expect(avatarRepository.atualizarPerfil).toHaveBeenCalledWith(
      expect.stringMatching(/\?v=123456$/),
      "Bearer token",
    );
    expect(resultado).toMatch(/avatar\.webp\?v=123456$/);
  });

  it("exige o campo multipart avatar", async () => {
    await expect(
      avatarService.atualizarAvatar({ arquivo: undefined, usuarioId: "u-1" }),
    ).rejects.toMatchObject({ statusCode: 400, code: "AVATAR_REQUIRED" });
  });

  it("rejeita MIME ou extensão diferente de WebP", async () => {
    await expect(
      avatarService.atualizarAvatar({
        arquivo: criarArquivo({ filename: "foto.png", mimetype: "image/png" }),
        usuarioId: "u-1",
      }),
    ).rejects.toMatchObject({
      statusCode: 415,
      code: "UNSUPPORTED_AVATAR_TYPE",
    });
  });

  it("rejeita conteúdo sem assinatura RIFF/WEBP", async () => {
    await expect(
      avatarService.atualizarAvatar({
        arquivo: criarArquivo({
          toBuffer: vi.fn().mockResolvedValue(Buffer.from("arquivo-falso")),
        }),
        usuarioId: "u-1",
      }),
    ).rejects.toMatchObject({
      statusCode: 415,
      code: "UNSUPPORTED_AVATAR_TYPE",
    });
  });

  it("rejeita arquivo acima de 200 KB", async () => {
    await expect(
      avatarService.atualizarAvatar({
        arquivo: criarArquivo({
          toBuffer: vi.fn().mockResolvedValue(criarWebp(200 * 1024 + 1)),
        }),
        usuarioId: "u-1",
      }),
    ).rejects.toMatchObject({ statusCode: 413, code: "AVATAR_TOO_LARGE" });
  });
});
