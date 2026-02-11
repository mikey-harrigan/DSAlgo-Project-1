import React from 'react';
import { Link } from 'react-router-dom';

export default function DualCard({ dual }) {
  const d = dual;
  const scheduledDate = new Date(d.scheduled_at);
  const dateStr = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
  const timeStr = scheduledDate.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });

  const statusTag = {
    live: 'tag-live',
    upcoming: 'tag-upcoming',
    completed: 'tag-completed',
  }[d.status] || 'tag-upcoming';

  return (
    <Link to={`/dual/${d.id}`} style={{ textDecoration: 'none' }}>
      <div className="dual-card">
        {/* Home team */}
        <div className="team-block">
          <div
            className="team-logo"
            style={{ background: d.home_color || '#333' }}
          >
            {d.home_short}
          </div>
          <div>
            <div className="team-name" style={{ color: d.home_color }}>
              {d.home_team_name}
            </div>
            {d.home_conference && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {d.home_conference}
              </div>
            )}
          </div>
        </div>

        {/* Center info */}
        <div className="meta">
          <span className={`tag ${statusTag}`} style={{ marginBottom: '4px' }}>
            {d.status}
          </span>

          {d.status === 'completed' ? (
            <div style={{ margin: '6px 0' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                color: d.home_score > d.away_score ? d.home_color : 'var(--text-muted)',
              }}>
                {d.home_score}
              </span>
              <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>-</span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                color: d.away_score > d.home_score ? d.away_color : 'var(--text-muted)',
              }}>
                {d.away_score}
              </span>
            </div>
          ) : (
            <>
              <div className="vs">VS</div>
              <div className="date">{dateStr} {timeStr}</div>
            </>
          )}

          {d.event_name && (
            <div className="event">{d.event_name}</div>
          )}

          {d.market_predictions > 0 && (
            <div className="market-line">
              <span style={{ color: d.home_color }}>
                {((d.market_home_pct || 0.5) * 100).toFixed(0)}%
              </span>
              <div className="prob-bar" style={{ flex: 1, height: '4px' }}>
                <div
                  className="prob-bar-fill"
                  style={{
                    width: `${((d.market_home_pct || 0.5) * 100).toFixed(0)}%`,
                    background: d.home_color,
                  }}
                />
              </div>
              <span style={{ color: d.away_color }}>
                {((d.market_away_pct || 0.5) * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        {/* Away team */}
        <div className="team-block away">
          <div
            className="team-logo"
            style={{ background: d.away_color || '#333' }}
          >
            {d.away_short}
          </div>
          <div>
            <div className="team-name" style={{ color: d.away_color }}>
              {d.away_team_name}
            </div>
            {d.away_conference && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {d.away_conference}
              </div>
            )}
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '4px', flexDirection: 'column', alignItems: 'flex-end', minWidth: '80px' }}>
          {d.is_postseason === 1 && <span className="tag tag-postseason">Postseason</span>}
          {d.is_favorite && <span className="tag" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple)' }}>Fav</span>}
        </div>
      </div>
    </Link>
  );
}
