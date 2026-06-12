const authController = require('../controllers/authController');
const { verificarPermissao } = require('../middlewares/authMiddleware');

async function rotasAuth(fastify, options) {
  fastify.post('/auth/login', authController.login);
  fastify.get(
    '/auth/me',
    { preHandler: [verificarPermissao(['ADMIN', 'RECEPCAO', 'ACS'])] },
    async (request) => {
      return { usuario: request.user };
    },
  );
}

module.exports = rotasAuth;
