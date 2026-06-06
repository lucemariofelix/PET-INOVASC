// =============================================================================
// MOCK do supabase — factory retorna objeto base, propriedades mutadas no beforeEach
// =============================================================================
vi.mock("../config/supabase", () => ({
  supabase: {
    auth: {},
    from: vi.fn(),
  },
}));

const supabaseModule = require("../config/supabase");
const authService = require("./authService");

// =============================================================================
// Helpers da chain, recriados a cada teste
// =============================================================================
let singleMock;
let eqMock;
let selectMock;
let fromMock;
let signInWithPasswordMock;

beforeEach(() => {
  vi.clearAllMocks();

  // Reconstrói a chain completa
  singleMock = vi.fn();
  eqMock = vi.fn().mockImplementation(() => ({ single: singleMock }));
  selectMock = vi.fn().mockImplementation(() => ({ eq: eqMock }));
  fromMock = vi.fn().mockImplementation(() => ({ select: selectMock }));
  signInWithPasswordMock = vi.fn();

  // Insere no objeto supabase — authService referencia o mesmo objeto
  // Mutação in-place, segura porque authService fez destructure do mesmo objeto
  supabaseModule.supabase.auth.signInWithPassword = signInWithPasswordMock;
  supabaseModule.supabase.from = fromMock;
});

// =============================================================================
// SUÍTE
// =============================================================================
describe("AuthService", () => {
  describe("login", () => {
    it("deve fazer login com sucesso e retornar token e usuário", async () => {
      signInWithPasswordMock.mockResolvedValue({
        data: {
          user: { id: "uuid-abc-123" },
          session: { access_token: "jwt-token-xyz" },
        },
        error: null,
      });
      singleMock.mockResolvedValue({
        data: { nome: "Administrador", funcao: "ADMIN" },
        error: null,
      });

      const resultado = await authService.login(
        "admin@ubs.com",
        "senha-segura",
      );

      expect(signInWithPasswordMock).toHaveBeenCalledWith({
        email: "admin@ubs.com",
        password: "senha-segura",
      });
      expect(fromMock).toHaveBeenCalledWith("perfis_usuarios");
      expect(selectMock).toHaveBeenCalledWith("nome, funcao");
      expect(eqMock).toHaveBeenCalledWith("id", "uuid-abc-123");
      expect(singleMock).toHaveBeenCalledTimes(1);
      expect(resultado).toEqual({
        token: "jwt-token-xyz",
        usuario: {
          id: "uuid-abc-123",
          nome: "Administrador",
          funcao: "ADMIN",
        },
      });
    });

    it("deve lançar erro quando as credenciais forem inválidas", async () => {
      signInWithPasswordMock.mockResolvedValue({
        data: null,
        error: { message: "Invalid login" },
      });

      await expect(authService.login("x@x.com", "x")).rejects.toThrow(
        "E-mail ou senha incorretos.",
      );
    });

    it("deve não buscar perfil quando as credenciais forem inválidas", async () => {
      signInWithPasswordMock.mockResolvedValue({
        data: null,
        error: { message: "Invalid login" },
      });

      try {
        await authService.login("x@x.com", "x");
      } catch {
        // esperado
      }

      expect(fromMock).not.toHaveBeenCalled();
    });

    it("deve lançar erro quando o perfil não for encontrado", async () => {
      signInWithPasswordMock.mockResolvedValue({
        data: { user: { id: "uu-1" }, session: { access_token: "j" } },
        error: null,
      });
      singleMock.mockResolvedValue({ data: null, error: null });

      await expect(authService.login("s@x.com", "x")).rejects.toThrow(
        "Perfil de usuário não configurado no sistema.",
      );
    });

    it("deve buscar o perfil usando o ID do usuário autenticado", async () => {
      signInWithPasswordMock.mockResolvedValue({
        data: { user: { id: "uuid-999" }, session: { access_token: "j" } },
        error: null,
      });
      singleMock.mockResolvedValue({
        data: { nome: "Recepcao", funcao: "RECEPCAO" },
        error: null,
      });

      const resultado = await authService.login("r@x.com", "x");

      expect(eqMock).toHaveBeenCalledWith("id", "uuid-999");
      expect(resultado).toEqual({
        token: "j",
        usuario: { id: "uuid-999", nome: "Recepcao", funcao: "RECEPCAO" },
      });
    });
  });
});
