import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Button, TextField, IconButton,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, Snackbar, Fade, Divider, CircularProgress,
    InputAdornment, Collapse
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import { clientesApi } from '../api';
import { gs } from '../utils/moneda';

const FORM_INICIAL = {
    nombre: '', apellido: '', cedula: '',
    telefono: '', email: '', direccion: ''
};

export default function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [open, setOpen] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [form, setForm] = useState(FORM_INICIAL);
    const [errForm, setErrForm] = useState('');
    const [expandido, setExpandido] = useState(null); // id del cliente expandido
    const [historial, setHistorial] = useState([]);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, mensaje: '', tipo: 'success' });

    const mostrarMensaje = (mensaje, tipo = 'success') =>
        setSnackbar({ open: true, mensaje, tipo });

    const cargarClientes = useCallback(async () => {
        try {
            const datos = await clientesApi.getAll(busqueda);
            setClientes(datos);
        } catch (err) {
            mostrarMensaje('Error al cargar clientes', 'error');
        } finally {
            setCargando(false);
        }
    }, [busqueda]);

    useEffect(() => {
        const timer = setTimeout(() => cargarClientes(), 300);
        return () => clearTimeout(timer);
    }, [cargarClientes]);

    const abrirModal = (cliente = null) => {
        setErrForm('');
        if (cliente) {
            setEditandoId(cliente.id);
            setForm({
                nombre:    cliente.nombre    || '',
                apellido:  cliente.apellido  || '',
                cedula:    cliente.cedula    || '',
                telefono:  cliente.telefono  || '',
                email:     cliente.email     || '',
                direccion: cliente.direccion || '',
            });
        } else {
            setEditandoId(null);
            setForm(FORM_INICIAL);
        }
        setOpen(true);
    };

    const cerrarModal = () => {
        setOpen(false);
        setEditandoId(null);
        setForm(FORM_INICIAL);
        setErrForm('');
    };

    const guardar = async (e) => {
        e.preventDefault();
        setErrForm('');
        if (!form.nombre.trim()) {
            setErrForm('El nombre es obligatorio');
            return;
        }
        try {
            if (editandoId) {
                await clientesApi.update(editandoId, form);
                mostrarMensaje('Cliente actualizado correctamente');
            } else {
                await clientesApi.create(form);
                mostrarMensaje('Cliente registrado correctamente');
            }
            cargarClientes();
            cerrarModal();
        } catch (err) {
            setErrForm(err.message);
        }
    };

    const eliminar = async (id, nombre) => {
        if (!window.confirm(`¿Eliminar a "${nombre}"?`)) return;
        try {
            await clientesApi.delete(id);
            mostrarMensaje('Cliente eliminado');
            cargarClientes();
        } catch (err) {
            mostrarMensaje(err.message, 'error');
        }
    };

    const toggleHistorial = async (id) => {
        if (expandido === id) {
            setExpandido(null);
            setHistorial([]);
            return;
        }
        setExpandido(id);
        setCargandoHistorial(true);
        try {
            const datos = await clientesApi.getVentas(id);
            setHistorial(datos);
        } catch (err) {
            mostrarMensaje('Error al cargar historial', 'error');
        } finally {
            setCargandoHistorial(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                        Clientes
                    </Typography>
                    <Typography sx={{ color: '#64748b', mt: 0.5 }}>
                        {clientes.length} clientes registrados
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => abrirModal()}
                    sx={{
                        bgcolor: '#f59e0b', color: '#000', fontWeight: 700,
                        borderRadius: '10px', px: 2.5, py: 1.2,
                        boxShadow: '0 4px 15px rgba(245,158,11,0.35)',
                        '&:hover': { bgcolor: '#d97706' },
                    }}>
                    Nuevo Cliente
                </Button>
            </Box>

            {/* Buscador */}
            <TextField
                placeholder="Buscar por nombre, cédula o teléfono..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                fullWidth
                sx={{ mb: 3, ...inputSx }}
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#94a3b8' }} />
                            </InputAdornment>
                        ),
                    },
                }}
            />

            {/* Lista */}
            {cargando ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: '#f59e0b' }} />
                </Box>
            ) : clientes.length === 0 ? (
                <Box sx={{ py: 10, textAlign: 'center' }}>
                    <PersonOutlinedIcon sx={{ fontSize: 52, color: '#e2e8f0', mb: 1 }} />
                    <Typography sx={{ color: '#94a3b8' }}>
                        {busqueda ? 'Sin resultados para esa búsqueda' : 'No hay clientes registrados'}
                    </Typography>
                </Box>
            ) : (
                <Paper sx={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                    {/* Cabecera tabla */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '48px 1fr 140px 130px 100px 100px 100px', bgcolor: '#0a0f1e', px: 3, py: 1.5 }}>
                        {['', 'Nombre', 'Cédula', 'Teléfono', 'Compras', 'Gastado', 'Acciones'].map(h => (
                            <Typography key={h} sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {h}
                            </Typography>
                        ))}
                    </Box>

                    {clientes.map((c, i) => (
                        <Fade in key={c.id} timeout={150 + i * 30}>
                            <Box>
                                {/* Fila principal */}
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '48px 1fr 140px 130px 100px 100px 100px',
                                    px: 3, py: 2, alignItems: 'center',
                                    borderBottom: expandido === c.id ? 'none' : '1px solid #f8fafc',
                                    bgcolor: expandido === c.id ? '#fffbeb' : 'white',
                                    '&:hover': { bgcolor: expandido === c.id ? '#fffbeb' : '#fafbff' },
                                    transition: 'background 0.15s',
                                }}>
                                    {/* Avatar */}
                                    <Box sx={{
                                        width: 32, height: 32, borderRadius: '8px',
                                        bgcolor: 'rgba(245,158,11,0.12)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <PersonOutlinedIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                                    </Box>

                                    <Box>
                                        <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                                            {c.nombre} {c.apellido || ''}
                                        </Typography>
                                        {c.email && (
                                            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                                {c.email}
                                            </Typography>
                                        )}
                                    </Box>

                                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#475569' }}>
                                        {c.cedula || '—'}
                                    </Typography>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {c.telefono && <PhoneOutlinedIcon sx={{ fontSize: 14, color: '#94a3b8' }} />}
                                        <Typography sx={{ fontSize: '0.82rem', color: '#475569' }}>
                                            {c.telefono || '—'}
                                        </Typography>
                                    </Box>

                                    <Chip
                                        label={`${c.total_compras} compra${c.total_compras !== 1 ? 's' : ''}`}
                                        size="small"
                                        sx={{
                                            fontWeight: 700, fontSize: '0.72rem', width: 'fit-content',
                                            bgcolor: c.total_compras > 0 ? '#eff6ff' : '#f8fafc',
                                            color: c.total_compras > 0 ? '#1d4ed8' : '#94a3b8',
                                            border: `1px solid ${c.total_compras > 0 ? '#bfdbfe' : '#e2e8f0'}`,
                                        }}
                                    />

                                    <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                                        {gs(c.total_gastado)}
                                    </Typography>

                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <IconButton size="small" onClick={() => toggleHistorial(c.id)}
                                            sx={{ color: expandido === c.id ? '#f59e0b' : '#64748b', '&:hover': { color: '#f59e0b', bgcolor: '#fef3c7' } }}>
                                            {expandido === c.id ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                        </IconButton>
                                        <IconButton size="small" onClick={() => abrirModal(c)}
                                            sx={{ color: '#64748b', '&:hover': { color: '#f59e0b', bgcolor: '#fef3c7' } }}>
                                            <EditOutlinedIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => eliminar(c.id, c.nombre)}
                                            sx={{ color: '#64748b', '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' } }}>
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>

                                {/* Historial expandible */}
                                <Collapse in={expandido === c.id}>
                                    <Box sx={{ bgcolor: '#fffbeb', borderBottom: '1px solid #f8fafc', px: 3, pb: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5, mb: 1 }}>
                                            <ReceiptLongIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#92400e' }}>
                                                Historial de compras
                                            </Typography>
                                        </Box>

                                        {cargandoHistorial ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                                <CircularProgress size={24} sx={{ color: '#f59e0b' }} />
                                            </Box>
                                        ) : historial.length === 0 ? (
                                            <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', py: 1 }}>
                                                Sin compras registradas aún
                                            </Typography>
                                        ) : (
                                            <Box sx={{
                                                bgcolor: 'white', borderRadius: '10px',
                                                border: '1px solid #fcd34d', overflow: 'hidden'
                                            }}>
                                                {/* Header historial */}
                                                <Box sx={{ display: 'grid', gridTemplateColumns: '80px 160px 1fr 120px 100px', px: 2, py: 1, bgcolor: '#fef9e7' }}>
                                                    {['Ticket', 'Fecha', 'Items', 'Método', 'Total'].map(h => (
                                                        <Typography key={h} sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                            {h}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                                {historial.map((v, idx) => (
                                                    <Box key={v.id} sx={{
                                                        display: 'grid', gridTemplateColumns: '80px 160px 1fr 120px 100px',
                                                        px: 2, py: 1.2, alignItems: 'center',
                                                        borderTop: idx > 0 ? '1px solid #fef3c7' : 'none',
                                                    }}>
                                                        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#64748b' }}>
                                                            #{v.id}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.78rem', color: '#475569' }}>
                                                            {v.fecha}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.78rem', color: '#475569' }}>
                                                            {v.items} producto{v.items !== 1 ? 's' : ''}
                                                        </Typography>
                                                        <Chip label={v.metodo_pago} size="small"
                                                            sx={{
                                                                fontSize: '0.68rem', fontWeight: 600, width: 'fit-content',
                                                                bgcolor: v.metodo_pago === 'Efectivo' ? '#dcfce7' : v.metodo_pago === 'Tarjeta' ? '#e0e7ff' : '#f3e8ff',
                                                                color: v.metodo_pago === 'Efectivo' ? '#166534' : v.metodo_pago === 'Tarjeta' ? '#3730a3' : '#6b21a8',
                                                            }} />
                                                        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a' }}>
                                                            {gs(v.total)}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}
                                    </Box>
                                </Collapse>
                            </Box>
                        </Fade>
                    ))}
                </Paper>
            )}

            {/* Modal crear/editar */}
            <Dialog open={open} onClose={cerrarModal} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0 25px 60px rgba(0,0,0,0.15)' } }}>
                <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', pt: 3, px: 3, pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {editandoId
                            ? <EditOutlinedIcon sx={{ color: '#f59e0b' }} />
                            : <AddIcon sx={{ color: '#f59e0b' }} />}
                        {editandoId ? 'Editar Cliente' : 'Nuevo Cliente'}
                    </Box>
                </DialogTitle>

                <form onSubmit={guardar}>
                    <DialogContent sx={{ px: 3, pb: 2 }}>
                        {errForm && (
                            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px', fontSize: '0.82rem' }}>
                                {errForm}
                            </Alert>
                        )}

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField name="nombre" label="Nombre *" required fullWidth
                                value={form.nombre}
                                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                sx={inputSx} />
                            <TextField name="apellido" label="Apellido" fullWidth
                                value={form.apellido}
                                onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                                sx={inputSx} />
                            <TextField name="cedula" label="Cédula / RUC" fullWidth
                                value={form.cedula}
                                onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                                sx={inputSx}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <BadgeOutlinedIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
                                            </InputAdornment>
                                        ),
                                    },
                                }} />
                            <TextField name="telefono" label="Teléfono" fullWidth
                                value={form.telefono}
                                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                                sx={inputSx}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PhoneOutlinedIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
                                            </InputAdornment>
                                        ),
                                    },
                                }} />
                            <TextField name="email" label="Email" fullWidth
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                sx={{ ...inputSx, gridColumn: '1 / -1' }} />
                            <TextField name="direccion" label="Dirección" fullWidth
                                multiline rows={2}
                                value={form.direccion}
                                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                                sx={{ ...inputSx, gridColumn: '1 / -1' }} />
                        </Box>
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
                            {editandoId ? 'Actualizar' : 'Registrar Cliente'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={3500}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
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
        '&:hover fieldset': { borderColor: '#f59e0b' },
        '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
    },
    '& label.Mui-focused': { color: '#f59e0b' },
};