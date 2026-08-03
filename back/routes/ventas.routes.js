const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventas.controller');
const { permitirRoles } = require('../middlewares/auth.middleware');

// GET  /api/ventas  → historial de ventas (admin y cajero)
router.get('/', permitirRoles('admin', 'cajero'), ventasController.obtenerVentas);

// POST /api/ventas  → registrar nueva venta (cualquier rol puede vender)
router.post('/', ventasController.registrarVenta);

// PATCH /api/ventas/:id/anular  → anular una venta específica (admin y cajero, no vendedor)
router.patch('/:id/anular', permitirRoles('admin', 'cajero'), ventasController.anularVenta);

module.exports = router;