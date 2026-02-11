import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDb } from './db.js';
import authRoutes from './routes/auth.js';
import teamsRoutes from './routes/teams.js';
import dualsRoutes from './routes/duals.js';
import predictionsRoutes from './routes/predictions.js';
import rankingsRoutes from './routes/rankings.js';
import friendsRoutes from './routes/friends.js';
import challengesRoutes from './routes/challenges.js';
import adminRoutes from './routes/admin.js';
import marketRoutes from './routes/market.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static client build
app.use(express.static(join(__dirname, '..', 'client', 'dist')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/duals', dualsRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/rankings', rankingsRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/market', marketRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '..', 'client', 'dist', 'index.html'));
});

// Initialize DB on startup
try {
  getDb();
  console.log('Database initialized successfully');
} catch (err) {
  console.error('Failed to initialize database:', err.message);
  process.exit(1);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`noBall server running on http://0.0.0.0:${PORT}`);
});

export default app;
