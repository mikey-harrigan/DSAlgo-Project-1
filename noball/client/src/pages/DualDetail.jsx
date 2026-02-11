import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import PredictionPanel from '../components/PredictionPanel.jsx';
import SimulationViz from '../components/SimulationViz.jsx';
import TrashTicker from '../components/TrashTicker.jsx';

export default function DualDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [dual, setDual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rootFor, setRootFor] = useState(null); // 'home' or 'away'
  const [toast, setToast] = useState(null);

  const fetchDual = useCallback(() => {
    api.get(`/duals/${id}`)
      .then(setDual)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchDual();
  }, [fetchDual]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!dual) return <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Dual not found.</div>;

  const teamColors = {
    home: dual.home_color || '#3b82f6',
    away: dual.away_color || '#ef4444',
  };

  const trashTalk = rootFor === 'home' ? dual.homeTrash
    : rootFor === 'away' ? dual.awayTrash
    : [...(dual.homeTrash || []), ...(dual.awayTrash || [])];

  const scheduledDate = new Date(dual.scheduled_at);

  return (
    <div>
      {/* Trash talk ticker */}
      {trashTalk && trashTalk.length > 0 && (
        <TrashTicker lines={trashTalk} teamColor={rootFor ? teamColors[rootFor] : null} />
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 0',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        {/* Home team */}
        <div
          style={{
            flex: 1,
            textAlign: 'center',
            cursor: 'pointer',
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            border: rootFor === 'home' ? `3px solid ${teamColors.home}` : '3px solid transparent',
            background: rootFor === 'home'
              ? `linear-gradient(135deg, ${teamColors.home}22, ${teamColors.home}08)`
              : 'transparent',
            transition: 'all 0.3s',
          }}
          onClick={() => setRootFor(rootFor === 'home' ? null : 'home')}
        >
          <div
            className="team-logo"
            style={{
              background: teamColors.home,
              width: '72px',
              height: '72px',
              fontSize: '22px',
              margin: '0 auto 12px',
            }}
          >
            {dual.home_short}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '32px',
            color: teamColors.home,
            letterSpacing: '2px',
          }}>
            {dual.home_team_name}
          </h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            {dual.home_mascot} / {dual.home_conference}
          </div>
          {rootFor === 'home' && (
            <div style={{
              marginTop: '8px',
              fontSize: '11px',
              color: teamColors.home,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Rooting for
            </div>
          )}
        </div>

        {/* VS / Score */}
        <div style={{ textAlign: 'center', minWidth: '160px' }}>
          {dual.status === 'completed' ? (
            <div className="score-display">
              <span className="score" style={{
                color: dual.home_score > dual.away_score ? teamColors.home : 'var(--text-muted)',
              }}>
                {dual.home_score}
              </span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '20px',
                color: 'var(--text-muted)',
              }}>
                -
              </span>
              <span className="score" style={{
                color: dual.away_score > dual.home_score ? teamColors.away : 'var(--text-muted)',
              }}>
                {dual.away_score}
              </span>
            </div>
          ) : (
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '36px',
              color: 'var(--text-muted)',
              letterSpacing: '4px',
            }}>
              VS
            </div>
          )}
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            {scheduledDate.toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            })}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </div>
          {dual.venue && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {dual.venue}
            </div>
          )}
          {dual.event_name && (
            <div className="tag tag-upcoming" style={{ marginTop: '8px' }}>
              {dual.event_name}
            </div>
          )}
          {dual.is_postseason === 1 && (
            <div className="tag tag-postseason" style={{ marginTop: '4px' }}>
              Postseason
            </div>
          )}
        </div>

        {/* Away team */}
        <div
          style={{
            flex: 1,
            textAlign: 'center',
            cursor: 'pointer',
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            border: rootFor === 'away' ? `3px solid ${teamColors.away}` : '3px solid transparent',
            background: rootFor === 'away'
              ? `linear-gradient(135deg, ${teamColors.away}22, ${teamColors.away}08)`
              : 'transparent',
            transition: 'all 0.3s',
          }}
          onClick={() => setRootFor(rootFor === 'away' ? null : 'away')}
        >
          <div
            className="team-logo"
            style={{
              background: teamColors.away,
              width: '72px',
              height: '72px',
              fontSize: '22px',
              margin: '0 auto 12px',
            }}
          >
            {dual.away_short}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '32px',
            color: teamColors.away,
            letterSpacing: '2px',
          }}>
            {dual.away_team_name}
          </h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
            {dual.away_mascot} / {dual.away_conference}
          </div>
          {rootFor === 'away' && (
            <div style={{
              marginTop: '8px',
              fontSize: '11px',
              color: teamColors.away,
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Rooting for
            </div>
          )}
        </div>
      </div>

      {/* Simulation Probabilities */}
      <SimulationViz
        simulation={dual.simulation}
        bouts={dual.bouts}
        market={dual.market}
        homeColor={teamColors.home}
        awayColor={teamColors.away}
        homeShort={dual.home_short}
        awayShort={dual.away_short}
      />

      {/* Bout Grid */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          letterSpacing: '1px',
          marginBottom: '16px',
        }}>
          Matchups
        </h3>
        <div style={{ overflowX: 'auto' }}>
          {dual.bouts.map((bout, i) => (
            <BoutRow
              key={bout.id}
              bout={bout}
              homeColor={teamColors.home}
              awayColor={teamColors.away}
              homeWinBase={dual.simulation.homeWin}
            />
          ))}
        </div>
      </div>

      {/* Prediction Panel */}
      {user && dual.status !== 'completed' && (
        <PredictionPanel
          dual={dual}
          bouts={dual.bouts}
          market={dual.market}
          homeColor={teamColors.home}
          awayColor={teamColors.away}
          existingPredictions={dual.userPredictions}
          onSubmit={() => {
            showToast('Prediction submitted!');
            fetchDual();
          }}
        />
      )}

      {!user && dual.status !== 'completed' && (
        <div className="card" style={{ textAlign: 'center', marginTop: '20px', padding: '32px' }}>
          <h3 style={{ marginBottom: '8px' }}>Want to make predictions?</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Sign up to submit picks and climb the rankings.
          </p>
          <a href="/register" className="btn btn-primary">Sign Up</a>
        </div>
      )}

      {/* Market Info */}
      {dual.market && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px',
            letterSpacing: '1px',
            marginBottom: '16px',
          }}>
            Market Consensus
          </h3>
          <div className="grid-3">
            <div className="stat-card">
              <div className="stat-value" style={{ color: teamColors.home }}>
                {(dual.market.weighted_home_win_pct * 100).toFixed(1)}%
              </div>
              <div className="stat-label">{dual.home_short} Win</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{dual.market.total_predictions}</div>
              <div className="stat-label">Predictions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: teamColors.away }}>
                {(dual.market.weighted_away_win_pct * 100).toFixed(1)}%
              </div>
              <div className="stat-label">{dual.away_short} Win</div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}

function BoutRow({ bout, homeColor, awayColor, homeWinBase }) {
  const outcomeLabels = ['Fall', 'TF', 'MD', 'Dec', 'Dec', 'MD', 'TF', 'Fall'];
  const probs = bout.base_probs || [];
  const condProbs = bout.conditional_home_win || [];

  return (
    <div className="bout-row" style={{
      gridTemplateColumns: '60px 1fr 40px 1fr auto',
    }}>
      {/* Weight */}
      <div className="bout-weight">{bout.weight_class}</div>

      {/* Home wrestler */}
      <div className="bout-wrestler">
        <span className="name" style={{ color: homeColor }}>
          {bout.home_wrestler_name || 'TBD'}
        </span>
        {bout.home_ranking && <span className="rank">#{bout.home_ranking}</span>}
        {bout.home_wins !== null && (
          <span className="record">{bout.home_wins}-{bout.home_losses}</span>
        )}
      </div>

      {/* vs */}
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>vs</div>

      {/* Away wrestler */}
      <div className="bout-wrestler">
        <span className="name" style={{ color: awayColor }}>
          {bout.away_wrestler_name || 'TBD'}
        </span>
        {bout.away_ranking && <span className="rank">#{bout.away_ranking}</span>}
        {bout.away_wins !== null && (
          <span className="record">{bout.away_wins}-{bout.away_losses}</span>
        )}
      </div>

      {/* Outcome probabilities */}
      <div style={{
        display: 'flex',
        gap: '2px',
        fontSize: '10px',
        fontFamily: 'monospace',
      }}>
        {probs.map((p, i) => {
          const isHome = i >= 4;
          const color = isHome ? homeColor : awayColor;
          const delta = condProbs[i] !== undefined
            ? ((condProbs[i] - homeWinBase) * 100).toFixed(1)
            : null;
          return (
            <div
              key={i}
              style={{
                padding: '4px 6px',
                borderRadius: '3px',
                background: `${color}20`,
                color: color,
                textAlign: 'center',
                minWidth: '36px',
              }}
              title={`${outcomeLabels[i]}: ${p.toFixed(1)}% | If this: Home win ${condProbs[i] ? (condProbs[i] * 100).toFixed(1) : '?'}%`}
            >
              <div style={{ fontWeight: '700' }}>{p.toFixed(0)}%</div>
              <div style={{ fontSize: '8px', opacity: 0.7 }}>{outcomeLabels[i]}</div>
              {delta && (
                <div className={`cond-prob ${parseFloat(delta) >= 0 ? 'positive' : 'negative'}`}>
                  {parseFloat(delta) >= 0 ? '+' : ''}{delta}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Result if completed */}
      {bout.status === 'completed' && bout.winner && (
        <div style={{
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          background: bout.winner === 'home' ? `${homeColor}30` : `${awayColor}30`,
          color: bout.winner === 'home' ? homeColor : awayColor,
          fontSize: '12px',
          fontWeight: '700',
        }}>
          {bout.winner === 'home' ? bout.home_wrestler_name : bout.away_wrestler_name} ({bout.outcome_type})
        </div>
      )}
    </div>
  );
}
