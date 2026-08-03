const express = require('express');
const router = express.Router();
const zapatosController = require('../controllers/zapatos.controller');
const { permitirRoles } = require('../middlewares/auth.middleware');

// GET  /api/zapatos        → listar todos (lo necesita cualquier rol para vender)
router.get('/', zapatosController.obtenerZapatos);

// POST /api/zapatos        → crear nuevo (solo admin, gestión de inventario)
router.post('/', permitirRoles('admin'), zapatosController.crearZapato);

// PUT  /api/zapatos/:id    → actualizar por ID (solo admin)
router.put('/:id', permitirRoles('admin'), zapatosController.actualizarZapato);

// DELETE /api/zapatos/:id  → eliminar por ID (solo admin)
router.delete('/:id', permitirRoles('admin'), zapatosController.eliminarZapato);

module.exports = router;
