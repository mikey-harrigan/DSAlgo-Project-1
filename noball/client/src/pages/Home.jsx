import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import DualCard from '../components/DualCard.jsx';

export default function Home() {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState([]);
  const [live, setLive] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/duals?status=upcoming&limit=6&sort=scheduled_at&order=ASC'),
      api.get('/duals?status=live&limit=5'),
      api.get('/market'),
    ])
      .then(([upcomingData, liveData, marketData]) => {
        setUpcoming(upcomingData);
        setLive(liveData);
        setMarkets(marketData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loader"><div className="spinner" /></div>;
  }

  return (
    <div>
      {/* Hero */}
      <div style={{
        textAlign: 'center',
        padding: '60px 20px 40px',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '72px',
          letterSpacing: '6px',
          lineHeight: 1,
        }}>
          no<span style={{ color: 'var(--accent-blue)' }}>Ball</span>
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '18px',
          marginTop: '12px',
          maxWidth: '600px',
          margin: '12px auto 0',
        }}>
          NCAA DI Wrestling Prediction Market.
          Prove you know the sport better than everyone else.
        </p>

        {!user && (
          <div style={{ marginTop: '28px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/register" className="btn btn-primary" style={{ fontSize: '16px', padding: '14px 32px' }}>
              Get Started
            </Link>
            <Link to="/browse" className="btn btn-outline" style={{ fontSize: '16px', padding: '14px 32px' }}>
              Browse Duals
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>
            {upcoming.length + live.length}+
          </div>
          <div className="stat-label">Upcoming Duals</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-green)' }}>72</div>
          <div className="stat-label">DI Programs</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-gold)' }}>5</div>
          <div className="stat-label">Prediction Modes</div>
        </div>
        <div className="card stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>
            {markets.length}
          </div>
          <div className="stat-label">Active Markets</div>
        </div>
      </div>

      {/* Live Duals */}
      {live.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <h2 className="page-title" style={{ fontSize: '28px', marginBottom: '16px' }}>
            <span className="tag tag-live" style={{ marginRight: '10px' }}>LIVE</span>
            In Progress
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {live.map(d => <DualCard key={d.id} dual={d} />)}
          </div>
        </section>
      )}

      {/* Upcoming */}
      <section style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="page-title" style={{ fontSize: '28px' }}>Upcoming Duals</h2>
          <Link to="/browse" className="btn btn-ghost">View All</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {upcoming.map(d => <DualCard key={d.id} dual={d} />)}
          {upcoming.length === 0 && (
            <p style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>
              No upcoming duals found. Check back soon.
            </p>
          )}
        </div>
      </section>

      {/* Hot Markets */}
      {markets.length > 0 && (
        <section>
          <h2 className="page-title" style={{ fontSize: '28px', marginBottom: '16px' }}>Hot Markets</h2>
          <div className="grid-3">
            {markets.slice(0, 6).map(m => (
              <Link key={m.dual_id} to={`/dual/${m.dual_id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="team-name" style={{ color: m.home_color }}>{m.home_short}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>vs</span>
                    <span className="team-name" style={{ color: m.away_color }}>{m.away_short}</span>
                  </div>
                  <div className="prob-bar" style={{ marginBottom: '8px' }}>
                    <div
                      className="prob-bar-fill"
                      style={{
                        width: `${(m.weighted_home_win_pct * 100).toFixed(0)}%`,
                        background: `linear-gradient(90deg, ${m.home_color}, ${m.away_color})`,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: m.home_color }}>
                      {(m.weighted_home_win_pct * 100).toFixed(0)}%
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {m.total_predictions} prediction{m.total_predictions !== 1 ? 's' : ''}
                    </span>
                    <span style={{ color: m.away_color }}>
                      {(m.weighted_away_win_pct * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section style={{ marginTop: '48px' }}>
        <h2 className="page-title" style={{ fontSize: '28px', marginBottom: '20px', textAlign: 'center' }}>
          How It Works
        </h2>
        <div className="grid-3">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px', fontFamily: 'var(--font-display)' }}>1</div>
            <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Pick a Dual</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Browse upcoming NCAA DI wrestling duals. Filter by team, conference, or tournament.
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px', fontFamily: 'var(--font-display)' }}>2</div>
            <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Make Predictions</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Team pickems, bout-by-bout picks, full probability assignments,
              or over/under on the market line.
            </p>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px', fontFamily: 'var(--font-display)' }}>3</div>
            <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Build Your Edge</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Your accuracy, calibration, and sharpness determine your ranking.
              Sharp predictions move the market. Be the edge on Kalshi.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
