require("dotenv").config();
const Fastify = require("fastify");
const cors = require("@fastify/cors"); // <- O Porteiro do CORS

const fastify = Fastify({ logger: true });

// ----------------------------------------------------
// REGISTRO DE PLUGINS DE SEGURANÇA
// ----------------------------------------------------
fastify.register(cors, {
  origin: ["https://pet-inovasc.vercel.app", "http://localhost:5173"], // Permite que o Vercel ou localhost conversem com essa API
  methods: ["GET", "POST", "PUT", "DELETE"],
});

// ----------------------------------------------------
// REGISTRO DE ROTAS (Módulos)
// ----------------------------------------------------
fastify.register(require("./routes/pacientes"));
fastify.register(require("./routes/consultas"));
fastify.register(require("./routes/auth"));
fastify.register(require("./routes/mensagens"));
fastify.register(require("./routes/rotasUsuarios"));
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
