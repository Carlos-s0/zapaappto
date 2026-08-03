const db = require('../config/db');

// GET /api/zapatos
const obtenerZapatos = async (req, res) => {
    try {
        const resultado = await db.query('SELECT * FROM zapatos ORDER BY fecha_ingreso DESC');
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener los zapatos' });
    }
};

// POST /api/zapatos
const crearZapato = async (req, res) => {
    const { codigo, modelo, talla, color, precio_venta, stock } = req.body;
    try {
        const resultado = await db.query(
            `INSERT INTO zapatos (codigo, modelo, talla, color, precio_venta, stock) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [codigo, modelo, talla, color, precio_venta, stock || 0]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(400).json({ mensaje: 'El código de este zapato ya existe en el sistema' });
        }
        res.status(500).json({ mensaje: 'Error al crear el zapato' });
    }
};

// PUT /api/zapatos/:id
const actualizarZapato = async (req, res) => {
    const { id } = req.params;
    const { codigo, modelo, talla, color, precio_venta, stock } = req.body;
    try {
        const resultado = await db.query(
            `UPDATE zapatos 
             SET codigo = $1, modelo = $2, talla = $3, color = $4, 
                 precio_venta = $5, stock = $6
             WHERE id = $7 RETURNING *`,
            [codigo, modelo, talla, color, precio_venta, stock, id]
        );
        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Zapato no encontrado' });
        }
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            return res.status(400).json({ mensaje: 'El código ya pertenece a otro zapato' });
        }
        res.status(500).json({ mensaje: 'Error al actualizar el zapato' });
    }
};

// DELETE /api/zapatos/:id
const eliminarZapato = async (req, res) => {
    const { id } = req.params;
    try {
        // Verificar si tiene ventas asociadas antes de eliminar
        const ventasCheck = await db.query(
            'SELECT COUNT(*) FROM venta_detalles WHERE zapato_id = $1',
            [id]
        );
        if (parseInt(ventasCheck.rows[0].count) > 0) {
            return res.status(400).json({ 
                mensaje: 'No se puede eliminar: este zapato tiene ventas registradas' 
            });
        }

        const resultado = await db.query(
            'DELETE FROM zapatos WHERE id = $1 RETURNING *',
            [id]
        );
        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Zapato no encontrado' });
        }
        res.json({ mensaje: 'Zapato eliminado correctamente', zapato: resultado.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al eliminar el zapato' });
    }
};

module.exports = {
    obtenerZapatos,
    crearZapato,
    actualizarZapato,
    eliminarZapato
};
