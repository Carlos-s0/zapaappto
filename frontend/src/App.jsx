import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, IconButton, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './layout/Sidebar';
import Login from './views/Login';
import Stock from './views/Stock';
import Ventas from './views/Ventas';
import Caja from './views/Caja';
import Informes from './views/Informes';
import Configuracion from './views/Configuracion';
import Clientes from './views/Clientes'; //
import { parametrosApi } from './api';
import { PANTALLAS_POR_ROL, pantallaPorDefecto } from './config/roles';

const TITULOS = {
    stock: 'Inventario', clientes: 'Clientes', ventas: 'Ventas',
    caja: 'Caja Diaria', informes: 'Informes', config: 'Configuración',
};

function AppContent() {
    const { usuario } = useAuth();
    const [pantallaActual, setPantallaActual] = useState('stock');
    const [parametros, setParametros] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useTheme();
    const esMobile = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => { parametrosApi.getAll().then(setParametros).catch(() => {}); }, []);

    useEffect(() => {
        document.title = parametros?.nombre_local || 'Sistema de Gestión';
    }, [parametros]);

    // Al iniciar sesión (o al recargar con una sesión guardada), si la pantalla actual
    // no está permitida para el rol del usuario, redirige a su pantalla por defecto.
    useEffect(() => {
        if (!usuario) return;
        setPantallaActual((actual) =>
            PANTALLAS_POR_ROL[usuario.rol]?.includes(actual) ? actual : pantallaPorDefecto(usuario.rol)
        );
    }, [usuario]);

    // Si no hay sesión, mostrar el login
    if (!usuario) {
        return <Login nombreLocal={parametros?.nombre_local} />;
    }

    const pantallasPermitidas = PANTALLAS_POR_ROL[usuario.rol] || [];

    const renderizarPantalla = () => {
        if (!pantallasPermitidas.includes(pantallaActual)) return <Ventas />;
        switch (pantallaActual) {
            case 'stock':    return <Stock />;
            case 'ventas':   return <Ventas />;
            case 'caja':     return <Caja />;
            case 'informes': return <Informes />;
            case 'config':   return <Configuracion />;
            case 'clientes': return <Clientes />;
            default:         return <Ventas />;
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar
                pantallaActual={pantallaActual}
                setPantallaActual={setPantallaActual}
                nombreLocal={parametros?.nombre_local}
                mobileOpen={mobileOpen}
                onCerrarMobile={() => setMobileOpen(false)}
            />
            <Box component="main" sx={{ flexGrow: 1, minWidth: 0, minHeight: '100vh', bgcolor: '#f8fafc', overflowY: 'auto' }}>
                {esMobile && (
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        px: 1.5, py: 1.5, position: 'sticky', top: 0, zIndex: 10,
                        bgcolor: '#0a0f1e', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <IconButton onClick={() => setMobileOpen(true)} sx={{ color: '#e2e8f0' }} aria-label="Abrir menú">
                            <MenuIcon />
                        </IconButton>
                        <Typography sx={{ fontWeight: 700, color: '#e2e8f0', fontSize: '1rem' }}>
                            {TITULOS[pantallaActual] || (parametros?.nombre_local || 'Sistema de Gestión')}
                        </Typography>
                    </Box>
                )}
                {renderizarPantalla()}
            </Box>
        </Box>
    );
}

export default function App() {
    return (
        <>
            <CssBaseline />
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </>
    );
}