import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory backend storage for dynamic contacts
// Allows any phone/computer to fetch and update dynamic contacts by shortId
const dynamicContactsDb: Record<string, { contact: any; updatedAt: number; scanCount: number }> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API to get contact by shortId (called by scanning phone)
  app.get('/api/dynamic/:shortId', (req, res) => {
    const { shortId } = req.params;
    const record = dynamicContactsDb[shortId];
    if (!record) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }
    record.scanCount = (record.scanCount || 0) + 1;
    res.json({ contact: record.contact, scanCount: record.scanCount });
  });

  // API to save or update contact by shortId (called when generating or editing)
  app.post('/api/dynamic/:shortId', (req, res) => {
    const { shortId } = req.params;
    const { contact } = req.body;
    if (!contact) {
      return res.status(400).json({ error: 'Dados do contato ausentes' });
    }
    const current = dynamicContactsDb[shortId] || { scanCount: 0 };
    dynamicContactsDb[shortId] = {
      contact,
      updatedAt: Date.now(),
      scanCount: current.scanCount,
    };
    res.json({ success: true, shortId, record: dynamicContactsDb[shortId] });
  });

  // Mount Vite middleware in dev
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
