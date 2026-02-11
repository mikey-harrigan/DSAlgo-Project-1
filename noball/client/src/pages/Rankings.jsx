import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api.js';

export default function Rankings() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('elo');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/rankings?sort=${sort}&limit=100`)
      .then(data => {
        setUsers(data.users);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sort]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Rankings</h1>
        <p className="page-subtitle">
          Global leaderboard. {total} predictors ranked.
        </p>
      </div>

      {/* Sort options */}
      <div className="filters-bar">
        <label style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sort by:</label>
        {[
          { key: 'elo', label: 'ELO Rating' },
          { key: 'accuracy', label: 'Accuracy' },
          { key: 'calibration', label: 'Calibration' },
          { key: 'sharpness', label: 'Sharpness' },
          { key: 'predictions', label: 'Volume' },
        ].map(s => (
          <button
            key={s.key}
            className={`btn btn-sm ${sort === s.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSort(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Rank</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>User</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>ELO</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Accuracy</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Brier Score</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Predictions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    background: i < 3 ? `rgba(255, 193, 7, ${0.06 - i * 0.015})` : 'transparent',
                  }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '20px',
                      color: i === 0 ? 'var(--accent-gold)'
                        : i === 1 ? '#C0C0C0'
                        : i === 2 ? '#CD7F32'
                        : 'var(--text-muted)',
                    }}>
                      {u.global_rank || i + 1}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Link to={`/profile/${u.id}`} style={{ fontWeight: '600', fontSize: '14px' }}>
                      {u.display_name || u.username}
                    </Link>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }}>
                    {Math.round(u.elo_rating)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <span style={{
                      color: u.accuracy_score > 0.6 ? 'var(--accent-green)' : 'var(--text-secondary)',
                    }}>
                      {(u.accuracy_score * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'monospace' }}>
                    {(u.calibration_score || 0).toFixed(3)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>
                    {u.total_predictions}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No ranked users yet. Start making predictions to appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
