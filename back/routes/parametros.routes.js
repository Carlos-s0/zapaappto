const express = require('express');
const router = express.Router();
const parametrosController = require('../controllers/parametros.controller');
const { verificarToken, permitirRoles } = require('../middlewares/auth.middleware');

// GET /api/parametros — público: lo necesitan tanto la pantalla de login como el sidebar
// para mostrar el nombre del negocio antes de autenticarse.
router.get('/', parametrosController.obtener);

// PUT /api/parametros — modificar la configuración: solo admin.
router.put('/', verificarToken, permitirRoles('admin'), parametrosController.actualizar);

module.exports = router;
