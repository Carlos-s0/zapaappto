const db = require('../config/db');

const obtenerEstadisticas = async (req, res) => {
    const { desde, hasta, cliente, producto } = req.query;

    try {
        const params = [];
        let i = 1;

        let filtroFecha    = '';
        let filtroProducto = '';
        let filtroCliente  = '';

        if (desde) {
            filtroFecha += ` AND v.fecha >= $${i++}`;
            params.push(`${desde} 00:00:00`);
        }
        if (hasta) {
            filtroFecha += ` AND v.fecha <= $${i++}`;
            params.push(`${hasta} 23:59:59`);
        }
        if (producto) {
            filtroProducto += ` AND z.modelo ILIKE $${i++}`;
            params.push(`%${producto}%`);
        }
        if (cliente) {
            filtroCliente += ` AND (c.nombre ILIKE $${i} OR c.apellido ILIKE $${i} OR c.cedula ILIKE $${i})`;
            params.push(`%${cliente}%`);
            i++;
        }

        // CONSULTA 1: detalle de ventas
        // ✅ CORREGIDO: Se agrega v.id AS id para que el frontend pueda usarlo al anular
        const ventasResult = await db.query(`
            SELECT
                v.id  AS id,
                TO_CHAR(v.fecha, 'DD/MM/YYYY HH24:MI') AS fecha,
                CASE 
                    WHEN c.id IS NOT NULL 
                    THEN TRIM(c.nombre || ' ' || COALESCE(c.apellido, ''))
                    ELSE 'Consumidor Final'
                END    AS cliente,
                c.cedula,
                v.metodo_pago,
                v.nro_operacion,
                v.monto_efectivo::FLOAT AS monto_efectivo,
                v.monto_banco::FLOAT    AS monto_banco,
                z.modelo   AS producto,
                vd.cantidad,
                vd.subtotal::FLOAT  AS subtotal_item
            FROM ventas v
            JOIN venta_detalles vd ON v.id  = vd.venta_id
            JOIN zapatos z         ON vd.zapato_id = z.id
            LEFT JOIN clientes c   ON v.cliente_id = c.id
            WHERE v.borrado = 0
            ${filtroFecha}
            ${filtroProducto}
            ${filtroCliente}
            ORDER BY v.fecha DESC, v.id DESC
        `, params);

        // CONSULTA 2: resumen / métricas
        const resumenResult = await db.query(`
            SELECT
                COALESCE(SUM(sub.total), 0)::FLOAT   AS total_ingresos,
                COUNT(DISTINCT sub.id)::INT           AS total_ventas,
                COALESCE(SUM(sub.pares), 0)::INT      AS total_pares
            FROM (
                SELECT v.id, v.total, SUM(vd.cantidad) AS pares
                FROM ventas v
                JOIN venta_detalles vd ON v.id  = vd.venta_id
                JOIN zapatos z         ON vd.zapato_id = z.id
                LEFT JOIN clientes c   ON v.cliente_id = c.id
                WHERE v.borrado = 0
                ${filtroFecha}
                ${filtroProducto}
                ${filtroCliente}
                GROUP BY v.id, v.total
            ) sub
        `, params);

        res.json({
            resumen: resumenResult.rows[0] || { total_ingresos: 0, total_ventas: 0, total_pares: 0 },
            ventas:  ventasResult.rows,
        });

    } catch (error) {
        console.error('Error al generar informes:', error);
        res.status(500).json({ mensaje: 'Error al compilar las estadísticas' });
    }
};

module.exports = { obtenerEstadisticas };