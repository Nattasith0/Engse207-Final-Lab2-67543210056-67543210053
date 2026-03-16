require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db/db');
const { initDb } = require('./db/initDb');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'task-service is running' });
});

app.get('/api/tasks/health', (_req, res) => {
  res.json({ status: 'ok', service: 'task-service' });
});

app.use('/api/tasks', taskRoutes);

async function start() {
  let retries = 10;

  while (retries > 0) {
    try {
      await db.query('SELECT 1');
      break;
    } catch (e) {
      console.log(`[task-service] Waiting for DB... (${retries} left)`);
      retries--;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  if (retries === 0) {
    throw new Error('task-service could not connect to database');
  }

  await initDb();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[task-service] Running on :${PORT}`);
  });
}

start().catch((err) => {
  console.error('[task-service] Startup error:', err.message);
  process.exit(1);
});