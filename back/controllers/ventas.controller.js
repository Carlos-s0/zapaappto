const db = require('../config/db');

// GET /api/ventas
const obtenerVentas = async (req, res) => {
    try {
        const resultado = await db.query(
            `SELECT v.id, v.total, v.metodo_pago, v.fecha, v.nro_operacion,
                    c.nombre AS cliente_nombre, c.apellido AS cliente_apellido,
                    COUNT(vd.id) AS cantidad_items
             FROM ventas v
             LEFT JOIN clientes c ON v.cliente_id = c.id
             LEFT JOIN venta_detalles vd ON v.id = vd.venta_id
             WHERE v.borrado = 0
             GROUP BY v.id, c.nombre, c.apellido
             ORDER BY v.fecha DESC
             LIMIT 50`
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener el historial de ventas' });
    }
};

// POST /api/ventas
const registrarVenta = async (req, res) => {
    const { total, metodo_pago, cliente_id, nro_operacion, productos } = req.body;

    if (!productos || productos.length === 0) {
        return res.status(400).json({ mensaje: 'La venta debe tener al menos un producto' });
    }

    let montoEfectivo;
    let montoBanco;

    if (metodo_pago === 'Mixto') {
        montoEfectivo = parseFloat(req.body.monto_efectivo);
        montoBanco = parseFloat(req.body.monto_banco);

        if (!(montoEfectivo > 0) || !(montoBanco > 0)) {
            return res.status(400).json({ mensaje: 'El pago mixto debe tener un monto en efectivo y en banco, ambos mayores a cero' });
        }
        if (Math.abs((montoEfectivo + montoBanco) - parseFloat(total)) > 1) {
            return res.status(400).json({ mensaje: 'La suma de efectivo y banco no coincide con el total de la venta' });
        }
    } else if (metodo_pago === 'Efectivo') {
        montoEfectivo = parseFloat(total);
        montoBanco = 0;
    } else {
        // Tarjeta, Transferencia u otro método único: todo va como "banco"
        montoEfectivo = 0;
        montoBanco = parseFloat(total);
    }

    try {
        const ventaId = await db.withTransaction(async (client) => {
            const ventaResult = await client.query(
                `INSERT INTO ventas (total, metodo_pago, cliente_id, nro_operacion, monto_efectivo, monto_banco, borrado)
                 VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING id`,
                [total, metodo_pago, cliente_id || null, nro_operacion || null, montoEfectivo, montoBanco]
            );
            const ventaId = ventaResult.rows[0].id;

            for (const producto of productos) {
                await client.query(
                    `INSERT INTO venta_detalles (venta_id, zapato_id, cantidad, precio_unitario, subtotal)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [ventaId, producto.id, producto.cantidad, producto.precio_unitario, producto.subtotal]
                );
                await client.query(`UPDATE zapatos SET stock = stock - $1 WHERE id = $2`, [producto.cantidad, producto.id]);
            }

            const clienteDescripcion = cliente_id ? `Cliente ID: ${cliente_id}` : 'Consumidor Final';
            const descripcionCaja = `Venta #${ventaId} — ${clienteDescripcion} (${metodo_pago}${nro_operacion ? ' - Op: ' + nro_operacion : ''})`;

            await client.query(
                `INSERT INTO movimientos_caja (tipo, monto, descripcion, monto_efectivo, monto_banco)
                 VALUES ('INGRESO', $1, $2, $3, $4)`,
                [total, descripcionCaja, montoEfectivo, montoBanco]
            );

            return ventaId;
        });

        res.status(201).json({ mensaje: '¡Venta registrada con éxito!', ventaId });
    } catch (error) {
        console.error('Error al registrar la venta:', error);
        res.status(500).json({ mensaje: 'Error al procesar la venta' });
    }
};

// PATCH /api/ventas/:id/anular
const anularVenta = async (req, res) => {
    const { id } = req.params;
    
    try {
        // ✅ CORREGIDO: Conversión a número para validar correctamente
        const ventaId = parseInt(id);
        
        if (isNaN(ventaId) || ventaId <= 0) {
            return res.status(400).json({ mensaje: 'ID de venta inválido' });
        }

        const anulada = await db.withTransaction(async (client) => {
            const result = await client.query(
                'UPDATE ventas SET borrado = 1 WHERE id = $1 AND borrado = 0 RETURNING id',
                [ventaId]
            );

            if (result.rowCount === 0) {
                return false;
            }

            // Devolver el stock de los productos de la venta anulada
            const detalles = await client.query(
                'SELECT zapato_id, cantidad FROM venta_detalles WHERE venta_id = $1',
                [ventaId]
            );

            for (const detalle of detalles.rows) {
                await client.query(
                    'UPDATE zapatos SET stock = stock + $1 WHERE id = $2',
                    [detalle.cantidad, detalle.zapato_id]
                );
            }

            // Insertar movimiento de egreso en caja por la anulación
            const ventaData = await client.query(
                'SELECT total, metodo_pago, monto_efectivo, monto_banco FROM ventas WHERE id = $1',
                [ventaId]
            );

            if (ventaData.rows.length > 0) {
                const { total, metodo_pago, monto_efectivo, monto_banco } = ventaData.rows[0];
                const descripcionCaja = `ANULACIÓN Venta #${ventaId} (${metodo_pago})`;
                await client.query(
                    `INSERT INTO movimientos_caja (tipo, monto, descripcion, monto_efectivo, monto_banco)
                     VALUES ('EGRESO', $1, $2, $3, $4)`,
                    [total, descripcionCaja, monto_efectivo, monto_banco]
                );
            }

            return true;
        });

        if (!anulada) {
            return res.status(404).json({ mensaje: 'Venta no encontrada o ya anulada' });
        }

        res.status(200).json({ mensaje: 'Venta anulada con éxito', id: ventaId });
    } catch (error) {
        console.error('Error al anular la venta:', error);
        res.status(500).json({ mensaje: 'Error al anular la venta' });
    }
};

module.exports = {
    obtenerVentas,
    registrarVenta,
    anularVenta
};