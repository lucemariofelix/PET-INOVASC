const supabaseConfig = require("../config/supabase");
vi.spyOn(supabaseConfig, "getSupabaseUsuario");
const pacienteRepository = require("./pacienteRepository");

describe("PacienteRepository atualização", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("envia o vínculo canônico e retorna o paciente completo", async () => {
    const selectUpdate = vi.fn().mockResolvedValue({
      data: [{ id: "paciente-1" }],
      error: null,
    });
    const eqUpdate = vi.fn().mockReturnValue({ select: selectUpdate });
    const update = vi.fn().mockReturnValue({ eq: eqUpdate });
    supabaseConfig.getSupabaseUsuario.mockReturnValue({
      from: vi.fn().mockReturnValue({ update }),
    });
    const buscarPorId = vi
      .spyOn(pacienteRepository, "buscarPorId")
      .mockResolvedValue({
        id: "paciente-1",
        agente_id: null,
        acs: null,
        agente: null,
      });

    const resultado = await pacienteRepository.atualizar(
      "paciente-1",
      { agente_id: null, acs: null },
      undefined,
      "Bearer token",
    );

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ agente_id: null, acs: null }),
    );
    expect(eqUpdate).toHaveBeenCalledWith("id", "paciente-1");
    expect(buscarPorId).toHaveBeenCalledWith("paciente-1", "Bearer token");
    expect(resultado).toMatchObject({ agente_id: null, acs: null });
  });

  it("rejeita atualização quando o banco não retorna nenhuma linha", async () => {
    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    supabaseConfig.getSupabaseUsuario.mockReturnValue({
      from: vi.fn().mockReturnValue({ update }),
    });

    await expect(
      pacienteRepository.atualizar(
        "inexistente",
        { agente_id: null, acs: null },
        undefined,
        "Bearer token",
      ),
    ).rejects.toThrow("Paciente não encontrado para atualização");
  });
});
