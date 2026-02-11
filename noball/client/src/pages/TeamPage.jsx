import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api.js';
import DualCard from '../components/DualCard.jsx';

export default function TeamPage() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/teams/${id}`)
      .then(setTeam)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!team) return <div className="card" style={{ textAlign: 'center', padding: '40px' }}>Team not found.</div>;

  return (
    <div>
      {/* Header */}
      <div style={{
        padding: '32px',
        marginBottom: '24px',
        borderRadius: 'var(--radius-lg)',
        background: `linear-gradient(135deg, ${team.primary_color}40, ${team.primary_color}10)`,
        border: `2px solid ${team.primary_color}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="team-logo" style={{
            background: team.primary_color,
            width: '80px', height: '80px',
            fontSize: '28px',
          }}>
            {team.short_name}
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '42px',
              color: team.primary_color,
              letterSpacing: '2px',
            }}>
              {team.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {team.mascot} &middot; {team.conference}
            </p>
          </div>
        </div>
      </div>

      {/* Roster */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', letterSpacing: '1px', marginBottom: '16px' }}>
          Roster
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{
              fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px',
              color: 'var(--text-muted)', background: 'var(--bg-secondary)',
            }}>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Weight</th>
              <th style={{ padding: '10px 12px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Rank</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>ELO</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Record</th>
            </tr>
          </thead>
          <tbody>
            {(team.wrestlers || []).map(w => (
              <tr key={w.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '10px 12px', fontFamily: 'var(--font-display)', fontSize: '18px' }}>
                  {w.weight_class}
                </td>
                <td style={{ padding: '10px 12px', fontWeight: '600' }}>{w.name}</td>
                <td style={{
                  padding: '10px 12px', textAlign: 'right',
                  color: w.ranking ? 'var(--accent-gold)' : 'var(--text-muted)',
                }}>
                  {w.ranking ? `#${w.ranking}` : '-'}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                  {Math.round(w.elo_rating)}
                </td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  {w.wins}-{w.losses}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upcoming Duals */}
      {team.upcomingDuals && team.upcomingDuals.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', letterSpacing: '1px', marginBottom: '12px' }}>
            Upcoming Duals
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {team.upcomingDuals.map(d => <DualCard key={d.id} dual={d} />)}
          </div>
        </div>
      )}

      {/* Recent Results */}
      {team.recentResults && team.recentResults.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', letterSpacing: '1px', marginBottom: '12px' }}>
            Recent Results
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {team.recentResults.map(d => (
              <Link key={d.id} to={`/dual/${d.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px',
                }}>
                  <div>
                    <span style={{ fontWeight: '600' }}>{d.home_team_name}</span>
                    <span style={{ color: 'var(--text-muted)' }}> vs </span>
                    <span style={{ fontWeight: '600' }}>{d.away_team_name}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px' }}>
                    {d.home_score} - {d.away_score}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Flavor */}
      {team.flavor && team.flavor.length > 0 && (
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', letterSpacing: '1px', marginBottom: '12px' }}>
            The Culture
          </h3>
          {team.flavor.map((f, i) => (
            <div key={i} style={{
              padding: '10px 14px',
              marginBottom: '6px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)',
              borderLeft: `3px solid ${team.primary_color}`,
              fontSize: '13px',
            }}>
              <span className="tag" style={{
                background: `${team.primary_color}20`,
                color: team.primary_color,
                marginRight: '8px',
              }}>
                {f.type}
              </span>
              {f.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
