# Decisiones de alcance

Registro de lo que queda fuera del alcance actual del proyecto (POS de zapatería) y por qué.

## Facturación fiscal legal (timbrado / SET Paraguay)

- **Estado:** fuera de alcance por ahora.
- Cuando un cliente necesita factura oficial, se gestiona manualmente fuera de la app.
- No se construye facturación fiscal salvo que se vuelva a plantear.

## Backups de base de datos

- **Estado:** diferido hasta el lanzamiento a producción.
- No es prioridad durante el desarrollo actual.
- Retomar cuando se prepare el despliegue a producción.

## Contexto (decidido el 2026-07-26)

Decisiones tomadas al priorizar los pendientes detectados tras una limpieza de seguridad y arquitectura (autenticación JWT, CORS, transacciones SQL, nombres de archivo consistentes).

Pendientes reales que siguen abiertos:

- Verificación de stock al realizar una venta.
- Auditoría: registrar qué `user_id` realizó una venta o un movimiento de caja.

## Siguiente paso

Impresión de tickets / recibos de venta.
