import { apiFetch } from './http';

export const informesApi = {
    getAll: (filtros = {}) => {
        const params = new URLSearchParams();
        if (filtros.desde)    params.append('desde',    filtros.desde);
        if (filtros.hasta)    params.append('hasta',    filtros.hasta);
        if (filtros.cliente)  params.append('cliente',  filtros.cliente);
        if (filtros.producto) params.append('producto', filtros.producto);

        const query = params.toString() ? `?${params.toString()}` : '';
        return apiFetch(`/informes${query}`);
    },
};
