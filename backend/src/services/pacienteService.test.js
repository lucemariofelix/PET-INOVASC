// =============================================================================
// MOCK do repositório — hoisted pelo Vitest antes de qualquer import
// =============================================================================
vi.mock("../repositories/pacienteRepository");

const pacienteRepository = require("../repositories/pacienteRepository");
const pacienteService = require("./pacienteService");

// =============================================================================
// Dados base reaproveitados
// =============================================================================
const authHeader = "Bearer token-abc";

// =============================================================================
// SUÍTE PRINCIPAL
// =============================================================================
describe("PacienteService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // cadastrarPaciente
  // ===========================================================================
  describe("cadastrarPaciente", () => {
    // -----------------------------------------------------------------------
    // 1. Falta nome_completo
    // -----------------------------------------------------------------------
    it("deve lançar erro quando faltar nome_completo", async () => {
      await expect(
        pacienteService.cadastrarPaciente(
          { cpf_cns: "12345678900" },
          authHeader,
        ),
      ).rejects.toThrow("O nome completo do paciente é obrigatório.");
    });

    // -----------------------------------------------------------------------
    // 2. Falta cpf_cns
    // -----------------------------------------------------------------------
    it("deve lançar erro quando faltar cpf_cns", async () => {
      await expect(
        pacienteService.cadastrarPaciente(
          { nome_completo: "João da Silva" },
          authHeader,
        ),
      ).rejects.toThrow("O CPF ou Cartão do SUS (cpf_cns) é obrigatório.");
    });

    // -----------------------------------------------------------------------
    // 3. Cadastro com dados mínimos
    // -----------------------------------------------------------------------
    it("deve cadastrar paciente com dados mínimos", async () => {
      // Arrange
      const pacienteSalvo = {
        id: 1,
        nome_completo: "Maria Souza",
        cpf_cns: "98765432100",
        status_telefone: "VALIDO",
        consentimento_msg: true,
      };
      pacienteRepository.criar = vi.fn().mockResolvedValue(pacienteSalvo);

      // Act
      const resultado = await pacienteService.cadastrarPaciente(
        {
          nome_completo: "Maria Souza",
          cpf_cns: "98765432100",
        },
        authHeader,
      );

      // Assert
      expect(pacienteRepository.criar).toHaveBeenCalledTimes(1);
      expect(pacienteRepository.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          nome_completo: "Maria Souza",
          cpf_cns: "98765432100",
          status_telefone: "VALIDO",
          consentimento_msg: true,
        }),
        undefined,
        authHeader,
      );
      expect(resultado).toEqual(pacienteSalvo);
    });

    // -----------------------------------------------------------------------
    // 4. consentimento_msg false explícito
    // -----------------------------------------------------------------------
    it("deve preservar consentimento_msg false quando informado explicitamente", async () => {
      // Arrange
      const pacienteSalvo = {
        id: 2,
        nome_completo: "Carlos Lima",
        cpf_cns: "11122233344",
        consentimento_msg: false,
      };
      pacienteRepository.criar = vi.fn().mockResolvedValue(pacienteSalvo);

      // Act
      await pacienteService.cadastrarPaciente(
        {
          nome_completo: "Carlos Lima",
          cpf_cns: "11122233344",
          consentimento_msg: false,
        },
        authHeader,
      );

      // Assert
      expect(pacienteRepository.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          consentimento_msg: false,
        }),
        undefined,
        authHeader,
      );
    });

    // -----------------------------------------------------------------------
    // 5. Cadastro com agente_id e grupos_ids
    // -----------------------------------------------------------------------
    it("deve cadastrar paciente separando agente_id e grupos_ids", async () => {
      // Arrange
      const agenteId = "11111111-1111-1111-1111-111111111111";
      const grupoId = "22222222-2222-2222-2222-222222222222";
      const pacienteSalvo = {
        id: "33333333-3333-3333-3333-333333333333",
        nome_completo: "Maria Souza",
        agente_id: agenteId,
      };

      pacienteRepository.buscarAgenteACSPorId = vi
        .fn()
        .mockResolvedValue({ id: agenteId, nome: "Agente ACS", funcao: "ACS" });
      pacienteRepository.criar = vi.fn().mockResolvedValue(pacienteSalvo);

      // Act
      const resultado = await pacienteService.cadastrarPaciente(
        {
          nome_completo: "Maria Souza",
          cpf_cns: "98765432100",
          agente_id: agenteId,
          grupos_ids: [grupoId, grupoId],
        },
        authHeader,
      );

      // Assert
      expect(pacienteRepository.buscarAgenteACSPorId).toHaveBeenCalledWith(
        agenteId,
        authHeader,
      );
      expect(pacienteRepository.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          nome_completo: "Maria Souza",
          cpf_cns: "98765432100",
          agente_id: agenteId,
        }),
        [grupoId],
        authHeader,
      );
      expect(resultado).toEqual(pacienteSalvo);
    });

    it("deve lançar erro quando grupos_ids não for uma lista", async () => {
      await expect(
        pacienteService.cadastrarPaciente(
          {
            nome_completo: "Maria Souza",
            cpf_cns: "98765432100",
            grupos_ids: "grupo-invalido",
          },
          authHeader,
        ),
      ).rejects.toThrow("O campo grupos_ids deve ser uma lista de IDs.");
    });

    it("deve lançar erro quando agente_id não for ACS válido", async () => {
      pacienteRepository.buscarAgenteACSPorId = vi.fn().mockResolvedValue(null);

      await expect(
        pacienteService.cadastrarPaciente(
          {
            nome_completo: "Maria Souza",
            cpf_cns: "98765432100",
            agente_id: "11111111-1111-1111-1111-111111111111",
          },
          authHeader,
        ),
      ).rejects.toThrow(
        "Agente de saúde não encontrado ou não possui função ACS.",
      );
    });
  });

  // ===========================================================================
  // listarPacientes
  // ===========================================================================
  describe("listarPacientes", () => {
    // -----------------------------------------------------------------------
    // 8. Delegação simples
    // -----------------------------------------------------------------------
    it("deve listar pacientes chamando pacienteRepository.listarTodos", async () => {
      // Arrange
      const pacientesMock = [
        { id: 1, nome_completo: "Ana Costa" },
        { id: 2, nome_completo: "Bruno Alves" },
      ];
      pacienteRepository.listarTodos = vi.fn().mockResolvedValue(pacientesMock);

      // Act
      const resultado = await pacienteService.listarPacientes(authHeader);

      // Assert
      expect(pacienteRepository.listarTodos).toHaveBeenCalledTimes(1);
      expect(pacienteRepository.listarTodos).toHaveBeenCalledWith(authHeader);
      expect(resultado).toEqual(pacientesMock);
    });
  });

  // ===========================================================================
  // atualizarPaciente
  // ===========================================================================
  describe("atualizarPaciente", () => {
    // -----------------------------------------------------------------------
    // 9. Falta id
    // -----------------------------------------------------------------------
    it("deve lançar erro quando faltar id na atualização", async () => {
      await expect(
        pacienteService.atualizarPaciente(
          undefined,
          { nome_completo: "Teste" },
          authHeader,
        ),
      ).rejects.toThrow(
        "O identificador (ID) do paciente é obrigatório para atualização.",
      );
    });

    // -----------------------------------------------------------------------
    // 10. Atualização com sucesso
    // -----------------------------------------------------------------------
    it("deve atualizar paciente com sucesso", async () => {
      // Arrange
      const pacienteAtualizado = {
        id: 5,
        nome_completo: "Pedro Atualizado",
        cpf_cns: "55566677788",
      };
      pacienteRepository.atualizar = vi
        .fn()
        .mockResolvedValue(pacienteAtualizado);

      // Act
      const resultado = await pacienteService.atualizarPaciente(
        5,
        {
          nome_completo: "Pedro Atualizado",
          cpf_cns: "55566677788",
        },
        authHeader,
      );

      // Assert
      expect(pacienteRepository.atualizar).toHaveBeenCalledTimes(1);
      expect(pacienteRepository.atualizar).toHaveBeenCalledWith(
        5,
        {
          nome_completo: "Pedro Atualizado",
          cpf_cns: "55566677788",
        },
        undefined,
        authHeader,
      );
      expect(resultado).toEqual(pacienteAtualizado);
    });

    it("deve repassar grupos_ids vazio para remover vínculos", async () => {
      // Arrange
      const pacienteAtualizado = {
        id: 5,
        nome_completo: "Pedro Atualizado",
      };
      pacienteRepository.atualizar = vi
        .fn()
        .mockResolvedValue(pacienteAtualizado);

      // Act
      await pacienteService.atualizarPaciente(
        5,
        {
          nome_completo: "Pedro Atualizado",
          cpf_cns: "55566677788",
          grupos_ids: [],
        },
        authHeader,
      );

      // Assert
      expect(pacienteRepository.atualizar).toHaveBeenCalledWith(
        5,
        expect.any(Object),
        [],
        authHeader,
      );
    });

    it("deve repassar undefined quando grupos_ids não for informado", async () => {
      // Arrange
      const pacienteAtualizado = {
        id: 5,
        nome_completo: "Pedro Atualizado",
      };
      pacienteRepository.atualizar = vi
        .fn()
        .mockResolvedValue(pacienteAtualizado);

      // Act
      await pacienteService.atualizarPaciente(
        5,
        {
          nome_completo: "Pedro Atualizado",
          cpf_cns: "55566677788",
        },
        authHeader,
      );

      // Assert
      expect(pacienteRepository.atualizar).toHaveBeenCalledWith(
        5,
        expect.any(Object),
        undefined,
        authHeader,
      );
    });
  });

  // ===========================================================================
  // filtrarPacientes
  // ===========================================================================
  describe("filtrarPacientes", () => {
    it("deve filtrar somente por agente_id", async () => {
      const filtros = { agente_id: "11111111-1111-1111-1111-111111111111" };
      const pacientesMock = [{ id: 1, nome_completo: "Ana Costa" }];
      pacienteRepository.filtrar = vi.fn().mockResolvedValue(pacientesMock);

      const resultado = await pacienteService.filtrarPacientes(
        filtros,
        authHeader,
      );

      expect(pacienteRepository.filtrar).toHaveBeenCalledWith(
        filtros,
        authHeader,
      );
      expect(resultado).toEqual(pacientesMock);
    });

    it("deve filtrar somente por grupo_id", async () => {
      const filtros = { grupo_id: "22222222-2222-2222-2222-222222222222" };
      const pacientesMock = [{ id: 2, nome_completo: "Bruno Alves" }];
      pacienteRepository.filtrar = vi.fn().mockResolvedValue(pacientesMock);

      await pacienteService.filtrarPacientes(filtros, authHeader);

      expect(pacienteRepository.filtrar).toHaveBeenCalledWith(
        filtros,
        authHeader,
      );
    });

    it("deve filtrar por grupo_id e agente_id", async () => {
      const filtros = {
        grupo_id: "22222222-2222-2222-2222-222222222222",
        agente_id: "11111111-1111-1111-1111-111111111111",
      };
      pacienteRepository.filtrar = vi.fn().mockResolvedValue([]);

      await pacienteService.filtrarPacientes(filtros, authHeader);

      expect(pacienteRepository.filtrar).toHaveBeenCalledWith(
        filtros,
        authHeader,
      );
    });

    it("deve permitir filtros vazios", async () => {
      pacienteRepository.filtrar = vi.fn().mockResolvedValue([]);

      await pacienteService.filtrarPacientes(undefined, authHeader);

      expect(pacienteRepository.filtrar).toHaveBeenCalledWith({}, authHeader);
    });
  });
});
