/**
 * Market Aggregation Service
 *
 * Aggregates user predictions into market consensus probabilities.
 * Weights users by sharpness, calibration, and accuracy.
 */

import { getDb } from '../db.js';
import { computeMarketConsensus, calculateUserWeight, computeDualProbabilities } from './simulation.js';

/**
 * Update market consensus for a dual after a new prediction comes in.
 */
export function updateMarketConsensus(dualId) {
  const db = getDb();

  // Get all predictions for this dual
  const predictions = db.prepare(`
    SELECT p.*, u.elo_rating, u.sharpness_score, u.calibration_score,
           u.accuracy_score, u.total_predictions
    FROM predictions p
    JOIN users u ON p.user_id = u.id
    WHERE p.dual_id = ?
  `).all(dualId);

  if (predictions.length === 0) return;

  // Compute team-level consensus
  const teamPicks = predictions
    .filter(p => p.mode === 'team_pickem' || p.team_pick)
    .map(p => ({
      prediction: p.team_pick === 'home' ? 1 : 0,
      weight: calculateUserWeight(p),
    }));

  const homeWinPct = teamPicks.length > 0
    ? computeMarketConsensus(teamPicks)
    : 0.5;

  // Compute bout-level consensus from probability predictions
  const probPredictions = predictions.filter(p => p.mode === 'probabilities' && p.bout_predictions);
  let boutMarketProbs = null;

  if (probPredictions.length > 0) {
    boutMarketProbs = aggregateBoutProbabilities(probPredictions);
  }

  // Weighted consensus (accounting for user quality)
  const weightedPicks = predictions
    .filter(p => p.team_pick)
    .map(p => {
      const weight = calculateUserWeight(p);
      return {
        prediction: p.team_pick === 'home' ? (p.confidence || 0.6) : 1 - (p.confidence || 0.6),
        weight,
      };
    });

  const weightedHomeWinPct = weightedPicks.length > 0
    ? computeMarketConsensus(weightedPicks)
    : homeWinPct;

  // Upsert market consensus
  db.prepare(`
    INSERT INTO market_consensus (dual_id, total_predictions, home_win_pct, away_win_pct,
                                   weighted_home_win_pct, weighted_away_win_pct,
                                   bout_market_probs, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(dual_id) DO UPDATE SET
      total_predictions = excluded.total_predictions,
      home_win_pct = excluded.home_win_pct,
      away_win_pct = excluded.away_win_pct,
      weighted_home_win_pct = excluded.weighted_home_win_pct,
      weighted_away_win_pct = excluded.weighted_away_win_pct,
      bout_market_probs = excluded.bout_market_probs,
      last_updated = excluded.last_updated
  `).run(
    dualId,
    predictions.length,
    homeWinPct,
    1 - homeWinPct,
    weightedHomeWinPct,
    1 - weightedHomeWinPct,
    boutMarketProbs ? JSON.stringify(boutMarketProbs) : null
  );
}

/**
 * Aggregate bout-level probability predictions from multiple users.
 */
function aggregateBoutProbabilities(probPredictions) {
  const boutProbs = {};

  for (const pred of probPredictions) {
    const weight = calculateUserWeight(pred);
    const bouts = JSON.parse(pred.bout_predictions);

    for (const bout of bouts) {
      const wc = bout.weight_class;
      if (!boutProbs[wc]) {
        boutProbs[wc] = { weights: [], probSets: [] };
      }
      boutProbs[wc].weights.push(weight);
      boutProbs[wc].probSets.push(bout.probabilities);
    }
  }

  // Weighted average per weight class
  const result = {};
  for (const [wc, data] of Object.entries(boutProbs)) {
    const totalWeight = data.weights.reduce((a, b) => a + b, 0);
    const avgProbs = new Array(8).fill(0);

    for (let i = 0; i < data.probSets.length; i++) {
      const w = data.weights[i] / totalWeight;
      for (let j = 0; j < 8; j++) {
        avgProbs[j] += (data.probSets[i][j] || 0) * w;
      }
    }

    result[wc] = avgProbs;
  }

  return result;
}

/**
 * Grade all predictions for a completed dual and update user scores.
 */
export function gradeDualPredictions(dualId) {
  const db = getDb();

  const dual = db.prepare('SELECT * FROM duals WHERE id = ?').get(dualId);
  if (!dual || dual.status !== 'completed') return;

  const bouts = db.prepare('SELECT * FROM bouts WHERE dual_id = ? ORDER BY weight_class').all(dualId);
  const actual = { ...dual, bouts };

  const predictions = db.prepare(`
    SELECT * FROM predictions WHERE dual_id = ? AND is_graded = 0
  `).all(dualId);

  const updatePred = db.prepare(`
    UPDATE predictions SET score = ?, brier_score = ?, is_correct = ?, is_graded = 1, graded_at = datetime('now')
    WHERE id = ?
  `);

  const updateUser = db.prepare(`
    UPDATE users SET
      total_predictions = total_predictions + 1,
      correct_predictions = correct_predictions + CASE WHEN ? THEN 1 ELSE 0 END,
      brier_sum = brier_sum + ?,
      accuracy_score = CAST(correct_predictions + CASE WHEN ? THEN 1 ELSE 0 END AS REAL) / (total_predictions + 1),
      calibration_score = (brier_sum + ?) / (total_predictions + 1),
      elo_rating = elo_rating + 32 * (? - 0.5)
    WHERE id = ?
  `);

  const gradeTransaction = db.transaction(() => {
    for (const pred of predictions) {
      const { scorePrediction } = require('./simulation.js');
      // Inline the scoring since we can't use dynamic import in transaction
      const result = scoreOnePrediction(pred, actual);
      updatePred.run(result.score, result.brierScore, result.isCorrect ? 1 : 0, pred.id);
      updateUser.run(
        result.isCorrect ? 1 : 0,
        result.brierScore,
        result.isCorrect ? 1 : 0,
        result.brierScore,
        result.score,
        pred.user_id
      );
    }
  });

  gradeTransaction();
  updateGlobalRankings();
}

/**
 * Inline scoring to avoid dynamic import in transaction.
 */
function scoreOnePrediction(prediction, actual) {
  const mode = prediction.mode;
  const teamPick = prediction.team_pick;
  const confidence = prediction.confidence;
  const boutPredictions = prediction.bout_predictions;

  if (mode === 'team_pickem') {
    const actualWinner = actual.home_score > actual.away_score ? 'home' : 'away';
    const isCorrect = teamPick === actualWinner;
    const forecastProb = confidence || 0.5;
    const brierScore = Math.pow(forecastProb - (isCorrect ? 1 : 0), 2);
    return { score: isCorrect ? 1 : 0, brierScore, isCorrect };
  }

  if (mode === 'individual_pickem' || mode === 'granular_pickem') {
    const preds = JSON.parse(boutPredictions || '[]');
    let correct = 0;
    let total = 0;
    let brierSum = 0;

    for (const pred of preds) {
      const bout = actual.bouts.find(b => b.weight_class === pred.weight_class);
      if (!bout || !bout.winner) continue;
      total++;
      const isRight = pred.winner === bout.winner;
      if (isRight) correct++;
      brierSum += Math.pow((pred.confidence || 0.5) - (isRight ? 1 : 0), 2);
    }

    return {
      score: total > 0 ? correct / total : 0,
      brierScore: total > 0 ? brierSum / total : 1,
      isCorrect: correct > total / 2,
    };
  }

  if (mode === 'probabilities') {
    const preds = JSON.parse(boutPredictions || '[]');
    let brierSum = 0;
    let total = 0;

    for (const pred of preds) {
      const bout = actual.bouts.find(b => b.weight_class === pred.weight_class);
      if (!bout || !bout.winner) continue;
      total++;

      const probs = pred.probabilities || [];
      const typeMap = { fall: 0, tech_fall: 1, major: 2, decision: 3, forfeit: 0, default: 0, disqualification: 0 };
      const base = typeMap[bout.outcome_type] ?? 3;
      const outcomeIdx = bout.winner === 'away' ? base : 7 - base;

      for (let i = 0; i < 8; i++) {
        const p = (probs[i] || 0) / 100;
        brierSum += Math.pow(p - (i === outcomeIdx ? 1 : 0), 2);
      }
    }

    const avgBrier = total > 0 ? brierSum / (total * 8) : 1;
    return {
      score: Math.max(0, 1 - avgBrier * 4),
      brierScore: total > 0 ? brierSum / total : 8,
      isCorrect: avgBrier < 0.2,
    };
  }

  return { score: 0, brierScore: 1, isCorrect: false };
}

/**
 * Recalculate global rankings for all users.
 */
export function updateGlobalRankings() {
  const db = getDb();

  // Rank by composite score: 40% accuracy + 30% calibration + 30% ELO
  db.prepare(`
    WITH ranked AS (
      SELECT id,
        ROW_NUMBER() OVER (
          ORDER BY (
            0.4 * COALESCE(accuracy_score, 0) +
            0.3 * MAX(0, 1 - COALESCE(calibration_score, 1)) +
            0.3 * MIN(1, MAX(0, (elo_rating - 1200) / 600.0))
          ) DESC
        ) as rank
      FROM users
      WHERE total_predictions >= 3
    )
    UPDATE users SET global_rank = (
      SELECT rank FROM ranked WHERE ranked.id = users.id
    )
  `).run();
}
