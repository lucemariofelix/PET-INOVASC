const mensageriaService = require("./mensageriaService");

const fetchOriginal = global.fetch;
const envOriginal = {
  EVOLUTION_API_URL: process.env.EVOLUTION_API_URL,
  EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY,
  EVOLUTION_INSTANCE_NAME: process.env.EVOLUTION_INSTANCE_NAME,
};

const respostaJson = (dados, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  json: vi.fn().mockResolvedValue(dados),
});

describe("mensageriaService.desconectarWhatsApp", () => {
  beforeEach(() => {
    process.env.EVOLUTION_API_URL = "https://evolution.example";
    process.env.EVOLUTION_API_KEY = "segredo";
    process.env.EVOLUTION_INSTANCE_NAME = "posto potengi";
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = fetchOriginal;
    for (const [chave, valor] of Object.entries(envOriginal)) {
      if (valor === undefined) delete process.env[chave];
      else process.env[chave] = valor;
    }
    vi.restoreAllMocks();
  });

  it("rejeita integração não configurada", async () => {
    delete process.env.EVOLUTION_API_KEY;

    await expect(mensageriaService.desconectarWhatsApp()).rejects.toMatchObject({
      statusCode: 503,
      code: "EVOLUTION_NOT_CONFIGURED",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("desconecta uma sessão aberta usando o endpoint de logout", async () => {
    global.fetch
      .mockResolvedValueOnce(respostaJson({ instance: { state: "open" } }))
      .mockResolvedValueOnce(respostaJson({ status: "SUCCESS" }));

    await expect(mensageriaService.desconectarWhatsApp()).resolves.toEqual({
      status: "disconnected",
      already_disconnected: false,
    });
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "https://evolution.example/instance/logout/posto%20potengi",
      expect.objectContaining({
        method: "DELETE",
        headers: { apikey: "segredo" },
      }),
    );
  });

  it.each(["close", "closed", "disconnected"])(
    "trata estado %s como logout idempotente",
    async (state) => {
      global.fetch.mockResolvedValueOnce(respostaJson({ instance: { state } }));

      await expect(mensageriaService.desconectarWhatsApp()).resolves.toEqual({
        status: "disconnected",
        already_disconnected: true,
      });
      expect(global.fetch).toHaveBeenCalledOnce();
    },
  );

  it.each([
    ["falha de rede", () => Promise.reject(new Error("offline"))],
    ["resposta HTTP inválida", () => respostaJson({}, { ok: false, status: 500 })],
    ["JSON inválido", () => ({ ok: true, json: vi.fn().mockRejectedValue(new Error("json")) })],
  ])("normaliza %s sem expor detalhes internos", async (_nome, resposta) => {
    global.fetch.mockImplementationOnce(resposta);

    await expect(mensageriaService.desconectarWhatsApp()).rejects.toMatchObject({
      statusCode: 502,
      code: "WHATSAPP_DISCONNECT_FAILED",
      message: "Não foi possível desconectar o WhatsApp. Tente novamente mais tarde.",
    });
  });

  it("normaliza falha retornada pelo endpoint de logout", async () => {
    global.fetch
      .mockResolvedValueOnce(
        respostaJson({ instance: { state: "connecting" } }),
      )
      .mockResolvedValueOnce(respostaJson({ error: true }));

    await expect(mensageriaService.desconectarWhatsApp()).rejects.toMatchObject({
      statusCode: 502,
      code: "WHATSAPP_DISCONNECT_FAILED",
    });
  });
});
