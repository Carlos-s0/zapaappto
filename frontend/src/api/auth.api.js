import { apiFetch } from './http';

export const authApi = {
    login: (usuario, password) =>
        apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ usuario, password }),
        }), // { token, id, nombre, usuario }
};
