const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// POST /api/auth/login
const login = async (req, res) => {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
        return res.status(400).json({ mensaje: 'Usuario y contraseña son requeridos' });
    }

    try {
        const resultado = await db.query(
            'SELECT * FROM usuarios WHERE usuario = $1 AND activo = true',
            [usuario]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado o inactivo' });
        }

        const user = resultado.rows[0];
        const passwordValida = await bcrypt.compare(password, user.password_hash);

        if (!passwordValida) {
           return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        const token = jwt.sign(
            { id: user.id, usuario: user.usuario, nombre: user.nombre, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        // Devolvemos el token y solo los datos seguros (sin el hash)
        res.json({
            token,
            id: user.id,
            nombre: user.nombre,
            usuario: user.usuario,
            rol: user.rol,
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

module.exports = { login };
