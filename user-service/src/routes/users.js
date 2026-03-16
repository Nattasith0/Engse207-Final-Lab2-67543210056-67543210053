const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { verifyToken } = require('../middleware/authMiddleware');

// ─── GET /api/users/health ─────────────────────────────────────────────────
router.get('/health', async (_req, res) => {
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

        res.json({ profile: result.rows[0] });
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

        const result = await db.query(
            `INSERT INTO user_profiles (user_id, username, email, role, display_name, bio, avatar_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (user_id) DO UPDATE SET
               display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
               bio          = COALESCE(EXCLUDED.bio, user_profiles.bio),
               avatar_url   = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
               updated_at   = NOW()
             RETURNING *`,
            [userId, req.user.username, req.user.email, req.user.role, display_name, bio, avatar_url]
        );

        res.json({ profile: result.rows[0] });
    } catch (err) {
        console.error('PUT /me error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── GET /api/users ────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin only' });
        }

        const result = await db.query(
            `SELECT * FROM user_profiles ORDER BY user_id ASC`
        );

        res.json({ users: result.rows, count: result.rowCount });
    } catch (err) {
        console.error('GET /users error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── GET /api/users/logs ───────────────────────────────────────────────────
router.get('/logs', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin only' });
        }

        const result = await db.query(
            'SELECT * FROM logs ORDER BY created_at DESC LIMIT 200'
        );

        res.json({
            logs: result.rows,
            count: result.rowCount,
            service: 'user-service'
        });
    } catch (err) {
        console.error('GET /users/logs error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;