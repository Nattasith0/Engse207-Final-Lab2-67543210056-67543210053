require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db/db');
const { initDb } = require('./db/initDb');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
    res.json({ message: 'user-service is running' });
});

app.get('/api/users/health', (_req, res) => {
    res.json({ status: 'ok', service: 'user-service' });
});

app.use('/api/users', userRoutes);

async function start() {
    let retries = 10;

    while (retries > 0) {
        try {
            await db.query('SELECT 1');
            break;
        } catch (e) {
            console.log(`[user-service] Waiting for DB... (${retries} left)`);
            retries--;
            await new Promise((r) => setTimeout(r, 3000));
        }
    }

    if (retries === 0) {
        throw new Error('user-service could not connect to database');
    }

    await initDb();

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`[user-service] Running on :${PORT}`);
    });
}

start().catch((err) => {
    console.error('[user-service] Startup error:', err.message);
    process.exit(1);
});