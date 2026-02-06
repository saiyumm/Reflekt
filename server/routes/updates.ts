import express from 'express';
import { nanoid } from 'nanoid';
import db from '../db.js';
import { parseAttachment } from './attachments.js';
import { categorize } from '../utils/categorize.js';

const router = express.Router();

// Helper to parse a raw SQLite row into the API shape
function parseUpdate(row: Record<string, unknown>) {
  return {
    ...row,
    tags: JSON.parse((row.tags as string) || '[]'),
    isAutoCategorized: Boolean(row.is_auto_categorized),
  };
}

// GET /updates — list all with optional filters (includes attachments)
router.get('/updates', (req, res) => {
  try {
    const { from, to, category, tag, search } = req.query as Record<string, string | undefined>;

    let query = 'SELECT * FROM updates WHERE 1=1';
    const params: string[] = [];

    if (from) { query += ' AND date >= ?'; params.push(from); }
    if (to) { query += ' AND date <= ?'; params.push(to); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (tag) { query += ' AND tags LIKE ?'; params.push(`%"${tag}"%`); }
    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY date DESC, created_at DESC';
    const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
    const parsed = rows.map(parseUpdate);

    // Batch-load attachments for all returned updates
    const updateIds = rows.map((r) => r.id as string);
    const attachmentMap = new Map<string, unknown[]>();

    if (updateIds.length > 0) {
      const placeholders = updateIds.map(() => '?').join(',');
      const attRows = db
        .prepare(
          `SELECT * FROM attachments WHERE update_id IN (${placeholders}) ORDER BY sort_order`,
        )
        .all(...updateIds) as Record<string, unknown>[];

      for (const att of attRows) {
        const uid = att.update_id as string;
        if (!attachmentMap.has(uid)) attachmentMap.set(uid, []);
        attachmentMap.get(uid)!.push(parseAttachment(att));
      }
    }

    const result = parsed.map((u: any) => ({
      ...u,
      attachments: attachmentMap.get(u.id as string) ?? [],
    }));

    res.json(result);
  } catch (err) {
    console.error('Error listing updates:', err);
    res.status(500).json({ error: 'Failed to list updates' });
  }
});

// GET /updates/:id — single update with attachments
router.get('/updates/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM updates WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
    if (!row) { res.status(404).json({ error: 'Update not found' }); return; }

    const attRows = db.prepare(
      'SELECT * FROM attachments WHERE update_id = ? ORDER BY sort_order'
    ).all(req.params.id) as Record<string, unknown>[];

    res.json({ ...parseUpdate(row), attachments: attRows.map(parseAttachment) });
  } catch (err) {
    console.error('Error getting update:', err);
    res.status(500).json({ error: 'Failed to get update' });
  }
});

// POST /updates — create
router.post('/updates', (req, res) => {
  try {
    const { title, description, date, category, tags, status } = req.body;

    if (!title || !date) {
      res.status(400).json({ error: 'Title and date are required' });
      return;
    }

    const id = nanoid();
    // Auto-categorize if no category provided or if it's 'other'
    let finalCategory = category;
    let isAutoCategorized = 0;
    if (!category || category === 'other') {
      const result = categorize(title, description);
      finalCategory = result.category;
      isAutoCategorized = result.confidence > 0 ? 1 : 0;
    }
    const finalTags = JSON.stringify(tags || []);
    const finalStatus = status || 'completed';

    db.prepare(`
      INSERT INTO updates (id, title, description, date, category, tags, status, is_auto_categorized)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, description || null, date, finalCategory, finalTags, finalStatus, isAutoCategorized);

    const created = db.prepare('SELECT * FROM updates WHERE id = ?').get(id) as Record<string, unknown>;
    res.status(201).json(parseUpdate(created));
  } catch (err) {
    console.error('Error creating update:', err);
    res.status(500).json({ error: 'Failed to create update' });
  }
});

// PUT /updates/:id — edit
router.put('/updates/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM updates WHERE id = ?').get(req.params.id);
    if (!existing) { res.status(404).json({ error: 'Update not found' }); return; }

    const { title, description, date, category, tags, status } = req.body;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (date !== undefined) { fields.push('date = ?'); values.push(date); }
    if (category !== undefined) {
      fields.push('category = ?'); values.push(category);
      fields.push('is_auto_categorized = ?'); values.push(0);
    }
    if (tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(tags)); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }

    if (fields.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    fields.push("updated_at = datetime('now')");
    values.push(req.params.id);

    db.prepare(`UPDATE updates SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM updates WHERE id = ?').get(req.params.id) as Record<string, unknown>;
    res.json(parseUpdate(updated));
  } catch (err) {
    console.error('Error updating update:', err);
    res.status(500).json({ error: 'Failed to update' });
  }
});

// DELETE /updates/:id
router.delete('/updates/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM updates WHERE id = ?').get(req.params.id);
    if (!existing) { res.status(404).json({ error: 'Update not found' }); return; }

    db.prepare('DELETE FROM updates WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting update:', err);
    res.status(500).json({ error: 'Failed to delete update' });
  }
});

// GET /stats — sidebar stats
router.get('/stats', (_req, res) => {
  try {
    const totalResult = db.prepare('SELECT COUNT(*) as count FROM updates').get() as { count: number };
    const byCategory = db.prepare(
      'SELECT category, COUNT(*) as count FROM updates GROUP BY category'
    ).all() as { category: string; count: number }[];

    res.json({ total: totalResult.count, byCategory });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
