// Pantallas permitidas por nivel de usuario. Único lugar donde se define esto
// para que Sidebar (qué se muestra) y App (qué se puede renderizar) no se desincronicen.
export const PANTALLAS_POR_ROL = {
    admin:    ['stock', 'clientes', 'ventas', 'caja', 'informes', 'config'],
    cajero:   ['clientes', 'ventas', 'caja', 'informes'],
    vendedor: ['ventas'],
};

export const ROL_LABEL = { admin: 'Administrador', cajero: 'Cajero', vendedor: 'Vendedor' };

export const pantallaPorDefecto = (rol) => PANTALLAS_POR_ROL[rol]?.[0] || 'ventas';
