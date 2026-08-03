const express = require('express');
const router = express.Router();
const informesController = require('../controllers/informes.controller');
const { permitirRoles } = require('../middlewares/auth.middleware');

// GET /api/informes → métricas y ranking de más vendidos (admin y cajero)
router.get('/', permitirRoles('admin', 'cajero'), informesController.obtenerEstadisticas);

module.exports = router;
