const supabaseMock = require("../config/supabase");
vi.spyOn(supabaseMock, "getSupabaseUsuario");
const avatarRepository = require("./avatarRepository");

describe("AvatarRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("substitui um único WebP na pasta do usuário e retorna URL pública", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const getPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: "https://cdn/avatars/u-1/avatar.webp" },
    });
    const from = vi.fn().mockReturnValue({ upload, getPublicUrl });
    supabaseMock.getSupabaseUsuario.mockReturnValue({ storage: { from } });
    const buffer = Buffer.from("webp");

    const resultado = await avatarRepository.salvar(
      "u-1",
      buffer,
      "Bearer token",
    );

    expect(from).toHaveBeenCalledWith("avatars");
    expect(upload).toHaveBeenCalledWith("u-1/avatar.webp", buffer, {
      cacheControl: "3600",
      contentType: "image/webp",
      upsert: true,
    });
    expect(resultado).toBe("https://cdn/avatars/u-1/avatar.webp");
  });

  it("persiste a URL pela RPC do usuário autenticado", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "url", error: null });
    supabaseMock.getSupabaseUsuario.mockReturnValue({ rpc });

    await expect(
      avatarRepository.atualizarPerfil("https://cdn/avatar.webp", "Bearer t"),
    ).resolves.toBe("url");
    expect(rpc).toHaveBeenCalledWith("atualizar_avatar_proprio", {
      p_avatar_url: "https://cdn/avatar.webp",
    });
  });

  it("propaga falha do Storage sem persistir perfil", async () => {
    const erro = new Error("storage indisponível");
    const upload = vi.fn().mockResolvedValue({ error: erro });
    supabaseMock.getSupabaseUsuario.mockReturnValue({
      storage: { from: vi.fn().mockReturnValue({ upload }) },
    });

    await expect(
      avatarRepository.salvar("u-1", Buffer.from("x"), "Bearer t"),
    ).rejects.toBe(erro);
  });

  it("falha quando o Storage não fornece URL pública", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const getPublicUrl = vi.fn().mockReturnValue({ data: {} });
    supabaseMock.getSupabaseUsuario.mockReturnValue({
      storage: { from: vi.fn().mockReturnValue({ upload, getPublicUrl }) },
    });

    await expect(
      avatarRepository.salvar("u-1", Buffer.from("x"), "Bearer t"),
    ).rejects.toThrow("não retornou a URL pública");
  });
});
