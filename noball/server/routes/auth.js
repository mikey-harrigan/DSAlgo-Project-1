import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db.js';
import { authenticate, signToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { username, email, password, displayName } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(409).json({ error: 'Username or email already taken' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)'
  ).run(username, email, hash, displayName || username);

  const token = signToken(result.lastInsertRowid);
  const user = db.prepare('SELECT id, username, email, display_name, elo_rating, global_rank FROM users WHERE id = ?')
    .get(result.lastInsertRowid);

  res.status(201).json({ token, user });
});

router.post('/login', (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({ error: 'Login and password required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(login, login);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken(user.id, user.is_admin === 1);
  const { password_hash, ...safeUser } = user;

  res.json({ token, user: safeUser });
});

router.get('/me', authenticate, (req, res) => {
  const db = getDb();
  const user = db.prepare(`
    SELECT id, username, email, display_name, avatar_url, favorite_team_id,
           elo_rating, sharpness_score, calibration_score, accuracy_score,
           total_predictions, correct_predictions, global_rank, is_admin,
           predictions_visible, created_at
    FROM users WHERE id = ?
  `).get(req.userId);

  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.put('/me', authenticate, (req, res) => {
  const { displayName, favoriteTeamId, predictionsVisible } = req.body;
  const db = getDb();

  db.prepare(`
    UPDATE users SET
      display_name = COALESCE(?, display_name),
      favorite_team_id = COALESCE(?, favorite_team_id),
      predictions_visible = COALESCE(?, predictions_visible)
    WHERE id = ?
  `).run(displayName, favoriteTeamId, predictionsVisible, req.userId);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  const { password_hash, ...safeUser } = user;
  res.json(safeUser);
});

export default router;
