const express = require('express');
const router = express.Router();
const { scrapeBusinessData } = require('../services/scrapeService');
const { getDB } = require('../utils/db');
const crypto = require('crypto');

/**
 * POST /api/scrape
 * Body: { urls: ["https://instagram.com/...", "https://..."] }
 */
router.post('/', async (req, res) => {
  const { urls } = req.body;

  if (!urls || !Array.isArray(urls) || urls.length === 0)
    return res.status(400).json({ error: 'Le champ "urls" est requis (tableau d\'URLs).' });

  if (urls.length > 5)
    return res.status(400).json({ error: 'Maximum 5 URLs par requête.' });

  for (const url of urls) {
    try { new URL(url); }
    catch { return res.status(400).json({ error: `URL invalide : ${url}` }); }
  }

  const cacheKey = crypto.createHash('md5').update(urls.sort().join('|')).digest('hex');
  const db = getDB();
  const cached = db.getCacheEntry(cacheKey);

  if (cached) return res.json({ success: true, data: cached, cached: true });

  try {
    const businessData = await scrapeBusinessData(urls);
    db.setCacheEntry(cacheKey, urls.join('|'), businessData);
    res.json({ success: true, data: businessData, cached: false });
  } catch (err) {
    console.error('Scrape error:', err);
    res.status(500).json({ error: 'Erreur lors de l\'extraction des données.', details: err.message });
  }
});

module.exports = router;
