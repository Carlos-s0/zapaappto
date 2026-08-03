import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(() => {
        // Recuperar sesión guardada al recargar la página
        const guardado = localStorage.getItem('zapateria_usuario');
        return guardado ? JSON.parse(guardado) : null;
    });

    const login = (datos) => {
        localStorage.setItem('zapateria_usuario', JSON.stringify(datos));
        setUsuario(datos);
    };

    const logout = () => {
        localStorage.removeItem('zapateria_usuario');
        setUsuario(null);
    };

    // El helper de API (src/api/http.js) dispara este evento cuando el
    // backend responde 401 (token inválido o expirado) para forzar el logout.
    useEffect(() => {
        const manejarNoAutorizado = () => setUsuario(null);
        window.addEventListener('auth:unauthorized', manejarNoAutorizado);
        return () => window.removeEventListener('auth:unauthorized', manejarNoAutorizado);
    }, []);

    return (
        <AuthContext.Provider value={{ usuario, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
