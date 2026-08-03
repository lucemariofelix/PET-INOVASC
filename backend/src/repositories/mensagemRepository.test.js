const supabaseConfig = require("../config/supabase");
vi.spyOn(supabaseConfig, "getSupabaseUsuario");
const mensagemRepository = require("./mensagemRepository");
const {
  selecionarConfirmacaoEfetiva,
} = require("./mensagemRepository");

describe("MensagemRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prioriza resposta terminal sobre uma pendência mais recente", () => {
    const resultado = selecionarConfirmacaoEfetiva(
      [
        {
          id: "terminal",
          data_envio: "2026-07-25T19:32:00.000Z",
          respondido_em: "2026-07-25T20:37:00.000Z",
          confirmacao_status: "CANCELAMENTO_SOLICITADO",
        },
        {
          id: "pendente-posterior",
          data_envio: "2026-07-25T23:07:00.000Z",
          confirmacao_status: "PENDENTE",
          confirmacao_expira_em: "2026-07-28T23:07:00.000Z",
        },
        {
          id: "substituida",
          data_envio: "2026-07-25T23:08:00.000Z",
          confirmacao_status: "SUBSTITUIDO",
        },
      ],
      new Date("2026-07-25T23:30:00.000Z"),
    );

    expect(resultado).toMatchObject({
      id: "terminal",
      confirmacao_status: "CANCELAMENTO_SOLICITADO",
    });
  });

  it("reserva o disparo com todos os dados pelo RPC autenticado", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { permitido: true, historico_id: "reserva-1" },
      error: null,
    });
    supabaseConfig.getSupabaseUsuario.mockReturnValue({ rpc });

    await expect(
      mensagemRepository.reservarDisparoConfirmacao(
        {
          consulta_id: "consulta-1",
          paciente_id: "paciente-1",
          telefone_destino: "5584999998888",
          texto_enviado: "Mensagem",
          tipo_mensagem: "LEMBRETE_CONSULTA",
          botao_id: null,
        },
        "Bearer token",
      ),
    ).resolves.toEqual({ permitido: true, historico_id: "reserva-1" });

    expect(supabaseConfig.getSupabaseUsuario).toHaveBeenCalledWith("Bearer token");
    expect(rpc).toHaveBeenCalledWith("reservar_disparo_confirmacao", {
      p_consulta_id: "consulta-1",
      p_paciente_id: "paciente-1",
      p_telefone_destino: "5584999998888",
      p_texto_enviado: "Mensagem",
      p_tipo_mensagem: "LEMBRETE_CONSULTA",
      p_botao_id: null,
    });
  });

  it("retorna a mensagem mais recente com confirmação efetiva separada", async () => {
    const data = [
      {
        id: "pendente-recente",
        consulta_id: "consulta-1",
        status: "ENTREGUE",
        entregue_em: "2026-07-25T23:08:00.000Z",
        data_envio: "2026-07-25T23:07:00.000Z",
        confirmacao_status: "PENDENTE",
        confirmacao_expira_em: "2026-07-28T23:07:00.000Z",
      },
      {
        id: "terminal-antigo",
        consulta_id: "consulta-1",
        data_envio: "2026-07-25T19:32:00.000Z",
        respondido_em: "2026-07-25T20:37:00.000Z",
        confirmacao_status: "CANCELAMENTO_SOLICITADO",
      },
    ];
    const order = vi.fn().mockResolvedValue({ data, error: null });
    const inQuery = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ in: inQuery });
    const from = vi.fn().mockReturnValue({ select });
    supabaseConfig.getSupabaseUsuario.mockReturnValue({ from });

    const resultado = await mensagemRepository.listarUltimasPorConsultas(
      ["consulta-1"],
      "Bearer token",
    );

    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toMatchObject({
      id: "pendente-recente",
      status: "ENTREGUE",
      confirmacao_efetiva: {
        id: "terminal-antigo",
        confirmacao_status: "CANCELAMENTO_SOLICITADO",
      },
    });
  });
});
