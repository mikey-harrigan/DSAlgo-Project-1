import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api.js';
import DualCard from '../components/DualCard.jsx';

export default function Browse() {
  const [duals, setDuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'upcoming,live',
    conference: '',
    search: '',
    postseason: '',
    sort: 'scheduled_at',
    order: 'ASC',
  });
  const [conferences, setConferences] = useState([]);

  useEffect(() => {
    api.get('/teams/meta/conferences')
      .then(setConferences)
      .catch(console.error);
  }, []);

  const fetchDuals = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    api.get(`/duals?${params}`)
      .then(setDuals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    fetchDuals();
  }, [fetchDuals]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Browse Duals</h1>
        <p className="page-subtitle">
          Every NCAA DI wrestling dual. Pick your battles.
        </p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select
          value={filters.status}
          onChange={e => updateFilter('status', e.target.value)}
        >
          <option value="upcoming,live">Upcoming & Live</option>
          <option value="upcoming">Upcoming</option>
          <option value="live">Live</option>
          <option value="completed">Completed</option>
          <option value="all">All</option>
        </select>

        <select
          value={filters.conference}
          onChange={e => updateFilter('conference', e.target.value)}
        >
          <option value="">All Conferences</option>
          {conferences.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={filters.postseason}
          onChange={e => updateFilter('postseason', e.target.value)}
        >
          <option value="">Regular & Postseason</option>
          <option value="0">Regular Season</option>
          <option value="1">Postseason</option>
        </select>

        <select
          value={filters.sort}
          onChange={e => updateFilter('sort', e.target.value)}
        >
          <option value="scheduled_at">By Date</option>
          <option value="market_predictions">By Market Activity</option>
        </select>

        <input
          type="text"
          placeholder="Search teams, events..."
          value={filters.search}
          onChange={e => updateFilter('search', e.target.value)}
          style={{ flex: 1, minWidth: '200px' }}
        />

        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setFilters({
            status: 'upcoming,live', conference: '', search: '',
            postseason: '', sort: 'scheduled_at', order: 'ASC',
          })}
        >
          Reset
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {duals.map(d => <DualCard key={d.id} dual={d} />)}
          {duals.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No duals found matching your filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
