import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// Global leaderboard
router.get('/', (req, res) => {
  const db = getDb();
  const { sort = 'elo', limit = 50, offset = 0 } = req.query;

  const sortMap = {
    elo: 'elo_rating DESC',
    accuracy: 'accuracy_score DESC',
    calibration: 'calibration_score ASC',
    sharpness: 'sharpness_score DESC',
    rank: 'global_rank ASC',
    predictions: 'total_predictions DESC',
  };

  const orderBy = sortMap[sort] || sortMap.elo;

  const users = db.prepare(`
    SELECT id, username, display_name, avatar_url,
           elo_rating, sharpness_score, calibration_score, accuracy_score,
           total_predictions, correct_predictions, global_rank,
           favorite_team_id
    FROM users
    WHERE total_predictions >= 1
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(parseInt(limit), parseInt(offset));

  const total = db.prepare('SELECT COUNT(*) as count FROM users WHERE total_predictions >= 1').get();

  res.json({ users, total: total.count });
});

// User rank details
router.get('/:userId', (req, res) => {
  const db = getDb();

  const user = db.prepare(`
    SELECT id, username, display_name, avatar_url,
           elo_rating, sharpness_score, calibration_score, accuracy_score,
           total_predictions, correct_predictions, global_rank,
           favorite_team_id, created_at
    FROM users WHERE id = ?
  `).get(req.params.userId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  // ELO history (approximated from prediction scores)
  const recentScores = db.prepare(`
    SELECT p.score, p.brier_score, p.graded_at,
      d.scheduled_at, ht.short_name as home_short, at.short_name as away_short
    FROM predictions p
    JOIN duals d ON p.dual_id = d.id
    JOIN teams ht ON d.home_team_id = ht.id
    JOIN teams at ON d.away_team_id = at.id
    WHERE p.user_id = ? AND p.is_graded = 1
    ORDER BY p.graded_at DESC
    LIMIT 50
  `).all(user.id);

  // Percentile rank
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE total_predictions >= 3').get();
  const percentile = totalUsers.count > 0 && user.global_rank
    ? Math.round((1 - user.global_rank / totalUsers.count) * 100)
    : null;

  res.json({ ...user, recentScores, percentile, totalRanked: totalUsers.count });
});

export default router;
