import { apiFetch } from './http';

export const clientesApi = {
    getAll: (buscar = '') => {
        const query = buscar ? `?buscar=${encodeURIComponent(buscar)}` : '';
        return apiFetch(`/clientes${query}`);
    },

    getById: (id) => apiFetch(`/clientes/${id}`),

    getVentas: (id) => apiFetch(`/clientes/${id}/ventas`),

    create: (datos) =>
        apiFetch('/clientes', { method: 'POST', body: JSON.stringify(datos) }),

    update: (id, datos) =>
        apiFetch(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),

    delete: (id) =>
        apiFetch(`/clientes/${id}`, { method: 'DELETE' }),
};
