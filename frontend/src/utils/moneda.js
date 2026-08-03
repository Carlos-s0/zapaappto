export const gs = (valor) => {
    const numero = parseFloat(valor) || 0;
    return '₲ ' + Math.round(numero).toLocaleString('es-PY');
};