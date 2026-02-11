/**
 * Simulation Engine for noBall
 *
 * Ports the brute-force and DP logic from the original wrestling analysis.
 * Computes win probabilities for a dual meet given bout-level outcome probabilities.
 *
 * Outcomes per bout (8 possible):
 *   Index 0: Away Fall    (-6 pts)
 *   Index 1: Away Tech    (-5 pts)
 *   Index 2: Away Major   (-4 pts)
 *   Index 3: Away Dec     (-3 pts)
 *   Index 4: Home Dec     (+3 pts)
 *   Index 5: Home Major   (+4 pts)
 *   Index 6: Home Tech    (+5 pts)
 *   Index 7: Home Fall    (+6 pts)
 */

const OUTCOME_POINTS = [-6, -5, -4, -3, 3, 4, 5, 6];
const MAX_DIFF = 60;
const DIFF_RANGE = 2 * MAX_DIFF + 1; // -60 to +60 = 121 values

/**
 * Dynamic Programming computation of dual outcome probabilities.
 * O(10 * 121 * 8) ≈ 9,680 operations — runs in <1ms.
 *
 * @param {number[][]} boutProbs - 10x8 array of outcome probabilities (each row sums to 1)
 * @param {(number|null)[]} realized - Array of 10 realized outcome indices (null if not yet determined)
 * @returns {{ homeWin: number, awayWin: number, tie: number, diffProbs: number[] }}
 */
export function computeDualProbabilities(boutProbs, realized = []) {
  // dp[diff + MAX_DIFF] = probability of reaching that differential
  let dp = new Float64Array(DIFF_RANGE);
  dp[MAX_DIFF] = 1.0; // Start at differential 0

  for (let bout = 0; bout < boutProbs.length; bout++) {
    const newDp = new Float64Array(DIFF_RANGE);
    const probs = boutProbs[bout];
    const realizedOutcome = realized[bout];

    if (realizedOutcome !== null && realizedOutcome !== undefined) {
      // This bout's outcome is locked in
      const pts = OUTCOME_POINTS[realizedOutcome];
      for (let d = 0; d < DIFF_RANGE; d++) {
        if (dp[d] > 0) {
          const newD = d + pts;
          if (newD >= 0 && newD < DIFF_RANGE) {
            newDp[newD] += dp[d];
          }
        }
      }
    } else {
      // Enumerate all 8 outcomes
      for (let o = 0; o < 8; o++) {
        const prob = probs[o] / 100; // Convert percentage to probability
        const pts = OUTCOME_POINTS[o];
        for (let d = 0; d < DIFF_RANGE; d++) {
          if (dp[d] > 0) {
            const newD = d + pts;
            if (newD >= 0 && newD < DIFF_RANGE) {
              newDp[newD] += dp[d] * prob;
            }
          }
        }
      }
    }

    dp = newDp;
  }

  // Aggregate results
  let homeWin = 0;
  let awayWin = 0;
  let tie = dp[MAX_DIFF];

  for (let d = 0; d < MAX_DIFF; d++) {
    awayWin += dp[d];
  }
  for (let d = MAX_DIFF + 1; d < DIFF_RANGE; d++) {
    homeWin += dp[d];
  }

  return {
    homeWin,
    awayWin,
    tie,
    diffProbs: Array.from(dp),
  };
}

/**
 * Compute conditional probabilities: "If bout B has outcome O, what's the dual win probability?"
 *
 * @param {number[][]} boutProbs - 10x8 array
 * @returns {number[][]} 10x8 array of conditional home win probabilities
 */
export function computeConditionalProbabilities(boutProbs) {
  const conditionals = [];

  for (let bout = 0; bout < boutProbs.length; bout++) {
    const row = [];
    for (let outcome = 0; outcome < 8; outcome++) {
      const realized = new Array(boutProbs.length).fill(null);
      realized[bout] = outcome;
      const result = computeDualProbabilities(boutProbs, realized);
      row.push(result.homeWin);
    }
    conditionals.push(row);
  }

  return conditionals;
}

/**
 * Compute ELO-based outcome probabilities for a bout.
 * Uses wrestler ELO ratings to estimate the 8-outcome distribution.
 *
 * @param {number} homeElo - Home wrestler ELO rating
 * @param {number} awayElo - Away wrestler ELO rating
 * @returns {number[]} 8-element array of probabilities (sum to 100)
 */
export function eloProbabilities(homeElo, awayElo) {
  const diff = homeElo - awayElo;
  const homeExpected = 1 / (1 + Math.pow(10, -diff / 400));
  const awayExpected = 1 - homeExpected;

  // Distribute win probability across outcome types
  // Stronger advantage → more dominant outcomes (falls, techs)
  const dominance = Math.abs(diff) / 400; // 0-1+ scale

  // Base distribution of outcome types given a win
  // [fall, tech, major, decision] ratios
  const fallRate = Math.min(0.15 + dominance * 0.12, 0.35);
  const techRate = Math.min(0.08 + dominance * 0.08, 0.20);
  const majorRate = Math.min(0.15 + dominance * 0.05, 0.25);
  const decRate = 1 - fallRate - techRate - majorRate;

  // Away outcomes (indices 0-3): away_fall, away_tech, away_major, away_dec
  // Home outcomes (indices 4-7): home_dec, home_major, home_tech, home_fall
  return [
    +(awayExpected * fallRate * 100).toFixed(2),
    +(awayExpected * techRate * 100).toFixed(2),
    +(awayExpected * majorRate * 100).toFixed(2),
    +(awayExpected * decRate * 100).toFixed(2),
    +(homeExpected * decRate * 100).toFixed(2),
    +(homeExpected * majorRate * 100).toFixed(2),
    +(homeExpected * techRate * 100).toFixed(2),
    +(homeExpected * fallRate * 100).toFixed(2),
  ];
}

/**
 * Score a user's prediction against actual outcomes.
 *
 * @param {object} prediction - The prediction record
 * @param {object} actual - The actual dual result
 * @returns {{ score: number, brierScore: number, isCorrect: boolean }}
 */
export function scorePrediction(prediction, actual) {
  const { mode, team_pick, bout_predictions, confidence } = prediction;

  switch (mode) {
    case 'team_pickem': {
      const actualWinner = actual.home_score > actual.away_score ? 'home' : 'away';
      const isCorrect = team_pick === actualWinner;
      // Simple binary Brier: (forecast - outcome)^2
      const forecastProb = confidence || 0.5;
      const outcome = isCorrect ? 1 : 0;
      const brierScore = Math.pow(forecastProb - outcome, 2);
      return { score: isCorrect ? 1 : 0, brierScore, isCorrect };
    }

    case 'individual_pickem': {
      const preds = JSON.parse(bout_predictions || '[]');
      let correct = 0;
      let total = 0;
      let brierSum = 0;

      for (const pred of preds) {
        const bout = actual.bouts.find(b => b.weight_class === pred.weight_class);
        if (!bout || !bout.winner) continue;
        total++;
        const isRight = pred.winner === bout.winner;
        if (isRight) correct++;
        const p = pred.confidence || 0.5;
        brierSum += Math.pow(p - (isRight ? 1 : 0), 2);
      }

      return {
        score: total > 0 ? correct / total : 0,
        brierScore: total > 0 ? brierSum / total : 1,
        isCorrect: correct > total / 2,
      };
    }

    case 'granular_pickem': {
      const preds = JSON.parse(bout_predictions || '[]');
      let score = 0;
      let total = 0;
      let brierSum = 0;

      for (const pred of preds) {
        const bout = actual.bouts.find(b => b.weight_class === pred.weight_class);
        if (!bout || !bout.winner) continue;
        total++;

        // Points for correct winner
        const correctWinner = pred.winner === bout.winner;
        if (correctWinner) score += 0.5;

        // Points for correct outcome type
        if (correctWinner && pred.outcome_type === bout.outcome_type) {
          score += 0.5;
        }

        const p = pred.confidence || 0.5;
        brierSum += Math.pow(p - (correctWinner ? 1 : 0), 2);
      }

      return {
        score: total > 0 ? score / total : 0,
        brierScore: total > 0 ? brierSum / total : 1,
        isCorrect: score > total * 0.25,
      };
    }

    case 'probabilities': {
      const preds = JSON.parse(bout_predictions || '[]');
      let brierSum = 0;
      let total = 0;

      for (const pred of preds) {
        const bout = actual.bouts.find(b => b.weight_class === pred.weight_class);
        if (!bout || !bout.winner) continue;
        total++;

        // 8-outcome Brier score
        const probs = pred.probabilities || [];
        // Determine actual outcome index
        const outcomeIdx = getActualOutcomeIndex(bout);
        if (outcomeIdx === -1) continue;

        for (let i = 0; i < 8; i++) {
          const p = (probs[i] || 0) / 100;
          const actual_i = i === outcomeIdx ? 1 : 0;
          brierSum += Math.pow(p - actual_i, 2);
        }
      }

      // Lower Brier is better; convert to 0-1 score (1 = perfect)
      const avgBrier = total > 0 ? brierSum / (total * 8) : 1;
      return {
        score: Math.max(0, 1 - avgBrier * 4), // Scale so random (0.25) = 0
        brierScore: total > 0 ? brierSum / total : 8,
        isCorrect: avgBrier < 0.2,
      };
    }

    case 'over_under': {
      const preds = JSON.parse(bout_predictions || '[]');
      let correct = 0;
      let total = 0;

      for (const pred of preds) {
        if (!pred.line || !pred.pick) continue;
        total++;

        // pred.line = the market probability, pred.pick = 'over' or 'under'
        // pred.target = what the line is about (e.g., 'home_win_pct')
        const actualValue = getActualMarketValue(pred.target, actual);
        if (actualValue === null) continue;

        const isOver = actualValue > pred.line;
        const isCorrect = (pred.pick === 'over' && isOver) || (pred.pick === 'under' && !isOver);
        if (isCorrect) correct++;
      }

      return {
        score: total > 0 ? correct / total : 0,
        brierScore: total > 0 ? 1 - correct / total : 1,
        isCorrect: correct > total / 2,
      };
    }

    default:
      return { score: 0, brierScore: 1, isCorrect: false };
  }
}

function getActualOutcomeIndex(bout) {
  const typeMap = { fall: 0, tech_fall: 1, major: 2, decision: 3, forfeit: 0, default: 0, disqualification: 0 };
  const base = typeMap[bout.outcome_type];
  if (base === undefined) return -1;
  return bout.winner === 'away' ? base : 7 - base;
}

function getActualMarketValue(target, actual) {
  if (target === 'home_win') return actual.home_score > actual.away_score ? 1 : 0;
  if (target === 'total_points') return (actual.home_score || 0) + (actual.away_score || 0);
  return null;
}

/**
 * Update user ELO based on prediction accuracy.
 *
 * @param {number} currentElo - User's current ELO
 * @param {number} score - Prediction score (0-1)
 * @param {number} expectedScore - Expected score based on difficulty
 * @returns {number} New ELO
 */
export function updateUserElo(currentElo, score, expectedScore = 0.5) {
  const K = 32;
  return currentElo + K * (score - expectedScore);
}

/**
 * Calculate user sharpness — how well their probabilities discriminate outcomes.
 * Higher sharpness = predictions further from 50/50.
 *
 * @param {number[]} predictions - Array of predicted probabilities
 * @returns {number} Sharpness score (0-1)
 */
export function calculateSharpness(predictions) {
  if (predictions.length === 0) return 0;
  const sum = predictions.reduce((acc, p) => acc + Math.abs(p - 0.5), 0);
  return sum / predictions.length;
}

/**
 * Compute weighted market consensus from user predictions.
 * Sharper, more accurate users get higher weight.
 *
 * @param {{ prediction: number, weight: number }[]} userPredictions
 * @returns {number} Weighted consensus probability
 */
export function computeMarketConsensus(userPredictions) {
  if (userPredictions.length === 0) return 0.5;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const { prediction, weight } of userPredictions) {
    weightedSum += prediction * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
}

/**
 * Calculate user weight for market consensus based on their track record.
 *
 * @param {object} user - User record with scoring fields
 * @returns {number} Weight (0.1 to 10)
 */
export function calculateUserWeight(user) {
  const totalPreds = user.total_predictions || 0;
  if (totalPreds < 3) return 0.1; // Minimum weight for new users

  // Components
  const accuracy = user.accuracy_score || 0;
  const calibration = Math.max(0, 1 - (user.calibration_score || 1));
  const eloFactor = Math.max(0, (user.elo_rating - 1200) / 600); // 0 at 1200, 1 at 1800
  const volume = Math.min(1, Math.log10(totalPreds + 1) / 2); // Logarithmic volume credit

  const weight = 0.3 * accuracy + 0.3 * calibration + 0.25 * eloFactor + 0.15 * volume;
  return Math.max(0.1, Math.min(10, weight * 10));
}
