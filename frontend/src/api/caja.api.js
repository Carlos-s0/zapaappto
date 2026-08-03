import { apiFetch } from './http';

export const cajaApi = {
    getResumen: () => apiFetch('/caja/resumen'),

    registrarMovimiento: (movimiento) =>
        apiFetch('/caja', { method: 'POST', body: JSON.stringify(movimiento) }),

    getMovimientos: () => apiFetch('/caja/movimientos'),
};
