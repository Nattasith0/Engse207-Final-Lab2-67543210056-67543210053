const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { verifyToken } = require('../middleware/authMiddleware');

// ─── GET /api/users/health ─────────────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', service: 'user-service' });
  } catch (err) {
    res.status(500).json({ status: 'error', service: 'user-service' });
  }
});

// ─── GET /api/users/me ─────────────────────────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.sub;

    let result = await db.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    // ถ้ายังไม่มี profile → สร้างให้อัตโนมัติจาก JWT
    if (result.rows.length === 0) {
      await db.query(
        `INSERT INTO user_profiles (user_id, username, email, role)
         VALUES ($1, $2, $3, $4)`,
        [userId, req.user.username, req.user.email, req.user.role]
      );
      result = await db.query(
        'SELECT * FROM user_profiles WHERE user_id = $1',
        [userId]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PUT /api/users/me ─────────────────────────────────────────────────────
router.put('/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { display_name, bio, avatar_url } = req.body;

    // ถ้ายังไม่มี profile สร้างก่อน
    const existing = await db.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    if (existing.rows.length === 0) {
      await db.query(
        `INSERT INTO user_profiles (user_id, username, email, role)
         VALUES ($1, $2, $3, $4)`,
        [userId, req.user.username, req.user.email, req.user.role]
      );
    }

    const result = await db.query(
      `UPDATE user_profiles
       SET display_name = COALESCE($1, display_name),
           bio          = COALESCE($2, bio),
           avatar_url   = COALESCE($3, avatar_url),
           updated_at   = NOW()
       WHERE user_id = $4
       RETURNING *`,
      [display_name, bio, avatar_url, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT /me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/users ────────────────────────────────────────────────────────
// Admin only
router.get('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin only' });
    }
    const result = await db.query(
      'SELECT * FROM user_profiles ORDER BY user_id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;