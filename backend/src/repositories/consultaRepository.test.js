const supabaseConfig = require("../config/supabase");
vi.spyOn(supabaseConfig, "getSupabaseUsuario");
const consultaRepository = require("./consultaRepository");

describe("ConsultaRepository", () => {
  afterEach(() => vi.clearAllMocks());

  it("efetiva o cancelamento pela RPC autenticada", async () => {
    const retorno = {
      sucesso: true,
      ja_cancelada: false,
      consulta: { id: "consulta-1", status_consulta: "CANCELADA" },
    };
    const rpc = vi.fn().mockResolvedValue({ data: retorno, error: null });
    supabaseConfig.getSupabaseUsuario.mockReturnValue({ rpc });

    const resultado = await consultaRepository.efetivarCancelamentoSolicitado(
      "consulta-1",
      "Bearer token",
    );

    expect(rpc).toHaveBeenCalledWith("efetivar_cancelamento_solicitado", {
      p_consulta_id: "consulta-1",
    });
    expect(resultado).toEqual(retorno);
  });

  it("propaga erro retornado pela RPC", async () => {
    const erro = new Error("falha transacional");
    const rpc = vi.fn().mockResolvedValue({ data: null, error: erro });
    supabaseConfig.getSupabaseUsuario.mockReturnValue({ rpc });

    await expect(
      consultaRepository.efetivarCancelamentoSolicitado(
        "consulta-1",
        "Bearer token",
      ),
    ).rejects.toThrow("falha transacional");
  });

  it("registra o desfecho pela RPC autenticada", async () => {
    const retorno = { sucesso: true, ja_registrado: false };
    const rpc = vi.fn().mockResolvedValue({ data: retorno, error: null });
    supabaseConfig.getSupabaseUsuario.mockReturnValue({ rpc });

    const resultado = await consultaRepository.registrarDesfecho(
      "consulta-1",
      "REALIZADA",
      "Bearer token",
    );

    expect(rpc).toHaveBeenCalledWith("registrar_desfecho_consulta", {
      p_consulta_id: "consulta-1",
      p_desfecho: "REALIZADA",
    });
    expect(resultado).toEqual(retorno);
  });
});
