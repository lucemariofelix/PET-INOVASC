const { supabaseAdmin } = require("../config/supabase");
vi.spyOn(supabaseAdmin, "from");
const logRepository = require("./logRepository");

describe("LogRepository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("pagina e ordena os logs de forma estável", async () => {
    const range = vi.fn().mockResolvedValue({
      data: [{ id: "log-6" }],
      error: null,
      count: 12,
    });
    const consulta = {
      select: vi.fn(),
      order: vi.fn(),
      range,
    };
    consulta.select.mockReturnValue(consulta);
    consulta.order.mockReturnValue(consulta);
    supabaseAdmin.from.mockReturnValue(consulta);

    await expect(logRepository.listarUltimos(2, 5)).resolves.toEqual({
      logs: [{ id: "log-6" }],
      paginacao: {
        pagina: 2,
        limite: 5,
        total: 12,
        total_paginas: 3,
      },
    });

    expect(supabaseAdmin.from).toHaveBeenCalledWith("logs_atividades");
    expect(consulta.select).toHaveBeenCalledWith(
      expect.stringContaining("perfis_usuarios"),
      { count: "exact" },
    );
    expect(consulta.order).toHaveBeenNthCalledWith(1, "created_at", {
      ascending: false,
    });
    expect(consulta.order).toHaveBeenNthCalledWith(2, "id", {
      ascending: false,
    });
    expect(range).toHaveBeenCalledWith(5, 9);
  });

  it("retorna metadados vazios quando não há logs", async () => {
    const consulta = {
      select: vi.fn(),
      order: vi.fn(),
      range: vi.fn().mockResolvedValue({ data: null, error: null, count: 0 }),
    };
    consulta.select.mockReturnValue(consulta);
    consulta.order.mockReturnValue(consulta);
    supabaseAdmin.from.mockReturnValue(consulta);

    await expect(logRepository.listarUltimos()).resolves.toEqual({
      logs: [],
      paginacao: {
        pagina: 1,
        limite: 5,
        total: 0,
        total_paginas: 0,
      },
    });
  });

  it("propaga falha da consulta", async () => {
    const erro = new Error("falha no banco");
    const consulta = {
      select: vi.fn(),
      order: vi.fn(),
      range: vi.fn().mockResolvedValue({ data: null, error: erro, count: null }),
    };
    consulta.select.mockReturnValue(consulta);
    consulta.order.mockReturnValue(consulta);
    supabaseAdmin.from.mockReturnValue(consulta);

    await expect(logRepository.listarUltimos()).rejects.toBe(erro);
  });
});
