import React from 'react';
import { Box, Typography, Divider, Tooltip, Drawer, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCartOutlined';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import AssessmentIcon from '@mui/icons-material/AssessmentOutlined';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import { useAuth } from '../context/AuthContext';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import { PANTALLAS_POR_ROL, ROL_LABEL } from '../config/roles';
export const drawerWidth = 260;

const opciones = [
    { texto: 'Inventario',    subtexto: 'Stock y productos',    clave: 'stock',    icono: <InventoryIcon /> },
    { texto: 'Clientes',      subtexto: 'Base de clientes',     clave: 'clientes', icono: <PeopleOutlinedIcon /> },
    { texto: 'Ventas',        subtexto: 'Facturación',           clave: 'ventas',   icono: <ShoppingCartIcon /> },
    { texto: 'Caja Diaria',   subtexto: 'Ingresos y egresos',    clave: 'caja',     icono: <AccountBalanceWalletIcon /> },
    { texto: 'Informes',      subtexto: 'Estadísticas',           clave: 'informes', icono: <AssessmentIcon /> },
    { texto: 'Configuración', subtexto: 'Usuarios del sistema',   clave: 'config',   icono: <SettingsIcon /> },
];

export default function Sidebar({ pantallaActual, setPantallaActual, nombreLocal, mobileOpen, onCerrarMobile }) {
    const { usuario, logout } = useAuth();
    const theme = useTheme();
    const esMobile = useMediaQuery(theme.breakpoints.down('md'));
    const clavesPermitidas = PANTALLAS_POR_ROL[usuario?.rol] || [];
    const opcionesVisibles = opciones.filter(o => clavesPermitidas.includes(o.clave));

    const elegirPantalla = (clave) => {
        setPantallaActual(clave);
        if (esMobile) onCerrarMobile?.();
    };

    const contenido = (
        <Box sx={{
            width: drawerWidth, minHeight: '100vh',
            bgcolor: '#0a0f1e',
            display: 'flex', flexDirection: 'column', flexShrink: 0,
            borderRight: '1px solid rgba(255,255,255,0.06)',
            height: '100%', overflowY: 'auto',
        }}>
            {/* Logo */}
            <Box sx={{ p: 3, pb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 38, height: 38, borderRadius: '10px',
                        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(245,158,11,0.4)',
                    }}>
                        <StorefrontIcon sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: 'white', letterSpacing: 0.5, lineHeight: 1.1 }}>
                            {nombreLocal || 'ZAPATERÍA'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: '#334155', letterSpacing: 2, textTransform: 'uppercase' }}>
                            Panel Admin
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2 }} />

            {/* Navegación */}
            <Box sx={{ px: 1.5, mt: 2, flex: 1 }}>
                <Typography sx={{ fontSize: '0.65rem', color: '#334155', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, px: 1.5, mb: 1.5 }}>
                    Módulos
                </Typography>

                {opcionesVisibles.map((opcion) => {
                    const esActiva = pantallaActual === opcion.clave;
                    return (
                        <Box key={opcion.clave} onClick={() => elegirPantalla(opcion.clave)}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 1.5,
                                px: 1.5, py: 1.2, mb: 0.5, borderRadius: '10px', cursor: 'pointer',
                                position: 'relative', overflow: 'hidden', transition: 'all 0.2s',
                                bgcolor: esActiva ? 'rgba(245,158,11,0.12)' : 'transparent',
                                '&:hover': { bgcolor: esActiva ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)' },
                                ...(esActiva && {
                                    '&::before': {
                                        content: '""', position: 'absolute',
                                        left: 0, top: '20%', width: '3px', height: '60%',
                                        borderRadius: '0 3px 3px 0', bgcolor: '#f59e0b',
                                    }
                                })
                            }}>
                            <Box sx={{ color: esActiva ? '#f59e0b' : '#475569', display: 'flex', alignItems: 'center', '& svg': { fontSize: 20 } }}>
                                {opcion.icono}
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '0.875rem', fontWeight: esActiva ? 700 : 500, color: esActiva ? '#f1f5f9' : '#94a3b8', lineHeight: 1.2 }}>
                                    {opcion.texto}
                                </Typography>
                                <Typography sx={{ fontSize: '0.7rem', color: '#334155' }}>
                                    {opcion.subtexto}
                                </Typography>
                            </Box>
                        </Box>
                    );
                })}
            </Box>

            {/* Usuario + Logout */}
            <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 1, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.04)' }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PersonOutlineIcon sx={{ color: '#f59e0b', fontSize: 18 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {usuario?.nombre || 'Usuario'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.65rem', color: '#334155' }}>
                            {ROL_LABEL[usuario?.rol] || usuario?.rol}
                        </Typography>
                    </Box>
                    <Tooltip title="Cerrar sesión">
                        <Box onClick={logout} sx={{
                            color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center',
                            p: 0.5, borderRadius: '6px',
                            '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.1)' },
                            transition: 'all 0.15s',
                        }}>
                            <LogoutIcon sx={{ fontSize: 18 }} />
                        </Box>
                    </Tooltip>
                </Box>
            </Box>
        </Box>
    );

    if (esMobile) {
        return (
            <Drawer
                variant="temporary"
                open={!!mobileOpen}
                onClose={onCerrarMobile}
                ModalProps={{ keepMounted: true }}
                sx={{ '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', border: 'none' } }}
            >
                {contenido}
            </Drawer>
        );
    }

    return (
        <Box sx={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
            {contenido}
        </Box>
    );
}