import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import { useAuth } from '../hooks/useAuth.jsx';

export default function Friends() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState({ incoming: [], outgoing: [] });
  const [challenges, setChallenges] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [tab, setTab] = useState('friends');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchData();
  }, [user]);

  const fetchData = () => {
    Promise.all([
      api.get('/friends'),
      api.get('/friends/pending'),
      api.get('/challenges/mine'),
    ])
      .then(([f, p, c]) => {
        setFriends(f);
        setPending(p);
        setChallenges(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const searchUsers = () => {
    if (searchQuery.length < 2) return;
    api.get(`/friends/search/${encodeURIComponent(searchQuery)}`)
      .then(setSearchResults)
      .catch(console.error);
  };

  const sendRequest = async (friendId) => {
    await api.post('/friends/request', { userId: friendId });
    searchUsers();
    fetchData();
  };

  const handleRequest = async (friendshipId, action) => {
    await api.put(`/friends/${friendshipId}`, { action });
    fetchData();
  };

  const removeFriend = async (friendId) => {
    await api.delete(`/friends/${friendId}`);
    fetchData();
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Friends</h1>
        <p className="page-subtitle">
          Challenge friends to head-to-head prediction battles.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
        {[
          { key: 'friends', label: `Friends (${friends.length})` },
          { key: 'pending', label: `Pending (${pending.incoming.length})` },
          { key: 'challenges', label: `Challenges (${challenges.length})` },
          { key: 'search', label: 'Find Users' },
        ].map(t => (
          <button
            key={t.key}
            className="btn btn-ghost"
            style={{
              borderBottom: tab === t.key ? '2px solid var(--accent-blue)' : '2px solid transparent',
              borderRadius: 0,
              color: tab === t.key ? 'var(--accent-blue)' : 'var(--text-secondary)',
            }}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Friends list */}
      {tab === 'friends' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {friends.map(f => (
            <div key={f.id} className="card" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'var(--accent-purple)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', color: 'white',
                }}>
                  {(f.display_name || f.username).charAt(0).toUpperCase()}
                </div>
                <div>
                  <Link to={`/profile/${f.id}`} style={{ fontWeight: '600' }}>
                    {f.display_name || f.username}
                  </Link>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    ELO: {Math.round(f.elo_rating)} &middot; {f.total_predictions} predictions
                    {f.global_rank && ` &middot; Rank #${f.global_rank}`}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link to={`/profile/${f.id}`} className="btn btn-ghost btn-sm">Profile</Link>
                <button className="btn btn-danger btn-sm" onClick={() => removeFriend(f.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
          {friends.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No friends yet. Use the Find Users tab to add some.
            </div>
          )}
        </div>
      )}

      {/* Pending requests */}
      {tab === 'pending' && (
        <div>
          {pending.incoming.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>Incoming Requests</h3>
              {pending.incoming.map(r => (
                <div key={r.friendship_id} className="card" style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 20px', marginBottom: '8px',
                }}>
                  <span style={{ fontWeight: '600' }}>{r.display_name || r.username}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-success btn-sm" onClick={() => handleRequest(r.friendship_id, 'accept')}>
                      Accept
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleRequest(r.friendship_id, 'decline')}>
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {pending.outgoing.length > 0 && (
            <div>
              <h3 style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>Sent Requests</h3>
              {pending.outgoing.map(r => (
                <div key={r.friendship_id} className="card" style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 20px', marginBottom: '8px',
                }}>
                  <span>{r.display_name || r.username}</span>
                  <span className="tag tag-upcoming">Pending</span>
                </div>
              ))}
            </div>
          )}
          {pending.incoming.length === 0 && pending.outgoing.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No pending requests.
            </div>
          )}
        </div>
      )}

      {/* Challenges */}
      {tab === 'challenges' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {challenges.map(c => (
            <div key={c.id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontWeight: '600' }}>{c.creator_display || c.creator_name}</span>
                  <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>vs</span>
                  <span style={{ fontWeight: '600' }}>{c.opponent_display || c.opponent_name}</span>
                </div>
                <span className={`tag ${c.status === 'completed' ? 'tag-completed' : c.status === 'accepted' ? 'tag-upcoming' : ''}`}>
                  {c.status}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span style={{ color: c.home_color }}>{c.home_short}</span>
                <span style={{ color: 'var(--text-muted)' }}> vs </span>
                <span style={{ color: c.away_color }}>{c.away_short}</span>
                <span style={{ color: 'var(--text-muted)' }}> &middot; {c.mode?.replace('_', ' ')}</span>
              </div>
              {c.status === 'pending' && c.opponent_id === user.id && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  <button className="btn btn-success btn-sm" onClick={async () => {
                    await api.put(`/challenges/${c.id}`, { action: 'accept' });
                    fetchData();
                  }}>
                    Accept
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={async () => {
                    await api.put(`/challenges/${c.id}`, { action: 'decline' });
                    fetchData();
                  }}>
                    Decline
                  </button>
                </div>
              )}
              {c.status === 'completed' && c.winner_name && (
                <div style={{ marginTop: '8px', color: 'var(--accent-gold)', fontWeight: '700' }}>
                  Winner: {c.winner_name}
                </div>
              )}
            </div>
          ))}
          {challenges.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No challenges yet. Challenge a friend from their profile.
            </div>
          )}
        </div>
      )}

      {/* Search */}
      {tab === 'search' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchUsers()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={searchUsers}>Search</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {searchResults.map(u => {
              const isFriend = friends.some(f => f.id === u.id);
              return (
                <div key={u.id} className="card" style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 20px',
                }}>
                  <div>
                    <Link to={`/profile/${u.id}`} style={{ fontWeight: '600' }}>
                      {u.display_name || u.username}
                    </Link>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      ELO: {Math.round(u.elo_rating)}
                      {u.global_rank && ` &middot; Rank #${u.global_rank}`}
                    </div>
                  </div>
                  {isFriend ? (
                    <span className="tag tag-completed">Friends</span>
                  ) : (
                    <button className="btn btn-primary btn-sm" onClick={() => sendRequest(u.id)}>
                      Add Friend
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
