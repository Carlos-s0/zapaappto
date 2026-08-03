import React from 'react';
import { gs } from '../utils/moneda';

// mm → px a 96dpi (resolución estándar de impresión de Chrome/Edge)
const anchoPx = (mm) => Math.round((mm / 25.4) * 96);

const estiloBase = {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: '12px',
    color: '#000',
    padding: '8px',
};

const linea = { borderTop: '1px dashed #000', margin: '6px 0' };

// venta = { id, fecha, cliente, items: [{modelo, cantidad, precio_unitario, subtotal}], total, metodoPago, nroOperacion }
export default function TicketVenta({ parametros, venta }) {
    if (!parametros || !venta) return null;

    const ancho = anchoPx(parametros.ancho_ticket || 80);
    const nombreCliente = venta.cliente
        ? `${venta.cliente.nombre} ${venta.cliente.apellido || ''}`.trim()
        : 'Consumidor Final';

    return (
        <div style={{ ...estiloBase, width: ancho }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                {parametros.nombre_local}
            </div>
            {parametros.direccion && (
                <div style={{ textAlign: 'center' }}>{parametros.direccion}</div>
            )}
            {parametros.telefono && (
                <div style={{ textAlign: 'center' }}>Tel: {parametros.telefono}</div>
            )}
            {parametros.ruc && (
                <div style={{ textAlign: 'center' }}>RUC: {parametros.ruc}</div>
            )}
            {parametros.timbrado && (
                <div style={{ textAlign: 'center' }}>Timbrado: {parametros.timbrado}</div>
            )}

            <div style={linea} />

            <div>Fecha: {new Date(venta.fecha).toLocaleString('es-PY')}</div>
            <div>Venta N°: {venta.id}</div>
            <div>Cliente: {nombreCliente}</div>

            <div style={linea} />

            {venta.items.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '4px' }}>
                    <div>{item.modelo}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.cantidad} x {gs(item.precio_unitario)}</span>
                        <span>{gs(item.subtotal)}</span>
                    </div>
                </div>
            ))}

            <div style={linea} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                <span>TOTAL</span>
                <span>{gs(venta.total)}</span>
            </div>

            <div style={linea} />

            {venta.metodoPago === 'Mixto' ? (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Efectivo</span><span>{gs(venta.montoEfectivo)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Banco</span><span>{gs(venta.montoBanco)}</span>
                    </div>
                </>
            ) : (
                <div>Pago: {venta.metodoPago}</div>
            )}
            {venta.nroOperacion && <div>Op: {venta.nroOperacion}</div>}

            {parametros.mensaje_pie && (
                <>
                    <div style={linea} />
                    <div style={{ textAlign: 'center' }}>{parametros.mensaje_pie}</div>
                </>
            )}
        </div>
    );
}
