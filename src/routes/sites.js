const express = require('express');
const router = express.Router();
const { getDB } = require('../utils/db');

// GET /api/sites
router.get('/', (req, res) => {
  const { sector, limit = 20, offset = 0 } = req.query;
  const db = getDB();
  const result = db.listSites({ sector, limit: parseInt(limit), offset: parseInt(offset) });
  const sanitized = result.sites.map(({ html, ...s }) => s); // ne pas retourner le HTML dans la liste
  res.json({ success: true, sites: sanitized, total: result.total });
});

// GET /api/sites/:id
router.get('/:id', (req, res) => {
  const db = getDB();
  const site = db.getSite(req.params.id);
  if (!site) return res.status(404).json({ error: 'Site introuvable.' });
  res.json({ success: true, site });
});

// GET /api/sites/:id/export
router.get('/:id/export', (req, res) => {
  const db = getDB();
  const site = db.getSite(req.params.id);
  if (!site) return res.status(404).json({ error: 'Site introuvable.' });
  const filename = `${(site.business_name || 'site').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(site.html);
});

// DELETE /api/sites/:id
router.delete('/:id', (req, res) => {
  const db = getDB();
  const deleted = db.deleteSite(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Site introuvable.' });
  res.json({ success: true, message: 'Site supprimé.' });
});

module.exports = router;
