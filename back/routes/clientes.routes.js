const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/clientes.controller');
const { permitirRoles } = require('../middlewares/auth.middleware');

// Lectura: la necesita cualquier rol para buscar clientes al vender.
router.get('/',           ctrl.getAll);       // GET  /api/clientes?buscar=xxx
router.get('/:id',        ctrl.getById);      // GET  /api/clientes/:id
router.get('/:id/ventas', ctrl.getVentas);    // GET  /api/clientes/:id/ventas

// Gestión (alta/edición/baja): admin y cajero, no vendedor.
router.post('/',          permitirRoles('admin', 'cajero'), ctrl.create);       // POST /api/clientes
router.put('/:id',        permitirRoles('admin', 'cajero'), ctrl.update);       // PUT  /api/clientes/:id
router.delete('/:id',     permitirRoles('admin', 'cajero'), ctrl.remove);       // DELETE /api/clientes/:id

module.exports = router;