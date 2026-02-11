import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// List all teams
router.get('/', (req, res) => {
  const db = getDb();
  const { conference, search } = req.query;

  let query = 'SELECT * FROM teams WHERE 1=1';
  const params = [];

  if (conference) {
    query += ' AND conference = ?';
    params.push(conference);
  }

  if (search) {
    query += ' AND (name LIKE ? OR short_name LIKE ? OR mascot LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY name';
  const teams = db.prepare(query).all(...params);
  res.json(teams);
});

// Get team by ID with roster
router.get('/:id', (req, res) => {
  const db = getDb();
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  const wrestlers = db.prepare(
    'SELECT * FROM wrestlers WHERE team_id = ? ORDER BY weight_class'
  ).all(team.id);

  const upcomingDuals = db.prepare(`
    SELECT d.*,
      ht.name as home_team_name, ht.short_name as home_short,
      ht.primary_color as home_color, ht.logo_url as home_logo,
      at.name as away_team_name, at.short_name as away_short,
      at.primary_color as away_color, at.logo_url as away_logo
    FROM duals d
    JOIN teams ht ON d.home_team_id = ht.id
    JOIN teams at ON d.away_team_id = at.id
    WHERE (d.home_team_id = ? OR d.away_team_id = ?)
    AND d.status IN ('upcoming', 'live')
    ORDER BY d.scheduled_at
    LIMIT 20
  `).all(team.id, team.id);

  const recentResults = db.prepare(`
    SELECT d.*,
      ht.name as home_team_name, ht.short_name as home_short,
      at.name as away_team_name, at.short_name as away_short
    FROM duals d
    JOIN teams ht ON d.home_team_id = ht.id
    JOIN teams at ON d.away_team_id = at.id
    WHERE (d.home_team_id = ? OR d.away_team_id = ?)
    AND d.status = 'completed'
    ORDER BY d.scheduled_at DESC
    LIMIT 20
  `).all(team.id, team.id);

  const flavor = db.prepare(
    'SELECT * FROM school_flavor WHERE team_id = ? OR target_team_id = ? ORDER BY RANDOM() LIMIT 10'
  ).all(team.id, team.id);

  res.json({ ...team, wrestlers, upcomingDuals, recentResults, flavor });
});

// List conferences
router.get('/meta/conferences', (req, res) => {
  const db = getDb();
  const conferences = db.prepare(
    'SELECT DISTINCT conference FROM teams WHERE conference IS NOT NULL ORDER BY conference'
  ).all();
  res.json(conferences.map(c => c.conference));
});

export default router;
