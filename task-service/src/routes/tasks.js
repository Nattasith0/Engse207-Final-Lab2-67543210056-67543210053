const express = require('express');
const router = express.Router();
const db = require('../db/db');
const requireAuth = require('../middleware/authMiddleware');

router.get('/health', (_, res) => res.json({ status: 'ok', service: 'task-service' }));

router.use(requireAuth);

// GET /api/tasks/
router.get('/', async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await db.query(
        'SELECT * FROM tasks ORDER BY created_at DESC'
      );
    } else {
      result = await db.query(
        'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
        [req.user.sub]
      );
    }
    res.json({ tasks: result.rows, count: result.rowCount });
  } catch (err) {
    console.error('GET /tasks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/tasks/
router.post('/', async (req, res) => {
  const { title, description, status = 'TODO', priority = 'medium' } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  try {
    const result = await db.query(
      `INSERT INTO tasks (user_id, title, description, status, priority)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.sub, title, description, status, priority]
    );
    res.status(201).json({ task: result.rows[0] });
  } catch (err) {
    console.error('POST /tasks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const check = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (!check.rows[0]) return res.status(404).json({ error: 'Task not found' });
    if (check.rows[0].user_id !== req.user.sub && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Forbidden' });

    const { title, description, status, priority } = req.body;
    const result = await db.query(
      `UPDATE tasks SET
        title=COALESCE($1,title), description=COALESCE($2,description),
        status=COALESCE($3,status), priority=COALESCE($4,priority), updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [title, description, status, priority, id]
    );
    res.json({ task: result.rows[0] });
  } catch (err) {
    console.error('PUT /tasks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const check = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (!check.rows[0]) return res.status(404).json({ error: 'Task not found' });
    if (check.rows[0].user_id !== req.user.sub && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Forbidden' });

    await db.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('DELETE /tasks error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/tasks/logs (admin only)
router.get('/logs', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admin only' });
    const result = await db.query('SELECT * FROM logs ORDER BY created_at DESC LIMIT 200');
    res.json({ logs: result.rows, count: result.rowCount, service: 'task-service' });
  } catch (err) {
    console.error('GET /tasks/logs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;