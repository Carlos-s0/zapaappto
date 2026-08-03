const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');
const { permitirRoles } = require('../middlewares/auth.middleware');

// Gestión de usuarios: exclusiva del rol admin.
router.use(permitirRoles('admin'));

// GET /api/usuarios -> Listar todos
router.get('/', usuariosController.obtenerUsuarios);

// POST /api/usuarios -> Crear nuevo
router.post('/', usuariosController.crearUsuario);

// PUT /api/usuarios/:id -> Actualizar datos (y password si se envía)
router.put('/:id', usuariosController.actualizarUsuario);

// PATCH /api/usuarios/:id/activo -> Activar o desactivar (Toggle)
router.patch('/:id/activo', usuariosController.toggleActivo);

// DELETE /api/usuarios/:id -> Eliminar definitivamente
router.delete('/:id', usuariosController.eliminarUsuario);
 
module.exports = router;