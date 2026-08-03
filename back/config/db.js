const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Si usas un servicio en la nube que requiere SSL (como Supabase), descomenta la siguiente línea:
    // ssl: { rejectUnauthorized: false }
}); 

pool.on('connect', () => {
    console.log('🔗 Conexión exitosa a la base de datos PostgreSQL');
});

// Ejecuta varias queries dentro de una misma transacción (BEGIN/COMMIT/ROLLBACK).
// `fn` recibe un cliente con el mismo método `query(text, params)` para usar dentro de la transacción.
const withTransaction = async (fn) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const resultado = await fn({ query: (text, params) => client.query(text, params) });
        await client.query('COMMIT');
        return resultado;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    query: (text, params) => pool.query(text, params),
    withTransaction,
};