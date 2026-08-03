import { apiFetch } from './http';

export const ventasApi = {
    create: (venta) =>
        apiFetch('/ventas', { method: 'POST', body: JSON.stringify(venta) }),

    getAll: () => apiFetch('/ventas'),

    anular: (id) =>
        apiFetch(`/ventas/${id}/anular`, { method: 'PATCH' }),
};
