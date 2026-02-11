import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api.js';

export default function Market() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/market')
      .then(setMarkets)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Prediction Market</h1>
        <p className="page-subtitle">
          Aggregated predictions weighted by predictor quality.
          Sharps move the line. Find the edge.
        </p>
      </div>

      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : markets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <h2 style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>No Active Markets</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
            Markets form when users submit predictions on upcoming duals.
          </p>
          <Link to="/browse" className="btn btn-primary">Browse Duals</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {markets.map(m => {
            const homePct = (m.weighted_home_win_pct * 100).toFixed(1);
            const awayPct = (m.weighted_away_win_pct * 100).toFixed(1);
            const impliedHomeOdds = homePct > 50
              ? `-${Math.round(homePct / (100 - homePct) * 100)}`
              : `+${Math.round((100 - homePct) / homePct * 100)}`;
            const impliedAwayOdds = awayPct > 50
              ? `-${Math.round(awayPct / (100 - awayPct) * 100)}`
              : `+${Math.round((100 - awayPct) / awayPct * 100)}`;

            return (
              <Link key={m.dual_id} to={`/dual/${m.dual_id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  padding: '20px',
                  transition: 'all 0.2s',
                }}>
                  {/* Home team */}
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div className="team-logo" style={{
                      background: m.home_color || '#333',
                      margin: '0 auto 8px',
                    }}>
                      {m.home_short}
                    </div>
                    <div style={{ fontWeight: '700', color: m.home_color }}>{m.home_team_name}</div>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '28px',
                      color: m.home_color,
                      marginTop: '4px',
                    }}>
                      {homePct}%
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {impliedHomeOdds}
                    </div>
                  </div>

                  {/* Center */}
                  <div style={{ textAlign: 'center', minWidth: '120px' }}>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '16px',
                      color: 'var(--text-muted)',
                      letterSpacing: '2px',
                      marginBottom: '8px',
                    }}>
                      VS
                    </div>
                    <div className="prob-bar" style={{ marginBottom: '8px' }}>
                      <div
                        className="prob-bar-fill"
                        style={{
                          width: `${homePct}%`,
                          background: `linear-gradient(90deg, ${m.home_color}, ${m.away_color})`,
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {m.total_predictions} prediction{m.total_predictions !== 1 ? 's' : ''}
                    </div>
                    {m.event_name && (
                      <div className="tag tag-upcoming" style={{ marginTop: '6px' }}>
                        {m.event_name}
                      </div>
                    )}
                    {m.is_postseason === 1 && (
                      <div className="tag tag-postseason" style={{ marginTop: '4px' }}>Postseason</div>
                    )}
                  </div>

                  {/* Away team */}
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div className="team-logo" style={{
                      background: m.away_color || '#333',
                      margin: '0 auto 8px',
                    }}>
                      {m.away_short}
                    </div>
                    <div style={{ fontWeight: '700', color: m.away_color }}>{m.away_team_name}</div>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '28px',
                      color: m.away_color,
                      marginTop: '4px',
                    }}>
                      {awayPct}%
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {impliedAwayOdds}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Explanation */}
      <div className="card" style={{ marginTop: '32px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', letterSpacing: '1px', marginBottom: '12px' }}>
          How Market Pricing Works
        </h3>
        <div className="grid-2">
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--accent-blue)' }}>
              Weighted Consensus
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              Predictions are weighted by the user's track record. Accuracy, calibration (Brier score),
              sharpness, and prediction volume all factor in. A sharp predictor with a strong history
              moves the line more than a new user.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--accent-green)' }}>
              Finding the Edge
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              When noBall's market consensus diverges from external odds (when wrestling markets emerge
              on Kalshi/Polymarket), that's where the edge lives. Be the sharp that identifies
              mispriced outcomes before the market corrects.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
