import React from 'react';

export default function SimulationViz({ simulation, bouts, market, homeColor, awayColor, homeShort, awayShort }) {
  if (!simulation) return null;

  const { homeWin, awayWin, tie, diffProbs } = simulation;

  // Build histogram data from diffProbs
  const maxDiff = 60;
  const histogramBars = [];
  let maxProb = 0;

  for (let d = -30; d <= 30; d++) {
    const idx = d + maxDiff;
    const prob = diffProbs[idx] || 0;
    if (prob > maxProb) maxProb = prob;
    if (prob > 0.0001) {
      histogramBars.push({ diff: d, prob });
    }
  }

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      {/* Win probabilities */}
      <div className="card" style={{ flex: '1', minWidth: '300px' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '18px',
          letterSpacing: '1px',
          marginBottom: '20px',
          color: 'var(--text-secondary)',
        }}>
          Dual Win Probability
        </h3>

        {/* Big probability display */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="win-prob" style={{ color: homeColor }}>
              {(homeWin * 100).toFixed(1)}%
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '14px',
              color: homeColor,
              letterSpacing: '2px',
            }}>
              {homeShort}
            </div>
          </div>

          {tie > 0.001 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '20px',
                color: 'var(--accent-gold)',
              }}>
                {(tie * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TIE</div>
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <div className="win-prob" style={{ color: awayColor }}>
              {(awayWin * 100).toFixed(1)}%
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '14px',
              color: awayColor,
              letterSpacing: '2px',
            }}>
              {awayShort}
            </div>
          </div>
        </div>

        {/* Probability bar */}
        <div style={{
          display: 'flex',
          height: '12px',
          borderRadius: '6px',
          overflow: 'hidden',
          background: 'var(--bg-input)',
        }}>
          <div style={{
            width: `${(homeWin * 100).toFixed(1)}%`,
            background: homeColor,
            transition: 'width 0.5s',
          }} />
          {tie > 0.001 && (
            <div style={{
              width: `${(tie * 100).toFixed(1)}%`,
              background: 'var(--accent-gold)',
            }} />
          )}
          <div style={{
            width: `${(awayWin * 100).toFixed(1)}%`,
            background: awayColor,
            transition: 'width 0.5s',
          }} />
        </div>

        {/* Market comparison */}
        {market && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
          }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>
              Market Consensus ({market.total_predictions} predictions)
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: homeColor }}>
                {homeShort}: {(market.weighted_home_win_pct * 100).toFixed(1)}%
              </span>
              <span style={{ color: awayColor }}>
                {awayShort}: {(market.weighted_away_win_pct * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Score differential histogram */}
      <div className="card" style={{ flex: '1.5', minWidth: '400px' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '18px',
          letterSpacing: '1px',
          marginBottom: '16px',
          color: 'var(--text-secondary)',
        }}>
          Score Differential Distribution
        </h3>

        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          height: '150px',
          gap: '1px',
          padding: '0 4px',
        }}>
          {histogramBars.map(({ diff, prob }) => {
            const height = maxProb > 0 ? (prob / maxProb) * 140 : 0;
            const color = diff > 0 ? homeColor
              : diff < 0 ? awayColor
              : 'var(--accent-gold)';

            return (
              <div
                key={diff}
                style={{
                  flex: 1,
                  minWidth: '3px',
                  maxWidth: '12px',
                  height: `${height}px`,
                  background: color,
                  borderRadius: '2px 2px 0 0',
                  opacity: 0.8,
                  transition: 'height 0.3s',
                }}
                title={`Diff: ${diff > 0 ? '+' : ''}${diff}, Prob: ${(prob * 100).toFixed(2)}%`}
              />
            );
          })}
        </div>

        {/* Axis labels */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: 'var(--text-muted)',
          marginTop: '4px',
          padding: '0 4px',
        }}>
          <span style={{ color: awayColor }}>{awayShort} wins</span>
          <span>0</span>
          <span style={{ color: homeColor }}>{homeShort} wins</span>
        </div>
      </div>
    </div>
  );
}
