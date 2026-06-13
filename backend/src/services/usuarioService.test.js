// =============================================================================
// MOCK 1: supabaseAdmin — factory retorna objeto base
// =============================================================================
vi.mock("../config/supabase", () => ({
  supabaseAdmin: {
    auth: {
      admin: {},
    },
  },
}));

// =============================================================================
// MOCK 2: usuarioRepository — hoisted
// =============================================================================
vi.mock("../repositories/usuarioRepository");

const supabaseModule = require("../config/supabase");
const usuarioRepository = require("../repositories/usuarioRepository");
const usuarioService = require("./usuarioService");

// =============================================================================
// Atalhos para os mocks
// =============================================================================
const authHeader = "Bearer token-abc";

let createUserMock;
let deleteUserMock;
let updateUserByIdMock;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";

  // Mock do supabaseAdmin
  createUserMock = vi.fn();
  deleteUserMock = vi.fn();
  updateUserByIdMock = vi.fn();
  supabaseModule.supabaseAdmin.auth.admin.createUser = createUserMock;
  supabaseModule.supabaseAdmin.auth.admin.deleteUser = deleteUserMock;
  supabaseModule.supabaseAdmin.auth.admin.updateUserById = updateUserByIdMock;
});

// =============================================================================
// SUÍTE
// =============================================================================
describe("UsuarioService", () => {
  // ===========================================================================
  // listar
  // ===========================================================================
  describe("listar", () => {
    it("deve listar usuários chamando usuarioRepository.listarTodos", async () => {
      const usuariosMock = [
        { id: "uuid-1", nome: "Admin", funcao: "ADMIN" },
        { id: "uuid-2", nome: "Recepcionista", funcao: "RECEPCAO" },
      ];
      usuarioRepository.listarTodos = vi.fn().mockResolvedValue(usuariosMock);

      const resultado = await usuarioService.listar(authHeader);

      expect(usuarioRepository.listarTodos).toHaveBeenCalledTimes(1);
      expect(usuarioRepository.listarTodos).toHaveBeenCalledWith(authHeader);
      expect(resultado).toEqual(usuariosMock);
    });
  });

  // ===========================================================================
  // excluirUsuario
  // ===========================================================================
  describe("excluirUsuario", () => {
    it("deve lançar erro quando faltar id na exclusão", async () => {
      await expect(
        usuarioService.excluirUsuario(undefined, authHeader),
      ).rejects.toThrow("ID do usuário é obrigatório para exclusão.");
    });

    it("deve excluir usuário com sucesso chamando usuarioRepository.excluir e supabaseAdmin.auth.admin.deleteUser", async () => {
      usuarioRepository.excluir = vi.fn().mockResolvedValue(true);
      deleteUserMock.mockResolvedValue({ data: {}, error: null });

      const resultado = await usuarioService.excluirUsuario(
        "uuid-5",
        authHeader,
      );

      expect(usuarioRepository.excluir).toHaveBeenCalledTimes(1);
      expect(usuarioRepository.excluir).toHaveBeenCalledWith(
        "uuid-5",
        authHeader,
      );
      expect(deleteUserMock).toHaveBeenCalledTimes(1);
      expect(deleteUserMock).toHaveBeenCalledWith("uuid-5");
      expect(resultado).toBe(true);
    });

    it("deve manter comportamento best effort quando deleteUser falhar na exclusão, sem lançar erro", async () => {
      usuarioRepository.excluir = vi.fn().mockResolvedValue(true);
      deleteUserMock.mockResolvedValue({
        data: null,
        error: { message: "User not found in Auth" },
      });

      // Spy no console.error para não poluir o output
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Não deve lançar erro
      const resultado = await usuarioService.excluirUsuario(
        "uuid-best-effort",
        authHeader,
      );

      expect(usuarioRepository.excluir).toHaveBeenCalledTimes(1);
      expect(deleteUserMock).toHaveBeenCalledWith("uuid-best-effort");
      expect(resultado).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Aviso: Usuário apagado do perfil, mas falhou ao apagar do Auth.",
        { message: "User not found in Auth" },
      );
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      consoleErrorSpy.mockRestore();
    });
  });

  // ===========================================================================
  // criarUsuario
  // ===========================================================================
  describe("criarUsuario", () => {
    it("deve lançar erro quando faltarem campos obrigatórios ao criar usuário", async () => {
      await expect(
        usuarioService.criarUsuario(
          { nome: "João" }, // faltam email, senha, funcao
          authHeader,
        ),
      ).rejects.toThrow(
        "Todos os campos são obrigatórios para criar um usuário.",
      );
    });

    it("deve criar usuário com sucesso", async () => {
      createUserMock.mockResolvedValue({
        data: { user: { id: "uuid-novo-123" } },
        error: null,
      });
      const perfilSalvo = {
        id: "uuid-novo-123",
        nome: "Maria",
        email: "maria@ubs.com",
        funcao: "RECEPCAO",
      };
      usuarioRepository.criarComAdmin = vi.fn().mockResolvedValue(perfilSalvo);

      const resultado = await usuarioService.criarUsuario(
        {
          nome: "Maria",
          email: "Maria@UBS.com",
          senha: "senha123",
          funcao: "RECEPCAO",
        },
        authHeader,
      );

      expect(createUserMock).toHaveBeenCalledWith({
        email: "maria@ubs.com",
        password: "senha123",
        email_confirm: true,
      });
      expect(usuarioRepository.criarComAdmin).toHaveBeenCalledWith({
        id: "uuid-novo-123",
        nome: "Maria",
        email: "maria@ubs.com",
        funcao: "RECEPCAO",
      });
      expect(resultado).toEqual(perfilSalvo);
    });

    it("deve converter email para lowercase ao criar usuário", async () => {
      createUserMock.mockResolvedValue({
        data: { user: { id: "uuid-lower" } },
        error: null,
      });
      usuarioRepository.criarComAdmin = vi.fn().mockResolvedValue({ id: "uuid-lower" });

      await usuarioService.criarUsuario(
        {
          nome: "Carlos",
          email: "CARLOS@UBS.COM",
          senha: "abc",
          funcao: "ACS",
        },
        authHeader,
      );

      expect(createUserMock).toHaveBeenCalledWith(
        expect.objectContaining({ email: "carlos@ubs.com" }),
      );
      expect(usuarioRepository.criarComAdmin).toHaveBeenCalledWith(
        expect.objectContaining({ email: "carlos@ubs.com" }),
      );
    });

    it("deve não enviar senha ao usuarioRepository.criarComAdmin", async () => {
      createUserMock.mockResolvedValue({
        data: { user: { id: "uuid-sem-senha" } },
        error: null,
      });
      usuarioRepository.criarComAdmin = vi
        .fn()
        .mockResolvedValue({ id: "uuid-sem-senha" });

      await usuarioService.criarUsuario(
        {
          nome: "Ana",
          email: "ana@ubs.com",
          senha: "supersecreta",
          funcao: "ADMIN",
        },
        authHeader,
      );

      const payloadEnviado = usuarioRepository.criarComAdmin.mock.calls[0][0];
      expect(payloadEnviado).not.toHaveProperty("senha");
      expect(payloadEnviado).not.toHaveProperty("password");
      expect(payloadEnviado).toEqual({
        id: "uuid-sem-senha",
        nome: "Ana",
        email: "ana@ubs.com",
        funcao: "ADMIN",
      });
    });

    it("deve lançar erro quando o Supabase Auth falhar ao criar usuário", async () => {
      createUserMock.mockResolvedValue({
        data: null,
        error: { message: "User already exists" },
      });

      await expect(
        usuarioService.criarUsuario(
          {
            nome: "Duplicado",
            email: "dup@ubs.com",
            senha: "abc",
            funcao: "ACS",
          },
          authHeader,
        ),
      ).rejects.toThrow(
        "Erro ao criar credencial de login: User already exists",
      );
    });

    it("deve não chamar usuarioRepository.criarComAdmin quando o Supabase Auth falhar", async () => {
      createUserMock.mockResolvedValue({
        data: null,
        error: { message: "Auth error" },
      });

      try {
        await usuarioService.criarUsuario(
          {
            nome: "Falha",
            email: "falha@ubs.com",
            senha: "abc",
            funcao: "ACS",
          },
          authHeader,
        );
      } catch {
        // esperado
      }

      expect(usuarioRepository.criarComAdmin).not.toHaveBeenCalled();
      // Rollback NÃO deve ser chamado pois o usuário nunca foi criado
      expect(deleteUserMock).not.toHaveBeenCalled();
    });

    it("deve lançar erro claro quando Supabase Auth não retornar user.id", async () => {
      createUserMock.mockResolvedValue({
        data: { user: {} },
        error: null,
      });
      usuarioRepository.criarComAdmin = vi.fn();

      await expect(
        usuarioService.criarUsuario(
          {
            nome: "Sem ID",
            email: "semid@ubs.com",
            senha: "abc",
            funcao: "ACS",
          },
          authHeader,
        ),
      ).rejects.toThrow(
        "Erro ao criar credencial de login: ID do usuário não retornado pelo Supabase Auth.",
      );

      expect(usuarioRepository.criarComAdmin).not.toHaveBeenCalled();
      expect(deleteUserMock).not.toHaveBeenCalled();
    });

    it("deve fazer rollback chamando deleteUser quando usuarioRepository.criarComAdmin falhar após o Auth criar o usuário", async () => {
      createUserMock.mockResolvedValue({
        data: { user: { id: "uuid-rollback" } },
        error: null,
      });
      usuarioRepository.criarComAdmin = vi
        .fn()
        .mockRejectedValue(new Error("DB insert failed"));
      deleteUserMock.mockResolvedValue({ data: {}, error: null });

      await expect(
        usuarioService.criarUsuario(
          {
            nome: "Rollback",
            email: "rb@ubs.com",
            senha: "abc",
            funcao: "ACS",
          },
          authHeader,
        ),
      ).rejects.toThrow("Erro ao salvar perfil: DB insert failed");

      // Rollback: deve apagar o usuário criado no Auth
      expect(deleteUserMock).toHaveBeenCalledWith("uuid-rollback");
    });

    it("deve preservar erro original quando rollback falhar", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      createUserMock.mockResolvedValue({
        data: { user: { id: "uuid-rollback-falha" } },
        error: null,
      });
      usuarioRepository.criarComAdmin = vi
        .fn()
        .mockRejectedValue(new Error("DB insert failed"));
      deleteUserMock.mockRejectedValue(new Error("Rollback failed"));

      await expect(
        usuarioService.criarUsuario(
          {
            nome: "Rollback Falha",
            email: "rollbackfalha@ubs.com",
            senha: "abc",
            funcao: "ACS",
          },
          authHeader,
        ),
      ).rejects.toThrow("Erro ao salvar perfil: DB insert failed");

      expect(deleteUserMock).toHaveBeenCalledWith("uuid-rollback-falha");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Falha ao compensar criação de usuário no Auth.",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it("deve lançar erro claro quando SUPABASE_SERVICE_ROLE_KEY não estiver configurada", async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      await expect(
        usuarioService.criarUsuario(
          {
            nome: "Sem Service Role",
            email: "sem-service-role@ubs.com",
            senha: "abc",
            funcao: "ADMIN",
          },
          authHeader,
        ),
      ).rejects.toThrow(
        "SUPABASE_SERVICE_ROLE_KEY não configurada. Não é possível criar usuários no Auth.",
      );

      expect(createUserMock).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // atualizarUsuario
  // ===========================================================================
  describe("atualizarUsuario", () => {
    it("deve atualizar usuário sem senha sem chamar updateUserById", async () => {
      const perfilAtualizado = {
        id: "uuid-10",
        nome: "João Atualizado",
        email: "joao@ubs.com",
        funcao: "RECEPCAO",
      };
      usuarioRepository.atualizar = vi.fn().mockResolvedValue(perfilAtualizado);

      const resultado = await usuarioService.atualizarUsuario(
        "uuid-10",
        {
          nome: "João Atualizado",
          email: "joao@ubs.com",
          funcao: "RECEPCAO",
        },
        authHeader,
      );

      // NÃO deve chamar updateUserById (sem senha)
      expect(updateUserByIdMock).not.toHaveBeenCalled();
      expect(usuarioRepository.atualizar).toHaveBeenCalledWith(
        "uuid-10",
        {
          nome: "João Atualizado",
          email: "joao@ubs.com",
          funcao: "RECEPCAO",
        },
        authHeader,
      );
      expect(resultado).toEqual(perfilAtualizado);
    });

    it("deve atualizar usuário com senha chamando updateUserById", async () => {
      updateUserByIdMock.mockResolvedValue({ data: {}, error: null });
      const perfilAtualizado = {
        id: "uuid-11",
        nome: "Maria Nova",
        email: "maria@ubs.com",
        funcao: "ADMIN",
      };
      usuarioRepository.atualizar = vi.fn().mockResolvedValue(perfilAtualizado);

      const resultado = await usuarioService.atualizarUsuario(
        "uuid-11",
        {
          nome: "Maria Nova",
          email: "maria@ubs.com",
          funcao: "ADMIN",
          senha: "novaSenha456",
        },
        authHeader,
      );

      // DEVE chamar updateUserById com a senha
      expect(updateUserByIdMock).toHaveBeenCalledTimes(1);
      expect(updateUserByIdMock).toHaveBeenCalledWith("uuid-11", {
        password: "novaSenha456",
      });
      expect(usuarioRepository.atualizar).toHaveBeenCalledWith(
        "uuid-11",
        {
          nome: "Maria Nova",
          email: "maria@ubs.com",
          funcao: "ADMIN",
        },
        authHeader,
      );
      expect(resultado).toEqual(perfilAtualizado);
    });
  });
});
