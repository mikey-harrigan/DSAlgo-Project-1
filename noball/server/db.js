import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'data', 'noball.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db) {
  db.exec(`
    -- NCAA DI Teams
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      mascot TEXT,
      conference TEXT,
      primary_color TEXT NOT NULL DEFAULT '#333333',
      secondary_color TEXT NOT NULL DEFAULT '#666666',
      accent_color TEXT DEFAULT '#FFFFFF',
      logo_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Wrestlers
    CREATE TABLE IF NOT EXISTS wrestlers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      team_id INTEGER NOT NULL REFERENCES teams(id),
      weight_class INTEGER NOT NULL,
      ranking INTEGER,
      elo_rating REAL DEFAULT 1500.0,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      falls INTEGER DEFAULT 0,
      tech_falls INTEGER DEFAULT 0,
      major_decisions INTEGER DEFAULT 0,
      season TEXT DEFAULT '2025-26',
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Dual meets
    CREATE TABLE IF NOT EXISTS duals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      home_team_id INTEGER NOT NULL REFERENCES teams(id),
      away_team_id INTEGER NOT NULL REFERENCES teams(id),
      event_name TEXT,
      venue TEXT,
      scheduled_at TEXT NOT NULL,
      status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'live', 'completed', 'cancelled')),
      season TEXT DEFAULT '2025-26',
      is_postseason INTEGER DEFAULT 0,
      is_conference INTEGER DEFAULT 0,
      home_score INTEGER,
      away_score INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Individual bouts within a dual
    CREATE TABLE IF NOT EXISTS bouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dual_id INTEGER NOT NULL REFERENCES duals(id),
      weight_class INTEGER NOT NULL,
      home_wrestler_id INTEGER REFERENCES wrestlers(id),
      away_wrestler_id INTEGER REFERENCES wrestlers(id),
      bout_order INTEGER,
      winner TEXT CHECK(winner IN ('home', 'away')),
      outcome_type TEXT CHECK(outcome_type IN ('decision', 'major', 'tech_fall', 'fall', 'forfeit', 'default', 'disqualification')),
      home_points INTEGER,
      away_points INTEGER,
      team_points_awarded INTEGER,
      status TEXT DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'live', 'completed')),
      -- Base probability estimates (from ELO/external ratings)
      base_probs TEXT, -- JSON: [away_fall%, away_tech%, away_major%, away_dec%, home_dec%, home_major%, home_tech%, home_fall%]
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      favorite_team_id INTEGER REFERENCES teams(id),
      elo_rating REAL DEFAULT 1500.0,
      sharpness_score REAL DEFAULT 0.0,
      calibration_score REAL DEFAULT 0.0,
      accuracy_score REAL DEFAULT 0.0,
      total_predictions INTEGER DEFAULT 0,
      correct_predictions INTEGER DEFAULT 0,
      brier_sum REAL DEFAULT 0.0,
      global_rank INTEGER,
      is_admin INTEGER DEFAULT 0,
      predictions_visible INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Friendships
    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      friend_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'blocked')),
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, friend_id)
    );

    -- Predictions (team-level pickem)
    CREATE TABLE IF NOT EXISTS predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      dual_id INTEGER NOT NULL REFERENCES duals(id),
      mode TEXT NOT NULL CHECK(mode IN ('team_pickem', 'individual_pickem', 'granular_pickem', 'probabilities', 'over_under')),
      -- Team pickem: which team wins
      team_pick TEXT CHECK(team_pick IN ('home', 'away')),
      -- Overall confidence (0-1)
      confidence REAL,
      -- Bout-level predictions stored as JSON
      bout_predictions TEXT, -- JSON array of bout-level picks
      -- Scoring
      score REAL,
      brier_score REAL,
      is_correct INTEGER,
      is_graded INTEGER DEFAULT 0,
      submitted_at TEXT DEFAULT (datetime('now')),
      graded_at TEXT,
      UNIQUE(user_id, dual_id, mode)
    );

    -- Head-to-head challenges
    CREATE TABLE IF NOT EXISTS challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_id INTEGER NOT NULL REFERENCES users(id),
      opponent_id INTEGER NOT NULL REFERENCES users(id),
      dual_id INTEGER NOT NULL REFERENCES duals(id),
      mode TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined', 'completed')),
      creator_score REAL,
      opponent_score REAL,
      winner_id INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Market consensus (aggregated predictions per dual)
    CREATE TABLE IF NOT EXISTS market_consensus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dual_id INTEGER NOT NULL REFERENCES duals(id),
      total_predictions INTEGER DEFAULT 0,
      home_win_pct REAL DEFAULT 0.5,
      away_win_pct REAL DEFAULT 0.5,
      weighted_home_win_pct REAL DEFAULT 0.5,
      weighted_away_win_pct REAL DEFAULT 0.5,
      -- Bout-level market probabilities (JSON)
      bout_market_probs TEXT,
      last_updated TEXT DEFAULT (datetime('now')),
      UNIQUE(dual_id)
    );

    -- School-specific trash talk / celebrations
    CREATE TABLE IF NOT EXISTS school_flavor (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL REFERENCES teams(id),
      type TEXT NOT NULL CHECK(type IN ('trash_talk', 'celebration', 'chant', 'taunt')),
      text TEXT NOT NULL,
      target_team_id INTEGER REFERENCES teams(id),
      rating INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_duals_status ON duals(status);
    CREATE INDEX IF NOT EXISTS idx_duals_scheduled ON duals(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_duals_teams ON duals(home_team_id, away_team_id);
    CREATE INDEX IF NOT EXISTS idx_bouts_dual ON bouts(dual_id);
    CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
    CREATE INDEX IF NOT EXISTS idx_predictions_dual ON predictions(dual_id);
    CREATE INDEX IF NOT EXISTS idx_wrestlers_team ON wrestlers(team_id);
    CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_market_dual ON market_consensus(dual_id);
    CREATE INDEX IF NOT EXISTS idx_users_rank ON users(global_rank);
    CREATE INDEX IF NOT EXISTS idx_users_elo ON users(elo_rating DESC);
  `);
}

export default getDb;
