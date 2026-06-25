require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./utils/db');

const scrapeRoutes = require('./routes/scrape');
const generateRoutes = require('./routes/generate');
const sitesRoutes = require('./routes/sites');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Preview public (sans auth) - doit être AVANT le middleware auth
app.get('/api/sites/:id/preview', (req, res) => {
  const { getDB } = require('./utils/db');
  const db = getDB();
  const site = db.prepare(`SELECT html, business_name FROM sites WHERE id = ?`).get(req.params.id);
  if (!site) return res.status(404).send('<h1>Site introuvable</h1>');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(site.html);
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes.' }
});
app.use('/api/', limiter);

// Auth middleware
app.use('/api/', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.SITEGEN_API_KEY) {
    return res.status(401).json({ error: 'Clé API manquante ou invalide.' });
  }
  next();
});

// Routes protégées
app.use('/api/scrape', scrapeRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/sites', sitesRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable.' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur serveur.', details: err.message });
});

initDB();
app.listen(PORT, () => {
  console.log(`✅ SiteGen API démarrée sur le port ${PORT}`);
});
