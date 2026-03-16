const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/db');
const { generateToken, verifyToken } = require('../middleware/jwtUtils');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [normalizedEmail, username]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, 'member')
       RETURNING id, username, email, role, created_at`,
      [username, normalizedEmail, hash]
    );

    res.status(201).json({ message: 'Registered', user: result.rows[0] });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'email and password required' });

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]
    );
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      username: user.username
    });

    res.json({
      message: 'Login สำเร็จ',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = verifyToken(token);
    const result = await db.query(
      'SELECT id, username, email, role, created_at, last_login FROM users WHERE id = $1',
      [decoded.sub]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ valid: false, error: 'No token' });
  try {
    const decoded = verifyToken(token);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(401).json({ valid: false, error: err.message });
  }
});

// GET /api/auth/logs (admin only)
router.get('/logs', async (req, res) => {
  const tkn = (req.headers['authorization'] || '').split(' ')[1];
  if (!tkn) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = verifyToken(tkn);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admin only' });
    const result = await db.query('SELECT * FROM logs ORDER BY created_at DESC LIMIT 200');
    res.json({ logs: result.rows, count: result.rowCount, service: 'auth-service' });
  } catch (err) {
    console.error('GET /logs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/health
router.get('/health', (_, res) => res.json({ status: 'ok', service: 'auth-service', time: new Date() }));

module.exports = router;