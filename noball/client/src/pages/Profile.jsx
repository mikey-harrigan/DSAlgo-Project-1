import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api.js';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !userId || (currentUser && parseInt(userId) === currentUser.id);
  const targetId = userId || currentUser?.id;

  useEffect(() => {
    if (!targetId) { setLoading(false); return; }

    Promise.all([
      api.get(`/rankings/${targetId}`),
      isOwnProfile ? api.get('/predictions/mine?limit=50') : api.get(`/predictions/stats/${targetId}`),
    ])
      .then(([profileData, predData]) => {
        setProfile(profileData);
        setPredictions(isOwnProfile ? predData : (predData.history || []));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [targetId, isOwnProfile]);

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  if (!currentUser && isOwnProfile) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ marginBottom: '12px' }}>Log in to view your profile</h2>
        <Link to="/login" className="btn btn-primary">Login</Link>
      </div>
    );
  }

  if (!profile) {
    return <div className="card" style={{ textAlign: 'center', padding: '40px' }}>User not found.</div>;
  }

  const accuracy = profile.total_predictions > 0
    ? ((profile.correct_predictions / profile.total_predictions) * 100).toFixed(1)
    : '0.0';

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        marginBottom: '32px',
        marginTop: '24px',
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'var(--accent-blue)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: '32px',
          color: 'white',
        }}>
          {(profile.display_name || profile.username || '?').charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="page-title" style={{ fontSize: '36px' }}>
            {profile.display_name || profile.username}
          </h1>
          <p className="page-subtitle">
            @{profile.username} &middot; Member since {new Date(profile.created_at).toLocaleDateString()}
          </p>
          {profile.global_rank && (
            <span className="tag" style={{
              background: 'rgba(255, 193, 7, 0.15)',
              color: 'var(--accent-gold)',
              marginTop: '6px',
            }}>
              Global Rank #{profile.global_rank}
              {profile.percentile !== null && ` (Top ${100 - profile.percentile}%)`}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>
            {Math.round(profile.elo_rating)}
          </div>
          <div className="stat-label">ELO Rating</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-green)' }}>
            {accuracy}%
          </div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-gold)' }}>
            {(profile.calibration_score || 0).toFixed(3)}
          </div>
          <div className="stat-label">Brier Score (lower = better)</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>
            {profile.total_predictions}
          </div>
          <div className="stat-label">Total Predictions</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '20px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '4px',
      }}>
        {['overview', 'predictions', 'elo_history'].map(t => (
          <button
            key={t}
            className={`btn btn-ghost ${tab === t ? '' : ''}`}
            style={{
              borderBottom: tab === t ? '2px solid var(--accent-blue)' : '2px solid transparent',
              borderRadius: 0,
              color: tab === t ? 'var(--accent-blue)' : 'var(--text-secondary)',
            }}
            onClick={() => setTab(t)}
          >
            {t === 'overview' ? 'Overview' : t === 'predictions' ? 'Predictions' : 'ELO History'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid-2">
          <div className="card">
            <h3 style={{ marginBottom: '12px', fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>
              Performance Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>Accuracy</span>
                  <span style={{ color: 'var(--accent-green)' }}>{accuracy}%</span>
                </div>
                <div className="prob-bar">
                  <div className="prob-bar-fill" style={{
                    width: `${accuracy}%`,
                    background: 'var(--accent-green)',
                  }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>Calibration</span>
                  <span style={{ color: 'var(--accent-gold)' }}>
                    {((1 - Math.min(1, profile.calibration_score || 1)) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="prob-bar">
                  <div className="prob-bar-fill" style={{
                    width: `${((1 - Math.min(1, profile.calibration_score || 1)) * 100).toFixed(0)}%`,
                    background: 'var(--accent-gold)',
                  }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span>Sharpness</span>
                  <span style={{ color: 'var(--accent-purple)' }}>
                    {((profile.sharpness_score || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="prob-bar">
                  <div className="prob-bar-fill" style={{
                    width: `${((profile.sharpness_score || 0) * 100).toFixed(0)}%`,
                    background: 'var(--accent-purple)',
                  }} />
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: '12px', fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>
              Win/Loss
            </h3>
            <div style={{ fontSize: '48px', fontFamily: 'var(--font-display)', textAlign: 'center', marginBottom: '8px' }}>
              <span style={{ color: 'var(--accent-green)' }}>{profile.correct_predictions}</span>
              <span style={{ color: 'var(--text-muted)' }}> - </span>
              <span style={{ color: 'var(--accent-red)' }}>
                {profile.total_predictions - profile.correct_predictions}
              </span>
            </div>
            <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
              {profile.correct_predictions}W {profile.total_predictions - profile.correct_predictions}L
            </div>
          </div>
        </div>
      )}

      {tab === 'predictions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {predictions.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No predictions yet.
            </div>
          )}
          {predictions.map((p, i) => (
            <div key={i} className="card" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
            }}>
              <div>
                <Link to={`/dual/${p.dual_id}`} style={{ fontWeight: '600', fontSize: '14px' }}>
                  <span style={{ color: p.home_color }}>{p.home_short}</span>
                  <span style={{ color: 'var(--text-muted)' }}> vs </span>
                  <span style={{ color: p.away_color }}>{p.away_short}</span>
                </Link>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {p.mode?.replace('_', ' ')} &middot; {new Date(p.submitted_at || p.scheduled_at).toLocaleDateString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {p.is_graded ? (
                  <>
                    <span style={{
                      color: p.is_correct ? 'var(--accent-green)' : 'var(--accent-red)',
                      fontWeight: '700',
                    }}>
                      {p.is_correct ? 'W' : 'L'}
                    </span>
                    {p.brier_score !== null && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Brier: {p.brier_score?.toFixed(3)}
                      </div>
                    )}
                  </>
                ) : (
                  <span className="tag tag-upcoming">Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'elo_history' && (
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontFamily: 'var(--font-display)', letterSpacing: '1px' }}>
            Recent Performance
          </h3>
          {(profile.recentScores || []).length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No graded predictions yet.</p>
          ) : (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '120px' }}>
              {(profile.recentScores || []).reverse().map((s, i) => {
                const height = Math.max(10, s.score * 100);
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${height}px`,
                      background: s.score >= 0.5 ? 'var(--accent-green)' : 'var(--accent-red)',
                      borderRadius: '3px 3px 0 0',
                      opacity: 0.7,
                    }}
                    title={`${s.home_short} vs ${s.away_short}: ${s.score?.toFixed(2)}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
