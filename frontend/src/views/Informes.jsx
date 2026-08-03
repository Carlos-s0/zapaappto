import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, Button, Grid,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Alert, Snackbar, InputAdornment, Chip, IconButton, Tooltip
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterAltOutlined as FilterAltOutlinedIcon,
    Clear as ClearIcon,
    ReceiptLong as ReceiptLongIcon,
    LocalMallOutlined as LocalMallOutlinedIcon,
    AttachMoney as AttachMoneyIcon,
    Download as DownloadIcon,
    PictureAsPdf as PictureAsPdfIcon,
    PersonOutlined as PersonOutlineIcon,
    CalendarMonth as CalendarMonthIcon,
    Inventory2Outlined as Inventory2OutlinedIcon,
    DeleteOutlined as DeleteOutlineIcon,
    PrintOutlined as PrintOutlinedIcon
} from '@mui/icons-material';
import { informesApi, ventasApi, parametrosApi } from '../api';
import { gs } from '../utils/moneda';
import TicketVenta from '../components/TicketVenta';

const FILTROS_INICIALES = {
    desde: '',
    hasta: '',
    cliente: '',
    producto: ''
};

export default function Informes() {
    const [filtros, setFiltros] = useState(FILTROS_INICIALES);
    const [cargando, setCargando] = useState(false);
    const [cargandoAnulacion, setCargandoAnulacion] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, mensaje: '', tipo: 'error' });
    const [parametros, setParametros] = useState(null);
    const [ventaImpresa, setVentaImpresa] = useState(null);

    const [reporte, setReporte] = useState({
        resumen: { total_ingresos: 0, total_ventas: 0, total_pares: 0 },
        ventas: []
    });

    const mostrarMensaje = (mensaje, tipo = 'success') => {
        setSnackbar({ open: true, mensaje, tipo });
    };

    const manejarFiltro = (e) => {
        setFiltros({ ...filtros, [e.target.name]: e.target.value });
    };

    const limpiarFiltros = () => {
        setFiltros(FILTROS_INICIALES);
    };

    const generarInforme = async (e) => {
        if (e) e.preventDefault();
        setCargando(true);

        try {
            const datos = await informesApi.getAll(filtros);
            setReporte(datos);
        } catch (error) {
            mostrarMensaje('Error al generar el informe con el servidor', 'error');
        } finally {
            setCargando(false);
        }
    };

    const anularVenta = async (ventaId) => {
        if (!window.confirm(`¿Estás seguro de anular la venta #${ventaId}? Esta acción no se puede deshacer.`)) {
            return;
        }

        setCargandoAnulacion(ventaId);

        try {
            await ventasApi.anular(ventaId);
            await generarInforme();
            mostrarMensaje(`Venta #${ventaId} anulada con éxito.`, 'success');
        } catch (error) {
            mostrarMensaje(error.message, 'error');
        } finally {
            setCargandoAnulacion(null);
        }
    };

    useEffect(() => {
        generarInforme();
        parametrosApi.getAll().then(setParametros).catch(() => {});
    }, []);

    const reimprimirVenta = (ventaId) => {
        const items = reporte.ventas.filter(v => v.id === ventaId);
        if (items.length === 0) return;
        const primera = items[0];
        setVentaImpresa({
            id: ventaId,
            fecha: primera.fecha,
            cliente: primera.cliente !== 'Consumidor Final'
                ? { nombre: primera.cliente, apellido: '' }
                : null,
            items: items.map(i => ({
                modelo: i.producto,
                cantidad: i.cantidad,
                precio_unitario: i.subtotal_item / i.cantidad,
                subtotal: i.subtotal_item,
            })),
            total: items.reduce((acc, i) => acc + i.subtotal_item, 0),
            metodoPago: primera.metodo_pago,
            nroOperacion: primera.nro_operacion,
            montoEfectivo: primera.monto_efectivo,
            montoBanco: primera.monto_banco,
        });
        setTimeout(() => window.print(), 0);
    };

    return (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
                <Box>
                    <Typography sx={{ fontSize: { xs: '1.3rem', sm: '1.6rem' }, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                        Informes de Ventas
                    </Typography>
                    <Typography sx={{ color: '#64748b', mt: 0.5, fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                        Generá reportes detallados y filtrá transacciones
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Exportar a Excel">
                        <IconButton sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', color: '#16a34a', borderRadius: '10px', '&:hover': { bgcolor: '#f0fdf4', borderColor: '#16a34a' } }}>
                            <DownloadIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Exportar a PDF">
                        <IconButton sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', color: '#dc2626', borderRadius: '10px', '&:hover': { bgcolor: '#fef2f2', borderColor: '#dc2626' } }}>
                            <PictureAsPdfIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Panel de Filtros */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', mb: 3 }}>
                <form onSubmit={generarInforme}>
                    <Grid container spacing={2} alignItems="center">

                        <Grid item xs={12} md={3}>
                            <Box>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', mb: 0.5, ml: 0.5 }}>
                                    Desde
                                </Typography>
                                <TextField fullWidth size="small" type="date" name="desde"
                                    value={filtros.desde} onChange={manejarFiltro} sx={inputSx} />
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Box>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', mb: 0.5, ml: 0.5 }}>
                                    Hasta
                                </Typography>
                                <TextField fullWidth size="small" type="date" name="hasta"
                                    value={filtros.hasta} onChange={manejarFiltro} sx={inputSx} />
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Box>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', mb: 0.5, ml: 0.5 }}>
                                    Cliente
                                </Typography>
                                <TextField fullWidth size="small" placeholder="Nombre o cédula..." name="cliente"
                                    value={filtros.cliente} onChange={manejarFiltro} sx={inputSx}
                                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonOutlineIcon sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> } }} />
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Box>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', mb: 0.5, ml: 0.5 }}>
                                    Producto
                                </Typography>
                                <TextField fullWidth size="small" placeholder="Modelo o marca..." name="producto"
                                    value={filtros.producto} onChange={manejarFiltro} sx={inputSx}
                                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><Inventory2OutlinedIcon sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> } }} />
                            </Box>
                        </Grid>

                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
                            <Button variant="outlined" startIcon={<ClearIcon />} onClick={limpiarFiltros}
                                sx={{ borderRadius: '8px', color: '#64748b', borderColor: '#cbd5e1', textTransform: 'none', fontWeight: 600 }}>
                                Limpiar
                            </Button>
                            <Button type="submit" variant="contained" startIcon={<FilterAltOutlinedIcon />} disabled={cargando}
                                sx={{ borderRadius: '8px', bgcolor: '#0f172a', color: 'white', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#1e293b' } }}>
                                {cargando ? 'Buscando...' : 'Generar Reporte'}
                            </Button>
                        </Grid>

                    </Grid>
                </form>
            </Paper>

            {/* Tarjetas de Resumen Dinámicas */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: { xs: 1.5, sm: 2 }, mb: 3 }}>
                {[
                    { titulo: 'Total Facturado', valor: gs(reporte.resumen.total_ingresos), icono: <AttachMoneyIcon />, bg: '#fef3c7', color: '#d97706', full: true },
                    { titulo: 'Operaciones (Tickets)', valor: reporte.resumen.total_ventas, icono: <ReceiptLongIcon />, bg: '#eff6ff', color: '#1d4ed8' },
                    { titulo: 'Pares Vendidos', valor: reporte.resumen.total_pares, icono: <LocalMallOutlinedIcon />, bg: '#f0fdf4', color: '#15803d' },
                ].map((t, index) => (
                    <Paper key={index} sx={{
                        p: { xs: 1.75, sm: 2.5 }, borderRadius: '12px', border: '1px solid #f1f5f9',
                        display: 'flex', alignItems: 'center', gap: { xs: 1.25, sm: 2 }, boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        gridColumn: { xs: t.full ? '1 / -1' : 'auto', sm: 'auto' },
                    }}>
                        <Box sx={{ width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 }, borderRadius: '10px', bgcolor: t.bg, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, '& svg': { fontSize: { xs: 20, sm: 26 } } }}>
                            {t.icono}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: { xs: '0.68rem', sm: '0.75rem' }, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {t.titulo}
                            </Typography>
                            <Typography sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' }, fontWeight: 900, color: '#0f172a', lineHeight: 1.1, mt: 0.5 }}>
                                {t.valor}
                            </Typography>
                        </Box>
                    </Paper>
                ))}
            </Box>

            {/* Tabla de Resultados Desglosada */}
            <Paper sx={{ borderRadius: '14px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                {cargando ? (
                    <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress sx={{ color: '#f59e0b' }} />
                    </Box>
                ) : reporte.ventas.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                        <SearchIcon sx={{ fontSize: 48, color: '#e2e8f0', mb: 1 }} />
                        <Typography sx={{ color: '#64748b', fontWeight: 600 }}>No se encontraron registros de ventas con estos filtros</Typography>
                    </Box>
                ) : (
                    <>
                    {/* Lista de tarjetas — solo mobile */}
                    <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                        {reporte.ventas.map((venta, idx) => (
                            <Box key={idx} sx={{ p: 2, borderBottom: '1px solid #f1f5f9' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>
                                            #{venta.id} <Typography component="span" sx={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.75rem' }}>{venta.fecha}</Typography>
                                        </Typography>
                                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mt: 0.3 }}>{venta.cliente || 'Consumidor Final'}</Typography>
                                        {venta.cedula && <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>CI/RUC: {venta.cedula}</Typography>}
                                    </Box>
                                    <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', flexShrink: 0, ml: 1 }}>
                                        {gs(venta.subtotal_item)}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Box>
                                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{venta.producto}</Typography>
                                        <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{venta.marca || 'Sin marca'}</Typography>
                                    </Box>
                                    <Chip label={`${venta.cantidad} uds.`} size="small" sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }} />
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Chip label={venta.metodo_pago} size="small"
                                            sx={{
                                                fontWeight: 600, fontSize: '0.7rem',
                                                bgcolor: venta.metodo_pago === 'Efectivo' ? '#dcfce7' : venta.metodo_pago === 'Tarjeta' ? '#e0e7ff' : '#f3e8ff',
                                                color: venta.metodo_pago === 'Efectivo' ? '#166534' : venta.metodo_pago === 'Tarjeta' ? '#3730a3' : '#6b21a8'
                                            }}
                                        />
                                        {venta.nro_operacion && (
                                            <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>
                                                Op: {venta.nro_operacion}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Box>
                                        <IconButton onClick={() => reimprimirVenta(venta.id)} size="small" sx={{ color: '#64748b' }}>
                                            <PrintOutlinedIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => anularVenta(venta.id)}
                                            disabled={cargandoAnulacion === venta.id}
                                            color="error"
                                            size="small"
                                        >
                                            {cargandoAnulacion === venta.id ? <CircularProgress size={18} /> : <DeleteOutlineIcon fontSize="small" />}
                                        </IconButton>
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    {/* Tabla — desde sm */}
                    <TableContainer sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#0f172a' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>TICKET / FECHA</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>CLIENTE</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>PRODUCTO</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.75rem', py: 2 }} align="center">CANTIDAD</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>PAGO</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.75rem', py: 2 }} align="right">SUBTOTAL</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.75rem', py: 2 }} align="center">ACCIONES</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reporte.ventas.map((venta, idx) => (
                                    <TableRow key={idx} hover sx={{ '&:last-child td': { border: 0 } }}>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>
                                                #{venta.id}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>{venta.fecha}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{venta.cliente || 'Consumidor Final'}</Typography>
                                            {venta.cedula && <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>CI/RUC: {venta.cedula}</Typography>}
                                        </TableCell>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{venta.producto}</Typography>
                                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{venta.marca || 'Sin marca'}</Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={`${venta.cantidad} uds.`} size="small" sx={{ fontWeight: 700, bgcolor: '#f1f5f9' }} />
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={venta.metodo_pago} size="small"
                                                sx={{
                                                    fontWeight: 600, fontSize: '0.7rem',
                                                    bgcolor: venta.metodo_pago === 'Efectivo' ? '#dcfce7' : venta.metodo_pago === 'Tarjeta' ? '#e0e7ff' : '#f3e8ff',
                                                    color: venta.metodo_pago === 'Efectivo' ? '#166534' : venta.metodo_pago === 'Tarjeta' ? '#3730a3' : '#6b21a8'
                                                }}
                                            />
                                            {venta.nro_operacion && (
                                                <Typography sx={{ fontSize: '0.68rem', color: '#64748b', mt: 0.2 }}>
                                                    Op: {venta.nro_operacion}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                                            {gs(venta.subtotal_item)}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Reimprimir ticket">
                                                <IconButton
                                                    onClick={() => reimprimirVenta(venta.id)}
                                                    size="small"
                                                    sx={{ color: '#64748b', '&:hover': { color: '#0f172a' } }}
                                                >
                                                    <PrintOutlinedIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Anular Venta">
                                                <span>
                                                    <IconButton
                                                        onClick={() => anularVenta(venta.id)}
                                                        disabled={cargandoAnulacion === venta.id}
                                                        color="error"
                                                        size="small"
                                                    >
                                                        {cargandoAnulacion === venta.id ? <CircularProgress size={20} /> : <DeleteOutlineIcon />}
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    </>
                )}
            </Paper>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snackbar.tipo} sx={{ borderRadius: '10px', fontWeight: 600 }}>{snackbar.mensaje}</Alert>
            </Snackbar>

            {/* Ticket oculto, solo visible al imprimir (ver print.css) */}
            <div className="ticket-imprimir">
                <TicketVenta parametros={parametros} venta={ventaImpresa} />
            </div>
        </Box>
    );
}

const inputSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px', bgcolor: 'white',
        '&:hover fieldset': { borderColor: '#f59e0b' },
        '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
    },
    '& label.Mui-focused': { color: '#f59e0b' },
};