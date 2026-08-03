-- Tabla de parámetros del negocio (fila única, id = 1).
-- Alimenta el encabezado/pie del ticket de venta y, más adelante, datos de facturación fiscal.
CREATE TABLE IF NOT EXISTS parametros (
    id                INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    nombre_local      VARCHAR(150) NOT NULL DEFAULT 'ZAPATERÍA',
    direccion         VARCHAR(200),
    telefono          VARCHAR(50),
    ruc               VARCHAR(50),
    timbrado          VARCHAR(50),
    nombre_impresora  VARCHAR(100),
    ancho_ticket      INT NOT NULL DEFAULT 80,
    mensaje_pie       VARCHAR(200) DEFAULT '¡Gracias por su compra!'
);

INSERT INTO parametros (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
