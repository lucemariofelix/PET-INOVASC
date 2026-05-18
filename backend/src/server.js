require('dotenv').config();
const Fastify = require('fastify');
const cors = require('@fastify/cors'); // <- O Porteiro do CORS

const fastify = Fastify({ logger: true });

// ----------------------------------------------------
// REGISTRO DE PLUGINS DE SEGURANÇA
// ----------------------------------------------------
// Isso avisa ao navegador que o nosso frontend React tem permissão para acessar os dados
fastify.register(cors, { 
  origin: '*', // Em desenvolvimento, permitimos qualquer origem. Em produção, colocaremos a URL real do site.
  methods: ['GET', 'POST', 'PUT', 'DELETE']
});

// ----------------------------------------------------
// REGISTRO DE ROTAS (Módulos)
// ----------------------------------------------------
fastify.register(require('./routes/pacientes'));
fastify.register(require('./routes/consultas'));
fastify.register(require('./routes/auth'));


// ----------------------------------------------------
// LIGANDO O MOTOR
// ----------------------------------------------------
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('✅ Motor de Regras rodando e CORS liberado em: http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();