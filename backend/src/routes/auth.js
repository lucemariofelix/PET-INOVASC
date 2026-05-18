const authController = require('../controllers/authController');

async function rotasAuth(fastify, options) {
  fastify.post('/auth/login', authController.login);
}

module.exports = rotasAuth;