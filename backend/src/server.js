require("dotenv").config();
const Fastify = require("fastify");
const cors = require("@fastify/cors"); // <- O Porteiro do CORS
const cookie = require("@fastify/cookie");
const errorHandler = require("./middlewares/errorHandler");

const fastify = Fastify({
  logger: true,
  bodyLimit: 10 * 1024 * 1024, // 10MB para payloads maiores da Evolution API
});

// Registro do Handler Global de Erros
fastify.setErrorHandler(errorHandler);

// ----------------------------------------------------
// REGISTRO DE PLUGINS DE SEGURANÇA
// ----------------------------------------------------
fastify.register(cors, {
  origin: ["https://pet-inovasc.vercel.app", "http://localhost:5173"], // Permite que o Vercel ou localhost conversem com essa API
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
});

fastify.register(cookie);

// 🔵 Rota principal (humana / debug)
fastify.get("/", async (request, reply) => {
  return reply.code(200).send({
    status: "online",
    sistema: "API SGR-UBS",
    mensagem: "Servidor rodando perfeitamente!",
  });
});

// 🟢 Health check (infra / monitoramento)
fastify.get("/health", async () => {
  return { status: "ok" };
});

// ----------------------------------------------------
// REGISTRO DE ROTAS (Módulos)
// ----------------------------------------------------
fastify.register(require("./routes/rotasPacientes"));
fastify.register(require("./routes/rotasConsultas"));
fastify.register(require("./routes/rotasAuth"));
fastify.register(require("./routes/rotasMensagens"));
fastify.register(require("./routes/rotasUsuarios"));
fastify.register(require("./routes/rotasGruposAcompanhamento"));
fastify.register(require("./routes/rotasNotificacoes"));
fastify.register(require("./routes/rotasWebhooks"));
fastify.register(require("./routes/rotasConfiguracoes"));

// ----------------------------------------------------
// LIGANDO O MOTOR
// ----------------------------------------------------
const start = async () => {
  try {
    // 1. Pega a porta que o Render mandar, ou usa 3000 se estiver no seu PC
    const porta = process.env.PORT || 3000;

    // 2. Abre para a internet com o 0.0.0.0
    await fastify.listen({ port: porta, host: "0.0.0.0" });

    console.log(`✅ Motor de Regras rodando na porta ${porta} e host 0.0.0.0`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
