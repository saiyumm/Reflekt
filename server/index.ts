import express from 'express';
import cors from 'cors';
import { initDb, ATTACHMENTS_DIR } from './db.js';
import updatesRouter from './routes/updates.js';
import attachmentsRouter from './routes/attachments.js';
import exportRouter from './routes/export.js';

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

// API routes
app.use('/api', updatesRouter);
app.use('/api', attachmentsRouter);
app.use('/api', exportRouter);

app.listen(PORT, () => {
  console.log(`Reflekt API server running on http://localhost:${PORT}`);
});
