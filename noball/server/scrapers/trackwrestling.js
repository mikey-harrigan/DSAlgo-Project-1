/**
 * TrackWrestling / OpenTW Scraper
 *
 * Uses the OpenTW API (https://github.com/vehbiu/opentw-api) as a middleware
 * for accessing TrackWrestling tournament data, or falls back to direct scraping.
 *
 * OpenTW endpoints:
 *   GET /tournaments?query={search} - Search tournaments
 *   GET /tournaments/{type}/{id} - Tournament details
 *   GET /tournaments/{type}/{id}/matches - Match assignments
 *   GET /tournaments/{type}/{id}/brackets - All brackets
 *   GET /tournaments/{type}/{id}/brackets/{weight} - Specific bracket
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const OPENTW_BASE = 'https://opentw.vercel.app/api'; // Public OpenTW API
const TW_BASE = 'https://www.trackwrestling.com';
const RATE_LIMIT_MS = 1500;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Search for tournaments on TrackWrestling via OpenTW.
 */
export async function searchTournaments(query) {
  try {
    await delay(RATE_LIMIT_MS);
    const res = await fetch(`${OPENTW_BASE}/tournaments?query=${encodeURIComponent(query)}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.error(`OpenTW search error: ${err.message}`);
  }
  return null;
}

/**
 * Get tournament details and matches.
 */
export async function getTournamentMatches(type, id) {
  try {
    await delay(RATE_LIMIT_MS);
    const res = await fetch(`${OPENTW_BASE}/tournaments/${type}/${id}/matches`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.error(`OpenTW matches error: ${err.message}`);
  }
  return null;
}

/**
 * Get tournament brackets.
 */
export async function getTournamentBrackets(type, id) {
  try {
    await delay(RATE_LIMIT_MS);
    const res = await fetch(`${OPENTW_BASE}/tournaments/${type}/${id}/brackets`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.error(`OpenTW brackets error: ${err.message}`);
  }
  return null;
}

/**
 * Direct TrackWrestling scraper for dual meet results.
 * Falls back to scraping HTML when API is unavailable.
 */
export async function scrapeDualResult(eventUrl) {
  try {
    await delay(RATE_LIMIT_MS);
    const res = await fetch(eventUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Parse dual meet results from TrackWrestling HTML
    const bouts = [];
    $('table.teamDualBouts tr, table[class*="bout"] tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length < 4) return;

      const weightText = $(cells[0]).text().trim();
      const weight = parseInt(weightText);
      if (isNaN(weight)) return;

      bouts.push({
        weight_class: weight,
        wrestler1: $(cells[1]).text().trim(),
        wrestler2: $(cells[2]).text().trim(),
        result: $(cells[3]).text().trim(),
      });
    });

    return bouts.length > 0 ? bouts : null;
  } catch (err) {
    console.error(`TrackWrestling scrape error: ${err.message}`);
    return null;
  }
}

/**
 * Scrape NCAA DI schedule from TrackWrestling.
 */
export async function scrapeSchedule(season = '2025-26') {
  // Search for NCAA Division I duals
  const results = await searchTournaments(`NCAA Division I ${season}`);
  if (!results) {
    console.log('TrackWrestling schedule unavailable. Using seed data.');
    return null;
  }
  return results;
}

export default {
  searchTournaments,
  getTournamentMatches,
  getTournamentBrackets,
  scrapeDualResult,
  scrapeSchedule,
};
