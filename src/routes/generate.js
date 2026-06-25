const express = require('express');
const router = express.Router();
const { generateSite } = require('../services/generateService');
const { scrapeBusinessData } = require('../services/scrapeService');
const { getDB } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/generate
 * Body: { urls?: [...], business_data?: {...}, sector: "beaute|plomberie", options?: {} }
 */
router.post('/', async (req, res) => {
  const { urls, business_data, sector, options = {} } = req.body;

  if (!urls && !business_data)
    return res.status(400).json({ error: 'Fournir soit "urls" soit "business_data".' });

  const validSectors = ['beaute', 'plomberie', 'coach', 'restaurant', 'autre'];
  if (sector && !validSectors.includes(sector))
    return res.status(400).json({ error: `Secteur invalide. Valeurs acceptées : ${validSectors.join(', ')}` });

  try {
    let data = business_data;

    if (urls && !data) {
      if (!Array.isArray(urls) || urls.length === 0)
        return res.status(400).json({ error: '"urls" doit être un tableau non vide.' });
      console.log('📡 Scraping en cours...', urls);
      data = await scrapeBusinessData(urls);
    }

    const finalSector = sector || data.sector || 'autre';
    console.log(`🎨 Génération du site (secteur: ${finalSector})...`);
    const html = await generateSite(data, finalSector, options);

    const siteId = uuidv4();
    const db = getDB();
    db.insertSite({
      id: siteId,
      business_name: data.business_name || 'Sans nom',
      sector: finalSector,
      urls: urls || [],
      business_data: data,
      html,
      created_at: new Date().toISOString(),
      status: 'generated'
    });

    res.json({
      success: true,
      site_id: siteId,
      html,
      preview_url: `/api/sites/${siteId}/preview`,
      business_data: data
    });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: 'Erreur lors de la génération du site.', details: err.message });
  }
});

module.exports = router;
