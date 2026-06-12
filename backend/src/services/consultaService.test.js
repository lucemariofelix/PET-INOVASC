// =============================================================================
// MOCK do repositório — hoisted pelo Vitest antes de qualquer import
// =============================================================================
vi.mock("../repositories/consultaRepository");

const consultaRepository = require("../repositories/consultaRepository");
const consultaService = require("./consultaService");

// =============================================================================
// SUÍTE PRINCIPAL
// =============================================================================
describe("ConsultaService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // obterConsultasAtrasadas
  // ---------------------------------------------------------------------------
  describe("obterConsultasAtrasadas", () => {
    it("deve calcular corretamente a data de corte de 150 dias", async () => {
      // Arrange: fixa a data atual para 2026-06-05
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-05T12:00:00.000Z"));

      const consultasMock = [
        { tipo_profissional: "Médico", data_ultima_consulta: "2025-12-01" },
      ];
      consultaRepository.buscarAtrasadas = vi
        .fn()
        .mockResolvedValue(consultasMock);

      // Act
      const resultado =
        await consultaService.obterConsultasAtrasadas("Bearer token-abc");

      // Assert
      expect(consultaRepository.buscarAtrasadas).toHaveBeenCalledTimes(1);
      // 2026-06-05 - 150 dias = 2026-01-06
      expect(consultaRepository.buscarAtrasadas).toHaveBeenCalledWith(
        "2026-01-06T12:00:00.000Z",
        "Bearer token-abc",
      );
      expect(resultado).toEqual({
        dias_regra: 150,
        corte_de_data: "2026-01-06T12:00:00.000Z",
        dados: consultasMock,
      });

      vi.useRealTimers();
    });

    it("deve propagar erro do repository", async () => {
      // Arrange
      const erroBanco = new Error("Falha na conexão com o banco de dados");
      consultaRepository.buscarAtrasadas = vi.fn().mockRejectedValue(erroBanco);

      // Act & Assert
      await expect(
        consultaService.obterConsultasAtrasadas("Bearer token-xyz"),
      ).rejects.toThrow("Falha na conexão com o banco de dados");

      expect(consultaRepository.buscarAtrasadas).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // agendarConsulta
  // ---------------------------------------------------------------------------
  describe("agendarConsulta", () => {
    it("deve lançar erro quando faltar paciente_id", async () => {
      await expect(
        consultaService.agendarConsulta(
          { tipo_profissional: "Médico", data_proxima_consulta: "2026-07-01" },
          "Bearer token",
        ),
      ).rejects.toThrow(
        "O ID do paciente é obrigatório para agendar uma consulta.",
      );
    });

    it("deve lançar erro quando faltar tipo_profissional", async () => {
      await expect(
        consultaService.agendarConsulta(
          { paciente_id: 1, data_proxima_consulta: "2026-07-01" },
          "Bearer token",
        ),
      ).rejects.toThrow(
        "O tipo de profissional (Médico, Enfermeiro, Dentista...) é obrigatório.",
      );
    });

    it("deve lançar erro quando faltar data_proxima_consulta", async () => {
      await expect(
        consultaService.agendarConsulta(
          { paciente_id: 1, tipo_profissional: "Médico" },
          "Bearer token",
        ),
      ).rejects.toThrow("A data da consulta é obrigatória.");
    });

    it("deve lançar erro quando houver conflito de horário", async () => {
      // Arrange
      consultaRepository.verificarConflitoHorario = vi.fn().mockResolvedValue({
        id: 99,
        tipo_profissional: "Dentista",
      });
      consultaRepository.criar = vi.fn();

      // Act & Assert
      await expect(
        consultaService.agendarConsulta(
          {
            paciente_id: 1,
            tipo_profissional: "Médico",
            data_proxima_consulta: "2026-09-10",
          },
          "Bearer token",
        ),
      ).rejects.toThrow(
        "Choque de agenda: Este paciente já possui uma consulta marcada para este mesmo dia e horário com o perfil: Dentista.",
      );

      // Não deve chamar criar se houve conflito
      expect(consultaRepository.criar).not.toHaveBeenCalled();
    });

    it("deve criar consulta com sucesso quando não houver conflito", async () => {
      // Arrange
      consultaRepository.verificarConflitoHorario = vi
        .fn()
        .mockResolvedValue(null);
      const consultaSalva = {
        id: 42,
        paciente_id: 1,
        tipo_profissional: "Médico",
        data_proxima_consulta: "2026-09-10",
        data_ultima_consulta: null,
        status_consulta: "AGENDADA",
      };
      consultaRepository.criar = vi.fn().mockResolvedValue(consultaSalva);

      // Act
      const resultado = await consultaService.agendarConsulta(
        {
          paciente_id: 1,
          tipo_profissional: "Médico",
          data_proxima_consulta: "2026-09-10",
        },
        "Bearer token",
      );

      // Assert
      expect(consultaRepository.verificarConflitoHorario).toHaveBeenCalledWith(
        1,
        "2026-09-10",
        "Bearer token",
      );
      expect(consultaRepository.criar).toHaveBeenCalledWith(
        {
          paciente_id: 1,
          tipo_profissional: "Médico",
          data_proxima_consulta: "2026-09-10",
          data_ultima_consulta: null,
          status_consulta: "AGENDADA",
        },
        "Bearer token",
      );
      expect(resultado).toEqual(consultaSalva);
    });
  });

  // ---------------------------------------------------------------------------
  // obterTodasConsultas
  // ---------------------------------------------------------------------------
  describe("obterTodasConsultas", () => {
    it("deve chamar listarTodas e retornar o resultado", async () => {
      // Arrange
      const todasConsultas = [
        { id: 1, tipo_profissional: "Médico" },
        { id: 2, tipo_profissional: "Enfermeiro" },
      ];
      consultaRepository.listarTodas = vi
        .fn()
        .mockResolvedValue(todasConsultas);

      // Act
      const resultado =
        await consultaService.obterTodasConsultas("Bearer token");

      // Assert
      expect(consultaRepository.listarTodas).toHaveBeenCalledTimes(1);
      expect(consultaRepository.listarTodas).toHaveBeenCalledWith(
        "Bearer token",
      );
      expect(resultado).toEqual(todasConsultas);
    });
  });
});
