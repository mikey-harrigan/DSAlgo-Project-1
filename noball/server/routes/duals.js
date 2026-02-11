import { Router } from 'express';
import { getDb } from '../db.js';
import { optionalAuth } from '../middleware/auth.js';
import { computeDualProbabilities, computeConditionalProbabilities, eloProbabilities } from '../services/simulation.js';

const router = Router();

// Browse duals with filters
router.get('/', optionalAuth, (req, res) => {
  const db = getDb();
  const {
    status = 'upcoming',
    team,
    conference,
    postseason,
    search,
    sort = 'scheduled_at',
    order = 'ASC',
    limit = 50,
    offset = 0,
  } = req.query;

  let query = `
    SELECT d.*,
      ht.name as home_team_name, ht.short_name as home_short,
      ht.primary_color as home_color, ht.secondary_color as home_secondary,
      ht.logo_url as home_logo, ht.mascot as home_mascot,
      ht.conference as home_conference,
      at.name as away_team_name, at.short_name as away_short,
      at.primary_color as away_color, at.secondary_color as away_secondary,
      at.logo_url as away_logo, at.mascot as away_mascot,
      at.conference as away_conference,
      mc.total_predictions as market_predictions,
      mc.weighted_home_win_pct as market_home_pct,
      mc.weighted_away_win_pct as market_away_pct
    FROM duals d
    JOIN teams ht ON d.home_team_id = ht.id
    JOIN teams at ON d.away_team_id = at.id
    LEFT JOIN market_consensus mc ON d.id = mc.dual_id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'all') {
    if (status === 'upcoming,live') {
      query += ` AND d.status IN ('upcoming', 'live')`;
    } else {
      query += ' AND d.status = ?';
      params.push(status);
    }
  }

  if (team) {
    query += ' AND (d.home_team_id = ? OR d.away_team_id = ?)';
    params.push(team, team);
  }

  if (conference) {
    query += ' AND (ht.conference = ? OR at.conference = ?)';
    params.push(conference, conference);
  }

  if (postseason === '1') {
    query += ' AND d.is_postseason = 1';
  } else if (postseason === '0') {
    query += ' AND d.is_postseason = 0';
  }

  if (search) {
    query += ' AND (ht.name LIKE ? OR at.name LIKE ? OR d.event_name LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  // If user has favorite team, mark those
  const favoriteTeamId = req.userId
    ? db.prepare('SELECT favorite_team_id FROM users WHERE id = ?').get(req.userId)?.favorite_team_id
    : null;

  const validSorts = ['scheduled_at', 'market_predictions'];
  const sortCol = validSorts.includes(sort) ? sort : 'scheduled_at';
  const sortOrder = order === 'DESC' ? 'DESC' : 'ASC';
  query += ` ORDER BY ${sortCol} ${sortOrder} LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const duals = db.prepare(query).all(...params);

  // Mark favorites
  const result = duals.map(d => ({
    ...d,
    is_favorite: favoriteTeamId
      ? d.home_team_id === favoriteTeamId || d.away_team_id === favoriteTeamId
      : false,
  }));

  res.json(result);
});

// Get dual detail with bouts and simulation
router.get('/:id', optionalAuth, (req, res) => {
  const db = getDb();
  const dual = db.prepare(`
    SELECT d.*,
      ht.name as home_team_name, ht.short_name as home_short,
      ht.primary_color as home_color, ht.secondary_color as home_secondary,
      ht.accent_color as home_accent, ht.logo_url as home_logo,
      ht.mascot as home_mascot, ht.conference as home_conference,
      at.name as away_team_name, at.short_name as away_short,
      at.primary_color as away_color, at.secondary_color as away_secondary,
      at.accent_color as away_accent, at.logo_url as away_logo,
      at.mascot as away_mascot, at.conference as away_conference
    FROM duals d
    JOIN teams ht ON d.home_team_id = ht.id
    JOIN teams at ON d.away_team_id = at.id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!dual) return res.status(404).json({ error: 'Dual not found' });

  // Get bouts with wrestler info
  const bouts = db.prepare(`
    SELECT b.*,
      hw.name as home_wrestler_name, hw.ranking as home_ranking,
      hw.elo_rating as home_elo, hw.wins as home_wins, hw.losses as home_losses,
      aw.name as away_wrestler_name, aw.ranking as away_ranking,
      aw.elo_rating as away_elo, aw.wins as away_wins, aw.losses as away_losses
    FROM bouts b
    LEFT JOIN wrestlers hw ON b.home_wrestler_id = hw.id
    LEFT JOIN wrestlers aw ON b.away_wrestler_id = aw.id
    WHERE b.dual_id = ?
    ORDER BY b.bout_order, b.weight_class
  `).all(dual.id);

  // Compute simulation probabilities
  const boutProbs = bouts.map(b => {
    if (b.base_probs) return JSON.parse(b.base_probs);
    // Fallback: compute from ELO
    return eloProbabilities(b.home_elo || 1500, b.away_elo || 1500);
  });

  const realized = bouts.map(b => {
    if (b.status !== 'completed' || !b.winner) return null;
    const typeMap = { fall: 0, tech_fall: 1, major: 2, decision: 3, forfeit: 0, default: 0, disqualification: 0 };
    const base = typeMap[b.outcome_type] ?? 3;
    return b.winner === 'away' ? base : 7 - base;
  });

  const simulation = computeDualProbabilities(boutProbs, realized);
  const conditionals = computeConditionalProbabilities(boutProbs);

  // Market consensus
  const market = db.prepare('SELECT * FROM market_consensus WHERE dual_id = ?').get(dual.id);

  // School flavor
  const homeTrash = db.prepare(`
    SELECT text FROM school_flavor
    WHERE (team_id = ? AND target_team_id = ?) OR (team_id = ? AND target_team_id IS NULL)
    ORDER BY RANDOM() LIMIT 5
  `).all(dual.home_team_id, dual.away_team_id, dual.home_team_id);

  const awayTrash = db.prepare(`
    SELECT text FROM school_flavor
    WHERE (team_id = ? AND target_team_id = ?) OR (team_id = ? AND target_team_id IS NULL)
    ORDER BY RANDOM() LIMIT 5
  `).all(dual.away_team_id, dual.home_team_id, dual.away_team_id);

  // User's existing predictions for this dual
  let userPredictions = null;
  if (req.userId) {
    userPredictions = db.prepare(
      'SELECT * FROM predictions WHERE user_id = ? AND dual_id = ?'
    ).all(req.userId, dual.id);
  }

  res.json({
    ...dual,
    bouts: bouts.map((b, i) => ({
      ...b,
      base_probs: boutProbs[i],
      conditional_home_win: conditionals[i],
    })),
    simulation,
    market,
    homeTrash: homeTrash.map(t => t.text),
    awayTrash: awayTrash.map(t => t.text),
    userPredictions,
  });
});

export default router;
