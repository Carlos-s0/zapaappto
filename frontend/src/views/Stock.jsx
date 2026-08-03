import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Grid, Chip,
    IconButton, Tooltip, Fade, CircularProgress, InputAdornment, Alert, Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { zapatosApi } from '../api';
import { gs } from '../utils/moneda';

const FORM_INICIAL = {
    codigo: '', modelo: '', talla: '', color: '',
    precio_venta: '', stock: ''
};

export default function Stock() {
    const [zapatos, setZapatos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [open, setOpen] = useState(false);
    const [editando, setEditando] = useState(null);
    const [formulario, setFormulario] = useState(FORM_INICIAL);
    const [snackbar, setSnackbar] = useState({ open: false, mensaje: '', tipo: 'success' });

    const mostrarMensaje = (mensaje, tipo = 'success') => {
        setSnackbar({ open: true, mensaje, tipo });
    };

    const obtenerInventario = async () => {
        try {
            const datos = await zapatosApi.getAll();
            setZapatos(datos);
        } catch (error) {
            mostrarMensaje('Error al cargar el inventario', 'error');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { obtenerInventario(); }, []);

    const manejarCambio = (e) => setFormulario({ ...formulario, [e.target.name]: e.target.value });

    const abrirModal = (zapato = null) => {
        if (zapato) {
            setEditando(zapato.id);
            setFormulario({
                codigo: zapato.codigo, modelo: zapato.modelo,
                talla: zapato.talla, color: zapato.color || '',
                precio_venta: zapato.precio_venta, stock: zapato.stock
            });
        } else {
            setEditando(null);
            setFormulario(FORM_INICIAL);
        }
        setOpen(true);
    };

    const cerrarModal = () => {
        setOpen(false);
        setEditando(null);
        setFormulario(FORM_INICIAL);
    };

    const guardarZapato = async (e) => {
        e.preventDefault();
        try {
            if (editando) {
                await zapatosApi.update(editando, formulario);
                mostrarMensaje('Calzado actualizado correctamente');
            } else {
                await zapatosApi.create(formulario);
                mostrarMensaje('Calzado agregado al inventario');
            }
            obtenerInventario();
            cerrarModal();
        } catch (error) {
            mostrarMensaje(error.message, 'error');
        }
    };

    const eliminarZapato = async (id, modelo) => {
        if (!window.confirm(`¿Eliminar "${modelo}" del inventario?`)) return;
        try {
            await zapatosApi.delete(id);
            mostrarMensaje('Calzado eliminado del inventario');
            obtenerInventario();
        } catch (error) {
            mostrarMensaje(error.message, 'error');
        }
    };

    const zapatosFiltrados = zapatos.filter(z =>
        z.modelo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        z.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        z.color?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const stockBajo = zapatos.filter(z => parseInt(z.stock) <= 3).length;
    const totalPares = zapatos.reduce((acc, z) => acc + parseInt(z.stock || 0), 0);

    if (cargando) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress sx={{ color: '#f59e0b' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                        Inventario de Stock
                    </Typography>
                    <Typography sx={{ color: '#64748b', mt: 0.5 }}>
                        {zapatos.length} productos · {totalPares} pares en total
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => abrirModal()}
                    sx={{
                        bgcolor: '#f59e0b', color: '#000', fontWeight: 700,
                        borderRadius: '10px', px: 2.5, py: 1.2,
                        boxShadow: '0 4px 15px rgba(245,158,11,0.35)',
                        '&:hover': { bgcolor: '#d97706' },
                    }}
                >
                    Nuevo Calzado
                </Button>
            </Box>

            {/* Alertas de stock bajo */}
            {stockBajo > 0 && (
                <Box sx={{
                    mb: 3, p: 2, borderRadius: '10px',
                    bgcolor: '#fef3c7', border: '1px solid #fcd34d',
                    display: 'flex', alignItems: 'center', gap: 1.5
                }}>
                    <WarningAmberIcon sx={{ color: '#d97706' }} />
                    <Typography sx={{ color: '#92400e', fontWeight: 600, fontSize: '0.875rem' }}>
                        {stockBajo} {stockBajo === 1 ? 'producto tiene' : 'productos tienen'} stock bajo (≤3 unidades). Revisá el inventario.
                    </Typography>
                </Box>
            )}

            {/* Buscador */}
            <TextField
                placeholder="Buscar por modelo, código o color..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                fullWidth
                sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '10px', bgcolor: 'white',
                        '&:hover fieldset': { borderColor: '#f59e0b' },
                        '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
                    }
                }}
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#94a3b8' }} />
                            </InputAdornment>
                        ),
                    }
                }}
            />

            {/* Tabla */}
            <Paper sx={{ borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9' }}>
                {/* Header de la tabla */}
                <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr 80px 100px 130px 120px 100px',
                    bgcolor: '#0a0f1e', px: 2, py: 1.5,
                }}>
                    {['Código', 'Modelo', 'Talla', 'Color', 'Precio', 'Stock', 'Acciones'].map(h => (
                        <Typography key={h} sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {h}
                        </Typography>
                    ))}
                </Box>

                {/* Filas */}
                {zapatosFiltrados.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                        <InventoryIcon sx={{ fontSize: 48, color: '#e2e8f0', mb: 1 }} />
                        <Typography sx={{ color: '#94a3b8' }}>
                            {busqueda ? 'No se encontraron resultados' : 'No hay calzados registrados'}
                        </Typography>
                    </Box>
                ) : (
                    zapatosFiltrados.map((zapato, i) => {
                        const stockBajoItem = parseInt(zapato.stock) <= 3;
                        return (
                            <Fade in key={zapato.id} timeout={200 + i * 30}>
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 2fr 80px 100px 130px 120px 100px',
                                    px: 2, py: 1.8,
                                    alignItems: 'center',
                                    borderBottom: '1px solid #f8fafc',
                                    bgcolor: 'white',
                                    transition: 'background 0.15s',
                                    '&:hover': { bgcolor: '#fafbff' },
                                    '&:last-child': { borderBottom: 'none' },
                                }}>
                                    <Typography sx={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>
                                        {zapato.codigo}
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>
                                        {zapato.modelo}
                                    </Typography>
                                    <Typography sx={{ color: '#475569', fontSize: '0.875rem' }}>
                                        {zapato.talla}
                                    </Typography>
                                    <Typography sx={{ color: '#475569', fontSize: '0.875rem' }}>
                                        {zapato.color || '—'}
                                    </Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                                        {gs(zapato.precio_venta)}
                                    </Typography>
                                    <Chip
                                        label={`${zapato.stock} uds.`}
                                        size="small"
                                        sx={{
                                            fontWeight: 700, fontSize: '0.78rem',
                                            bgcolor: stockBajoItem ? '#fef3c7' : '#f0fdf4',
                                            color: stockBajoItem ? '#d97706' : '#15803d',
                                            border: `1px solid ${stockBajoItem ? '#fcd34d' : '#bbf7d0'}`,
                                            width: 'fit-content',
                                        }}
                                    />
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <Tooltip title="Editar">
                                            <IconButton size="small" onClick={() => abrirModal(zapato)}
                                                sx={{ color: '#64748b', '&:hover': { color: '#f59e0b', bgcolor: '#fef3c7' } }}>
                                                <EditOutlinedIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Eliminar">
                                            <IconButton size="small" onClick={() => eliminarZapato(zapato.id, zapato.modelo)}
                                                sx={{ color: '#64748b', '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' } }}>
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>
                            </Fade>
                        );
                    })
                )}
            </Paper>

            {/* Modal */}
            <Dialog
                open={open}
                onClose={cerrarModal}
                maxWidth="sm"
                fullWidth
                slotProps={{
                    paper: {
                        sx: { borderRadius: '16px', boxShadow: '0 25px 60px rgba(0,0,0,0.15)' }
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', pb: 1, pt: 3, px: 3 }}>
                    {editando ? 'Editar Calzado' : 'Registrar Nuevo Calzado'}
                </DialogTitle>
                <form onSubmit={guardarZapato}>
                    <DialogContent sx={{ px: 3, pb: 2 }}>
                        <Grid container spacing={2}>
                            <Grid xs={6}>
                                <TextField name="codigo" label="Código Único" fullWidth required
                                    value={formulario.codigo} onChange={manejarCambio}
                                    sx={inputSx} />
                            </Grid>
                            <Grid xs={6}>
                                <TextField name="modelo" label="Modelo / Nombre" fullWidth required
                                    value={formulario.modelo} onChange={manejarCambio}
                                    sx={inputSx} />
                            </Grid>
                            <Grid xs={6}>
                                <TextField name="talla" label="Talla" type="number" fullWidth required
                                    slotProps={{ htmlInput: { step: '0.5', min: '15' } }}
                                    value={formulario.talla} onChange={manejarCambio}
                                    sx={inputSx} />
                            </Grid>
                            <Grid xs={6}>
                                <TextField name="color" label="Color" fullWidth
                                    value={formulario.color} onChange={manejarCambio}
                                    sx={inputSx} />
                            </Grid>
                            <Grid xs={6}>
                                <TextField name="precio_venta" label="Precio de Venta (₲)" type="number" fullWidth required
                                    slotProps={{ htmlInput: { min: '0', step: '1' } }}
                                    value={formulario.precio_venta} onChange={manejarCambio}
                                    sx={inputSx} />
                            </Grid>
                            <Grid xs={6}>
                                <TextField name="stock" label="Stock" type="number" fullWidth required
                                    slotProps={{ htmlInput: { min: '0' } }}
                                    value={formulario.stock} onChange={manejarCambio}
                                    sx={inputSx} />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                        <Button onClick={cerrarModal} sx={{ color: '#64748b', borderRadius: '8px' }}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained"
                            sx={{
                                bgcolor: '#f59e0b', color: '#000', fontWeight: 700,
                                borderRadius: '8px', px: 3,
                                '&:hover': { bgcolor: '#d97706' },
                            }}>
                            {editando ? 'Actualizar' : 'Guardar Calzado'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

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
        borderRadius: '8px',
        '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
    },
    '& label.Mui-focused': { color: '#f59e0b' },
};