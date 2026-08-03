const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function obtenerToken() {
    const guardado = localStorage.getItem('zapateria_usuario');
    if (!guardado) return null;
    try {
        return JSON.parse(guardado).token || null;
    } catch {
        return null;
    }
}

// Wrapper de fetch: arma la URL desde la variable de entorno, agrega el token JWT
// y desloguea automáticamente si el backend responde 401 (token inválido o expirado).
export async function apiFetch(path, options = {}) {
    const token = obtenerToken();
    const headers = { ...(options.headers || {}) };
    if (options.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (res.status === 401) {
        localStorage.removeItem('zapateria_usuario');
        window.dispatchEvent(new Event('auth:unauthorized'));
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.mensaje || 'Error en la solicitud');
    }

    if (res.status === 204) return null;
    return res.json();
}
