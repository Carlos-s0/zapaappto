const db = require('../config/db');
const bcrypt = require('bcrypt');

const ROLES_VALIDOS = ['admin', 'cajero', 'vendedor'];

// GET /api/usuarios
const obtenerUsuarios = async (req, res) => {
    try {
        // No devolvemos el password_hash por seguridad
        const resultado = await db.query(
            'SELECT id, nombre, usuario, rol, activo, fecha_creacion FROM usuarios ORDER BY id ASC'
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ mensaje: 'Error al obtener la lista de usuarios' });
    }
};

// POST /api/usuarios
const crearUsuario = async (req, res) => {
    const { nombre, usuario, password, rol } = req.body;

    if (!nombre || !usuario || !password) {
        return res.status(400).json({ mensaje: 'Nombre, usuario y contraseña son obligatorios' });
    }
    if (rol && !ROLES_VALIDOS.includes(rol)) {
        return res.status(400).json({ mensaje: 'Rol inválido' });
    }

    try {
        // Encriptar la contraseña (costo 10 es el estándar seguro)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const resultado = await db.query(
            `INSERT INTO usuarios (nombre, usuario, password_hash, rol)
             VALUES ($1, $2, $3, $4) RETURNING id, nombre, usuario, rol, activo`,
            [nombre, usuario, passwordHash, rol || 'vendedor']
        );

        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error('Error al crear usuario:', error);
        // Manejar error de usuario duplicado (código 23505 en PostgreSQL)
        if (error.code === '23505') {
            return res.status(400).json({ mensaje: 'El nombre de usuario ya existe' });
        }
        res.status(500).json({ mensaje: 'Error al crear el usuario' });
    }
};

// PUT /api/usuarios/:id
const actualizarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, usuario, password, rol } = req.body;

    if (rol && !ROLES_VALIDOS.includes(rol)) {
        return res.status(400).json({ mensaje: 'Rol inválido' });
    }

    try {
        let query;
        let params;

        // Si el usuario envió una nueva contraseña, la actualizamos también.
        // rol usa COALESCE para no pisar el rol actual si no se envía uno nuevo.
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);
            query = `UPDATE usuarios SET nombre = $1, usuario = $2, password_hash = $3, rol = COALESCE($4, rol) WHERE id = $5 RETURNING id, nombre, usuario, rol`;
            params = [nombre, usuario, passwordHash, rol || null, id];
        } else {
            query = `UPDATE usuarios SET nombre = $1, usuario = $2, rol = COALESCE($3, rol) WHERE id = $4 RETURNING id, nombre, usuario, rol`;
            params = [nombre, usuario, rol || null, id];
        }

        const resultado = await db.query(query, params);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        if (error.code === '23505') {
            return res.status(400).json({ mensaje: 'El nombre de usuario ya está en uso' });
        }
        res.status(500).json({ mensaje: 'Error al actualizar el usuario' });
    }
};

// PATCH /api/usuarios/:id/activo
const toggleActivo = async (req, res) => {
    const { id } = req.params;
    const { activo } = req.body;

    try {
        const resultado = await db.query(
            'UPDATE usuarios SET activo = $1 WHERE id = $2 RETURNING id, activo',
            [activo, id]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        console.error('Error al cambiar estado del usuario:', error);
        res.status(500).json({ mensaje: 'Error al cambiar el estado del usuario' });
    }
};

// DELETE /api/usuarios/:id
const eliminarUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await db.query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        res.json({ mensaje: 'Usuario eliminado con éxito' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ mensaje: 'Error al eliminar el usuario' });
    }
};

// Es VITAL exportar todas las funciones para que el router no tire error de "undefined"
module.exports = {
    obtenerUsuarios,
    crearUsuario,
    actualizarUsuario,
    toggleActivo,
    eliminarUsuario
};