import { apiFetch } from './http';

export const parametrosApi = {
    getAll: () => apiFetch('/parametros'),

    update: (datos) =>
        apiFetch('/parametros', { method: 'PUT', body: JSON.stringify(datos) }),
};
