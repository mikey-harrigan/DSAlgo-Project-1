/**
 * Database Seed Script
 *
 * Populates noBall with:
 * - All 72 NCAA Division I wrestling teams (with colors, conferences)
 * - Top-ranked wrestlers at each weight class
 * - Upcoming 2025-26 season duals
 * - School-specific trash talk and celebrations
 *
 * Run with: npm run seed
 */

import bcrypt from 'bcryptjs';
import { getDb } from './db.js';
import { eloProbabilities } from './services/simulation.js';

function main() {
  const db = getDb();

  console.log('Seeding noBall database...\n');

  // Clear existing data
  db.exec(`
    DELETE FROM school_flavor;
    DELETE FROM market_consensus;
    DELETE FROM challenges;
    DELETE FROM predictions;
    DELETE FROM bouts;
    DELETE FROM duals;
    DELETE FROM wrestlers;
    DELETE FROM friendships;
    DELETE FROM teams;
  `);

  // 1. Seed Teams
  console.log('Seeding teams...');
  const insertTeam = db.prepare(`
    INSERT INTO teams (name, short_name, mascot, conference, primary_color, secondary_color, accent_color)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const teamIds = {};
  const seedTeams = db.transaction(() => {
    for (const team of TEAMS) {
      const result = insertTeam.run(
        team.name, team.short, team.mascot, team.conference,
        team.primary, team.secondary, team.accent || '#FFFFFF'
      );
      teamIds[team.short] = result.lastInsertRowid;
    }
  });
  seedTeams();
  console.log(`  Seeded ${Object.keys(teamIds).length} teams`);

  // 2. Seed Wrestlers
  console.log('Seeding wrestlers...');
  const insertWrestler = db.prepare(`
    INSERT INTO wrestlers (name, team_id, weight_class, ranking, elo_rating, wins, losses, season)
    VALUES (?, ?, ?, ?, ?, ?, ?, '2025-26')
  `);

  const wrestlerIds = {};
  const seedWrestlers = db.transaction(() => {
    for (const w of WRESTLERS) {
      const teamId = teamIds[w.team];
      if (!teamId) continue;
      const result = insertWrestler.run(
        w.name, teamId, w.weight, w.rank || null, w.elo || 1500,
        w.wins || 0, w.losses || 0
      );
      wrestlerIds[`${w.team}_${w.weight}`] = result.lastInsertRowid;
    }
  });
  seedWrestlers();
  console.log(`  Seeded ${Object.keys(wrestlerIds).length} wrestlers`);

  // 3. Seed Duals
  console.log('Seeding duals...');
  const insertDual = db.prepare(`
    INSERT INTO duals (home_team_id, away_team_id, event_name, venue, scheduled_at, status, season, is_postseason, is_conference)
    VALUES (?, ?, ?, ?, ?, ?, '2025-26', ?, ?)
  `);

  const insertBout = db.prepare(`
    INSERT INTO bouts (dual_id, weight_class, home_wrestler_id, away_wrestler_id, bout_order, base_probs, status)
    VALUES (?, ?, ?, ?, ?, ?, 'upcoming')
  `);

  const seedDuals = db.transaction(() => {
    for (const d of DUALS) {
      const homeId = teamIds[d.home];
      const awayId = teamIds[d.away];
      if (!homeId || !awayId) continue;

      const result = insertDual.run(
        homeId, awayId, d.event || null, d.venue || null,
        d.date, d.status || 'upcoming',
        d.postseason ? 1 : 0, d.conference ? 1 : 0
      );

      const dualId = result.lastInsertRowid;

      // Create bouts for each weight class
      const weights = [125, 133, 141, 149, 157, 165, 174, 184, 197, 285];
      for (let i = 0; i < weights.length; i++) {
        const wc = weights[i];
        const homeWrestlerId = wrestlerIds[`${d.home}_${wc}`] || null;
        const awayWrestlerId = wrestlerIds[`${d.away}_${wc}`] || null;

        // Compute base probabilities from ELO
        const homeElo = homeWrestlerId
          ? db.prepare('SELECT elo_rating FROM wrestlers WHERE id = ?').get(homeWrestlerId)?.elo_rating || 1500
          : 1500;
        const awayElo = awayWrestlerId
          ? db.prepare('SELECT elo_rating FROM wrestlers WHERE id = ?').get(awayWrestlerId)?.elo_rating || 1500
          : 1500;

        const probs = eloProbabilities(homeElo, awayElo);

        insertBout.run(
          dualId, wc, homeWrestlerId, awayWrestlerId,
          i + 1, JSON.stringify(probs)
        );
      }
    }
  });
  seedDuals();
  console.log(`  Seeded ${DUALS.length} duals with bouts`);

  // 4. Seed School Flavor
  console.log('Seeding school flavor...');
  const insertFlavor = db.prepare(`
    INSERT INTO school_flavor (team_id, type, text, target_team_id)
    VALUES (?, ?, ?, ?)
  `);

  const seedFlavor = db.transaction(() => {
    for (const f of SCHOOL_FLAVOR) {
      const teamId = teamIds[f.team];
      const targetId = f.target ? teamIds[f.target] : null;
      if (!teamId) continue;
      insertFlavor.run(teamId, f.type, f.text, targetId);
    }
  });
  seedFlavor();
  console.log(`  Seeded ${SCHOOL_FLAVOR.length} flavor entries`);

  // 5. Create admin user
  console.log('Creating admin user...');
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT OR IGNORE INTO users (username, email, password_hash, display_name, is_admin)
    VALUES ('admin', 'admin@noball.io', ?, 'Admin', 1)
  `).run(hash);

  console.log('\nSeed complete!');
}

// ============================================================
// NCAA Division I Wrestling Teams (2025-26 season)
// All 72+ programs with accurate colors and conferences
// ============================================================

const TEAMS = [
  // Big Ten
  { name: 'Penn State', short: 'PSU', mascot: 'Nittany Lions', conference: 'Big Ten', primary: '#041E42', secondary: '#FFFFFF' },
  { name: 'Iowa', short: 'IOWA', mascot: 'Hawkeyes', conference: 'Big Ten', primary: '#FFCD00', secondary: '#000000' },
  { name: 'Michigan', short: 'MICH', mascot: 'Wolverines', conference: 'Big Ten', primary: '#00274C', secondary: '#FFCB05' },
  { name: 'Ohio State', short: 'OSU', mascot: 'Buckeyes', conference: 'Big Ten', primary: '#BB0000', secondary: '#666666' },
  { name: 'Minnesota', short: 'MINN', mascot: 'Golden Gophers', conference: 'Big Ten', primary: '#7A0019', secondary: '#FFCC33' },
  { name: 'Wisconsin', short: 'WISC', mascot: 'Badgers', conference: 'Big Ten', primary: '#C5050C', secondary: '#FFFFFF' },
  { name: 'Nebraska', short: 'NEB', mascot: 'Cornhuskers', conference: 'Big Ten', primary: '#E41C38', secondary: '#FFFFFF' },
  { name: 'Rutgers', short: 'RU', mascot: 'Scarlet Knights', conference: 'Big Ten', primary: '#CC0033', secondary: '#5F6A72' },
  { name: 'Illinois', short: 'ILL', mascot: 'Fighting Illini', conference: 'Big Ten', primary: '#E84A27', secondary: '#13294B' },
  { name: 'Northwestern', short: 'NW', mascot: 'Wildcats', conference: 'Big Ten', primary: '#4E2A84', secondary: '#FFFFFF' },
  { name: 'Purdue', short: 'PUR', mascot: 'Boilermakers', conference: 'Big Ten', primary: '#CEB888', secondary: '#000000' },
  { name: 'Maryland', short: 'UMD', mascot: 'Terrapins', conference: 'Big Ten', primary: '#E03A3E', secondary: '#FFD520' },
  { name: 'Indiana', short: 'IND', mascot: 'Hoosiers', conference: 'Big Ten', primary: '#990000', secondary: '#FFFFFF' },
  { name: 'Michigan State', short: 'MSU', mascot: 'Spartans', conference: 'Big Ten', primary: '#18453B', secondary: '#FFFFFF' },
  { name: 'Oregon State', short: 'ORST', mascot: 'Beavers', conference: 'Big Ten', primary: '#DC4405', secondary: '#000000' },

  // Big 12
  { name: 'Iowa State', short: 'ISU', mascot: 'Cyclones', conference: 'Big 12', primary: '#C8102E', secondary: '#F1BE48' },
  { name: 'Oklahoma State', short: 'OKST', mascot: 'Cowboys', conference: 'Big 12', primary: '#FF7300', secondary: '#000000' },
  { name: 'Missouri', short: 'MIZ', mascot: 'Tigers', conference: 'Big 12', primary: '#F1B82D', secondary: '#000000' },
  { name: 'Northern Iowa', short: 'UNI', mascot: 'Panthers', conference: 'Big 12', primary: '#4B116F', secondary: '#FFCC00' },
  { name: 'Oklahoma', short: 'OU', mascot: 'Sooners', conference: 'Big 12', primary: '#841617', secondary: '#FFFFFF' },
  { name: 'West Virginia', short: 'WVU', mascot: 'Mountaineers', conference: 'Big 12', primary: '#002855', secondary: '#EAAA00' },
  { name: 'South Dakota State', short: 'SDSU', mascot: 'Jackrabbits', conference: 'Big 12', primary: '#0033A0', secondary: '#FFD100' },
  { name: 'North Dakota State', short: 'NDSU', mascot: 'Bison', conference: 'Big 12', primary: '#006633', secondary: '#FFD700' },
  { name: 'Air Force', short: 'AFA', mascot: 'Falcons', conference: 'Big 12', primary: '#003087', secondary: '#8F8F8C' },
  { name: 'Wyoming', short: 'WYO', mascot: 'Cowboys', conference: 'Big 12', primary: '#492F24', secondary: '#FFC425' },
  { name: 'Utah Valley', short: 'UVU', mascot: 'Wolverines', conference: 'Big 12', primary: '#275D38', secondary: '#FFFFFF' },
  { name: 'Northern Colorado', short: 'UNC', mascot: 'Bears', conference: 'Big 12', primary: '#003B71', secondary: '#FFB81C' },

  // ACC
  { name: 'Virginia Tech', short: 'VT', mascot: 'Hokies', conference: 'ACC', primary: '#861F41', secondary: '#E5751F', accent: '#FFB81C' },
  { name: 'NC State', short: 'NCSU', mascot: 'Wolfpack', conference: 'ACC', primary: '#CC0000', secondary: '#FFFFFF' },
  { name: 'North Carolina', short: 'UNC-CH', mascot: 'Tar Heels', conference: 'ACC', primary: '#7BAFD4', secondary: '#13294B' },
  { name: 'Duke', short: 'DUKE', mascot: 'Blue Devils', conference: 'ACC', primary: '#003087', secondary: '#FFFFFF' },
  { name: 'Pittsburgh', short: 'PITT', mascot: 'Panthers', conference: 'ACC', primary: '#003594', secondary: '#FFB81C' },
  { name: 'Virginia', short: 'UVA', mascot: 'Cavaliers', conference: 'ACC', primary: '#232D4B', secondary: '#F84C1E' },

  // EIWA
  { name: 'Cornell', short: 'COR', mascot: 'Big Red', conference: 'EIWA', primary: '#B31B1B', secondary: '#FFFFFF' },
  { name: 'Lehigh', short: 'LEH', mascot: 'Mountain Hawks', conference: 'EIWA', primary: '#653819', secondary: '#FFFFFF' },
  { name: 'Princeton', short: 'PRIN', mascot: 'Tigers', conference: 'EIWA', primary: '#FF8F00', secondary: '#000000' },
  { name: 'Navy', short: 'NAVY', mascot: 'Midshipmen', conference: 'EIWA', primary: '#00205B', secondary: '#C5B783' },
  { name: 'Army', short: 'ARMY', mascot: 'Black Knights', conference: 'EIWA', primary: '#000000', secondary: '#D3BC8D' },
  { name: 'Columbia', short: 'CU', mascot: 'Lions', conference: 'EIWA', primary: '#B9D9EB', secondary: '#002B7F' },
  { name: 'Penn', short: 'PENN', mascot: 'Quakers', conference: 'EIWA', primary: '#990000', secondary: '#011F5B' },
  { name: 'Drexel', short: 'DREX', mascot: 'Dragons', conference: 'EIWA', primary: '#07294D', secondary: '#FFC600' },
  { name: 'Bucknell', short: 'BUCK', mascot: 'Bison', conference: 'EIWA', primary: '#E87722', secondary: '#003865' },
  { name: 'Brown', short: 'BRWN', mascot: 'Bears', conference: 'EIWA', primary: '#4E3629', secondary: '#C00404' },
  { name: 'American', short: 'AU', mascot: 'Eagles', conference: 'EIWA', primary: '#ED1B2D', secondary: '#00205C' },
  { name: 'Hofstra', short: 'HOF', mascot: 'Pride', conference: 'EIWA', primary: '#004B8D', secondary: '#FFD200' },
  { name: 'Sacred Heart', short: 'SHU', mascot: 'Pioneers', conference: 'EIWA', primary: '#CE1141', secondary: '#808080' },
  { name: 'Long Island', short: 'LIU', mascot: 'Sharks', conference: 'EIWA', primary: '#005740', secondary: '#FFD200' },

  // MAC
  { name: 'Central Michigan', short: 'CMU', mascot: 'Chippewas', conference: 'MAC', primary: '#6A0032', secondary: '#FFC82E' },
  { name: 'Ohio', short: 'OHIO', mascot: 'Bobcats', conference: 'MAC', primary: '#00694E', secondary: '#CFC493' },
  { name: 'Kent State', short: 'KENT', mascot: 'Golden Flashes', conference: 'MAC', primary: '#002664', secondary: '#EAAB00' },
  { name: 'Northern Illinois', short: 'NIU', mascot: 'Huskies', conference: 'MAC', primary: '#BA0C2F', secondary: '#000000' },
  { name: 'Buffalo', short: 'BUFF', mascot: 'Bulls', conference: 'MAC', primary: '#005BBB', secondary: '#FFFFFF' },
  { name: 'Eastern Michigan', short: 'EMU', mascot: 'Eagles', conference: 'MAC', primary: '#006747', secondary: '#FFFFFF' },
  { name: 'Bowling Green', short: 'BGSU', mascot: 'Falcons', conference: 'MAC', primary: '#FF7300', secondary: '#4F2C1D' },
  { name: 'Lock Haven', short: 'LHU', mascot: 'Bald Eagles', conference: 'MAC', primary: '#8B0000', secondary: '#FFFFFF' },
  { name: 'Clarion', short: 'CLAR', mascot: 'Golden Eagles', conference: 'MAC', primary: '#003366', secondary: '#CC9933' },
  { name: 'Bloomsburg', short: 'BLOOM', mascot: 'Huskies', conference: 'MAC', primary: '#7B2D26', secondary: '#C6930A' },
  { name: 'Rider', short: 'RIDR', mascot: 'Broncs', conference: 'MAC', primary: '#9E1B32', secondary: '#5F6A72' },

  // SoCon
  { name: 'Appalachian State', short: 'APP', mascot: 'Mountaineers', conference: 'SoCon', primary: '#000000', secondary: '#FFCC00' },
  { name: 'Campbell', short: 'CAMP', mascot: 'Fighting Camels', conference: 'SoCon', primary: '#F47920', secondary: '#000000' },
  { name: 'Chattanooga', short: 'UTC', mascot: 'Mocs', conference: 'SoCon', primary: '#00386B', secondary: '#E0AA0F' },
  { name: 'The Citadel', short: 'CIT', mascot: 'Bulldogs', conference: 'SoCon', primary: '#00529B', secondary: '#FFFFFF' },
  { name: 'VMI', short: 'VMI', mascot: 'Keydets', conference: 'SoCon', primary: '#C41E3A', secondary: '#FFD500' },
  { name: 'Gardner-Webb', short: 'GWU', mascot: 'Runnin Bulldogs', conference: 'SoCon', primary: '#BF0D3E', secondary: '#000000' },
  { name: 'Presbyterian', short: 'PC', mascot: 'Blue Hose', conference: 'SoCon', primary: '#00205B', secondary: '#CF202E' },

  // EWL / PAC-12 / Independent
  { name: 'Arizona State', short: 'ASU', mascot: 'Sun Devils', conference: 'Big 12', primary: '#8C1D40', secondary: '#FFC627' },
  { name: 'Stanford', short: 'STAN', mascot: 'Cardinal', conference: 'PAC-12', primary: '#8C1515', secondary: '#FFFFFF' },
  { name: 'Cal Baptist', short: 'CBU', mascot: 'Lancers', conference: 'WAC', primary: '#002E5A', secondary: '#BF1E2E' },
  { name: 'Little Rock', short: 'LR', mascot: 'Trojans', conference: 'PAC-12', primary: '#8B0000', secondary: '#999999' },
  { name: 'CSU Bakersfield', short: 'CSUB', mascot: 'Roadrunners', conference: 'PAC-12', primary: '#003DA5', secondary: '#CF0A2C' },
  { name: 'Fresno State', short: 'FRES', mascot: 'Bulldogs', conference: 'PAC-12', primary: '#DB0032', secondary: '#13294B' },
  { name: 'Cal Poly', short: 'CP', mascot: 'Mustangs', conference: 'PAC-12', primary: '#154734', secondary: '#BD8B13' },
  { name: 'Binghamton', short: 'BING', mascot: 'Bearcats', conference: 'EIWA', primary: '#005C29', secondary: '#FFFFFF' },
];

// ============================================================
// Wrestlers — Top ranked at each weight class (2025-26)
// Based on known rankings from the season
// ============================================================

const WRESTLERS = [
  // 125 lbs
  { name: 'Spencer Lee', team: 'PSU', weight: 125, rank: 1, elo: 1850, wins: 18, losses: 0 },
  { name: 'Drake Ayala', team: 'IOWA', weight: 125, rank: 2, elo: 1780, wins: 15, losses: 2 },
  { name: 'Liam Cronin', team: 'VT', weight: 125, rank: 3, elo: 1760, wins: 14, losses: 1 },
  { name: 'Eric Barnett', team: 'WISC', weight: 125, rank: 4, elo: 1720, wins: 16, losses: 3 },
  { name: 'Ryan Miller', team: 'PENN', weight: 125, rank: 5, elo: 1710, wins: 12, losses: 3 },
  { name: 'Pat Robinson', team: 'NCSU', weight: 125, rank: 6, elo: 1690, wins: 14, losses: 4 },
  { name: 'Brandon Kaylor', team: 'ORST', weight: 125, rank: 7, elo: 1680, wins: 13, losses: 3 },
  { name: 'Braeden Davis', team: 'MICH', weight: 125, rank: 8, elo: 1670, wins: 11, losses: 4 },
  { name: 'Michael DeAugustino', team: 'NW', weight: 125, rank: 10, elo: 1640, wins: 10, losses: 5 },
  { name: 'Anthony Noto', team: 'COR', weight: 125, rank: 12, elo: 1620, wins: 13, losses: 5 },
  { name: 'Killian Cardinale', team: 'WVU', weight: 125, rank: 15, elo: 1590, wins: 9, losses: 5 },

  // 133 lbs
  { name: 'Jesse Mendez', team: 'OSU', weight: 133, rank: 1, elo: 1840, wins: 17, losses: 0 },
  { name: 'RJ Richter', team: 'ILL', weight: 133, rank: 2, elo: 1780, wins: 16, losses: 2 },
  { name: 'Aaron Nagao', team: 'MINN', weight: 133, rank: 3, elo: 1760, wins: 15, losses: 2 },
  { name: 'Michael McGee', team: 'ASU', weight: 133, rank: 4, elo: 1740, wins: 14, losses: 3 },
  { name: 'Dylan Shawver', team: 'RU', weight: 133, rank: 5, elo: 1720, wins: 13, losses: 3 },
  { name: 'Sam Seidel', team: 'VT', weight: 133, rank: 6, elo: 1700, wins: 13, losses: 4 },
  { name: 'Kai Orine', team: 'NCSU', weight: 133, rank: 14, elo: 1600, wins: 10, losses: 6 },
  { name: 'Lucas Byrd', team: 'ILL', weight: 133, rank: 7, elo: 1690, wins: 12, losses: 4 },
  { name: 'Chance Rich', team: 'ISU', weight: 133, rank: 8, elo: 1680, wins: 14, losses: 4 },

  // 141 lbs
  { name: 'Andrew Alirez', team: 'IOWA', weight: 141, rank: 1, elo: 1830, wins: 16, losses: 0 },
  { name: 'Cole Matthews', team: 'PITT', weight: 141, rank: 2, elo: 1790, wins: 15, losses: 1 },
  { name: 'Beau Bartlett', team: 'PSU', weight: 141, rank: 3, elo: 1770, wins: 14, losses: 2 },
  { name: 'Clay Lautt', team: 'UNC-CH', weight: 141, rank: 4, elo: 1740, wins: 13, losses: 3 },
  { name: 'Crook', team: 'VT', weight: 141, rank: 10, elo: 1650, wins: 10, losses: 5 },
  { name: 'Ed Scott', team: 'NCSU', weight: 141, rank: 7, elo: 1700, wins: 11, losses: 4 },
  { name: 'Allan Hart', team: 'MIZ', weight: 141, rank: 5, elo: 1730, wins: 14, losses: 3 },
  { name: 'Dylan D\'Emilio', team: 'OSU', weight: 141, rank: 6, elo: 1710, wins: 12, losses: 4 },

  // 149 lbs
  { name: 'Yianni Diakomihalis', team: 'COR', weight: 149, rank: 1, elo: 1860, wins: 18, losses: 0 },
  { name: 'Ridge Lovett', team: 'NEB', weight: 149, rank: 2, elo: 1790, wins: 16, losses: 1 },
  { name: 'Kyle Parco', team: 'ASU', weight: 149, rank: 3, elo: 1770, wins: 15, losses: 2 },
  { name: 'Caleb Henson', team: 'VT', weight: 149, rank: 4, elo: 1760, wins: 14, losses: 2 },
  { name: 'Paniro Johnson', team: 'ISU', weight: 149, rank: 5, elo: 1740, wins: 13, losses: 3 },
  { name: 'Shayne Van Ness', team: 'PSU', weight: 149, rank: 6, elo: 1720, wins: 12, losses: 3 },
  { name: 'Ryan Jauch', team: 'NCSU', weight: 149, rank: 12, elo: 1630, wins: 9, losses: 6 },

  // 157 lbs
  { name: 'Levi Haines', team: 'PSU', weight: 157, rank: 1, elo: 1850, wins: 17, losses: 0 },
  { name: 'Peyton Robb', team: 'NEB', weight: 157, rank: 2, elo: 1790, wins: 15, losses: 2 },
  { name: 'Will Lewan', team: 'MICH', weight: 157, rank: 3, elo: 1770, wins: 14, losses: 2 },
  { name: 'Jared Franek', team: 'NDSU', weight: 157, rank: 4, elo: 1740, wins: 13, losses: 3 },
  { name: 'Jason Miranda', team: 'NCSU', weight: 157, rank: 8, elo: 1680, wins: 11, losses: 5 },
  { name: 'Bryce Andonian', team: 'VT', weight: 157, rank: 6, elo: 1710, wins: 12, losses: 4 },
  { name: 'Kendall Coleman', team: 'PUR', weight: 157, rank: 5, elo: 1720, wins: 14, losses: 3 },

  // 165 lbs
  { name: 'Mitchell Mesenbrink', team: 'OSU', weight: 165, rank: 1, elo: 1840, wins: 17, losses: 0 },
  { name: 'Keegan O\'Toole', team: 'MIZ', weight: 165, rank: 2, elo: 1800, wins: 16, losses: 1 },
  { name: 'Dean Hamiti', team: 'WISC', weight: 165, rank: 3, elo: 1770, wins: 14, losses: 2 },
  { name: 'Patrick Kennedy', team: 'Iowa', weight: 165, rank: 4, elo: 1750, wins: 13, losses: 3 },
  { name: 'Julian Ramirez', team: 'COR', weight: 165, rank: 5, elo: 1730, wins: 13, losses: 3 },
  { name: 'Connor Brady', team: 'VT', weight: 165, rank: 10, elo: 1660, wins: 10, losses: 5 },
  { name: 'Ryan Kee', team: 'NCSU', weight: 165, rank: 11, elo: 1650, wins: 9, losses: 5 },

  // 174 lbs
  { name: 'Carter Starocci', team: 'PSU', weight: 174, rank: 1, elo: 1870, wins: 18, losses: 0 },
  { name: 'Edmond Ruth', team: 'ILL', weight: 174, rank: 2, elo: 1800, wins: 16, losses: 1 },
  { name: 'Dustin Plott', team: 'OKST', weight: 174, rank: 3, elo: 1780, wins: 15, losses: 2 },
  { name: 'Donnell Washington', team: 'IOWA', weight: 174, rank: 4, elo: 1750, wins: 14, losses: 3 },
  { name: 'DJ Washington', team: 'VT', weight: 174, rank: 12, elo: 1620, wins: 9, losses: 6 },
  { name: 'Ed Singleton', team: 'NCSU', weight: 174, rank: 5, elo: 1740, wins: 14, losses: 3 },

  // 184 lbs
  { name: 'Aaron Brooks', team: 'PSU', weight: 184, rank: 1, elo: 1880, wins: 18, losses: 0 },
  { name: 'Parker Keckeisen', team: 'UNI', weight: 184, rank: 2, elo: 1810, wins: 16, losses: 1 },
  { name: 'Kaleb Romero', team: 'OSU', weight: 184, rank: 3, elo: 1770, wins: 14, losses: 3 },
  { name: 'Isaiah Salazar', team: 'MINN', weight: 184, rank: 4, elo: 1740, wins: 13, losses: 3 },
  { name: 'Hunter Bolen', team: 'VT', weight: 184, rank: 8, elo: 1680, wins: 11, losses: 5 },
  { name: 'Trent Hidlay', team: 'NCSU', weight: 184, rank: 5, elo: 1730, wins: 14, losses: 3 },

  // 197 lbs
  { name: 'Bernie Truax', team: 'ISU', weight: 197, rank: 1, elo: 1830, wins: 17, losses: 0 },
  { name: 'Silas Allred', team: 'NEB', weight: 197, rank: 2, elo: 1790, wins: 15, losses: 2 },
  { name: 'Rocky Elam', team: 'MIZ', weight: 197, rank: 3, elo: 1770, wins: 14, losses: 2 },
  { name: 'Isaac Trumble', team: 'NCSU', weight: 197, rank: 4, elo: 1750, wins: 15, losses: 3 },
  { name: 'Jacob Cardenas', team: 'COR', weight: 197, rank: 5, elo: 1730, wins: 13, losses: 3 },
  { name: 'Andy Smith', team: 'VT', weight: 197, rank: 9, elo: 1670, wins: 10, losses: 5 },

  // 285 lbs (Heavyweight)
  { name: 'Greg Kerkvliet', team: 'PSU', weight: 285, rank: 1, elo: 1830, wins: 16, losses: 0 },
  { name: 'Mason Parris', team: 'MICH', weight: 285, rank: 2, elo: 1800, wins: 15, losses: 1 },
  { name: 'Wyatt Hendrickson', team: 'AFA', weight: 285, rank: 3, elo: 1770, wins: 14, losses: 2 },
  { name: 'Owen Trephan', team: 'NCSU', weight: 285, rank: 6, elo: 1710, wins: 12, losses: 4 },
  { name: 'Hunter Catka', team: 'VT', weight: 285, rank: 8, elo: 1680, wins: 11, losses: 5 },
  { name: 'Tony Cassioppi', team: 'IOWA', weight: 285, rank: 4, elo: 1750, wins: 14, losses: 3 },
  { name: 'Lucas Davison', team: 'NW', weight: 285, rank: 5, elo: 1730, wins: 13, losses: 3 },
  { name: 'Yaraslau Slavikouski', team: 'OSU', weight: 285, rank: 7, elo: 1690, wins: 11, losses: 4 },

  // Fill out key teams with starters at every weight
  // Penn State remaining
  { name: 'Robert Howard', team: 'PSU', weight: 133, rank: 8, elo: 1680, wins: 13, losses: 3 },
  { name: 'Mitchell Ragusin', team: 'PSU', weight: 165, rank: 8, elo: 1680, wins: 12, losses: 3 },
  { name: 'Mason Manville', team: 'PSU', weight: 197, rank: 7, elo: 1700, wins: 12, losses: 3 },
  // Iowa remaining
  { name: 'Aiden Riggins', team: 'IOWA', weight: 133, rank: 10, elo: 1650, wins: 11, losses: 4 },
  { name: 'Cael Happel', team: 'IOWA', weight: 149, rank: 8, elo: 1690, wins: 12, losses: 4 },
  { name: 'Gabe Arnold', team: 'IOWA', weight: 157, rank: 10, elo: 1650, wins: 10, losses: 5 },
  { name: 'Nelson Brands', team: 'IOWA', weight: 184, rank: 7, elo: 1700, wins: 12, losses: 4 },
  { name: 'Zach Glazier', team: 'IOWA', weight: 197, rank: 6, elo: 1720, wins: 13, losses: 4 },
  // Ohio State remaining
  { name: 'Nic Bouzakis', team: 'OSU', weight: 125, rank: 9, elo: 1660, wins: 11, losses: 4 },
  { name: 'Paddy Gallagher', team: 'OSU', weight: 149, rank: 9, elo: 1670, wins: 11, losses: 4 },
  { name: 'Rocco Welsh', team: 'OSU', weight: 157, rank: 7, elo: 1700, wins: 12, losses: 4 },
  { name: 'Ethan Smith', team: 'OSU', weight: 174, rank: 8, elo: 1680, wins: 11, losses: 4 },
  { name: 'Gavin Hoffman', team: 'OSU', weight: 197, rank: 10, elo: 1640, wins: 10, losses: 5 },
];

// ============================================================
// Upcoming Duals — 2025-26 Season (Feb-March 2026)
// Including regular season, conference championships, and NCAAs
// ============================================================

const DUALS = [
  // Week of Feb 11-16 (this week)
  { home: 'PSU', away: 'IOWA', date: '2026-02-13T19:00:00', venue: 'Rec Hall', event: 'Big Ten Dual', conference: true },
  { home: 'OSU', away: 'MICH', date: '2026-02-14T19:00:00', venue: 'Value City Arena', event: 'Big Ten Dual', conference: true },
  { home: 'VT', away: 'NCSU', date: '2026-02-14T19:00:00', venue: 'Cassell Coliseum', event: 'ACC Dual', conference: true },
  { home: 'OKST', away: 'ISU', date: '2026-02-14T19:00:00', venue: 'Gallagher-Iba Arena', event: 'Big 12 Dual', conference: true },
  { home: 'NEB', away: 'MINN', date: '2026-02-14T19:00:00', venue: 'Devaney Center', event: 'Big Ten Dual', conference: true },
  { home: 'COR', away: 'LEH', date: '2026-02-15T14:00:00', venue: 'Newman Arena', event: 'EIWA Dual', conference: true },
  { home: 'PITT', away: 'UNC-CH', date: '2026-02-15T14:00:00', venue: 'Fitzgerald Field House', event: 'ACC Dual', conference: true },
  { home: 'MIZ', away: 'OU', date: '2026-02-15T14:00:00', venue: 'Hearnes Center', event: 'Big 12 Dual', conference: true },
  { home: 'WISC', away: 'ILL', date: '2026-02-15T14:00:00', venue: 'UW Field House', event: 'Big Ten Dual', conference: true },
  { home: 'RU', away: 'NW', date: '2026-02-16T13:00:00', venue: 'Jersey Mike\'s Arena', event: 'Big Ten Dual', conference: true },

  // Week of Feb 17-23
  { home: 'IOWA', away: 'OSU', date: '2026-02-20T20:00:00', venue: 'Carver-Hawkeye Arena', event: 'Big Ten Dual', conference: true },
  { home: 'PSU', away: 'MICH', date: '2026-02-21T19:00:00', venue: 'Rec Hall', event: 'Big Ten Dual', conference: true },
  { home: 'NCSU', away: 'UNC-CH', date: '2026-02-20T19:00:00', venue: 'Reynolds Coliseum', event: 'ACC Dual', conference: true },
  { home: 'VT', away: 'PITT', date: '2026-02-21T19:00:00', venue: 'Cassell Coliseum', event: 'ACC Dual', conference: true },
  { home: 'ISU', away: 'ASU', date: '2026-02-21T19:00:00', venue: 'Hilton Coliseum', event: 'Big 12 Dual', conference: true },
  { home: 'NEB', away: 'WISC', date: '2026-02-22T14:00:00', venue: 'Devaney Center', event: 'Big Ten Dual', conference: true },
  { home: 'COR', away: 'PRIN', date: '2026-02-22T14:00:00', venue: 'Newman Arena', event: 'EIWA Dual', conference: true },
  { home: 'MIZ', away: 'OKST', date: '2026-02-22T14:00:00', venue: 'Hearnes Center', event: 'Big 12 Dual', conference: true },

  // Week of Feb 24 - Mar 1 (Conference Championship Week)
  { home: 'PSU', away: 'RU', date: '2026-02-27T19:00:00', venue: 'Rec Hall', event: 'Big Ten Dual', conference: true },
  { home: 'IOWA', away: 'MINN', date: '2026-02-27T20:00:00', venue: 'Carver-Hawkeye Arena', event: 'Big Ten Dual', conference: true },
  { home: 'NCSU', away: 'VT', date: '2026-02-28T19:00:00', venue: 'Reynolds Coliseum', event: 'ACC Dual', conference: true },
  { home: 'MICH', away: 'NW', date: '2026-02-28T19:00:00', venue: 'Cliff Keen Arena', event: 'Big Ten Dual', conference: true },
  { home: 'OKST', away: 'WVU', date: '2026-02-28T14:00:00', venue: 'Gallagher-Iba Arena', event: 'Big 12 Dual', conference: true },

  // Conference Championships (first week of March)
  { home: 'PSU', away: 'IOWA', date: '2026-03-07T10:00:00', venue: 'TBD', event: 'Big Ten Championships', conference: true, postseason: true },
  { home: 'VT', away: 'NCSU', date: '2026-03-07T10:00:00', venue: 'TBD', event: 'ACC Championships', conference: true, postseason: true },
  { home: 'OKST', away: 'ISU', date: '2026-03-07T10:00:00', venue: 'TBD', event: 'Big 12 Championships', conference: true, postseason: true },
  { home: 'COR', away: 'LEH', date: '2026-03-07T10:00:00', venue: 'TBD', event: 'EIWA Championships', conference: true, postseason: true },

  // NCAA Championships (March 19-21, Cleveland)
  { home: 'PSU', away: 'IOWA', date: '2026-03-19T12:00:00', venue: 'Rocket Arena, Cleveland', event: 'NCAA DI Championships', postseason: true },
  { home: 'OSU', away: 'OKST', date: '2026-03-19T12:00:00', venue: 'Rocket Arena, Cleveland', event: 'NCAA DI Championships', postseason: true },
  { home: 'MICH', away: 'ISU', date: '2026-03-19T12:00:00', venue: 'Rocket Arena, Cleveland', event: 'NCAA DI Championships', postseason: true },
  { home: 'VT', away: 'MIZ', date: '2026-03-19T12:00:00', venue: 'Rocket Arena, Cleveland', event: 'NCAA DI Championships', postseason: true },
  { home: 'NCSU', away: 'NEB', date: '2026-03-19T12:00:00', venue: 'Rocket Arena, Cleveland', event: 'NCAA DI Championships', postseason: true },
  { home: 'COR', away: 'MINN', date: '2026-03-19T12:00:00', venue: 'Rocket Arena, Cleveland', event: 'NCAA DI Championships', postseason: true },

  // Additional regular season matchups for breadth
  { home: 'ASU', away: 'ORST', date: '2026-02-13T20:00:00', venue: 'Desert Financial Arena', event: 'Big 12 Dual', conference: true },
  { home: 'DUKE', away: 'UVA', date: '2026-02-14T14:00:00', venue: 'Cameron Indoor', event: 'ACC Dual', conference: true },
  { home: 'NAVY', away: 'ARMY', date: '2026-02-15T14:00:00', venue: 'Alumni Hall', event: 'Star Match', conference: true },
  { home: 'APP', away: 'CAMP', date: '2026-02-14T19:00:00', venue: 'Varsity Gymnasium', event: 'SoCon Dual', conference: true },
  { home: 'CMU', away: 'KENT', date: '2026-02-15T14:00:00', venue: 'McGuirk Arena', event: 'MAC Dual', conference: true },
  { home: 'WVU', away: 'UNI', date: '2026-02-16T14:00:00', venue: 'WVU Coliseum', event: 'Big 12 Dual', conference: true },
  { home: 'ILL', away: 'PUR', date: '2026-02-20T19:00:00', venue: 'Huff Hall', event: 'Big Ten Dual', conference: true },
  { home: 'UNC-CH', away: 'DUKE', date: '2026-02-21T14:00:00', venue: 'Carmichael Arena', event: 'ACC Dual', conference: true },
  { home: 'SDSU', away: 'NDSU', date: '2026-02-22T14:00:00', venue: 'Frost Arena', event: 'Big 12 Dual', conference: true },

  // Completed duals (for history/testing)
  { home: 'PSU', away: 'NEB', date: '2026-01-31T19:00:00', venue: 'Rec Hall', event: 'Big Ten Dual', status: 'completed', conference: true },
  { home: 'IOWA', away: 'WISC', date: '2026-02-01T20:00:00', venue: 'Carver-Hawkeye Arena', event: 'Big Ten Dual', status: 'completed', conference: true },
  { home: 'VT', away: 'UNC-CH', date: '2026-02-01T19:00:00', venue: 'Cassell Coliseum', event: 'ACC Dual', status: 'completed', conference: true },
  { home: 'NCSU', away: 'DUKE', date: '2026-01-31T19:00:00', venue: 'Reynolds Coliseum', event: 'ACC Dual', status: 'completed', conference: true },
  { home: 'OSU', away: 'ILL', date: '2026-02-07T19:00:00', venue: 'Value City Arena', event: 'Big Ten Dual', status: 'completed', conference: true },
];

// ============================================================
// School Flavor — trash talk, celebrations, chants, taunts
// School-specific rivalry content. Edgy but not crossing the line.
// ============================================================

const SCHOOL_FLAVOR = [
  // Virginia Tech
  { team: 'VT', type: 'celebration', text: 'Enter Sandman shakes the Coliseum. The mat is ours.' },
  { team: 'VT', type: 'chant', text: 'Let\'s go... Hokies!' },
  { team: 'VT', type: 'celebration', text: 'Gobble gobble. Another victim.' },
  { team: 'VT', type: 'trash_talk', text: 'Welcome to Blacksburg. Leave your confidence at the door.', target: null },
  { team: 'VT', type: 'trash_talk', text: 'Reynolds Coliseum? More like Reynolds Mausoleum.', target: 'NCSU' },
  { team: 'VT', type: 'trash_talk', text: 'NCSU: where the students are as dull as the campus', target: 'NCSU' },
  { team: 'VT', type: 'trash_talk', text: 'The Pack is about to get packed up and shipped home', target: 'NCSU' },
  { team: 'VT', type: 'trash_talk', text: 'Raleigh: where ambition goes to flatline', target: 'NCSU' },
  { team: 'VT', type: 'trash_talk', text: 'Their roster shares one brain cell and it\'s on life support', target: 'NCSU' },
  { team: 'VT', type: 'taunt', text: 'Wolfpack? More like a litter of puppies.', target: 'NCSU' },
  { team: 'VT', type: 'trash_talk', text: 'Pitt couldn\'t wrestle their way out of a paper bag', target: 'PITT' },
  { team: 'VT', type: 'trash_talk', text: 'Carolina Blue? More like Carolina Blew it again.', target: 'UNC-CH' },
  { team: 'VT', type: 'celebration', text: 'The Hokie Bird struts. Dominance confirmed.' },

  // NC State
  { team: 'NCSU', type: 'celebration', text: 'Wolfpack wrestling. Reynolds is rocking.' },
  { team: 'NCSU', type: 'chant', text: 'Wolf! Pack!' },
  { team: 'NCSU', type: 'trash_talk', text: 'Blacksburg is just Raleigh\'s minor league.', target: 'VT' },
  { team: 'NCSU', type: 'trash_talk', text: 'Hokies are just discount Wolfpack', target: 'VT' },
  { team: 'NCSU', type: 'trash_talk', text: 'VT: where turkeys are the most intelligent residents', target: 'VT' },
  { team: 'NCSU', type: 'taunt', text: 'Turkey season opened early this year.', target: 'VT' },
  { team: 'NCSU', type: 'celebration', text: 'Red and white all over the mat.' },
  { team: 'NCSU', type: 'trash_talk', text: 'UNC\'s wrestling program is as irrelevant as their football team', target: 'UNC-CH' },

  // Penn State
  { team: 'PSU', type: 'celebration', text: 'Rec Hall erupts. Happy Valley stays unbeaten.' },
  { team: 'PSU', type: 'chant', text: 'WE ARE... PENN STATE!' },
  { team: 'PSU', type: 'trash_talk', text: 'Nine national titles. You have how many?', target: null },
  { team: 'PSU', type: 'trash_talk', text: 'Iowa comes to Rec Hall and leaves with nothing. Every time.', target: 'IOWA' },
  { team: 'PSU', type: 'trash_talk', text: 'Buckeyes are just a warm-up for the real matches', target: 'OSU' },
  { team: 'PSU', type: 'taunt', text: 'The dynasty continues. Stay mad about it.' },
  { team: 'PSU', type: 'celebration', text: 'Another title. Another era of dominance.' },

  // Iowa
  { team: 'IOWA', type: 'celebration', text: 'Carver-Hawkeye shakes. The Hawkeyes feast.' },
  { team: 'IOWA', type: 'chant', text: 'Let\'s go Hawks!' },
  { team: 'IOWA', type: 'trash_talk', text: 'Penn State\'s dynasty has an expiration date.', target: 'PSU' },
  { team: 'IOWA', type: 'trash_talk', text: 'Iowa City is where wrestling was born. The rest of you are tourists.', target: null },
  { team: 'IOWA', type: 'trash_talk', text: 'Columbus couldn\'t produce a real wrestler if they tried', target: 'OSU' },
  { team: 'IOWA', type: 'taunt', text: '23 national titles. Read that number again.' },

  // Ohio State
  { team: 'OSU', type: 'celebration', text: 'O-H-I-O on the mat. Buckeyes dominate.' },
  { team: 'OSU', type: 'chant', text: 'O-H! I-O!' },
  { team: 'OSU', type: 'trash_talk', text: 'Michigan can\'t wrestle and can\'t win The Game', target: 'MICH' },
  { team: 'OSU', type: 'trash_talk', text: 'Penn State\'s run ends when they face real competition', target: 'PSU' },

  // Michigan
  { team: 'MICH', type: 'celebration', text: 'Go Blue. Cliff Keen Arena is deafening.' },
  { team: 'MICH', type: 'trash_talk', text: 'Ohio State talks big for a team that always chokes in March', target: 'OSU' },
  { team: 'MICH', type: 'chant', text: 'Go Blue!' },

  // Oklahoma State
  { team: 'OKST', type: 'celebration', text: 'Gallagher-Iba is hostile territory. Cowboys ride.' },
  { team: 'OKST', type: 'chant', text: 'Go Pokes!' },
  { team: 'OKST', type: 'trash_talk', text: '34 national titles. Most in history. Sit down.', target: null },
  { team: 'OKST', type: 'trash_talk', text: 'Cyclones are just a light breeze. Cowboys are the storm.', target: 'ISU' },

  // Iowa State
  { team: 'ISU', type: 'celebration', text: 'Hilton Coliseum is electric. Cyclone wrestling.' },
  { team: 'ISU', type: 'trash_talk', text: 'Oklahoma State lives off ancient history. We are the present.', target: 'OKST' },
  { team: 'ISU', type: 'chant', text: 'Cyclone Power!' },

  // Cornell
  { team: 'COR', type: 'celebration', text: 'Newman Arena. Where Ivy League meets cage match.' },
  { team: 'COR', type: 'trash_talk', text: 'We have more brains AND more pins than anyone in the EIWA', target: null },
  { team: 'COR', type: 'chant', text: 'Go Big Red!' },

  // Navy/Army rivalry
  { team: 'NAVY', type: 'trash_talk', text: 'Army\'s mat game is as outdated as their uniforms', target: 'ARMY' },
  { team: 'ARMY', type: 'trash_talk', text: 'Navy sinks on the mat every year', target: 'NAVY' },
  { team: 'NAVY', type: 'celebration', text: 'Anchors aweigh. Another win for the Mids.' },
  { team: 'ARMY', type: 'celebration', text: 'Beat Navy. On the mat and everywhere else.' },

  // Missouri
  { team: 'MIZ', type: 'celebration', text: 'M-I-Z! Z-O-U! Tigers on the mat.' },
  { team: 'MIZ', type: 'trash_talk', text: 'Oklahoma State talks dynasty but can\'t beat us anymore', target: 'OKST' },

  // Minnesota
  { team: 'MINN', type: 'celebration', text: 'Gopher wrestling. The Barn is loud.' },
  { team: 'MINN', type: 'trash_talk', text: 'Iowa thinks they own the Midwest. Cute.', target: 'IOWA' },

  // Nebraska
  { team: 'NEB', type: 'celebration', text: 'Devaney rocks. Big Red wrestling.' },
  { team: 'NEB', type: 'trash_talk', text: 'We don\'t rebuild, we reload.', target: null },

  // Pittsburgh
  { team: 'PITT', type: 'celebration', text: 'Hail to Pitt! Steel City wrestling.' },
  { team: 'PITT', type: 'trash_talk', text: 'VT\'s program is a cute little hobby compared to ours', target: 'VT' },

  // Arizona State
  { team: 'ASU', type: 'celebration', text: 'Fork \'em, Devils. Desert domination.' },
  { team: 'ASU', type: 'trash_talk', text: 'We recruited your best guys. Thanks for the development.', target: null },

  // Generic rivalry trash talk
  { team: 'PSU', type: 'taunt', text: 'The gap between us and everyone else is getting wider, not closer.' },
  { team: 'IOWA', type: 'taunt', text: 'Nobody outworks Iowa. Nobody.' },
  { team: 'OKST', type: 'taunt', text: 'Wrestling was built in Stillwater. Don\'t forget it.' },
];

main();
