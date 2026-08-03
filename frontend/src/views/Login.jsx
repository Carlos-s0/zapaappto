import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { authApi } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';

export default function Login({ nombreLocal }) {
    const { login } = useAuth();
    const [form, setForm] = useState({ usuario: '', password: '' });
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const manejarCambio = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.usuario || !form.password) {
            setError('Completá usuario y contraseña');
            return;
        }
        setCargando(true);
        try {
            const datos = await authApi.login(form.usuario, form.password);
            login(datos);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            bgcolor: '#0a0f1e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Fondo decorativo */}
            <Box sx={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at 20% 50%, rgba(245,158,11,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.06) 0%, transparent 50%)',
                pointerEvents: 'none',
            }} />

            {/* Círculos decorativos */}
            <Box sx={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(245,158,11,0.08)', pointerEvents: 'none' }} />
            <Box sx={{ position: 'absolute', bottom: -150, left: -150, width: 500, height: 500, borderRadius: '50%', border: '1px solid rgba(245,158,11,0.05)', pointerEvents: 'none' }} />

            {/* Card de login */}
            <Box sx={{
                width: '100%', maxWidth: 420,
                mx: 2, zIndex: 1,
            }}>
                {/* Logo */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box sx={{
                        width: 64, height: 64, borderRadius: '16px',
                        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 2,
                        boxShadow: '0 8px 32px rgba(245,158,11,0.4)',
                    }}>
                        <StorefrontIcon sx={{ color: 'white', fontSize: 32 }} />
                    </Box>
                    <Typography sx={{
                        fontSize: '1.6rem', fontWeight: 900,
                        color: 'white', letterSpacing: '-0.5px',
                    }}>
                        {nombreLocal || 'ZAPATERÍA'}
                    </Typography>
                    <Typography sx={{ color: '#475569', fontSize: '0.85rem', mt: 0.5 }}>
                        Sistema de Gestión · Panel Admin
                    </Typography>
                </Box>

                {/* Formulario */}
                <Box sx={{
                    bgcolor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    p: 4,
                    backdropFilter: 'blur(10px)',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <LockOutlinedIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>
                            Ingresá tus credenciales
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{
                            mb: 2, borderRadius: '10px',
                            bgcolor: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#fca5a5',
                            '& .MuiAlert-icon': { color: '#f87171' },
                        }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField
                                name="usuario"
                                label="Usuario"
                                autoComplete="username"
                                fullWidth
                                value={form.usuario}
                                onChange={manejarCambio}
                                sx={inputDarkSx}
                            />
                            <TextField
                                name="password"
                                label="Contraseña"
                                type="password"
                                autoComplete="current-password"
                                fullWidth
                                value={form.password}
                                onChange={manejarCambio}
                                sx={inputDarkSx}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={cargando}
                                sx={{
                                    mt: 1, py: 1.5,
                                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                                    color: '#000',
                                    fontWeight: 800,
                                    fontSize: '0.95rem',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 20px rgba(245,158,11,0.4)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #d97706, #ea580c)',
                                        boxShadow: '0 6px 24px rgba(245,158,11,0.5)',
                                    },
                                    '&:disabled': { opacity: 0.6 },
                                }}
                            >
                                {cargando
                                    ? <CircularProgress size={22} sx={{ color: '#000' }} />
                                    : 'Ingresar al Sistema'
                                }
                            </Button>
                        </Box>
                    </form>
                </Box>

                <Typography sx={{ textAlign: 'center', color: '#1e293b', fontSize: '0.75rem', mt: 3 }}>
                    Acceso restringido · Solo personal autorizado
                </Typography>
            </Box>
        </Box>
    );
}

const inputDarkSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '10px',
        bgcolor: 'rgba(255,255,255,0.05)',
        color: 'white',
        '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
        '&:hover fieldset': { borderColor: 'rgba(245,158,11,0.4)' },
        '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
    },
    '& .MuiInputLabel-root': { color: '#64748b' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#f59e0b' },
};
