import { Router } from 'express';
import { getDb } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { updateMarketConsensus } from '../services/market.js';

const router = Router();

// Submit a prediction
router.post('/', authenticate, (req, res) => {
  const { dualId, mode, teamPick, confidence, boutPredictions } = req.body;

  if (!dualId || !mode) {
    return res.status(400).json({ error: 'dualId and mode are required' });
  }

  const db = getDb();

  // Verify dual exists and is still open for predictions
  const dual = db.prepare('SELECT * FROM duals WHERE id = ?').get(dualId);
  if (!dual) return res.status(404).json({ error: 'Dual not found' });
  if (dual.status === 'completed') {
    return res.status(400).json({ error: 'This dual has already completed' });
  }

  // Check for existing prediction of same mode
  const existing = db.prepare(
    'SELECT id FROM predictions WHERE user_id = ? AND dual_id = ? AND mode = ?'
  ).get(req.userId, dualId, mode);

  if (existing) {
    // Update existing prediction
    db.prepare(`
      UPDATE predictions SET
        team_pick = ?, confidence = ?, bout_predictions = ?,
        submitted_at = datetime('now'), is_graded = 0
      WHERE id = ?
    `).run(
      teamPick || null,
      confidence || null,
      boutPredictions ? JSON.stringify(boutPredictions) : null,
      existing.id
    );
  } else {
    db.prepare(`
      INSERT INTO predictions (user_id, dual_id, mode, team_pick, confidence, bout_predictions)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.userId, dualId, mode,
      teamPick || null,
      confidence || null,
      boutPredictions ? JSON.stringify(boutPredictions) : null
    );
  }

  // Update market consensus
  updateMarketConsensus(dualId);

  const prediction = db.prepare(
    'SELECT * FROM predictions WHERE user_id = ? AND dual_id = ? AND mode = ?'
  ).get(req.userId, dualId, mode);

  res.json(prediction);
});

// Get user's predictions
router.get('/mine', authenticate, (req, res) => {
  const db = getDb();
  const { status, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT p.*,
      d.scheduled_at, d.status as dual_status,
      d.home_score, d.away_score,
      ht.name as home_team_name, ht.short_name as home_short,
      ht.primary_color as home_color,
      at.name as away_team_name, at.short_name as away_short,
      at.primary_color as away_color
    FROM predictions p
    JOIN duals d ON p.dual_id = d.id
    JOIN teams ht ON d.home_team_id = ht.id
    JOIN teams at ON d.away_team_id = at.id
    WHERE p.user_id = ?
  `;
  const params = [req.userId];

  if (status === 'pending') {
    query += ` AND d.status IN ('upcoming', 'live')`;
  } else if (status === 'graded') {
    query += ' AND p.is_graded = 1';
  }

  query += ' ORDER BY d.scheduled_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const predictions = db.prepare(query).all(...params);
  res.json(predictions);
});

// Get predictions for a dual (public, aggregated)
router.get('/dual/:dualId', (req, res) => {
  const db = getDb();

  const stats = db.prepare(`
    SELECT
      mode,
      COUNT(*) as count,
      SUM(CASE WHEN team_pick = 'home' THEN 1 ELSE 0 END) as home_picks,
      SUM(CASE WHEN team_pick = 'away' THEN 1 ELSE 0 END) as away_picks,
      AVG(confidence) as avg_confidence
    FROM predictions
    WHERE dual_id = ?
    GROUP BY mode
  `).all(req.params.dualId);

  const market = db.prepare('SELECT * FROM market_consensus WHERE dual_id = ?')
    .get(req.params.dualId);

  res.json({ stats, market });
});

// Get a user's prediction history stats
router.get('/stats/:userId', (req, res) => {
  const db = getDb();

  const user = db.prepare(`
    SELECT id, username, display_name, elo_rating, sharpness_score,
           calibration_score, accuracy_score, total_predictions,
           correct_predictions, global_rank, predictions_visible
    FROM users WHERE id = ?
  `).get(req.params.userId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  // Respect visibility setting
  if (!user.predictions_visible) {
    return res.json({
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        elo_rating: user.elo_rating,
        global_rank: user.global_rank,
      },
      history: [],
      message: 'This user has hidden their prediction history',
    });
  }

  const history = db.prepare(`
    SELECT p.mode, p.is_correct, p.score, p.brier_score, p.submitted_at,
      d.scheduled_at, ht.short_name as home_short, at.short_name as away_short
    FROM predictions p
    JOIN duals d ON p.dual_id = d.id
    JOIN teams ht ON d.home_team_id = ht.id
    JOIN teams at ON d.away_team_id = at.id
    WHERE p.user_id = ? AND p.is_graded = 1
    ORDER BY p.graded_at DESC
    LIMIT 100
  `).all(req.params.userId);

  res.json({ user, history });
});

export default router;
