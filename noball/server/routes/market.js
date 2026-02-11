import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// Get market overview (all duals with consensus data)
router.get('/', (req, res) => {
  const db = getDb();

  const markets = db.prepare(`
    SELECT mc.*,
      d.scheduled_at, d.status, d.home_score, d.away_score,
      d.is_postseason, d.event_name,
      ht.name as home_team_name, ht.short_name as home_short,
      ht.primary_color as home_color, ht.logo_url as home_logo,
      at.name as away_team_name, at.short_name as away_short,
      at.primary_color as away_color, at.logo_url as away_logo
    FROM market_consensus mc
    JOIN duals d ON mc.dual_id = d.id
    JOIN teams ht ON d.home_team_id = ht.id
    JOIN teams at ON d.away_team_id = at.id
    WHERE d.status IN ('upcoming', 'live')
    AND mc.total_predictions >= 1
    ORDER BY mc.total_predictions DESC
    LIMIT 50
  `).all();

  res.json(markets);
});

// Get market detail for a dual
router.get('/:dualId', (req, res) => {
  const db = getDb();

  const market = db.prepare('SELECT * FROM market_consensus WHERE dual_id = ?')
    .get(req.params.dualId);

  if (!market) return res.status(404).json({ error: 'No market data for this dual' });

  // Prediction mode breakdown
  const modeBreakdown = db.prepare(`
    SELECT mode, COUNT(*) as count,
      AVG(CASE WHEN team_pick = 'home' THEN 1.0 ELSE 0.0 END) as home_pct,
      AVG(confidence) as avg_confidence
    FROM predictions
    WHERE dual_id = ?
    GROUP BY mode
  `).all(req.params.dualId);

  // Sharps vs public split
  const sharpPicks = db.prepare(`
    SELECT
      SUM(CASE WHEN team_pick = 'home' THEN 1 ELSE 0 END) as sharp_home,
      SUM(CASE WHEN team_pick = 'away' THEN 1 ELSE 0 END) as sharp_away,
      COUNT(*) as sharp_total
    FROM predictions p
    JOIN users u ON p.user_id = u.id
    WHERE p.dual_id = ? AND u.elo_rating >= 1600 AND p.team_pick IS NOT NULL
  `).get(req.params.dualId);

  const publicPicks = db.prepare(`
    SELECT
      SUM(CASE WHEN team_pick = 'home' THEN 1 ELSE 0 END) as public_home,
      SUM(CASE WHEN team_pick = 'away' THEN 1 ELSE 0 END) as public_away,
      COUNT(*) as public_total
    FROM predictions p
    JOIN users u ON p.user_id = u.id
    WHERE p.dual_id = ? AND u.elo_rating < 1600 AND p.team_pick IS NOT NULL
  `).get(req.params.dualId);

  res.json({
    market,
    modeBreakdown,
    sharpPicks,
    publicPicks,
  });
});

export default router;
