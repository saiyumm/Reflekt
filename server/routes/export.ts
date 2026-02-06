import express from 'express';
import fs from 'fs';
import path from 'path';
import db, { ATTACHMENTS_DIR } from '../db.js';
import { nanoid } from 'nanoid';

const router = express.Router();

// ---------------------------------------------------------------------------
// GET /export — export all data as JSON with base64-encoded images
// ---------------------------------------------------------------------------
router.get('/export', (_req, res) => {
  try {
    const updates = db.prepare('SELECT * FROM updates ORDER BY date DESC').all() as Record<string, unknown>[];
    const attachments = db.prepare('SELECT * FROM attachments ORDER BY update_id, sort_order').all() as Record<string, unknown>[];

    // Encode image files as base64
    const encodedAttachments = attachments.map((att) => {
      const result: Record<string, unknown> = { ...att };

      // Encode single-image filepath
      if (att.filepath) {
        const filePath = path.join(ATTACHMENTS_DIR, att.filepath as string);
        if (fs.existsSync(filePath)) {
          result.fileData = fs.readFileSync(filePath).toString('base64');
        }
      }

      // Encode before_path
      if (att.before_path) {
        const filePath = path.join(ATTACHMENTS_DIR, att.before_path as string);
        if (fs.existsSync(filePath)) {
          result.beforeData = fs.readFileSync(filePath).toString('base64');
        }
      }

      // Encode after_path
      if (att.after_path) {
        const filePath = path.join(ATTACHMENTS_DIR, att.after_path as string);
        if (fs.existsSync(filePath)) {
          result.afterData = fs.readFileSync(filePath).toString('base64');
        }
      }

      return result;
    });

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      updates,
      attachments: encodedAttachments,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reflekt-export-${new Date().toISOString().slice(0, 10)}.json"`,
    );
    res.json(exportData);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// ---------------------------------------------------------------------------
// POST /import — import data from a previously exported JSON file
// ---------------------------------------------------------------------------
router.post('/import', (req, res) => {
  try {
    const data = req.body;

    if (!data || !data.updates || !Array.isArray(data.updates)) {
      res.status(400).json({ error: 'Invalid import data format' });
      return;
    }

    let updatesImported = 0;
    let attachmentsImported = 0;

    const insertUpdate = db.prepare(`
      INSERT OR IGNORE INTO updates (id, title, description, date, category, tags, status, is_auto_categorized, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertAttachment = db.prepare(`
      INSERT OR IGNORE INTO attachments (id, update_id, type, filename, filepath, url, label, before_path, after_path, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const importAll = db.transaction(() => {
      // Import updates
      for (const u of data.updates) {
        const result = insertUpdate.run(
          u.id,
          u.title,
          u.description ?? null,
          u.date,
          u.category ?? 'other',
          u.tags ?? '[]',
          u.status ?? 'completed',
          u.is_auto_categorized ?? 1,
          u.created_at ?? new Date().toISOString(),
          u.updated_at ?? new Date().toISOString(),
        );
        if (result.changes > 0) updatesImported++;
      }

      // Import attachments
      if (data.attachments && Array.isArray(data.attachments)) {
        for (const att of data.attachments) {
          // Restore image file from base64
          let filepath = att.filepath ?? null;
          if (att.fileData && att.filepath) {
            const ext = path.extname(att.filepath as string);
            const newFilename = `${nanoid()}${ext}`;
            fs.writeFileSync(
              path.join(ATTACHMENTS_DIR, newFilename),
              Buffer.from(att.fileData as string, 'base64'),
            );
            filepath = newFilename;
          }

          let beforePath = att.before_path ?? null;
          if (att.beforeData && att.before_path) {
            const ext = path.extname(att.before_path as string);
            const newFilename = `${nanoid()}${ext}`;
            fs.writeFileSync(
              path.join(ATTACHMENTS_DIR, newFilename),
              Buffer.from(att.beforeData as string, 'base64'),
            );
            beforePath = newFilename;
          }

          let afterPath = att.after_path ?? null;
          if (att.afterData && att.after_path) {
            const ext = path.extname(att.after_path as string);
            const newFilename = `${nanoid()}${ext}`;
            fs.writeFileSync(
              path.join(ATTACHMENTS_DIR, newFilename),
              Buffer.from(att.afterData as string, 'base64'),
            );
            afterPath = newFilename;
          }

          const result = insertAttachment.run(
            att.id,
            att.update_id,
            att.type,
            att.filename ?? null,
            filepath,
            att.url ?? null,
            att.label ?? null,
            beforePath,
            afterPath,
            att.sort_order ?? 0,
            att.created_at ?? new Date().toISOString(),
          );
          if (result.changes > 0) attachmentsImported++;
        }
      }
    });

    importAll();

    res.json({
      success: true,
      updatesImported,
      attachmentsImported,
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

export default router;
