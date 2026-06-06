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
        authHeader,
      );
    });
  });

  // ===========================================================================
  // listarPacientes
  // ===========================================================================
  describe("listarPacientes", () => {
    // -----------------------------------------------------------------------
    // 5. Delegação simples
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
    // 6. Falta id
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
    // 7. Atualização com sucesso
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
        authHeader,
      );
      expect(resultado).toEqual(pacienteAtualizado);
    });
  });
});
