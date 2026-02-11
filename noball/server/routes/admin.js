import { Router } from 'express';
import { getDb } from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { gradeDualPredictions, updateGlobalRankings } from '../services/market.js';

const router = Router();

// Update dual status / scores
router.put('/duals/:id', authenticate, requireAdmin, (req, res) => {
  const { status, homeScore, awayScore } = req.body;
  const db = getDb();

  const dual = db.prepare('SELECT * FROM duals WHERE id = ?').get(req.params.id);
  if (!dual) return res.status(404).json({ error: 'Dual not found' });

  if (status) {
    db.prepare('UPDATE duals SET status = ?, home_score = ?, away_score = ? WHERE id = ?')
      .run(status, homeScore ?? dual.home_score, awayScore ?? dual.away_score, dual.id);
  }

  // If marking as completed, grade predictions
  if (status === 'completed') {
    gradeDualPredictions(dual.id);
  }

  res.json({ message: 'Dual updated' });
});

// Update bout result
router.put('/bouts/:id', authenticate, requireAdmin, (req, res) => {
  const { winner, outcomeType, homePoints, awayPoints, teamPointsAwarded, status } = req.body;
  const db = getDb();

  db.prepare(`
    UPDATE bouts SET
      winner = COALESCE(?, winner),
      outcome_type = COALESCE(?, outcome_type),
      home_points = COALESCE(?, home_points),
      away_points = COALESCE(?, away_points),
      team_points_awarded = COALESCE(?, team_points_awarded),
      status = COALESCE(?, status)
    WHERE id = ?
  `).run(winner, outcomeType, homePoints, awayPoints, teamPointsAwarded, status, req.params.id);

  res.json({ message: 'Bout updated' });
});

// Toggle prediction visibility globally
router.put('/settings/prediction-visibility', authenticate, requireAdmin, (req, res) => {
  const { visible } = req.body;
  const db = getDb();
  // This is a global toggle - in production you'd use a settings table
  res.json({ message: `Prediction visibility ${visible ? 'enabled' : 'disabled'}` });
});

// Force re-grade a dual
router.post('/grade/:dualId', authenticate, requireAdmin, (req, res) => {
  const db = getDb();
  // Reset grading
  db.prepare('UPDATE predictions SET is_graded = 0 WHERE dual_id = ?').run(req.params.dualId);
  gradeDualPredictions(parseInt(req.params.dualId));
  res.json({ message: 'Predictions re-graded' });
});

// Force recalculate rankings
router.post('/rankings/recalculate', authenticate, requireAdmin, (req, res) => {
  updateGlobalRankings();
  res.json({ message: 'Rankings recalculated' });
});

export default router;
