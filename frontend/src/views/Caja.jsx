import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, TextField,
    CircularProgress, Alert, Snackbar, Divider
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AddCardIcon from '@mui/icons-material/AddCard';
import { cajaApi } from '../api';
import { gs } from '../utils/moneda';

const MOVIMIENTO_INICIAL = { tipo: 'EGRESO', monto: '', descripcion: '' };

export default function Caja() {
    const [resumen, setResumen] = useState({ fecha: '', ingresos: 0, egresos: 0, saldo_caja: 0, efectivo: 0, banco: 0 });
    const [movimiento, setMovimiento] = useState(MOVIMIENTO_INICIAL);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, mensaje: '', tipo: 'success' });

    const mostrarMensaje = (mensaje, tipo = 'success') => setSnackbar({ open: true, mensaje, tipo });

    const obtenerResumen = async () => {
        try {
            const datos = await cajaApi.getResumen();
            setResumen(datos);
        } catch (error) {
            mostrarMensaje('Error al cargar la caja', 'error');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { obtenerResumen(); }, []);

    const manejarCambio = (e) => setMovimiento({ ...movimiento, [e.target.name]: e.target.value });

    const guardarMovimiento = async (e) => {
        e.preventDefault();
        if (parseFloat(movimiento.monto) <= 0) {
            mostrarMensaje('El monto debe ser mayor a cero', 'warning');
            return;
        }
        setGuardando(true);
        try {
            await cajaApi.registrarMovimiento(movimiento);
            mostrarMensaje('Movimiento registrado correctamente');
            setMovimiento(MOVIMIENTO_INICIAL);
            obtenerResumen();
        } catch (error) {
            mostrarMensaje(error.message, 'error');
        } finally {
            setGuardando(false);
        }
    };

    const fechaDisplay = resumen.fecha || new Date().toLocaleDateString('es-PY', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const tarjetas = [
        {
            label: 'Ingresos del día',
            valor: resumen.ingresos,
            icono: <TrendingUpIcon sx={{ fontSize: 22 }} />,
            color: '#16a34a',
            bgcolor: '#f0fdf4',
            borde: '#bbf7d0',
        },
        {
            label: 'Egresos del día',
            valor: resumen.egresos,
            icono: <TrendingDownIcon sx={{ fontSize: 22 }} />,
            color: '#dc2626',
            bgcolor: '#fef2f2',
            borde: '#fecaca',
        },
        {
            label: 'Saldo en caja',
            valor: resumen.saldo_caja,
            icono: <AccountBalanceIcon sx={{ fontSize: 22 }} />,
            color: resumen.saldo_caja >= 0 ? '#1d4ed8' : '#d97706',
            bgcolor: resumen.saldo_caja >= 0 ? '#eff6ff' : '#fef3c7',
            borde: resumen.saldo_caja >= 0 ? '#bfdbfe' : '#fcd34d',
            destacada: true,
        },
    ];

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                <Typography sx={{ fontSize: { xs: '1.3rem', sm: '1.6rem' }, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                    Control de Caja
                </Typography>
                <Typography sx={{ color: '#64748b', mt: 0.5, textTransform: 'capitalize', fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                    {fechaDisplay}
                </Typography>
            </Box>

            {cargando ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: '#f59e0b' }} />
                </Box>
            ) : (
                <>
                    {/* Tarjetas de resumen */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: { xs: 1.5, sm: 2 }, mb: { xs: 3, sm: 4 } }}>
                        {tarjetas.map((t) => (
                            <Paper key={t.label} sx={{
                                p: { xs: 1.75, sm: 3 }, borderRadius: '14px',
                                border: `1px solid ${t.borde}`,
                                bgcolor: t.bgcolor,
                                boxShadow: t.destacada ? '0 4px 20px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
                                position: 'relative',
                                overflow: 'hidden',
                                gridColumn: { xs: t.destacada ? '1 / -1' : 'auto', sm: 'auto' },
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: { xs: 1, sm: 2 }, gap: 0.5 }}>
                                    <Typography sx={{ fontSize: { xs: '0.68rem', sm: '0.8rem' }, fontWeight: 600, color: t.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        {t.label}
                                    </Typography>
                                    <Box sx={{ color: t.color, opacity: 0.8, flexShrink: 0 }}>{t.icono}</Box>
                                </Box>
                                <Typography sx={{ fontSize: { xs: '1.4rem', sm: '2rem' }, fontWeight: 900, color: t.color, letterSpacing: '-1px' }}>
                                    {gs(t.valor)}
                                </Typography>
                            </Paper>
                        ))}
                    </Box>

                    {/* Formulario de movimientos */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 2, sm: 3 }, alignItems: 'start' }}>
                        <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <AddCardIcon sx={{ color: '#f59e0b' }} />
                                <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                                    Registrar Movimiento Manual
                                </Typography>
                            </Box>

                            <form onSubmit={guardarMovimiento}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {/* Tipo de movimiento */}
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        {[
                                            { valor: 'EGRESO', label: '↓ Egreso / Gasto', color: '#dc2626', bg: '#fef2f2', borde: '#fecaca' },
                                            { valor: 'INGRESO', label: '↑ Ingreso Extra', color: '#16a34a', bg: '#f0fdf4', borde: '#bbf7d0' },
                                        ].map(({ valor, label, color, bg, borde }) => (
                                            <Box key={valor}
                                                onClick={() => setMovimiento({ ...movimiento, tipo: valor })}
                                                sx={{
                                                    flex: 1, p: 1.5, textAlign: 'center',
                                                    borderRadius: '10px', cursor: 'pointer',
                                                    border: `2px solid ${movimiento.tipo === valor ? borde : '#e2e8f0'}`,
                                                    bgcolor: movimiento.tipo === valor ? bg : 'white',
                                                    color: movimiento.tipo === valor ? color : '#94a3b8',
                                                    fontWeight: 700, fontSize: '0.82rem',
                                                    transition: 'all 0.15s',
                                                }}>
                                                {label}
                                            </Box>
                                        ))}
                                    </Box>

                                    <TextField
                                        name="monto"
                                        label="Monto (₲)"
                                        type="number"
                                        required
                                        inputProps={{ min: '1', step: '1' }}
                                        value={movimiento.monto}
                                        onChange={manejarCambio}
                                        sx={inputSx}
                                        fullWidth
                                    />

                                    <TextField
                                        name="descripcion"
                                        label="Descripción / Concepto"
                                        placeholder="Ej: Pago de delivery, compra de insumos..."
                                        required
                                        multiline
                                        rows={3}
                                        value={movimiento.descripcion}
                                        onChange={manejarCambio}
                                        sx={inputSx}
                                        fullWidth
                                    />

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={guardando}
                                        sx={{
                                            py: 1.4, borderRadius: '10px', fontWeight: 700,
                                            bgcolor: movimiento.tipo === 'EGRESO' ? '#dc2626' : '#16a34a',
                                            '&:hover': {
                                                bgcolor: movimiento.tipo === 'EGRESO' ? '#b91c1c' : '#15803d',
                                            },
                                        }}
                                    >
                                        {guardando ? 'Registrando...' : `Asentar ${movimiento.tipo === 'EGRESO' ? 'Egreso' : 'Ingreso'} en Caja`}
                                    </Button>
                                </Box>
                            </form>
                        </Paper>

                        {/* Panel informativo */}
                        <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: '14px', border: '1px solid #f1f5f9', bgcolor: '#fafbff', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', mb: 2 }}>
                                Resumen del Balance
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {[
                                { label: 'Ingresos por ventas', valor: resumen.ingresos, color: '#16a34a' },
                                { label: 'Salidas registradas', valor: resumen.egresos, color: '#dc2626' },
                            ].map(({ label, valor, color }) => (
                                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                                    <Typography sx={{ fontSize: '0.875rem', color: '#64748b' }}>{label}</Typography>
                                    <Typography sx={{ fontWeight: 700, color, fontSize: '0.95rem' }}>
                                        {gs(valor)}
                                    </Typography>
                                </Box>
                            ))}

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, mt: 1 }}>
                                <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>Saldo neto</Typography>
                                <Typography sx={{ fontWeight: 900, fontSize: '1.4rem' }}>
                                    {gs(resumen.saldo_caja)}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, mb: 1 }}>
                                Desglose para arqueo de caja
                            </Typography>
                            {[
                                { label: 'Efectivo', valor: resumen.efectivo },
                                { label: 'Banco (tarjeta / transferencia)', valor: resumen.banco },
                            ].map(({ label, valor }) => (
                                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                                    <Typography sx={{ fontSize: '0.82rem', color: '#64748b' }}>{label}</Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                                        {gs(valor)}
                                    </Typography>
                                </Box>
                            ))}

                            <Box sx={{ mt: 3, p: 2, bgcolor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
                                    💡 Los ingresos de ventas se registran automáticamente al procesar cada factura desde el módulo de Ventas.
                                </Typography>
                            </Box>
                        </Paper>
                    </Box>
                </>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snackbar.tipo} sx={{ borderRadius: '10px', fontWeight: 600 }}>
                    {snackbar.mensaje}
                </Alert>
            </Snackbar>
        </Box>
    );
}

const inputSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px', bgcolor: 'white',
        '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
    },
    '& label.Mui-focused': { color: '#f59e0b' },
};