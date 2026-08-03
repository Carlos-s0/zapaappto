const db = require('../config/db');

// GET /api/parametros
const obtener = async (req, res) => {
    try {
        const resultado = await db.query('SELECT * FROM parametros WHERE id = 1');
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error('Error al obtener parámetros:', error);
        res.status(500).json({ mensaje: 'Error al obtener los parámetros del negocio' });
    }
};

// PUT /api/parametros
const actualizar = async (req, res) => {
    const {
        nombre_local, direccion, telefono, ruc,
        timbrado, nombre_impresora, ancho_ticket, mensaje_pie
    } = req.body;

    if (!nombre_local?.trim()) {
        return res.status(400).json({ mensaje: 'El nombre del local es obligatorio' });
    }

    try {
        const resultado = await db.query(
            `UPDATE parametros SET
                nombre_local = $1, direccion = $2, telefono = $3, ruc = $4,
                timbrado = $5, nombre_impresora = $6, ancho_ticket = $7, mensaje_pie = $8
             WHERE id = 1
             RETURNING *`,
            [
                nombre_local, direccion || null, telefono || null, ruc || null,
                timbrado || null, nombre_impresora || null, ancho_ticket || 80, mensaje_pie || null
            ]
        );
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error('Error al actualizar parámetros:', error);
        res.status(500).json({ mensaje: 'Error al actualizar los parámetros del negocio' });
    }
};

module.exports = { obtener, actualizar };
