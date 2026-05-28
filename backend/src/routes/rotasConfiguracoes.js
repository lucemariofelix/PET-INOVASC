const logController = require('../controllers/logController');

// Proteja essa rota com o middleware de ADMIN!
fastify.get('/logs', logController.listar);
