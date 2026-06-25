const { callClaude } = require('./claudeService');
const { getBeauteTemplate } = require('../templates/beaute');
const { getPlomberieTemplate } = require('../templates/plomberie');

const SYSTEM_PROMPT = `Tu es un expert en création de sites web professionnels et esthétiques. Tu génères du HTML/CSS/JS complet, moderne, responsive et prêt à déployer.

Règles ABSOLUES :
- Retourne UNIQUEMENT le code HTML complet, depuis <!DOCTYPE html> jusqu'à </html>
- Pas de markdown, pas de backticks, pas d'explications
- Le HTML doit être complet, autonome (CSS et JS inline dans le fichier)
- Design Apple-style : épuré, espacements généreux, typographie soignée
- Responsive mobile-first obligatoire
- Animations subtiles au scroll (Intersection Observer)
- Polices Google Fonts incluses via CDN
- Images : utilise les URLs fournies. Si aucune image, utilise des gradients élégants
- Couleurs : utilise les couleurs extraites du business si disponibles`;

async function generateSite(businessData, sector, customOptions = {}) {
  // Choisir le template de base selon le secteur
  let templateHints = '';
  if (sector === 'beaute' || businessData.sector === 'beaute') {
    templateHints = getBeauteTemplate();
  } else if (sector === 'plomberie' || businessData.sector === 'plomberie') {
    templateHints = getPlomberieTemplate();
  } else {
    // Template générique adapté
    templateHints = sector === 'beaute' ? getBeauteTemplate() : getPlomberieTemplate();
  }

  const userPrompt = `Génère un site web complet et professionnel pour ce business.

DONNÉES DU BUSINESS :
${JSON.stringify(businessData, null, 2)}

SECTEUR : ${sector || businessData.sector}

INSTRUCTIONS SPÉCIFIQUES AU SECTEUR :
${templateHints}

OPTIONS SUPPLÉMENTAIRES :
${JSON.stringify(customOptions, null, 2)}

IMPORTANT : 
- Si des images sont disponibles dans "images", utilise-les dans le design
- Si des couleurs sont disponibles dans "colors", utilise-les comme palette principale
- Crée du vrai contenu basé sur les données fournies, pas du lorem ipsum
- Le site doit sembler 100% authentique et professionnel

Retourne UNIQUEMENT le HTML complet.`;

  const html = await callClaude(SYSTEM_PROMPT, userPrompt, 8000);

  // Vérifier que c'est bien du HTML
  if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
    // Essayer de trouver le HTML dans la réponse
    const htmlStart = html.indexOf('<!DOCTYPE');
    if (htmlStart !== -1) {
      return html.substring(htmlStart);
    }
    throw new Error('Claude n\'a pas retourné de HTML valide');
  }

  return html.trim();
}

module.exports = { generateSite };
