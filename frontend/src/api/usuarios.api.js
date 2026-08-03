import { apiFetch } from './http';

export const usuariosApi = {
    getAll: () => apiFetch('/usuarios'),

    create: (datos) =>
        apiFetch('/usuarios', { method: 'POST', body: JSON.stringify(datos) }),

    update: (id, datos) =>
        apiFetch(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),

    toggleActivo: (id, activo) =>
        apiFetch(`/usuarios/${id}/activo`, { method: 'PATCH', body: JSON.stringify({ activo }) }),

    delete: (id) =>
        apiFetch(`/usuarios/${id}`, { method: 'DELETE' }),
};
