/**
 * WrestleStat Scraper
 *
 * Scrapes wrestler rankings and dual comparison data from WrestleStat.
 * Uses their internal API endpoints discovered via network inspection.
 *
 * Key endpoints (reverse-engineered):
 *   /api/d1/rankings - Division I rankings by weight class
 *   /api/d1/team/{teamId} - Team roster and schedule
 *   /api/d1/dual/{teamId1}/{teamId2} - Dual comparison tool
 *
 * Note: These endpoints may change. The scraper includes retry logic
 * and graceful fallback to ELO-based estimates.
 */

import fetch from 'node-fetch';

const BASE_URL = 'https://www.wrestlestat.com';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json, text/html',
  'Accept-Language': 'en-US,en;q=0.9',
};

const RATE_LIMIT_MS = 2000; // Be respectful - 2 seconds between requests

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Attempt to fetch JSON from a WrestleStat API endpoint.
 * Falls back gracefully if the endpoint doesn't exist or is blocked.
 */
async function fetchWrestleStat(path, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      await delay(RATE_LIMIT_MS);
      const res = await fetch(`${BASE_URL}${path}`, { headers: HEADERS });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('json')) {
          return await res.json();
        }
        // HTML response — would need to parse
        return { _html: true, status: res.status };
      }

      if (res.status === 429) {
        // Rate limited — back off
        await delay(RATE_LIMIT_MS * (attempt + 2));
        continue;
      }

      return null;
    } catch (err) {
      console.error(`WrestleStat fetch error (${path}): ${err.message}`);
      if (attempt < retries - 1) await delay(RATE_LIMIT_MS * 2);
    }
  }
  return null;
}

/**
 * Scrape D1 rankings for all weight classes.
 * Returns array of { weightClass, wrestlers: [{ name, team, ranking, record, rating }] }
 */
export async function scrapeRankings() {
  console.log('Scraping WrestleStat D1 rankings...');

  // Try known API patterns
  const endpoints = [
    '/api/d1/rankings/starters',
    '/api/rankings/d1',
    '/d1/rankings/starters',
  ];

  for (const endpoint of endpoints) {
    const data = await fetchWrestleStat(endpoint);
    if (data && !data._html) {
      console.log(`Found rankings at ${endpoint}`);
      return data;
    }
  }

  console.log('WrestleStat API endpoints not accessible. Using seed data.');
  return null;
}

/**
 * Scrape a dual comparison between two teams.
 * Returns weight-by-weight matchup predictions.
 */
export async function scrapeDualComparison(team1Slug, team2Slug) {
  const endpoints = [
    `/api/d1/dual/${team1Slug}/${team2Slug}`,
    `/d1/dual/${team1Slug}/${team2Slug}`,
  ];

  for (const endpoint of endpoints) {
    const data = await fetchWrestleStat(endpoint);
    if (data && !data._html) {
      return data;
    }
  }

  return null;
}

/**
 * Scrape team roster and schedule.
 */
export async function scrapeTeam(teamSlug) {
  const endpoints = [
    `/api/d1/team/${teamSlug}`,
    `/d1/team/${teamSlug}`,
  ];

  for (const endpoint of endpoints) {
    const data = await fetchWrestleStat(endpoint);
    if (data && !data._html) {
      return data;
    }
  }

  return null;
}

export default {
  scrapeRankings,
  scrapeDualComparison,
  scrapeTeam,
};
