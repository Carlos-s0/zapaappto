const db = require('../config/db');

const getAll = async (req, res) => {
    const { buscar } = req.query;
    try {
        let query = `
            SELECT c.*, 
                   COUNT(v.id)::INT        AS total_compras,
                   COALESCE(SUM(v.total), 0)::FLOAT AS total_gastado
            FROM clientes c
            LEFT JOIN ventas v ON v.cliente_id = c.id
            WHERE 1=1
        `;
        const params = [];
        if (buscar) {
            query += ` AND (c.nombre ILIKE $1 OR c.apellido ILIKE $1 
                           OR c.cedula ILIKE $1 OR c.telefono ILIKE $1)`;
            params.push(`%${buscar}%`);
        }
        query += ` GROUP BY c.id ORDER BY c.nombre ASC`;
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensaje: 'Error al obtener clientes' });
    }
};

const getById = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT c.*,
                    COUNT(v.id)::INT         AS total_compras,
                    COALESCE(SUM(v.total),0)::FLOAT AS total_gastado
             FROM clientes c
             LEFT JOIN ventas v ON v.cliente_id = c.id
             WHERE c.id = $1
             GROUP BY c.id`,
            [req.params.id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al obtener cliente' });
    }
};

const getVentas = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT v.id, TO_CHAR(v.fecha,'DD/MM/YYYY HH24:MI') AS fecha,
                   v.total, v.metodo_pago,
                   COUNT(vd.id)::INT AS items
            FROM ventas v
            JOIN venta_detalles vd ON v.id = vd.venta_id
            WHERE v.cliente_id = $1
            GROUP BY v.id
            ORDER BY v.fecha DESC
        `, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al obtener historial' });
    }
};

const create = async (req, res) => {
    const { nombre, apellido, cedula, telefono, email, direccion } = req.body;
    if (!nombre?.trim())
        return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
    try {
        const result = await db.query(
            `INSERT INTO clientes (nombre, apellido, cedula, telefono, email, direccion)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [nombre, apellido || null, cedula || null,
             telefono || null, email || null, direccion || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505')
            return res.status(400).json({ mensaje: 'La cédula ya está registrada' });
        res.status(500).json({ mensaje: 'Error al crear cliente' });
    }
};

const update = async (req, res) => {
    const { nombre, apellido, cedula, telefono, email, direccion } = req.body;
    try {
        const result = await db.query(
            `UPDATE clientes SET nombre=$1, apellido=$2, cedula=$3,
             telefono=$4, email=$5, direccion=$6
             WHERE id=$7 RETURNING *`,
            [nombre, apellido || null, cedula || null,
             telefono || null, email || null, direccion || null, req.params.id]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ mensaje: 'Cliente no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505')
            return res.status(400).json({ mensaje: 'La cédula ya está registrada' });
        res.status(500).json({ mensaje: 'Error al actualizar cliente' });
    }
};

const remove = async (req, res) => {
    try {
        // No eliminar si tiene ventas asociadas
        const check = await db.query(
            'SELECT COUNT(*) FROM ventas WHERE cliente_id = $1', [req.params.id]
        );
        if (parseInt(check.rows[0].count) > 0)
            return res.status(400).json({
                mensaje: 'No se puede eliminar: el cliente tiene ventas registradas'
            });
        await db.query('DELETE FROM clientes WHERE id = $1', [req.params.id]);
        res.json({ mensaje: 'Cliente eliminado' });
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al eliminar cliente' });
    }
};

module.exports = { getAll, getById, getVentas, create, update, remove };