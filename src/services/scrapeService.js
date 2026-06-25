const { callClaudeWithSearch } = require('./claudeService');
const { scrapeInstagram } = require('./apifyService');

const SYSTEM_PROMPT = `Tu es un expert en extraction de données business depuis des pages web.
Tu dois TOUJOURS répondre UNIQUEMENT en JSON valide, sans markdown, sans backticks, sans texte avant ou après.

Structure JSON à retourner :
{
  "business_name": "Nom du business",
  "tagline": "Slogan ou description courte",
  "description": "Description complète (2-3 phrases)",
  "sector": "beaute|plomberie|coach|restaurant|autre",
  "contact": {
    "phone": "numéro ou null",
    "email": "email ou null",
    "address": "adresse complète ou null",
    "city": "ville ou null",
    "instagram": "URL Instagram ou null",
    "tiktok": "URL TikTok ou null",
    "website": "URL site existant ou null"
  },
  "services": [{"name": "Nom", "description": "desc", "price": "prix ou null"}],
  "opening_hours": "Horaires ou null",
  "images": ["URL1", "URL2"],
  "videos": ["URL video1"],
  "colors": {"primary": "#HEX ou null", "secondary": "#HEX ou null"},
  "reviews_summary": "Résumé avis ou null",
  "certifications": [],
  "zone_intervention": "Zone géo ou null",
  "emergency_available": false,
  "booking_url": "URL réservation ou null",
  "extra": {}
}`;

async function scrapeBusinessData(urls) {
  const urlsList = Array.isArray(urls) ? urls : [urls];

  // Séparer les URLs Instagram des autres
  const instagramUrls = urlsList.filter(u => u.includes('instagram.com'));
  const otherUrls = urlsList.filter(u => !u.includes('instagram.com'));

  let instagramData = null;
  let webData = null;

  // Scraper Instagram via Apify si dispo
  if (instagramUrls.length > 0 && process.env.APIFY_API_KEY) {
    try {
      console.log('📸 Scraping Instagram via Apify...');
      instagramData = await scrapeInstagram(instagramUrls[0]);
      console.log('✅ Instagram scraped:', instagramData.images?.length, 'images');
    } catch (err) {
      console.error('⚠️ Apify Instagram error:', err.message);
    }
  }

  // Scraper les autres URLs via Claude
  if (otherUrls.length > 0) {
    try {
      const userPrompt = `Analyse ces URLs et extrais toutes les informations business :
${otherUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}
Retourne UNIQUEMENT le JSON structuré.`;

      const raw = await callClaudeWithSearch(SYSTEM_PROMPT, userPrompt, 3000);
      let cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      webData = JSON.parse(cleaned);
    } catch (err) {
      console.error('⚠️ Web scrape error:', err.message);
    }
  }

  // Fusionner les données Instagram + Web
  return mergeData(instagramData, webData, urlsList);
}

function mergeData(instagram, web, urls) {
  // Base depuis web scraping ou données vides
  const base = web || {
    business_name: null, tagline: null, description: null,
    sector: 'autre', contact: {}, services: [], images: [],
    videos: [], colors: {}, reviews_summary: null,
  };

  // Enrichir avec données Instagram
  if (instagram) {
    const p = instagram.profile;

    if (p) {
      base.business_name = base.business_name || p.full_name || p.username;
      base.description = base.description || p.bio;
      if (p.website && !base.contact?.website) {
        base.contact = base.contact || {};
        base.contact.website = p.website;
      }
    }

    // Ajouter les images Instagram (priorité aux vraies photos)
    const existingImages = base.images || [];
    const instaImages = instagram.images || [];
    base.images = [...new Set([...instaImages, ...existingImages])].slice(0, 10);

    // Ajouter les vidéos
    base.videos = [...new Set([...(instagram.videos || []), ...(base.videos || [])])].slice(0, 3);

    // Détecter le secteur depuis Instagram
    if (base.sector === 'autre' && instagram.detected_services?.length > 0) {
      const s = instagram.detected_services;
      if (s.some(k => ['nail','ongles','gel','semi','lash','cils','manucure','pédicure'].includes(k))) base.sector = 'beaute';
      else if (s.some(k => ['plombier','débouchage','fuite'].includes(k))) base.sector = 'plomberie';
      else if (s.some(k => ['coach','training','fitness'].includes(k))) base.sector = 'coach';
    }

    // Instagram contact
    base.contact = base.contact || {};
    base.contact.instagram = instagram.instagram_url;

    // Enrichir les services détectés
    if (base.services?.length === 0 && instagram.detected_services?.length > 0) {
      base.services = instagram.detected_services.slice(0, 5).map(s => ({
        name: s.charAt(0).toUpperCase() + s.slice(1),
        description: null,
        price: null
      }));
    }

    base.instagram_raw = {
      followers: instagram.profile?.followers,
      posts_count: instagram.posts_count,
      hashtags: instagram.hashtags?.slice(0, 10),
      top_captions: instagram.top_captions,
    };
  }

  // Ajouter les URLs sources
  base.source_urls = urls;

  return base;
}

module.exports = { scrapeBusinessData };
