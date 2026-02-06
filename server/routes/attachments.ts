import express from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import path from 'path';
import fs from 'fs';
import db, { ATTACHMENTS_DIR } from '../db.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// Multer configuration — disk storage, images only, 10 MB limit
// ---------------------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ATTACHMENTS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${nanoid()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Helper — check that an update exists
function updateExists(id: string): boolean {
  return Boolean(db.prepare('SELECT id FROM updates WHERE id = ?').get(id));
}

// Helper — convert snake_case attachment row to camelCase
function parseAttachment(row: Record<string, unknown>) {
  return {
    id: row.id,
    updateId: row.update_id,
    type: row.type,
    filename: row.filename ?? null,
    filepath: row.filepath ?? null,
    url: row.url ?? null,
    label: row.label ?? null,
    beforePath: row.before_path ?? null,
    afterPath: row.after_path ?? null,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// POST /updates/:id/attachments/image — single image upload
// ---------------------------------------------------------------------------
router.post(
  '/updates/:id/attachments/image',
  upload.single('file'),
  (req, res) => {
    try {
      if (!updateExists(req.params.id)) {
        res.status(404).json({ error: 'Update not found' });
        return;
      }

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const id = nanoid();
      const label = req.body?.label || null;

      db.prepare(`
        INSERT INTO attachments (id, update_id, type, filename, filepath, label)
        VALUES (?, ?, 'image', ?, ?, ?)
      `).run(id, req.params.id, file.originalname, file.filename, label);

      const row = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as Record<string, unknown>;
      res.status(201).json(parseAttachment(row));
    } catch (err) {
      console.error('Error uploading image:', err);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  },
);

// ---------------------------------------------------------------------------
// POST /updates/:id/attachments/before-after — before + after image pair
// ---------------------------------------------------------------------------
router.post(
  '/updates/:id/attachments/before-after',
  upload.fields([
    { name: 'before', maxCount: 1 },
    { name: 'after', maxCount: 1 },
  ]),
  (req, res) => {
    try {
      if (!updateExists(req.params.id)) {
        res.status(404).json({ error: 'Update not found' });
        return;
      }

      const files = (req as any).files as Record<string, Express.Multer.File[]> | undefined;
      const beforeFile = files?.before?.[0];
      const afterFile = files?.after?.[0];

      if (!beforeFile || !afterFile) {
        res.status(400).json({ error: 'Both before and after images are required' });
        return;
      }

      const id = nanoid();
      const label = req.body?.label || null;

      db.prepare(`
        INSERT INTO attachments (id, update_id, type, before_path, after_path, label)
        VALUES (?, ?, 'before_after', ?, ?, ?)
      `).run(id, req.params.id, beforeFile.filename, afterFile.filename, label);

      const row = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as Record<string, unknown>;
      res.status(201).json(parseAttachment(row));
    } catch (err) {
      console.error('Error uploading before/after:', err);
      res.status(500).json({ error: 'Failed to upload before/after images' });
    }
  },
);

// ---------------------------------------------------------------------------
// POST /updates/:id/attachments/link — add a URL attachment
// ---------------------------------------------------------------------------
router.post('/updates/:id/attachments/link', (req, res) => {
  try {
    if (!updateExists(req.params.id)) {
      res.status(404).json({ error: 'Update not found' });
      return;
    }

    const { url, label } = req.body;
    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    const id = nanoid();
    db.prepare(`
      INSERT INTO attachments (id, update_id, type, url, label)
      VALUES (?, ?, 'link', ?, ?)
    `).run(id, req.params.id, url, label || null);

    const row = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as Record<string, unknown>;
    res.status(201).json(parseAttachment(row));
  } catch (err) {
    console.error('Error adding link:', err);
    res.status(500).json({ error: 'Failed to add link' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /attachments/:id — remove attachment and its files
// ---------------------------------------------------------------------------
router.delete('/attachments/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    // Clean up files on disk
    const filenames: string[] = [];
    if (row.filepath) filenames.push(row.filepath as string);
    if (row.before_path) filenames.push(row.before_path as string);
    if (row.after_path) filenames.push(row.after_path as string);

    for (const name of filenames) {
      const fullPath = path.join(ATTACHMENTS_DIR, name);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    db.prepare('DELETE FROM attachments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting attachment:', err);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

export { parseAttachment };
export default router;
