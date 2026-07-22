const supabaseConfig = require("../config/supabase");
vi.spyOn(supabaseConfig, "getSupabaseUsuario");
const grupoAcompanhamentoRepository = require("./grupoAcompanhamentoRepository");

describe("GrupoAcompanhamentoRepository", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("deve excluir e retornar os dados do grupo removido", async () => {
    const grupo = {
      id: "22222222-2222-2222-2222-222222222222",
      nome: "Hipertensos",
      descricao: null,
      criado_em: "2026-07-21T12:00:00Z",
    };
    const select = vi.fn().mockResolvedValue({ data: [grupo], error: null });
    const eq = vi.fn(() => ({ select }));
    const deletar = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ delete: deletar }));
    supabaseConfig.getSupabaseUsuario.mockReturnValue({ from });

    const resultado = await grupoAcompanhamentoRepository.excluir(
      grupo.id,
      "Bearer token",
    );

    expect(resultado).toEqual(grupo);
    expect(from).toHaveBeenCalledWith("grupos_acompanhamento");
    expect(eq).toHaveBeenCalledWith("id", grupo.id);
    expect(select).toHaveBeenCalledWith("id, nome, descricao, criado_em");
  });

  it("deve retornar null quando nenhuma linha for excluída", async () => {
    const select = vi.fn().mockResolvedValue({ data: [], error: null });
    const eq = vi.fn(() => ({ select }));
    const from = vi.fn(() => ({ delete: vi.fn(() => ({ eq })) }));
    supabaseConfig.getSupabaseUsuario.mockReturnValue({ from });

    const resultado = await grupoAcompanhamentoRepository.excluir(
      "33333333-3333-3333-3333-333333333333",
      "Bearer token",
    );

    expect(resultado).toBeNull();
  });
});
