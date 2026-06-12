vi.mock("../repositories/grupoAcompanhamentoRepository");

const grupoAcompanhamentoRepository = require("../repositories/grupoAcompanhamentoRepository");
const grupoAcompanhamentoService = require("./grupoAcompanhamentoService");

const authHeader = "Bearer token-abc";

describe("GrupoAcompanhamentoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listarGrupos", () => {
    it("deve listar grupos chamando o repository", async () => {
      const gruposMock = [
        { id: "1", nome: "Diabéticos", descricao: "Pacientes diabéticos" },
      ];
      grupoAcompanhamentoRepository.listarTodos = vi
        .fn()
        .mockResolvedValue(gruposMock);

      const resultado =
        await grupoAcompanhamentoService.listarGrupos(authHeader);

      expect(grupoAcompanhamentoRepository.listarTodos).toHaveBeenCalledWith(
        authHeader,
      );
      expect(resultado).toEqual(gruposMock);
    });
  });

  describe("criarGrupo", () => {
    it("deve lançar erro sem nome válido", async () => {
      await expect(
        grupoAcompanhamentoService.criarGrupo({ nome: " " }, authHeader),
      ).rejects.toThrow("O nome do grupo deve ter pelo menos 2 caracteres.");
    });

    it("deve criar grupo com payload válido", async () => {
      const grupoMock = {
        id: "1",
        nome: "Hipertensos",
        descricao: "Acompanhamento HAS",
      };
      grupoAcompanhamentoRepository.criar = vi
        .fn()
        .mockResolvedValue(grupoMock);

      const resultado = await grupoAcompanhamentoService.criarGrupo(
        {
          nome: " Hipertensos ",
          descricao: " Acompanhamento HAS ",
        },
        authHeader,
      );

      expect(grupoAcompanhamentoRepository.criar).toHaveBeenCalledWith(
        {
          nome: "Hipertensos",
          descricao: "Acompanhamento HAS",
        },
        authHeader,
      );
      expect(resultado).toEqual(grupoMock);
    });
  });
});
