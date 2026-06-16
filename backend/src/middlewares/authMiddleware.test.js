const supabaseConfig = require("../config/supabase");
const { verificarPermissao } = require("./authMiddleware");

const createReplyMock = () => {
  const reply = {
    status: vi.fn(() => reply),
    send: vi.fn(() => reply),
  };
  return reply;
};

const createSupabaseClientMock = ({ user, perfil, authError, dbError }) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user },
      error: authError || null,
    }),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: perfil,
          error: dbError || null,
        }),
      })),
    })),
  })),
});

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(supabaseConfig, "getSupabaseUsuario");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve negar quando cookie access_token estiver ausente", async () => {
    const request = {
      cookies: {},
      headers: {},
      log: { error: vi.fn() },
    };
    const reply = createReplyMock();

    await verificarPermissao(["ADMIN"])(request, reply);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({
      erro: "Token de autenticação ausente.",
    });
    expect(supabaseConfig.getSupabaseUsuario).not.toHaveBeenCalled();
  });

  it("deve validar token do cookie, reconstruir authHeader e anexar request.user", async () => {
    const supabaseClient = createSupabaseClientMock({
      user: { id: "user-1" },
      perfil: { nome: "Admin", funcao: "ADMIN" },
    });
    supabaseConfig.getSupabaseUsuario.mockReturnValue(supabaseClient);

    const request = {
      cookies: { access_token: "jwt-cookie" },
      headers: {},
      log: { error: vi.fn() },
    };
    const reply = createReplyMock();

    await verificarPermissao(["ADMIN"])(request, reply);

    expect(supabaseConfig.getSupabaseUsuario).toHaveBeenCalledWith(
      "Bearer jwt-cookie",
    );
    expect(request.authHeader).toBe("Bearer jwt-cookie");
    expect(request.headers.authorization).toBe("Bearer jwt-cookie");
    expect(request.user).toEqual({
      id: "user-1",
      nome: "Admin",
      funcao: "ADMIN",
    });
    expect(reply.status).not.toHaveBeenCalled();
  });

  it("deve negar quando perfil não tiver permissão", async () => {
    const supabaseClient = createSupabaseClientMock({
      user: { id: "user-1" },
      perfil: { nome: "ACS", funcao: "ACS" },
    });
    supabaseConfig.getSupabaseUsuario.mockReturnValue(supabaseClient);

    const request = {
      cookies: { access_token: "jwt-cookie" },
      headers: {},
      log: { error: vi.fn() },
    };
    const reply = createReplyMock();

    await verificarPermissao(["ADMIN"])(request, reply);

    expect(reply.status).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({
      erro: "Acesso Negado. O perfil ACS não tem permissão para isso.",
    });
  });
});
