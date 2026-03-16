require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db/db');
const { initDb } = require('./db/initDb');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'auth-service is running' });
});

app.get('/api/auth/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

app.use('/api/auth', authRoutes);

async function start() {
  let retries = 10;

  while (retries > 0) {
    try {
      await db.query('SELECT 1');
      break;
    } catch (e) {
      console.log(`[auth-service] Waiting for DB... (${retries} left)`);
      retries--;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  if (retries === 0) {
    throw new Error('auth-service could not connect to database');
  }

  await initDb();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[auth-service] Running on :${PORT}`);
  });
}

start().catch((err) => {
  console.error('[auth-service] Startup error:', err.message);
  process.exit(1);
});