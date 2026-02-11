import { Router } from 'express';
import { getDb } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get friends list
router.get('/', authenticate, (req, res) => {
  const db = getDb();

  const friends = db.prepare(`
    SELECT u.id, u.username, u.display_name, u.avatar_url,
           u.elo_rating, u.global_rank, u.total_predictions,
           u.accuracy_score, f.status, f.created_at as friendship_date
    FROM friendships f
    JOIN users u ON (
      CASE WHEN f.user_id = ? THEN f.friend_id ELSE f.user_id END
    ) = u.id
    WHERE (f.user_id = ? OR f.friend_id = ?)
    AND f.status = 'accepted'
    ORDER BY u.elo_rating DESC
  `).all(req.userId, req.userId, req.userId);

  res.json(friends);
});

// Get pending friend requests
router.get('/pending', authenticate, (req, res) => {
  const db = getDb();

  const incoming = db.prepare(`
    SELECT u.id, u.username, u.display_name, u.avatar_url,
           u.elo_rating, f.id as friendship_id, f.created_at
    FROM friendships f
    JOIN users u ON f.user_id = u.id
    WHERE f.friend_id = ? AND f.status = 'pending'
    ORDER BY f.created_at DESC
  `).all(req.userId);

  const outgoing = db.prepare(`
    SELECT u.id, u.username, u.display_name, u.avatar_url,
           u.elo_rating, f.id as friendship_id, f.created_at
    FROM friendships f
    JOIN users u ON f.friend_id = u.id
    WHERE f.user_id = ? AND f.status = 'pending'
    ORDER BY f.created_at DESC
  `).all(req.userId);

  res.json({ incoming, outgoing });
});

// Send friend request
router.post('/request', authenticate, (req, res) => {
  const { userId: friendId } = req.body;

  if (!friendId || friendId === req.userId) {
    return res.status(400).json({ error: 'Invalid friend ID' });
  }

  const db = getDb();

  const friend = db.prepare('SELECT id FROM users WHERE id = ?').get(friendId);
  if (!friend) return res.status(404).json({ error: 'User not found' });

  // Check existing friendship
  const existing = db.prepare(`
    SELECT * FROM friendships
    WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
  `).get(req.userId, friendId, friendId, req.userId);

  if (existing) {
    if (existing.status === 'accepted') {
      return res.status(400).json({ error: 'Already friends' });
    }
    if (existing.status === 'pending') {
      return res.status(400).json({ error: 'Friend request already pending' });
    }
    if (existing.status === 'blocked') {
      return res.status(400).json({ error: 'Cannot send friend request' });
    }
  }

  db.prepare('INSERT INTO friendships (user_id, friend_id) VALUES (?, ?)').run(req.userId, friendId);
  res.status(201).json({ message: 'Friend request sent' });
});

// Accept/decline friend request
router.put('/:friendshipId', authenticate, (req, res) => {
  const { action } = req.body; // 'accept' or 'decline'
  const db = getDb();

  const friendship = db.prepare('SELECT * FROM friendships WHERE id = ?').get(req.params.friendshipId);
  if (!friendship) return res.status(404).json({ error: 'Request not found' });

  if (friendship.friend_id !== req.userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  if (action === 'accept') {
    db.prepare('UPDATE friendships SET status = ? WHERE id = ?').run('accepted', friendship.id);
    res.json({ message: 'Friend request accepted' });
  } else {
    db.prepare('DELETE FROM friendships WHERE id = ?').run(friendship.id);
    res.json({ message: 'Friend request declined' });
  }
});

// Remove friend
router.delete('/:friendId', authenticate, (req, res) => {
  const db = getDb();
  db.prepare(`
    DELETE FROM friendships
    WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
  `).run(req.userId, req.params.friendId, req.params.friendId, req.userId);

  res.json({ message: 'Friend removed' });
});

// Search users
router.get('/search/:query', authenticate, (req, res) => {
  const db = getDb();
  const term = `%${req.params.query}%`;

  const users = db.prepare(`
    SELECT id, username, display_name, avatar_url, elo_rating, global_rank
    FROM users
    WHERE (username LIKE ? OR display_name LIKE ?)
    AND id != ?
    LIMIT 20
  `).all(term, term, req.userId);

  res.json(users);
});

export default router;
