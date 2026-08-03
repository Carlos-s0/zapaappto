const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/caja.controller');
const { permitirRoles } = require('../middlewares/auth.middleware');

router.use(permitirRoles('admin', 'cajero'));

// GET  /api/caja/resumen      → resumen del día (ingresos, egresos, saldo)
router.get('/resumen', cajaController.obtenerResumenDiario);

// GET  /api/caja/movimientos  → listado de movimientos del día
router.get('/movimientos', cajaController.obtenerMovimientos);

// POST /api/caja              → registrar egreso o ingreso manual
router.post('/', cajaController.registrarMovimiento);

module.exports = router;
