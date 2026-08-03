import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Paper, Button, TextField, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, Chip,
    CircularProgress, Alert, Snackbar, Fade, Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { zapatosApi, ventasApi, clientesApi, parametrosApi } from '../api';
import { gs } from '../utils/moneda';
import TicketVenta from '../components/TicketVenta';

export default function Ventas() {
    const [zapatos, setZapatos] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [metodoPago, setMetodoPago] = useState('Efectivo');
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, mensaje: '', tipo: 'success' });
    const [nroOperacion, setNroOperacion] = useState(''); // Nuevo estado
    const [montoEfectivoMixto, setMontoEfectivoMixto] = useState('');
    const [montoBancoMixto, setMontoBancoMixto] = useState('');

    // Producto
    const [modalProducto, setModalProducto] = useState(false);
    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [codigoBarra, setCodigoBarra] = useState('');
    const [productoActual, setProductoActual] = useState(null);
    const [cantidadActual, setCantidadActual] = useState(1);
    const [precioEditable, setPrecioEditable] = useState('');

    // Cliente
    const [modalCliente, setModalCliente] = useState(false);
    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [clientesFiltrados, setClientesFiltrados] = useState([]);
    const [cargandoClientes, setCargandoClientes] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null); // null = Consumidor Final

    // Ticket / impresión
    const [parametros, setParametros] = useState(null);
    const [ventaImpresa, setVentaImpresa] = useState(null);
    const [dialogExito, setDialogExito] = useState(false);

    const codigoRef = useRef(null);
    const mostrarMensaje = (mensaje, tipo = 'success') =>
        setSnackbar({ open: true, mensaje, tipo });

    const obtenerZapatos = async () => {
        try {
            const datos = await zapatosApi.getAll();
            setZapatos(datos);
        } catch {
            mostrarMensaje('Error al cargar productos', 'error');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { obtenerZapatos(); }, []);
    useEffect(() => { parametrosApi.getAll().then(setParametros).catch(() => {}); }, []);

    // Búsqueda de clientes con debounce
    useEffect(() => {
        if (!modalCliente) return;
        const timer = setTimeout(async () => {
            setCargandoClientes(true);
            try {
                const datos = await clientesApi.getAll(busquedaCliente);
                setClientesFiltrados(datos);
            } catch {
                mostrarMensaje('Error al buscar clientes', 'error');
            } finally {
                setCargandoClientes(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [busquedaCliente, modalCliente]);

    // ── PRODUCTO ──────────────────────────────────────────
    const buscarPorCodigo = (e) => {
        if (e.key !== 'Enter') return;
        const codigo = codigoBarra.trim().toUpperCase();
        if (!codigo) return;
        const zapato = zapatos.find(z => z.codigo?.toUpperCase() === codigo);
        if (zapato) {
            parseInt(zapato.stock) <= 0
                ? mostrarMensaje(`"${zapato.modelo}" sin stock`, 'warning')
                : seleccionarProducto(zapato);
        } else {
            mostrarMensaje(`Código "${codigo}" no encontrado`, 'error');
        }
        setCodigoBarra('');
    };

    const seleccionarProducto = (zapato) => {
        setProductoActual(zapato);
        setCantidadActual(1);
        setPrecioEditable(parseFloat(zapato.precio_venta).toString());
        setModalProducto(false);
        setBusquedaProducto('');
    };

    const agregarAlCarrito = () => {
        if (!productoActual) return;
        const cantidad = parseInt(cantidadActual) || 1;
        const precio   = parseFloat(precioEditable) || parseFloat(productoActual.precio_venta);

        if (precio <= 0) {
            mostrarMensaje('El precio debe ser mayor a cero', 'warning');
            return;
        }

        const yaEnCarrito   = carrito.find(c => c.id === productoActual.id);
        const cantEnCarrito = yaEnCarrito ? yaEnCarrito.cantidad : 0;

        if (cantEnCarrito + cantidad > parseInt(productoActual.stock)) {
            mostrarMensaje(`Stock máximo: ${productoActual.stock} unidades`, 'warning');
            return;
        }

        if (yaEnCarrito) {
            setCarrito(carrito.map(c => c.id === productoActual.id
                ? { ...c, cantidad: c.cantidad + cantidad, precio_unitario: precio, subtotal: (c.cantidad + cantidad) * precio }
                : c
            ));
        } else {
            setCarrito([...carrito, {
                id:             productoActual.id,
                codigo:         productoActual.codigo,
                modelo:         productoActual.modelo,
                talla:          productoActual.talla,
                color:          productoActual.color,
                precio_unitario: precio,
                cantidad,
                subtotal:       precio * cantidad,
                stockMaximo:    parseInt(productoActual.stock),
            }]);
        }

        mostrarMensaje(`"${productoActual.modelo}" agregado`);
        setProductoActual(null);
        setCantidadActual(1);
        setPrecioEditable('');
        codigoRef.current?.focus();
    };

    const cambiarCantidad = (id, delta) => {
        setCarrito(carrito.map(c => {
            if (c.id !== id) return c;
            const nueva = c.cantidad + delta;
            if (nueva < 1) return c;
            if (nueva > c.stockMaximo) {
                mostrarMensaje(`Máximo: ${c.stockMaximo} uds.`, 'warning');
                return c;
            }
            return { ...c, cantidad: nueva, subtotal: nueva * c.precio_unitario };
        }));
    };

    const eliminarDelCarrito = (id) =>
        setCarrito(carrito.filter(c => c.id !== id));

    const calcularTotal = () =>
        carrito.reduce((acc, c) => acc + c.subtotal, 0);

    // ── CLIENTE ───────────────────────────────────────────
    const seleccionarCliente = (cliente) => {
        setClienteSeleccionado(cliente);
        setModalCliente(false);
        setBusquedaCliente('');
    };

    const quitarCliente = () => setClienteSeleccionado(null);

    // ── VENTA ─────────────────────────────────────────────
    const finalizarVenta = async () => {
        if (carrito.length === 0) return;

        const total = calcularTotal();
        let montoEfectivo;
        let montoBanco;

        if (metodoPago === 'Mixto') {
            montoEfectivo = parseFloat(montoEfectivoMixto) || 0;
            montoBanco = parseFloat(montoBancoMixto) || 0;
            if (montoEfectivo <= 0 || montoBanco <= 0) {
                mostrarMensaje('Ingresá un monto en efectivo y en banco, ambos mayores a cero', 'warning');
                return;
            }
            if (Math.abs((montoEfectivo + montoBanco) - total) > 1) {
                mostrarMensaje('La suma de efectivo y banco no coincide con el total', 'warning');
                return;
            }
        }

        setProcesando(true);
        try {
            const respuesta = await ventasApi.create({
                total,
                metodo_pago:    metodoPago,
                cliente_id:     clienteSeleccionado?.id || null,
                nro_operacion:  nroOperacion || null, // Nuevo campo
                monto_efectivo: metodoPago === 'Mixto' ? montoEfectivo : undefined,
                monto_banco:    metodoPago === 'Mixto' ? montoBanco : undefined,
                productos:      carrito,
            });
            setVentaImpresa({
                id: respuesta.ventaId,
                fecha: new Date(),
                cliente: clienteSeleccionado,
                items: carrito,
                total,
                metodoPago,
                nroOperacion,
                montoEfectivo: metodoPago === 'Mixto' ? montoEfectivo : undefined,
                montoBanco: metodoPago === 'Mixto' ? montoBanco : undefined,
            });
            setDialogExito(true);
            setCarrito([]);
            setProductoActual(null);
            setClienteSeleccionado(null);
            setNroOperacion(''); // Limpiar número de operación
            setMontoEfectivoMixto('');
            setMontoBancoMixto('');
            obtenerZapatos();
        } catch (err) {
            mostrarMensaje(err.message, 'error');
        } finally {
            setProcesando(false);
        }
    };

    const cerrarDialogExito = () => {
        setDialogExito(false);
        codigoRef.current?.focus();
    };

    const zapatosFiltrados = zapatos
        .filter(z => parseInt(z.stock) > 0)
        .filter(z => !busquedaProducto ||
            z.modelo?.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
            z.codigo?.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
            z.color?.toLowerCase().includes(busquedaProducto.toLowerCase())
        );

    const metodosPago = [
        { valor: 'Efectivo',       emoji: '💵' },
        { valor: 'Tarjeta',        emoji: '💳' },
        { valor: 'Transferencia',  emoji: '🏦' },
        { valor: 'Mixto',          emoji: '🔀' },
    ];

    return (
        <Box sx={{ p: 2, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <Box sx={{ mb: 1.5, flexShrink: 0 }}>
                <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                    Módulo de Ventas
                </Typography>
                <Typography sx={{ color: '#64748b', mt: 0.3, fontSize: '0.82rem' }}>
                    Escaneá el código o buscá en el catálogo
                </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 2, flex: 1, minHeight: 0 }}>

                {/* ── PANEL IZQUIERDO ── */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, overflowY: 'auto', minHeight: 0 }}>

                    {/* CLIENTE */}
                    <Paper sx={{ p: 2, borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', mb: 1.5 }}>
                            Cliente
                        </Typography>

                        {clienteSeleccionado ? (
                            <Box sx={{
                                display: 'flex', alignItems: 'center', gap: 1.5,
                                p: 1.5, borderRadius: '10px',
                                bgcolor: '#f0fdf4', border: '1px solid #bbf7d0',
                            }}>
                                <Box sx={{
                                    width: 36, height: 36, borderRadius: '8px',
                                    bgcolor: '#dcfce7', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <PersonOutlinedIcon sx={{ color: '#16a34a', fontSize: 20 }} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#15803d' }}>
                                        {clienteSeleccionado.nombre} {clienteSeleccionado.apellido || ''}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#16a34a' }}>
                                        {clienteSeleccionado.cedula
                                            ? `CI: ${clienteSeleccionado.cedula}`
                                            : clienteSeleccionado.telefono || 'Sin datos adicionales'}
                                    </Typography>
                                </Box>
                                <IconButton size="small" onClick={quitarCliente}
                                    sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        ) : (
                            <Button fullWidth variant="outlined"
                                startIcon={<PersonAddOutlinedIcon />}
                                onClick={() => { setModalCliente(true); setBusquedaCliente(''); }}
                                sx={{
                                    borderRadius: '10px', borderColor: '#e2e8f0',
                                    color: '#475569', fontWeight: 600, py: 1.1,
                                    '&:hover': { borderColor: '#f59e0b', color: '#f59e0b', bgcolor: '#fef3c7' },
                                }}>
                                Buscar / Asignar Cliente
                            </Button>
                        )}

                        {!clienteSeleccionado && (
                            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', mt: 1 }}>
                                Sin cliente = Consumidor Final
                            </Typography>
                        )}
                    </Paper>

                    {/* BUSCADOR PRODUCTO */}
                    <Paper sx={{ p: 2, borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', mb: 1.5 }}>
                            Buscar Producto
                        </Typography>
                        <TextField
                            inputRef={codigoRef}
                            placeholder="Código de barras + Enter"
                            value={codigoBarra}
                            onChange={(e) => setCodigoBarra(e.target.value)}
                            onKeyDown={buscarPorCodigo}
                            fullWidth autoFocus
                            sx={{ ...inputSx, mb: 1 }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <QrCodeScannerIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                        <Button fullWidth variant="outlined" startIcon={<SearchIcon />}
                            onClick={() => setModalProducto(true)}
                            sx={{
                                borderRadius: '10px', borderColor: '#e2e8f0',
                                color: '#475569', fontWeight: 600,
                                '&:hover': { borderColor: '#f59e0b', color: '#f59e0b', bgcolor: '#fef3c7' },
                            }}>
                            Buscar en catálogo
                        </Button>
                    </Paper>

                    {/* PRODUCTO SELECCIONADO */}
                    <Paper sx={{
                        p: 2, borderRadius: '14px', transition: 'all 0.2s',
                        border: `1px solid ${productoActual ? '#fcd34d' : '#f1f5f9'}`,
                        bgcolor: productoActual ? '#fffbeb' : 'white',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', mb: 1.5 }}>
                            Producto Seleccionado
                        </Typography>

                        {!productoActual ? (
                            <Box sx={{ py: 1.5, textAlign: 'center' }}>
                                <ShoppingBagOutlinedIcon sx={{ fontSize: 32, color: '#e2e8f0', mb: 0.5 }} />
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                                    Buscá un producto para cargarlo aquí
                                </Typography>
                            </Box>
                        ) : (
                            <Fade in>
                                <Box>
                                    {/* Resumen en una sola línea */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                        <Typography sx={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            <Box component="span" sx={{ fontFamily: 'monospace', color: '#64748b', mr: 0.5 }}>{productoActual.codigo}</Box>
                                            {productoActual.modelo} · Talla {productoActual.talla} · {productoActual.color || '—'}
                                        </Typography>
                                        <Chip label={`${productoActual.stock} uds.`} size="small" sx={{ ml: 1, flexShrink: 0, fontWeight: 700, bgcolor: '#f0fdf4', color: '#16a34a' }} />
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                                        {/* Precio editable */}
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={{ fontSize: '0.62rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.3 }}>
                                                Precio de Venta ✏️
                                            </Typography>
                                            <TextField
                                                type="number"
                                                value={precioEditable}
                                                onChange={(e) => setPrecioEditable(e.target.value)}
                                                size="small" fullWidth
                                                inputProps={{ min: 1 }}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '8px', bgcolor: 'white',
                                                        '& fieldset': { borderColor: '#fcd34d', borderWidth: 2 },
                                                        '&:hover fieldset': { borderColor: '#f59e0b' },
                                                        '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
                                                    },
                                                    '& input': { fontWeight: 700, color: '#92400e' },
                                                }}
                                            />
                                        </Box>

                                        {/* Cantidad */}
                                        <Box>
                                            <Typography sx={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.3 }}>
                                                Cantidad
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <IconButton size="small"
                                                    onClick={() => setCantidadActual(Math.max(1, cantidadActual - 1))}
                                                    sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', width: 32, height: 32 }}>
                                                    <RemoveIcon fontSize="small" />
                                                </IconButton>
                                                <TextField type="number" value={cantidadActual}
                                                    onChange={(e) => setCantidadActual(Math.max(1, parseInt(e.target.value) || 1))}
                                                    size="small"
                                                    sx={{ width: 56, '& input': { textAlign: 'center', fontWeight: 700 }, ...inputSx }}
                                                    inputProps={{ min: 1, max: productoActual.stock }}
                                                />
                                                <IconButton size="small"
                                                    onClick={() => setCantidadActual(Math.min(parseInt(productoActual.stock), cantidadActual + 1))}
                                                    sx={{ border: '1px solid #e2e8f0', borderRadius: '8px', width: 32, height: 32 }}>
                                                    <AddIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Typography sx={{ color: '#64748b', fontSize: '0.8rem', mb: 1.5 }}>
                                        Subtotal: <strong>{gs((parseFloat(precioEditable) || 0) * cantidadActual)}</strong>
                                    </Typography>

                                    <Button fullWidth variant="contained" onClick={agregarAlCarrito}
                                        sx={{
                                            bgcolor: '#0a0f1e', color: 'white', fontWeight: 700,
                                            borderRadius: '10px', py: 1,
                                            '&:hover': { bgcolor: '#1e293b' },
                                        }}>
                                        Agregar al Carrito
                                    </Button>
                                </Box>
                            </Fade>
                        )}
                    </Paper>

                    {/* PAGO */}
                    <Paper sx={{ p: 2, borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                        <Box sx={{ mb: 1.5 }}>
                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Total a cobrar
                            </Typography>
                            <Typography sx={{ fontSize: '1.7rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1.1 }}>
                                {gs(calcularTotal())}
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 1.5 }} />
                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, mb: 1 }}>
                            Método de pago
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            {metodosPago.map(({ valor, emoji }) => (
                                <Box key={valor} onClick={() => setMetodoPago(valor)} sx={{
                                    flex: 1, py: 0.8, textAlign: 'center',
                                    borderRadius: '8px', cursor: 'pointer',
                                    border: `2px solid ${metodoPago === valor ? '#f59e0b' : '#e2e8f0'}`,
                                    bgcolor: metodoPago === valor ? '#fef3c7' : 'white',
                                    color: metodoPago === valor ? '#92400e' : '#94a3b8',
                                    fontWeight: 700, fontSize: '0.78rem', transition: 'all 0.15s',
                                }}>
                                    {emoji}<br />{valor}
                                </Box>
                            ))}
                        </Box>

                        {/* Comprobante — Tarjeta, Transferencia, o la parte banco de un Mixto */}
                        {(metodoPago === 'Tarjeta' || metodoPago === 'Transferencia' || metodoPago === 'Mixto') && (
                            <Fade in>
                                <Box sx={{ mb: 2 }}>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, mb: 0.5 }}>
                                        Nº de comprobante / operación
                                    </Typography>
                                    <TextField
                                        placeholder={
                                            metodoPago === 'Tarjeta' ? 'Últimos 4 dígitos o nro. de lote...'
                                            : metodoPago === 'Transferencia' ? 'Nro. de transferencia...'
                                            : 'Nro. de comprobante del pago por banco...'
                                        }
                                        value={nroOperacion}
                                        onChange={(e) => setNroOperacion(e.target.value)}
                                        fullWidth size="small"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '8px',
                                                '&:hover fieldset': { borderColor: '#f59e0b' },
                                                '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
                                            },
                                        }}
                                    />
                                </Box>
                            </Fade>
                        )}

                        {/* Pago mixto — dos montos que deben sumar el total */}
                        {metodoPago === 'Mixto' && (
                            <Fade in>
                                <Box sx={{ mb: 2 }}>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, mb: 0.5 }}>
                                        Montos por forma de pago (deben sumar {gs(calcularTotal())})
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <TextField
                                            label="Efectivo" type="number" size="small" fullWidth
                                            value={montoEfectivoMixto}
                                            onChange={(e) => {
                                                const valor = e.target.value;
                                                setMontoEfectivoMixto(valor);
                                                const restante = calcularTotal() - (parseFloat(valor) || 0);
                                                setMontoBancoMixto(restante > 0 ? String(Math.round(restante)) : '0');
                                            }}
                                            sx={inputSx}
                                        />
                                        <TextField
                                            label="Banco" type="number" size="small" fullWidth
                                            value={montoBancoMixto}
                                            onChange={(e) => {
                                                const valor = e.target.value;
                                                setMontoBancoMixto(valor);
                                                const restante = calcularTotal() - (parseFloat(valor) || 0);
                                                setMontoEfectivoMixto(restante > 0 ? String(Math.round(restante)) : '0');
                                            }}
                                            sx={inputSx}
                                        />
                                    </Box>
                                </Box>
                            </Fade>
                        )}

                        <Button fullWidth variant="contained" startIcon={<ReceiptLongIcon />}
                            onClick={finalizarVenta}
                            disabled={carrito.length === 0 || procesando}
                            sx={{
                                bgcolor: '#f59e0b', color: '#000', fontWeight: 800,
                                borderRadius: '10px', py: 1.5,
                                boxShadow: '0 4px 15px rgba(245,158,11,0.35)',
                                '&:hover': { bgcolor: '#d97706' },
                                '&:disabled': { bgcolor: '#f1f5f9', color: '#94a3b8', boxShadow: 'none' },
                            }}>
                            {procesando ? 'Procesando...' : 'Procesar Venta'}
                        </Button>
                    </Paper>
                </Box>

                {/* ── PANEL DERECHO: CARRITO ── */}
                <Paper sx={{ borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <Box sx={{ px: 3, py: 2, bgcolor: '#0a0f1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                        <Box>
                            <Typography sx={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>
                                Detalle de la Venta
                            </Typography>
                            {clienteSeleccionado && (
                                <Typography sx={{ fontSize: '0.72rem', color: '#f59e0b', mt: 0.3 }}>
                                    👤 {clienteSeleccionado.nombre} {clienteSeleccionado.apellido || ''}
                                </Typography>
                            )}
                        </Box>
                        {carrito.length > 0 && (
                            <Chip label={`${carrito.length} ítem${carrito.length > 1 ? 's' : ''}`}
                                size="small" sx={{ bgcolor: '#f59e0b', color: '#000', fontWeight: 700 }} />
                        )}
                    </Box>

                    {/* Cabecera tabla */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '90px 1fr 70px 110px 140px 48px', px: 2.5, py: 1.2, bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                        {['Código', 'Producto', 'Talla', 'Cantidad', 'Subtotal', ''].map(h => (
                            <Typography key={h} sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {h}
                            </Typography>
                        ))}
                    </Box>

                    {carrito.length === 0 ? (
                        <Box sx={{ py: 10, textAlign: 'center' }}>
                            <ShoppingBagOutlinedIcon sx={{ fontSize: 52, color: '#e2e8f0', mb: 1 }} />
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>El carrito está vacío</Typography>
                            <Typography sx={{ color: '#cbd5e1', fontSize: '0.8rem', mt: 0.5 }}>Buscá un producto para comenzar</Typography>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
                            {carrito.map((item) => (
                                <Fade in key={item.id}>
                                    <Box sx={{
                                        display: 'grid', gridTemplateColumns: '90px 1fr 70px 110px 140px 48px',
                                        px: 2.5, py: 1.8, alignItems: 'center',
                                        borderBottom: '1px solid #f8fafc',
                                        '&:hover': { bgcolor: '#fafbff' },
                                    }}>
                                        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#64748b' }}>
                                            {item.codigo}
                                        </Typography>
                                        <Box>
                                            <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                                                {item.modelo}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                                {gs(item.precio_unitario)} c/u · {item.color || ''}
                                            </Typography>
                                        </Box>
                                        <Typography sx={{ color: '#475569', fontSize: '0.875rem' }}>{item.talla}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <IconButton size="small" onClick={() => cambiarCantidad(item.id, -1)}
                                                sx={{ border: '1px solid #e2e8f0', borderRadius: '6px', width: 24, height: 24 }}>
                                                <RemoveIcon sx={{ fontSize: 12 }} />
                                            </IconButton>
                                            <Typography sx={{ fontWeight: 700, minWidth: '22px', textAlign: 'center', fontSize: '0.9rem' }}>
                                                {item.cantidad}
                                            </Typography>
                                            <IconButton size="small" onClick={() => cambiarCantidad(item.id, 1)}
                                                sx={{ border: '1px solid #e2e8f0', borderRadius: '6px', width: 24, height: 24 }}>
                                                <AddIcon sx={{ fontSize: 12 }} />
                                            </IconButton>
                                        </Box>
                                        <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                                            {gs(item.subtotal)}
                                        </Typography>
                                        <IconButton size="small" onClick={() => eliminarDelCarrito(item.id)}
                                            sx={{ color: '#cbd5e1', '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' } }}>
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Fade>
                            ))}
                            </Box>
                            <Box sx={{ px: 2.5, py: 2, bgcolor: '#fafbff', borderTop: '2px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                                <Typography sx={{ color: '#64748b', fontWeight: 600 }}>
                                    {carrito.reduce((a, c) => a + c.cantidad, 0)} unidades
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Typography sx={{ color: '#64748b', fontWeight: 600 }}>Total:</Typography>
                                    <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', color: '#0f172a' }}>
                                        {gs(calcularTotal())}
                                    </Typography>
                                </Box>
                            </Box>
                        </>
                    )}
                </Paper>
            </Box>

            {/* ── MODAL CATÁLOGO PRODUCTOS ── */}
            <Dialog open={modalProducto}
                onClose={() => { setModalProducto(false); setBusquedaProducto(''); }}
                maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: '16px', maxHeight: '80vh' } }}>
                <DialogTitle sx={{ p: 0 }}>
                    <Box sx={{ px: 3, pt: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>Catálogo de Productos</Typography>
                        <IconButton onClick={() => { setModalProducto(false); setBusquedaProducto(''); }} sx={{ color: '#94a3b8' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Box sx={{ px: 3, pb: 2 }}>
                        <TextField autoFocus placeholder="Buscar por modelo, código o color..."
                            value={busquedaProducto}
                            onChange={(e) => setBusquedaProducto(e.target.value)}
                            fullWidth sx={inputSx}
                            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment> } }}
                        />
                    </Box>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    {cargando ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress sx={{ color: '#f59e0b' }} />
                        </Box>
                    ) : zapatosFiltrados.length === 0 ? (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            <Typography sx={{ color: '#94a3b8' }}>Sin resultados</Typography>
                        </Box>
                    ) : (
                        <>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '100px 1fr 70px 80px 140px 100px', px: 3, py: 1.2, bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, zIndex: 1 }}>
                                {['Código', 'Modelo', 'Talla', 'Color', 'Precio', 'Stock'].map(h => (
                                    <Typography key={h} sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</Typography>
                                ))}
                            </Box>
                            {zapatosFiltrados.map((z) => (
                                <Box key={z.id} onClick={() => seleccionarProducto(z)} sx={{
                                    display: 'grid', gridTemplateColumns: '100px 1fr 70px 80px 140px 100px',
                                    px: 3, py: 1.8, borderBottom: '1px solid #f8fafc',
                                    cursor: 'pointer', alignItems: 'center',
                                    '&:hover': { bgcolor: '#fef9e7' },
                                    '&:last-child': { borderBottom: 'none' },
                                }}>
                                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#64748b' }}>{z.codigo}</Typography>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{z.modelo}</Typography>
                                    <Typography sx={{ color: '#475569', fontSize: '0.875rem' }}>{z.talla}</Typography>
                                    <Typography sx={{ color: '#475569', fontSize: '0.875rem' }}>{z.color || '—'}</Typography>
                                    <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>{gs(z.precio_venta)}</Typography>
                                    <Chip label={`${z.stock} uds.`} size="small" sx={{
                                        fontWeight: 700, fontSize: '0.75rem', width: 'fit-content',
                                        bgcolor: parseInt(z.stock) <= 3 ? '#fef3c7' : '#f0fdf4',
                                        color: parseInt(z.stock) <= 3 ? '#d97706' : '#15803d',
                                        border: `1px solid ${parseInt(z.stock) <= 3 ? '#fcd34d' : '#bbf7d0'}`,
                                    }} />
                                </Box>
                            ))}
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── MODAL BUSCAR CLIENTE ── */}
            <Dialog open={modalCliente}
                onClose={() => { setModalCliente(false); setBusquedaCliente(''); }}
                maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: '16px', maxHeight: '70vh' } }}>
                <DialogTitle sx={{ p: 0 }}>
                    <Box sx={{ px: 3, pt: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>Buscar Cliente</Typography>
                        <IconButton onClick={() => { setModalCliente(false); setBusquedaCliente(''); }} sx={{ color: '#94a3b8' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Box sx={{ px: 3, pb: 2 }}>
                        <TextField autoFocus placeholder="Nombre, cédula o teléfono..."
                            value={busquedaCliente}
                            onChange={(e) => setBusquedaCliente(e.target.value)}
                            fullWidth sx={inputSx}
                            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94a3b8' }} /></InputAdornment> } }}
                        />
                    </Box>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0 }}>
                    {cargandoClientes ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size={28} sx={{ color: '#f59e0b' }} />
                        </Box>
                    ) : clientesFiltrados.length === 0 ? (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                            <PersonOutlinedIcon sx={{ fontSize: 40, color: '#e2e8f0', mb: 1 }} />
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                                {busquedaCliente ? 'Sin resultados' : 'Escribí para buscar'}
                            </Typography>
                        </Box>
                    ) : (
                        clientesFiltrados.map((c) => (
                            <Box key={c.id} onClick={() => seleccionarCliente(c)} sx={{
                                display: 'flex', alignItems: 'center', gap: 2,
                                px: 3, py: 2, cursor: 'pointer',
                                borderBottom: '1px solid #f8fafc',
                                '&:hover': { bgcolor: '#fef9e7' },
                                '&:last-child': { borderBottom: 'none' },
                            }}>
                                <Box sx={{
                                    width: 36, height: 36, borderRadius: '8px',
                                    bgcolor: 'rgba(245,158,11,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <PersonOutlinedIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                                        {c.nombre} {c.apellido || ''}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        {[c.cedula && `CI: ${c.cedula}`, c.telefono].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                        {c.total_compras} compra{c.total_compras !== 1 ? 's' : ''}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                                        {gs(c.total_gastado)}
                                    </Typography>
                                </Box>
                            </Box>
                        ))
                    )}
                </DialogContent>
            </Dialog>

            {/* ── DIALOG VENTA EXITOSA ── */}
            <Dialog open={dialogExito} onClose={cerrarDialogExito} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogContent sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 56, color: '#16a34a', mb: 1 }} />
                    <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', mb: 0.5 }}>
                        ¡Venta registrada!
                    </Typography>
                    {ventaImpresa && (
                        <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                            Venta N° {ventaImpresa.id} · {gs(ventaImpresa.total)}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, gap: 1, justifyContent: 'center' }}>
                    <Button variant="outlined" onClick={cerrarDialogExito}
                        sx={{ borderRadius: '10px', color: '#475569', borderColor: '#e2e8f0', fontWeight: 600 }}>
                        Nueva Venta
                    </Button>
                    <Button variant="contained" startIcon={<PrintOutlinedIcon />} onClick={() => window.print()}
                        sx={{ bgcolor: '#f59e0b', color: '#000', fontWeight: 700, borderRadius: '10px' }}>
                        Imprimir Ticket
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Ticket oculto, solo visible al imprimir (ver print.css) */}
            <div className="ticket-imprimir">
                <TicketVenta parametros={parametros} venta={ventaImpresa} />
            </div>

            <Snackbar open={snackbar.open} autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snackbar.tipo} sx={{ borderRadius: '10px', fontWeight: 600 }}>
                    {snackbar.mensaje}
                </Alert>
            </Snackbar>
        </Box>
    );
}

const inputSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '10px',
        '&:hover fieldset': { borderColor: '#f59e0b' },
        '&.Mui-focused fieldset': { borderColor: '#f59e0b' },
    },
};

