-- Soporte de pago mixto (efectivo + banco) en ventas y su reflejo en el libro de caja.
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS monto_efectivo NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS monto_banco    NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE movimientos_caja ADD COLUMN IF NOT EXISTS monto_efectivo NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE movimientos_caja ADD COLUMN IF NOT EXISTS monto_banco    NUMERIC(12,2) NOT NULL DEFAULT 0;
