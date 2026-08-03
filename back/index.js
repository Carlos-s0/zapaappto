const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');
const { verificarToken } = require('./middlewares/auth.middleware');

const app = express();

const zapatoRoutes   = require('./routes/zapatos.routes');
const ventasRoutes   = require('./routes/ventas.routes');
const cajaRoutes     = require('./routes/caja.routes');
const informesRoutes = require('./routes/informes.routes');
const login = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const clientesRoutes = require('./routes/clientes.routes');
const parametrosRoutes = require('./routes/parametros.routes');


const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Único endpoint público: login. Todo lo demás requiere JWT válido.
app.use('/api/auth', login);

app.use('/api/zapatos',   verificarToken, zapatoRoutes);
app.use('/api/ventas',    verificarToken, ventasRoutes);
app.use('/api/caja',      verificarToken, cajaRoutes);
app.use('/api/informes',  verificarToken, informesRoutes);
app.use('/api/usuarios',  verificarToken, usuariosRoutes);
app.use('/api/clientes',  verificarToken, clientesRoutes);
app.use('/api/parametros', parametrosRoutes); // auth aplicada por-ruta dentro del router (ver parametros.routes.js)

// Ruta de diagnóstico para verificar la conexión a la BD
app.get('/api/test-db', verificarToken, async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.json({ mensaje: '¡Base de datos conectada!', hora: result.rows[0].now });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error conectando a la base de datos' });
    }
});

// Puerto 4000 para que coincida con el frontend
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
