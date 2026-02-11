// Wrestling match outcome types and their team point values
export const OUTCOME_TYPES = {
  FALL: { label: 'Fall', abbrev: 'F', points: 6 },
  TECH_FALL: { label: 'Tech Fall', abbrev: 'TF', points: 5 },
  MAJOR: { label: 'Major Decision', abbrev: 'MD', points: 4 },
  DECISION: { label: 'Decision', abbrev: 'D', points: 3 },
};

// Ordered outcomes from perspective of away team losing to home team winning
export const OUTCOMES = [
  { key: 'away_fall', points: -6, label: 'Fall', winner: 'away' },
  { key: 'away_tech', points: -5, label: 'Tech Fall', winner: 'away' },
  { key: 'away_major', points: -4, label: 'Major Dec', winner: 'away' },
  { key: 'away_dec', points: -3, label: 'Decision', winner: 'away' },
  { key: 'home_dec', points: 3, label: 'Decision', winner: 'home' },
  { key: 'home_major', points: 4, label: 'Major Dec', winner: 'home' },
  { key: 'home_tech', points: 5, label: 'Tech Fall', winner: 'home' },
  { key: 'home_fall', points: 6, label: 'Fall', winner: 'home' },
];

export const WEIGHT_CLASSES = [125, 133, 141, 149, 157, 165, 174, 184, 197, 285];

export const PREDICTION_MODES = {
  TEAM_PICKEM: 'team_pickem',
  INDIVIDUAL_PICKEM: 'individual_pickem',
  GRANULAR_PICKEM: 'granular_pickem',
  PROBABILITIES: 'probabilities',
  OVER_UNDER: 'over_under',
};

// ELO constants
export const ELO_K_FACTOR = 32;
export const ELO_INITIAL = 1500;

// Calibration scoring
export const BRIER_WEIGHT = 0.4;
export const ACCURACY_WEIGHT = 0.3;
export const SHARPNESS_WEIGHT = 0.3;
