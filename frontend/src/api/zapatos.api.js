import { apiFetch } from './http';

export const zapatosApi = {
    getAll: () => apiFetch('/zapatos'),

    getDisponibles: async () => {
        const datos = await apiFetch('/zapatos');
        return datos.filter(z => parseInt(z.stock) > 0);
    },

    create: (zapato) =>
        apiFetch('/zapatos', { method: 'POST', body: JSON.stringify(zapato) }),

    update: (id, zapato) =>
        apiFetch(`/zapatos/${id}`, { method: 'PUT', body: JSON.stringify(zapato) }),

    delete: (id) =>
        apiFetch(`/zapatos/${id}`, { method: 'DELETE' }),
};
