const db = require('../config/db');

// GET /api/caja/movimientos
const obtenerMovimientos = async (req, res) => {
    try {
        const resultado = await db.query(
            `SELECT id, tipo, monto, descripcion, fecha
             FROM movimientos_caja
             WHERE DATE(fecha) = CURRENT_DATE
             ORDER BY fecha DESC`
        );
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener los movimientos' });
    }
};

// GET /api/caja/resumen
const obtenerResumenDiario = async (req, res) => {
    try {
        const ingresosQuery = await db.query(
            `SELECT COALESCE(SUM(monto), 0) AS total_ingresos,
                    COALESCE(SUM(monto_efectivo), 0) AS ingresos_efectivo,
                    COALESCE(SUM(monto_banco), 0) AS ingresos_banco
             FROM movimientos_caja
             WHERE tipo = 'INGRESO' AND DATE(fecha) = CURRENT_DATE`
        );

        const egresosQuery = await db.query(
            `SELECT COALESCE(SUM(monto), 0) AS total_egresos,
                    COALESCE(SUM(monto_efectivo), 0) AS egresos_efectivo,
                    COALESCE(SUM(monto_banco), 0) AS egresos_banco
             FROM movimientos_caja
             WHERE tipo = 'EGRESO' AND DATE(fecha) = CURRENT_DATE`
        );

        const ingresos = parseFloat(ingresosQuery.rows[0].total_ingresos);
        const egresos  = parseFloat(egresosQuery.rows[0].total_egresos);
        const ingresosEfectivo = parseFloat(ingresosQuery.rows[0].ingresos_efectivo);
        const ingresosBanco    = parseFloat(ingresosQuery.rows[0].ingresos_banco);
        const egresosEfectivo  = parseFloat(egresosQuery.rows[0].egresos_efectivo);
        const egresosBanco     = parseFloat(egresosQuery.rows[0].egresos_banco);

        res.json({
            fecha: new Date().toLocaleDateString('es-PY'),
            ingresos,
            egresos,
            saldo_caja: ingresos - egresos,
            efectivo: ingresosEfectivo - egresosEfectivo,
            banco: ingresosBanco - egresosBanco,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al calcular el resumen de caja' });
    }
};

// POST /api/caja
const registrarMovimiento = async (req, res) => {
    const { tipo, monto, descripcion } = req.body;

    if (!['INGRESO', 'EGRESO'].includes(tipo?.toUpperCase())) {
        return res.status(400).json({ mensaje: 'El tipo debe ser INGRESO o EGRESO' });
    }
    if (!monto || parseFloat(monto) <= 0) {
        return res.status(400).json({ mensaje: 'El monto debe ser mayor a cero' });
    }

    try {
        const resultado = await db.query(
            `INSERT INTO movimientos_caja (tipo, monto, descripcion) 
             VALUES ($1, $2, $3) RETURNING *`,
            [tipo.toUpperCase(), monto, descripcion]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al registrar el movimiento' });
    }
};

module.exports = {
    obtenerMovimientos,
    obtenerResumenDiario,
    registrarMovimiento
};
