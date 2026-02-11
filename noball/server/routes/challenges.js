import { Router } from 'express';
import { getDb } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Create a head-to-head challenge
router.post('/', authenticate, (req, res) => {
  const { opponentId, dualId, mode } = req.body;

  if (!opponentId || !dualId || !mode) {
    return res.status(400).json({ error: 'opponentId, dualId, and mode required' });
  }

  const db = getDb();

  // Verify opponent exists and is a friend
  const friendship = db.prepare(`
    SELECT * FROM friendships
    WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?))
    AND status = 'accepted'
  `).get(req.userId, opponentId, opponentId, req.userId);

  if (!friendship) {
    return res.status(400).json({ error: 'You can only challenge friends' });
  }

  // Verify dual exists and is upcoming
  const dual = db.prepare('SELECT * FROM duals WHERE id = ?').get(dualId);
  if (!dual) return res.status(404).json({ error: 'Dual not found' });
  if (dual.status === 'completed') {
    return res.status(400).json({ error: 'Dual already completed' });
  }

  const result = db.prepare(
    'INSERT INTO challenges (creator_id, opponent_id, dual_id, mode) VALUES (?, ?, ?, ?)'
  ).run(req.userId, opponentId, dualId, mode);

  res.status(201).json({ id: result.lastInsertRowid, message: 'Challenge sent' });
});

// Get my challenges
router.get('/mine', authenticate, (req, res) => {
  const db = getDb();

  const challenges = db.prepare(`
    SELECT c.*,
      creator.username as creator_name, creator.display_name as creator_display,
      opponent.username as opponent_name, opponent.display_name as opponent_display,
      d.scheduled_at, d.status as dual_status,
      ht.short_name as home_short, at.short_name as away_short,
      ht.primary_color as home_color, at.primary_color as away_color,
      winner.username as winner_name
    FROM challenges c
    JOIN users creator ON c.creator_id = creator.id
    JOIN users opponent ON c.opponent_id = opponent.id
    JOIN duals d ON c.dual_id = d.id
    JOIN teams ht ON d.home_team_id = ht.id
    JOIN teams at ON d.away_team_id = at.id
    LEFT JOIN users winner ON c.winner_id = winner.id
    WHERE c.creator_id = ? OR c.opponent_id = ?
    ORDER BY c.created_at DESC
  `).all(req.userId, req.userId);

  res.json(challenges);
});

// Accept/decline challenge
router.put('/:id', authenticate, (req, res) => {
  const { action } = req.body;
  const db = getDb();

  const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

  if (challenge.opponent_id !== req.userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  if (action === 'accept') {
    db.prepare('UPDATE challenges SET status = ? WHERE id = ?').run('accepted', challenge.id);
    res.json({ message: 'Challenge accepted' });
  } else {
    db.prepare('UPDATE challenges SET status = ? WHERE id = ?').run('declined', challenge.id);
    res.json({ message: 'Challenge declined' });
  }
});

export default router;
