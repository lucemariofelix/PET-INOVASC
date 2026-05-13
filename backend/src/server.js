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


// ----------------------------------------------------
// LIGANDO O MOTOR
// ----------------------------------------------------
const start = async () => {
  try {
    // Pega a porta dinâmica do Render ou usa a 3000 localmente
    const port = process.env.PORT || 3000;
    
    // CORREÇÃO: Trocamos "app" por "fastify" nestas 3 linhas abaixo!
    await fastify.listen({ port: port, host: '0.0.0.0' });
    
    fastify.log.info(`Servidor rodando forte na porta ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
