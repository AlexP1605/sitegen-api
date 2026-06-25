const { callClaude } = require('./claudeService');

const SYSTEM_PROMPT = `Tu es un expert en création de sites web professionnels et esthétiques. Tu génères du HTML/CSS/JS complet, moderne, responsive et prêt à déployer.

Règles ABSOLUES :
- Retourne UNIQUEMENT le code HTML complet, depuis <!DOCTYPE html> jusqu'à </html>
- Pas de markdown, pas de backticks, pas d'explications avant ou après
- Le HTML doit être complet et autonome (CSS et JS inline dans le fichier)
- Design moderne, épuré, espacements généreux, typographie soignée
- Responsive mobile-first obligatoire avec menu hamburger
- Animations subtiles au scroll (Intersection Observer)
- Polices Google Fonts incluses via CDN
- Images : utilise les URLs fournies. Si aucune image dispo, utilise des gradients élégants
- Couleurs : utilise les couleurs extraites du business si disponibles
- Contenu 100% réel basé sur les données, jamais de lorem ipsum
- Le site doit être complet avec TOUTES les sections jusqu'au footer inclus`;

async function generateSite(businessData, sector, options = [], prompt = '') {
  // Construire les instructions fonctionnalités
  const featureMap = {
    booking: 'RÉSERVATION EN LIGNE : Intègre un système de réservation avec Google Agenda. Bouton "Prendre rendez-vous" qui ouvre https://calendar.google.com/calendar/appointments. Affiche les créneaux disponibles de façon visuelle.',
    devis: 'DEVIS AUTOMATIQUE : Formulaire interactif JS avec sélection du type de prestation, description du besoin, niveau d\'urgence. Calcul automatique d\'une fourchette de prix en temps réel selon les choix. Bouton envoi par email.',
    acompte: 'PAIEMENT ACOMPTE : Section avec bouton de paiement d\'acompte via lien Stripe ou SumUp. Explique que le paiement de X% confirme le rendez-vous.',
    whatsapp: 'BOUTON WHATSAPP FLOTTANT : Bouton vert fixe en bas à droite avec icône WhatsApp SVG. Lien wa.me avec le numéro de téléphone. Toujours visible en scrollant.',
    urgence: 'MODE URGENCE 24h/7j : Bandeau rouge en haut de page avec numéro d\'urgence. Section dédiée avec délai d\'intervention. Badge "Disponible maintenant" animé.',
    popup: 'POPUP OFFRE BIENVENUE : Popup élégante qui apparaît après 3 secondes avec une offre de bienvenue (ex: -10% sur le 1er RDV). Bouton fermer + bouton CTA.',
    fidelite: 'PROGRAMME FIDÉLITÉ : Section carte de fidélité digitale avec visuel. Ex: 10e soin offert. Formulaire d\'inscription email pour rejoindre le programme.',
    before_after: 'AVANT / APRÈS : Slider comparatif interactif avec poignée glissante. Plusieurs exemples de réalisations avant/après. JS natif, pas de librairie externe.',
    chatbot: 'CHATBOT FAQ : Bulle de chat fixe en bas à droite. Clic = fenêtre avec questions fréquentes prédéfinies et réponses automatiques. Pas d\'IA, juste FAQ interactive.',
    map: 'CARTE & ITINÉRAIRE : Iframe Google Maps intégrée avec l\'adresse du business. Bouton "Obtenir l\'itinéraire" en dessous.',
    newsletter: 'CAPTURE EMAIL : Section avec formulaire d\'inscription newsletter. Design accrocheur avec promesse de valeur (ex: "Reçois nos offres exclusives"). Champ email + bouton.',
    multilingue: 'SITE BILINGUE FR/EN : Toggle FR/EN en haut à droite. JS qui switche tous les textes. Version anglaise complète et professionnelle.',
  };

  const featuresInstructions = options.length > 0
    ? '\n\nFONCTIONNALITÉS OBLIGATOIRES À INTÉGRER :\n' + options.map(o => featureMap[o] ? '• ' + featureMap[o] : '').filter(Boolean).join('\n\n')
    : '';

  const userPrompt = `Génère un site web complet et professionnel.

${prompt ? `INSTRUCTIONS PRIORITAIRES DU CLIENT :\n${prompt}\n` : ''}
DONNÉES DU BUSINESS EXTRAITES :
${JSON.stringify(businessData, null, 2)}

SECTEUR : ${sector || businessData.sector || 'général'}
${featuresInstructions}

STRUCTURE OBLIGATOIRE DU SITE :
1. Header avec navigation sticky + menu hamburger mobile
2. Hero section impactante avec CTA principal
3. Services / Prestations avec prix si disponibles
4. Section À propos / Histoire
5. ${options.includes('before_after') ? 'Slider avant/après' : 'Galerie ou section visuels'}
6. Avis clients / Témoignages (réels si dispo, sinon cohérents avec le secteur)
7. ${options.includes('booking') || options.includes('devis') ? 'Section réservation/devis (voir fonctionnalités)' : 'Section contact'}
8. Footer complet avec infos, réseaux sociaux, horaires

IMPORTANT :
- Utilise les images disponibles dans les données si présentes
- Utilise les couleurs de la marque si disponibles
- Le site doit être COMPLET jusqu'au </html> final
- Qualité professionnelle, le client paie pour ce site

Retourne UNIQUEMENT le HTML complet.`;

  const html = await callClaude(SYSTEM_PROMPT, userPrompt, 16000);

  // Nettoyer et vérifier
  let clean = html.trim();
  clean = clean.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  const start = clean.indexOf('<!DOCTYPE');
  if (start > 0) clean = clean.substring(start);

  if (!clean.includes('<!DOCTYPE') && !clean.includes('<html')) {
    throw new Error('Claude n\'a pas retourné de HTML valide');
  }

  return clean;
}

module.exports = { generateSite };
