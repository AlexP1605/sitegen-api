const { callClaudeWithSearch } = require('./claudeService');

const SYSTEM_PROMPT = `Tu es un expert en extraction de données business depuis des pages web, profils Instagram, TikTok, Google Maps, et sites professionnels.

Ton rôle : analyser les URLs fournies et extraire toutes les informations utiles pour créer un site web professionnel.

Tu dois TOUJOURS répondre UNIQUEMENT en JSON valide, sans markdown, sans backticks, sans texte avant ou après. Juste le JSON brut.

Structure JSON à retourner :
{
  "business_name": "Nom du business",
  "tagline": "Slogan ou description courte",
  "description": "Description complète du business (2-3 phrases)",
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
  "services": [
    {"name": "Nom du service", "description": "description courte", "price": "prix ou null"}
  ],
  "opening_hours": "Horaires en texte libre ou null",
  "images": ["URL image 1", "URL image 2"],
  "colors": {
    "primary": "#HEX couleur principale dominante ou null",
    "secondary": "#HEX couleur secondaire ou null"
  },
  "reviews_summary": "Résumé des avis clients si disponibles ou null",
  "certifications": ["certification 1", "certification 2"],
  "zone_intervention": "Zone géographique d'intervention (pour plombier etc.) ou null",
  "emergency_available": true,
  "booking_available": false,
  "extra": {}
}

Si une info n'est pas trouvable, mets null. Ne mets jamais de valeurs inventées sauf pour le secteur que tu peux déduire.`;

async function scrapeBusinessData(urls) {
  const urlsList = Array.isArray(urls) ? urls : [urls];
  
  const userPrompt = `Analyse ces URLs et extrais toutes les informations business disponibles :

${urlsList.map((u, i) => `${i + 1}. ${u}`).join('\n')}

Visite chaque URL et extrais le maximum d'informations. Retourne UNIQUEMENT le JSON structuré, rien d'autre.`;

  const raw = await callClaudeWithSearch(SYSTEM_PROMPT, userPrompt, 3000);

  // Nettoyer et parser le JSON
  let cleaned = raw.trim();
  // Enlever les backticks markdown si présents
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  
  // Trouver le JSON dans la réponse
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Impossible de parser la réponse de Claude: ${e.message}\nRaw: ${raw.substring(0, 500)}`);
  }
}

module.exports = { scrapeBusinessData };
