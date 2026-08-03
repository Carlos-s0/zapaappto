-- Niveles de usuario: admin (acceso total), cajero (ventas + caja + informes,
-- puede anular ventas) y vendedor (solo ventas).
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS rol VARCHAR(20) NOT NULL DEFAULT 'vendedor';

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('admin', 'cajero', 'vendedor'));

-- Los usuarios ya existentes quedan como admin para no perder acceso al actualizar.
UPDATE usuarios SET rol = 'admin' WHERE rol = 'vendedor';
