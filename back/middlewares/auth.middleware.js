const jwt = require('jsonwebtoken');

// Exige un JWT válido en el header Authorization: Bearer <token>
const verificarToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ mensaje: 'No autorizado: token no proporcionado' });
    }

    const token = authHeader.slice('Bearer '.length);

    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ mensaje: 'No autorizado: token inválido o expirado' });
    }
};

// Exige que el usuario autenticado tenga uno de los roles permitidos.
// Debe usarse después de verificarToken (necesita req.usuario.rol).
const permitirRoles = (...roles) => (req, res, next) => {
    if (!roles.includes(req.usuario?.rol)) {
        return res.status(403).json({ mensaje: 'No tenés permisos para realizar esta acción' });
    }
    next();
};

module.exports = { verificarToken, permitirRoles };
