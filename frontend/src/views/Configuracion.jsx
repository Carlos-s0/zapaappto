import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, TextField, IconButton,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, Snackbar, Fade, Divider, CircularProgress,
    Tabs, Tab, Grid, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import LockResetIcon from '@mui/icons-material/LockReset';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import StorefrontIcon from '@mui/icons-material/StorefrontOutlined';
import { usuariosApi } from '../api/usuarios.api';
import { parametrosApi } from '../api/parametros.api';

const FORM_INICIAL = { nombre: '', usuario: '', password: '', confirmar: '', rol: 'vendedor' };
const ROLES = [
    { valor: 'admin', label: 'Administrador', color: '#7c3aed', bg: '#f3e8ff' },
    { valor: 'cajero', label: 'Cajero', color: '#1d4ed8', bg: '#eff6ff' },
    { valor: 'vendedor', label: 'Vendedor', color: '#15803d', bg: '#f0fdf4' },
];
const rolInfo = (rol) => ROLES.find(r => r.valor === rol) || ROLES[2];
const PARAMETROS_INICIAL = {
    nombre_local: '', direccion: '', telefono: '', ruc: '',
    timbrado: '', nombre_impresora: '', ancho_ticket: 80, mensaje_pie: '',
};

export default function Configuracion() {
    const [tab, setTab] = useState(0);
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [open, setOpen] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(null); // null = nuevo, id = editar
    const [form, setForm] = useState(FORM_INICIAL);
    const [errForm, setErrForm] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, mensaje: '', tipo: 'success' });

    // Parámetros del negocio
    const [paramForm, setParamForm] = useState(PARAMETROS_INICIAL);
    const [cargandoParam, setCargandoParam] = useState(true);
    const [guardandoParam, setGuardandoParam] = useState(false);

    const mostrarMensaje = (mensaje, tipo = 'success') => setSnackbar({ open: true, mensaje, tipo });

    const cargarParametros = async () => {
        try {
            const datos = await parametrosApi.getAll();
            setParamForm({ ...PARAMETROS_INICIAL, ...datos });
        } catch (err) {
            mostrarMensaje('Error al cargar los parámetros del negocio', 'error');
        } finally {
            setCargandoParam(false);
        }
    };

    const guardarParametros = async (e) => {
        e.preventDefault();
        if (!paramForm.nombre_local.trim()) {
            mostrarMensaje('El nombre del local es obligatorio', 'error');
            return;
        }
        setGuardandoParam(true);
        try {
            const actualizado = await parametrosApi.update(paramForm);
            setParamForm({ ...PARAMETROS_INICIAL, ...actualizado });
            mostrarMensaje('Parámetros actualizados correctamente');
        } catch (err) {
            mostrarMensaje(err.message, 'error');
        } finally {
            setGuardandoParam(false);
        }
    };

    useEffect(() => { cargarParametros(); }, []);

    const cargarUsuarios = async () => {
        try {
            const datos = await usuariosApi.getAll();
            setUsuarios(datos);
        } catch (err) {
            mostrarMensaje('Error al cargar usuarios', 'error');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarUsuarios(); }, []);

    const abrirModal = (usuario = null) => {
        setErrForm('');
        if (usuario) {
            setModoEdicion(usuario.id);
            setForm({ nombre: usuario.nombre, usuario: usuario.usuario, password: '', confirmar: '', rol: usuario.rol || 'vendedor' });
        } else {
            setModoEdicion(null);
            setForm(FORM_INICIAL);
        }
        setOpen(true);
    };

    const cerrarModal = () => {
        setOpen(false);
        setForm(FORM_INICIAL);
        setErrForm('');
    };

    const guardar = async (e) => {
        e.preventDefault();
        setErrForm('');

        if (!form.nombre.trim() || !form.usuario.trim()) {
            setErrForm('Nombre y usuario son obligatorios'); return;
        }
        if (!modoEdicion && !form.password) {
            setErrForm('La contraseña es obligatoria para usuarios nuevos'); return;
        }
        if (form.password && form.password !== form.confirmar) {
            setErrForm('Las contraseñas no coinciden'); return;
        }
        if (form.password && form.password.length < 6) {
            setErrForm('La contraseña debe tener al menos 6 caracteres'); return;
        }

        try {
            const payload = { nombre: form.nombre, usuario: form.usuario, rol: form.rol };
            if (form.password) payload.password = form.password;

            if (modoEdicion) {
                await usuariosApi.update(modoEdicion, payload);
                mostrarMensaje('Usuario actualizado correctamente');
            } else {
                await usuariosApi.create(payload);
                mostrarMensaje('Usuario creado correctamente');
            }
            cargarUsuarios();
            cerrarModal();
        } catch (err) {
            setErrForm(err.message);
        }
    };

    const toggleActivo = async (id, activo) => {
        try {
            await usuariosApi.toggleActivo(id, !activo);
            mostrarMensaje(`Usuario ${!activo ? 'activado' : 'desactivado'}`);
            cargarUsuarios();
        } catch (err) {
            mostrarMensaje(err.message, 'error');
        }
    };

    const eliminar = async (id, nombre) => {
        if (!window.confirm(`¿Eliminar al usuario "${nombre}"?`)) return;
        try {
            await usuariosApi.delete(id);
            mostrarMensaje('Usuario eliminado');
            cargarUsuarios();
        } catch (err) {
            mostrarMensaje(err.message, 'error');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                        Configuración
                    </Typography>
                    <Typography sx={{ color: '#64748b', mt: 0.5 }}>
                        Usuarios del sistema y datos del negocio
                    </Typography>
                </Box>
                {tab === 0 && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => abrirModal()}
                        sx={{
                            bgcolor: '#f59e0b', color: '#000', fontWeight: 700,
                            borderRadius: '10px', px: 2.5, py: 1.2,
                            boxShadow: '0 4px 15px rgba(245,158,11,0.35)',
                            '&:hover': { bgcolor: '#d97706' },
                        }}>
                        Nuevo Usuario
                    </Button>
                )}
            </Box>

            <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3, minHeight: 0 }}
                TabIndicatorProps={{ sx: { bgcolor: '#f59e0b' } }}>
                <Tab icon={<PersonOutlinedIcon fontSize="small" />} iconPosition="start" label="Usuarios"
                    sx={{ textTransform: 'none', fontWeight: 700, minHeight: 0, '&.Mui-selected': { color: '#0f172a' } }} />
                <Tab icon={<StorefrontIcon fontSize="small" />} iconPosition="start" label="Datos del Negocio"
                    sx={{ textTransform: 'none', fontWeight: 700, minHeight: 0, '&.Mui-selected': { color: '#0f172a' } }} />
            </Tabs>

            {/* Tabla de usuarios */}
            {tab === 0 && (
            <Paper sx={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                {/* Header tabla */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '48px 1fr 150px 130px 110px 120px', bgcolor: '#0a0f1e', px: 3, py: 1.5 }}>
                    {['', 'Nombre', 'Usuario', 'Rol', 'Estado', 'Acciones'].map(h => (
                        <Typography key={h} sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {h}
                        </Typography>
                    ))}
                </Box>

                {cargando ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress sx={{ color: '#f59e0b' }} />
                    </Box>
                ) : usuarios.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                        <PersonOutlinedIcon sx={{ fontSize: 48, color: '#e2e8f0', mb: 1 }} />
                        <Typography sx={{ color: '#94a3b8' }}>No hay usuarios registrados</Typography>
                    </Box>
                ) : (
                    usuarios.map((u, i) => (
                        <Fade in key={u.id} timeout={150 + i * 40}>
                            <Box sx={{
                                display: 'grid', gridTemplateColumns: '48px 1fr 150px 130px 110px 120px',
                                px: 3, py: 2, alignItems: 'center',
                                borderBottom: '1px solid #f8fafc',
                                bgcolor: 'white',
                                '&:hover': { bgcolor: '#fafbff' },
                                '&:last-child': { borderBottom: 'none' },
                                opacity: u.activo ? 1 : 0.5,
                            }}>
                                {/* Avatar */}
                                <Box sx={{
                                    width: 32, height: 32, borderRadius: '8px',
                                    bgcolor: u.activo ? 'rgba(245,158,11,0.12)' : '#f1f5f9',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <PersonOutlinedIcon sx={{ fontSize: 18, color: u.activo ? '#f59e0b' : '#94a3b8' }} />
                                </Box>

                                <Box>
                                    <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                                        {u.nombre}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                        Creado el {new Date(u.fecha_creacion).toLocaleDateString('es-PY')}
                                    </Typography>
                                </Box>

                                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>
                                    @{u.usuario}
                                </Typography>

                                <Chip
                                    label={rolInfo(u.rol).label}
                                    size="small"
                                    sx={{
                                        fontWeight: 700, fontSize: '0.72rem', width: 'fit-content',
                                        bgcolor: rolInfo(u.rol).bg, color: rolInfo(u.rol).color,
                                    }}
                                />

                                <Chip
                                    label={u.activo ? 'Activo' : 'Inactivo'}
                                    size="small"
                                    sx={{
                                        fontWeight: 700, fontSize: '0.75rem', width: 'fit-content',
                                        bgcolor: u.activo ? '#f0fdf4' : '#f8fafc',
                                        color: u.activo ? '#15803d' : '#94a3b8',
                                        border: `1px solid ${u.activo ? '#bbf7d0' : '#e2e8f0'}`,
                                    }}
                                />

                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton size="small" onClick={() => abrirModal(u)}
                                        sx={{ color: '#64748b', '&:hover': { color: '#f59e0b', bgcolor: '#fef3c7' } }}>
                                        <EditOutlinedIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => toggleActivo(u.id, u.activo)}
                                        sx={{ color: '#64748b', '&:hover': { color: u.activo ? '#64748b' : '#16a34a', bgcolor: u.activo ? '#f1f5f9' : '#f0fdf4' } }}>
                                        {u.activo
                                            ? <ToggleOnIcon fontSize="small" sx={{ color: '#16a34a' }} />
                                            : <ToggleOffIcon fontSize="small" />
                                        }
                                    </IconButton>
                                    <IconButton size="small" onClick={() => eliminar(u.id, u.nombre)}
                                        sx={{ color: '#64748b', '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' } }}>
                                        <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Fade>
                    ))
                )}
            </Paper>
            )}

            {/* Parámetros del negocio */}
            {tab === 1 && (
                <Paper sx={{ p: 3, borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                    {cargandoParam ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress sx={{ color: '#f59e0b' }} />
                        </Box>
                    ) : (
                        <form onSubmit={guardarParametros}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', mb: 2 }}>
                                Datos impresos en el ticket de venta
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TextField label="Nombre del local" required fullWidth
                                        value={paramForm.nombre_local}
                                        onChange={(e) => setParamForm({ ...paramForm, nombre_local: e.target.value })}
                                        sx={inputSx} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField label="Teléfono" fullWidth
                                        value={paramForm.telefono || ''}
                                        onChange={(e) => setParamForm({ ...paramForm, telefono: e.target.value })}
                                        sx={inputSx} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField label="Dirección" fullWidth
                                        value={paramForm.direccion || ''}
                                        onChange={(e) => setParamForm({ ...paramForm, direccion: e.target.value })}
                                        sx={inputSx} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField label="RUC" fullWidth
                                        value={paramForm.ruc || ''}
                                        onChange={(e) => setParamForm({ ...paramForm, ruc: e.target.value })}
                                        sx={inputSx} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField label="Timbrado" fullWidth
                                        helperText="Para cuando se habilite la factura legal (todavía no se usa)"
                                        value={paramForm.timbrado || ''}
                                        onChange={(e) => setParamForm({ ...paramForm, timbrado: e.target.value })}
                                        sx={inputSx} />
                                </Grid>

                                <Grid item xs={12}><Divider /></Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField label="Nombre de la impresora" fullWidth
                                        helperText="Informativo por ahora: el navegador no elige la impresora del sistema por nombre, eso se selecciona en el diálogo de impresión"
                                        value={paramForm.nombre_impresora || ''}
                                        onChange={(e) => setParamForm({ ...paramForm, nombre_impresora: e.target.value })}
                                        sx={inputSx} />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField select label="Ancho del ticket" fullWidth
                                        value={paramForm.ancho_ticket || 80}
                                        onChange={(e) => setParamForm({ ...paramForm, ancho_ticket: Number(e.target.value) })}
                                        sx={inputSx}>
                                        <MenuItem value={80}>80mm</MenuItem>
                                        <MenuItem value={58}>58mm</MenuItem>
                                    </TextField>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField label="Mensaje de pie del ticket" fullWidth
                                        value={paramForm.mensaje_pie || ''}
                                        onChange={(e) => setParamForm({ ...paramForm, mensaje_pie: e.target.value })}
                                        sx={inputSx} />
                                </Grid>
                            </Grid>

                            <Button type="submit" variant="contained" disabled={guardandoParam}
                                sx={{
                                    mt: 3, bgcolor: '#f59e0b', color: '#000', fontWeight: 700,
                                    borderRadius: '10px', px: 3, py: 1.2,
                                    '&:hover': { bgcolor: '#d97706' },
                                }}>
                                {guardandoParam ? 'Guardando...' : 'Guardar cambios'}
                            </Button>
                        </form>
                    )}
                </Paper>
            )}

            {/* Modal crear/editar */}
            <Dialog open={open} onClose={cerrarModal} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0 25px 60px rgba(0,0,0,0.15)' } }}>
                <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', pt: 3, px: 3, pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {modoEdicion ? <EditOutlinedIcon sx={{ color: '#f59e0b' }} /> : <AddIcon sx={{ color: '#f59e0b' }} />}
                        {modoEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </Box>
                </DialogTitle>

                <form onSubmit={guardar}>
                    <DialogContent sx={{ px: 3, pb: 2 }}>
                        {errForm && (
                            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px', fontSize: '0.82rem' }}>
                                {errForm}
                            </Alert>
                        )}

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField name="nombre" label="Nombre completo" required fullWidth
                                value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                                sx={inputSx} />
                            <TextField name="usuario" label="Nombre de usuario" required fullWidth
                                value={form.usuario} onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                                sx={inputSx}
                                slotProps={{
                                    input: {
                                        startAdornment: <Box component="span" sx={{ color: '#94a3b8', mr: 0.5, fontSize: '0.9rem' }}>@</Box>,
                                    },
                                }} />

                            <TextField select name="rol" label="Nivel de usuario" required fullWidth
                                value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}
                                sx={inputSx}>
                                {ROLES.map(r => (
                                    <MenuItem key={r.valor} value={r.valor}>{r.label}</MenuItem>
                                ))}
                            </TextField>

                            <Divider>
                                <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <LockResetIcon sx={{ fontSize: 14 }} />
                                    {modoEdicion ? 'Cambiar contraseña (opcional)' : 'Contraseña'}
                                </Typography>
                            </Divider>

                            <TextField name="password" label="Contraseña" type="password"
                                fullWidth required={!modoEdicion}
                                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                                sx={inputSx}
                                helperText={modoEdicion ? "Dejá vacío para mantener la actual" : "Mínimo 6 caracteres"} />
                            <TextField name="confirmar" label="Confirmar contraseña" type="password"
                                fullWidth required={!modoEdicion || !!form.password}
                                value={form.confirmar} onChange={(e) => setForm({ ...form, confirmar: e.target.value })}
                                sx={inputSx} />
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
                            {modoEdicion ? 'Actualizar' : 'Crear Usuario'}
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