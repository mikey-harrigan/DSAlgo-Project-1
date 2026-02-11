import React, { useState } from 'react';
import { api } from '../utils/api.js';

const MODES = [
  { key: 'team_pickem', label: 'Team Pick' },
  { key: 'individual_pickem', label: 'Bout Picks' },
  { key: 'granular_pickem', label: 'Granular' },
  { key: 'probabilities', label: 'Probabilities' },
  { key: 'over_under', label: 'Over/Under' },
];

const OUTCOME_LABELS = ['Fall', 'Tech Fall', 'Major Dec', 'Decision', 'Decision', 'Major Dec', 'Tech Fall', 'Fall'];

export default function PredictionPanel({ dual, bouts, market, homeColor, awayColor, existingPredictions, onSubmit }) {
  const [mode, setMode] = useState('team_pickem');
  const [teamPick, setTeamPick] = useState(null);
  const [confidence, setConfidence] = useState(60);
  const [boutPicks, setBoutPicks] = useState({});
  const [boutOutcomes, setBoutOutcomes] = useState({});
  const [boutProbs, setBoutProbs] = useState({});
  const [overUnderPicks, setOverUnderPicks] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize from existing predictions
  React.useEffect(() => {
    if (!existingPredictions) return;
    for (const pred of existingPredictions) {
      if (pred.mode === mode) {
        if (pred.team_pick) setTeamPick(pred.team_pick);
        if (pred.confidence) setConfidence(pred.confidence * 100);
        if (pred.bout_predictions) {
          const bp = JSON.parse(pred.bout_predictions);
          const picks = {};
          const outcomes = {};
          const probs = {};
          for (const b of bp) {
            picks[b.weight_class] = b.winner;
            if (b.outcome_type) outcomes[b.weight_class] = b.outcome_type;
            if (b.probabilities) probs[b.weight_class] = b.probabilities;
          }
          setBoutPicks(picks);
          setBoutOutcomes(outcomes);
          setBoutProbs(probs);
        }
      }
    }
  }, [mode, existingPredictions]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      let body = { dualId: dual.id, mode };

      switch (mode) {
        case 'team_pickem':
          if (!teamPick) throw new Error('Pick a team');
          body.teamPick = teamPick;
          body.confidence = confidence / 100;
          break;

        case 'individual_pickem':
          body.boutPredictions = bouts.map(b => ({
            weight_class: b.weight_class,
            winner: boutPicks[b.weight_class] || null,
            confidence: 0.5,
          })).filter(p => p.winner);
          if (body.boutPredictions.length === 0) throw new Error('Pick at least one bout winner');
          // Also derive team pick
          body.teamPick = deriveTeamPick(body.boutPredictions, bouts);
          break;

        case 'granular_pickem':
          body.boutPredictions = bouts.map(b => ({
            weight_class: b.weight_class,
            winner: boutPicks[b.weight_class] || null,
            outcome_type: boutOutcomes[b.weight_class] || null,
            confidence: 0.5,
          })).filter(p => p.winner);
          if (body.boutPredictions.length === 0) throw new Error('Pick at least one bout outcome');
          body.teamPick = deriveTeamPick(body.boutPredictions, bouts);
          break;

        case 'probabilities':
          body.boutPredictions = bouts.map(b => ({
            weight_class: b.weight_class,
            probabilities: boutProbs[b.weight_class] || b.base_probs || defaultProbs(),
          }));
          break;

        case 'over_under':
          body.boutPredictions = Object.entries(overUnderPicks).map(([key, pick]) => ({
            target: key,
            line: market ? market.weighted_home_win_pct : 0.5,
            pick,
          }));
          if (body.boutPredictions.length === 0) throw new Error('Make at least one over/under pick');
          body.teamPick = overUnderPicks.home_win === 'over' ? 'home' : 'away';
          break;
      }

      await api.post('/predictions', body);
      onSubmit();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="prediction-panel" style={{ marginTop: '20px' }}>
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '22px',
        letterSpacing: '1px',
        marginBottom: '16px',
      }}>
        Make Your Prediction
      </h3>

      {/* Mode tabs */}
      <div className="prediction-mode-tabs">
        {MODES.map(m => (
          <button
            key={m.key}
            className={`prediction-mode-tab ${mode === m.key ? 'active' : ''}`}
            onClick={() => setMode(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Mode-specific content */}
      {mode === 'team_pickem' && (
        <TeamPickem
          dual={dual}
          homeColor={homeColor}
          awayColor={awayColor}
          teamPick={teamPick}
          setTeamPick={setTeamPick}
          confidence={confidence}
          setConfidence={setConfidence}
        />
      )}

      {mode === 'individual_pickem' && (
        <BoutPickem
          bouts={bouts}
          homeColor={homeColor}
          awayColor={awayColor}
          boutPicks={boutPicks}
          setBoutPicks={setBoutPicks}
        />
      )}

      {mode === 'granular_pickem' && (
        <GranularPickem
          bouts={bouts}
          homeColor={homeColor}
          awayColor={awayColor}
          boutPicks={boutPicks}
          setBoutPicks={setBoutPicks}
          boutOutcomes={boutOutcomes}
          setBoutOutcomes={setBoutOutcomes}
        />
      )}

      {mode === 'probabilities' && (
        <ProbabilitiesMode
          bouts={bouts}
          homeColor={homeColor}
          awayColor={awayColor}
          boutProbs={boutProbs}
          setBoutProbs={setBoutProbs}
        />
      )}

      {mode === 'over_under' && (
        <OverUnderMode
          dual={dual}
          market={market}
          homeColor={homeColor}
          awayColor={awayColor}
          picks={overUnderPicks}
          setPicks={setOverUnderPicks}
        />
      )}

      {/* Submit */}
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {error && <span style={{ color: 'var(--accent-red)', fontSize: '13px' }}>{error}</span>}
        <div style={{ flex: 1 }} />
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={submitting}
          style={{ minWidth: '160px' }}
        >
          {submitting ? 'Submitting...' : 'Submit Prediction'}
        </button>
      </div>
    </div>
  );
}

function TeamPickem({ dual, homeColor, awayColor, teamPick, setTeamPick, confidence, setConfidence }) {
  return (
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
        Pick which team wins the dual. Set your confidence level.
      </p>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '20px' }}>
        <button
          className={`bout-pick-btn ${teamPick === 'home' ? 'selected' : ''}`}
          style={{
            background: teamPick === 'home' ? homeColor : `${homeColor}20`,
            color: teamPick === 'home' ? 'white' : homeColor,
            padding: '16px 32px',
            fontSize: '16px',
            borderRadius: 'var(--radius-md)',
          }}
          onClick={() => setTeamPick('home')}
        >
          {dual.home_short} Win
        </button>
        <button
          className={`bout-pick-btn ${teamPick === 'away' ? 'selected' : ''}`}
          style={{
            background: teamPick === 'away' ? awayColor : `${awayColor}20`,
            color: teamPick === 'away' ? 'white' : awayColor,
            padding: '16px 32px',
            fontSize: '16px',
            borderRadius: 'var(--radius-md)',
          }}
          onClick={() => setTeamPick('away')}
        >
          {dual.away_short} Win
        </button>
      </div>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
          Confidence: {confidence}%
        </label>
        <input
          type="range"
          min="50"
          max="99"
          value={confidence}
          onChange={e => setConfidence(parseInt(e.target.value))}
          style={{ width: '100%', border: 'none', padding: 0 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
          <span>50% (Coin flip)</span>
          <span>99% (Lock)</span>
        </div>
      </div>
    </div>
  );
}

function BoutPickem({ bouts, homeColor, awayColor, boutPicks, setBoutPicks }) {
  return (
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
        Pick the winner at each weight class.
      </p>
      {bouts.map(bout => (
        <div key={bout.id} className="bout-row" style={{
          gridTemplateColumns: '60px 1fr 60px 1fr',
          gap: '8px',
        }}>
          <div className="bout-weight">{bout.weight_class}</div>
          <button
            className={`bout-pick-btn ${boutPicks[bout.weight_class] === 'home' ? 'selected' : ''}`}
            style={{
              background: boutPicks[bout.weight_class] === 'home' ? homeColor : `${homeColor}15`,
              color: boutPicks[bout.weight_class] === 'home' ? 'white' : homeColor,
            }}
            onClick={() => setBoutPicks(prev => ({
              ...prev,
              [bout.weight_class]: prev[bout.weight_class] === 'home' ? null : 'home',
            }))}
          >
            {bout.home_wrestler_name || 'Home'}
            {bout.home_ranking && <span style={{ opacity: 0.7, marginLeft: '4px' }}>#{bout.home_ranking}</span>}
          </button>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', alignSelf: 'center' }}>vs</div>
          <button
            className={`bout-pick-btn ${boutPicks[bout.weight_class] === 'away' ? 'selected' : ''}`}
            style={{
              background: boutPicks[bout.weight_class] === 'away' ? awayColor : `${awayColor}15`,
              color: boutPicks[bout.weight_class] === 'away' ? 'white' : awayColor,
            }}
            onClick={() => setBoutPicks(prev => ({
              ...prev,
              [bout.weight_class]: prev[bout.weight_class] === 'away' ? null : 'away',
            }))}
          >
            {bout.away_wrestler_name || 'Away'}
            {bout.away_ranking && <span style={{ opacity: 0.7, marginLeft: '4px' }}>#{bout.away_ranking}</span>}
          </button>
        </div>
      ))}
    </div>
  );
}

function GranularPickem({ bouts, homeColor, awayColor, boutPicks, setBoutPicks, boutOutcomes, setBoutOutcomes }) {
  const outcomeTypes = ['decision', 'major', 'tech_fall', 'fall'];

  return (
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
        Pick the winner AND the outcome type at each weight.
      </p>
      {bouts.map(bout => (
        <div key={bout.id} style={{ marginBottom: '12px', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span className="bout-weight" style={{ fontSize: '18px' }}>{bout.weight_class}</span>
            <button
              className={`bout-pick-btn btn-sm ${boutPicks[bout.weight_class] === 'home' ? 'selected' : ''}`}
              style={{
                background: boutPicks[bout.weight_class] === 'home' ? homeColor : `${homeColor}15`,
                color: boutPicks[bout.weight_class] === 'home' ? 'white' : homeColor,
              }}
              onClick={() => setBoutPicks(prev => ({ ...prev, [bout.weight_class]: 'home' }))}
            >
              {bout.home_wrestler_name || 'Home'}
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>vs</span>
            <button
              className={`bout-pick-btn btn-sm ${boutPicks[bout.weight_class] === 'away' ? 'selected' : ''}`}
              style={{
                background: boutPicks[bout.weight_class] === 'away' ? awayColor : `${awayColor}15`,
                color: boutPicks[bout.weight_class] === 'away' ? 'white' : awayColor,
              }}
              onClick={() => setBoutPicks(prev => ({ ...prev, [bout.weight_class]: 'away' }))}
            >
              {bout.away_wrestler_name || 'Away'}
            </button>
          </div>
          {boutPicks[bout.weight_class] && (
            <div style={{ display: 'flex', gap: '6px', marginLeft: '60px' }}>
              {outcomeTypes.map(ot => (
                <button
                  key={ot}
                  className={`btn btn-sm ${boutOutcomes[bout.weight_class] === ot ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setBoutOutcomes(prev => ({ ...prev, [bout.weight_class]: ot }))}
                >
                  {ot === 'tech_fall' ? 'Tech Fall' : ot.charAt(0).toUpperCase() + ot.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ProbabilitiesMode({ bouts, homeColor, awayColor, boutProbs, setBoutProbs }) {
  const updateProb = (wc, idx, value) => {
    const current = [...(boutProbs[wc] || bouts.find(b => b.weight_class === wc)?.base_probs || defaultProbs())];
    current[idx] = parseFloat(value);
    // Normalize to sum to 100
    const sum = current.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      const normalized = current.map(v => +(v / sum * 100).toFixed(1));
      setBoutProbs(prev => ({ ...prev, [wc]: normalized }));
    } else {
      setBoutProbs(prev => ({ ...prev, [wc]: current }));
    }
  };

  return (
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
        Assign probabilities to each outcome. Your calibration will be scored.
        Sharper predictions = higher weight in the market consensus.
      </p>
      {bouts.map(bout => {
        const probs = boutProbs[bout.weight_class] || bout.base_probs || defaultProbs();
        return (
          <div key={bout.id} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span className="bout-weight" style={{ fontSize: '18px' }}>{bout.weight_class}</span>
              <span style={{ color: homeColor, fontWeight: '600', fontSize: '13px' }}>
                {bout.home_wrestler_name}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>vs</span>
              <span style={{ color: awayColor, fontWeight: '600', fontSize: '13px' }}>
                {bout.away_wrestler_name}
              </span>
            </div>
            <div className="prob-slider-group">
              {OUTCOME_LABELS.map((label, idx) => {
                const isHome = idx >= 4;
                const color = isHome ? homeColor : awayColor;
                const side = isHome ? 'Home' : 'Away';
                return (
                  <div key={idx} className="prob-slider-row">
                    <label style={{ color }}>
                      {side} {label}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={probs[idx] || 0}
                      onChange={e => updateProb(bout.weight_class, idx, e.target.value)}
                    />
                    <span className="value" style={{ color }}>
                      {(probs[idx] || 0).toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OverUnderMode({ dual, market, homeColor, awayColor, picks, setPicks }) {
  const marketLine = market ? market.weighted_home_win_pct : 0.5;

  return (
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
        The market has set lines. Do you think the actual result will be over or under?
      </p>

      {/* Home win probability line */}
      <div className="card" style={{ marginBottom: '12px', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>
              {dual.home_short} Win Probability
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Market line: {(marketLine * 100).toFixed(1)}%
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn btn-sm ${picks.home_win === 'over' ? 'btn-success' : 'btn-outline'}`}
              onClick={() => setPicks(prev => ({ ...prev, home_win: 'over' }))}
            >
              Over {(marketLine * 100).toFixed(0)}%
            </button>
            <button
              className={`btn btn-sm ${picks.home_win === 'under' ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => setPicks(prev => ({ ...prev, home_win: 'under' }))}
            >
              Under {(marketLine * 100).toFixed(0)}%
            </button>
          </div>
        </div>
        <div className="prob-bar">
          <div className="prob-bar-fill" style={{
            width: `${(marketLine * 100).toFixed(0)}%`,
            background: `linear-gradient(90deg, ${homeColor}, ${awayColor})`,
          }} />
        </div>
      </div>

      {/* Total team points line */}
      <div className="card" style={{ background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>
              Combined Total Points
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Market line: 40.5 pts
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn btn-sm ${picks.total_points === 'over' ? 'btn-success' : 'btn-outline'}`}
              onClick={() => setPicks(prev => ({ ...prev, total_points: 'over' }))}
            >
              Over 40.5
            </button>
            <button
              className={`btn btn-sm ${picks.total_points === 'under' ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => setPicks(prev => ({ ...prev, total_points: 'under' }))}
            >
              Under 40.5
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function defaultProbs() {
  return [5, 3, 10, 32, 32, 10, 3, 5];
}

function deriveTeamPick(boutPredictions, bouts) {
  const pointMap = { fall: 6, tech_fall: 5, major: 4, decision: 3 };
  let homePoints = 0;
  let awayPoints = 0;

  for (const pred of boutPredictions) {
    const pts = pointMap[pred.outcome_type] || 3;
    if (pred.winner === 'home') homePoints += pts;
    else if (pred.winner === 'away') awayPoints += pts;
  }

  return homePoints >= awayPoints ? 'home' : 'away';
}
