/**
 * Data Collection Runner
 *
 * Orchestrates scraping from multiple sources and updates the database.
 * Run with: npm run scrape
 */

import { getDb } from '../db.js';
import { scrapeRankings, scrapeDualComparison } from './wrestlestat.js';
import { scrapeSchedule } from './trackwrestling.js';
import { eloProbabilities } from '../services/simulation.js';

async function main() {
  console.log('=== noBall Data Collection ===\n');

  const db = getDb();

  // 1. Try to scrape rankings from WrestleStat
  console.log('Step 1: Fetching rankings...');
  const rankings = await scrapeRankings();

  if (rankings) {
    console.log('Rankings fetched successfully. Updating database...');
    updateRankingsInDb(db, rankings);
  } else {
    console.log('Rankings unavailable from external sources. Using existing data.');
  }

  // 2. Try to scrape upcoming schedule
  console.log('\nStep 2: Fetching schedule...');
  const schedule = await scrapeSchedule();

  if (schedule) {
    console.log('Schedule fetched successfully.');
  } else {
    console.log('Schedule unavailable. Using seed data.');
  }

  // 3. Update bout probabilities using ELO
  console.log('\nStep 3: Computing bout probabilities...');
  updateBoutProbabilities(db);

  console.log('\n=== Data collection complete ===');
}

function updateRankingsInDb(db, rankings) {
  const updateWrestler = db.prepare(`
    UPDATE wrestlers SET ranking = ?, elo_rating = ?
    WHERE name LIKE ? AND weight_class = ?
  `);

  if (Array.isArray(rankings)) {
    for (const entry of rankings) {
      if (entry.name && entry.weightClass && entry.rating) {
        updateWrestler.run(
          entry.ranking || null,
          entry.rating || 1500,
          `%${entry.name}%`,
          entry.weightClass
        );
      }
    }
  }
}

function updateBoutProbabilities(db) {
  const bouts = db.prepare(`
    SELECT b.id, b.weight_class,
      hw.elo_rating as home_elo, aw.elo_rating as away_elo
    FROM bouts b
    LEFT JOIN wrestlers hw ON b.home_wrestler_id = hw.id
    LEFT JOIN wrestlers aw ON b.away_wrestler_id = aw.id
    WHERE b.base_probs IS NULL
  `).all();

  const update = db.prepare('UPDATE bouts SET base_probs = ? WHERE id = ?');

  for (const bout of bouts) {
    const probs = eloProbabilities(bout.home_elo || 1500, bout.away_elo || 1500);
    update.run(JSON.stringify(probs), bout.id);
  }

  console.log(`Updated probabilities for ${bouts.length} bouts`);
}

main().catch(console.error);
