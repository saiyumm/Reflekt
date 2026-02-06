import express from 'express';
import cors from 'cors';
import db, { initDb, ATTACHMENTS_DIR } from './db';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize database
initDb();

// Serve attachment files statically
app.use('/api/attachments/files', express.static(ATTACHMENTS_DIR));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/updates — list all updates with optional filters
app.get('/api/updates', (req, res) => {
  try {
    const { from, to, category, tag, search } = req.query as Record<string, string | undefined>;

    let query = 'SELECT * FROM updates WHERE 1=1';
    const params: string[] = [];

    if (from) {
      query += ' AND date >= ?';
      params.push(from);
    }
    if (to) {
      query += ' AND date <= ?';
      params.push(to);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (tag) {
      query += ' AND tags LIKE ?';
      params.push(`%"${tag}"%`);
    }
    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const updates = db.prepare(query).all(...params) as Record<string, unknown>[];

    const parsed = updates.map((u) => ({
      ...u,
      tags: JSON.parse((u.tags as string) || '[]'),
      isAutoCategorized: Boolean(u.is_auto_categorized),
    }));

    res.json(parsed);
  } catch (err) {
    console.error('Error fetching updates:', err);
    res.status(500).json({ error: 'Failed to fetch updates' });
  }
});

// GET /api/stats — stats for sidebar
app.get('/api/stats', (_req, res) => {
  try {
    const totalResult = db.prepare('SELECT COUNT(*) as count FROM updates').get() as { count: number };
    const byCategory = db.prepare(
      'SELECT category, COUNT(*) as count FROM updates GROUP BY category'
    ).all() as { category: string; count: number }[];

    res.json({
      total: totalResult.count,
      byCategory,
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.listen(PORT, () => {
  console.log(`Reflekt API server running on http://localhost:${PORT}`);
});
