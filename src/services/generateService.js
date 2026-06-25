const { callClaude } = require('./claudeService');

const SYSTEM_PROMPT = `Tu es un expert en création de sites web professionnels et esthétiques. Tu génères du HTML/CSS/JS complet, moderne, responsive et prêt à déployer.

Règles ABSOLUES :
- Retourne UNIQUEMENT le code HTML complet, depuis <!DOCTYPE html> jusqu'à </html>
- Pas de markdown, pas de backticks, pas d'explications avant ou après
- Le HTML doit être complet et autonome (CSS et JS inline dans le fichier)
- Design moderne, épuré, espacements généreux, typographie soignée
- Responsive mobile-first obligatoire avec menu hamburger
- PAS d'animations fade-up au scroll (Intersection Observer) — les éléments seraient invisibles. Utilise uniquement des transitions CSS hover
- Tous les éléments doivent être visibles directement sans JS
- Polices Google Fonts incluses via CDN
- Si tu utilises des images, mets-les dans des balises img avec l'URL dans src
- Couleurs : utilise les couleurs extraites du business si disponibles
- Contenu 100% réel basé sur les données, jamais de lorem ipsum
- Le site doit être COMPLET avec TOUTES les sections jusqu'au footer et jusqu'au tag html fermant`;

async function generateSite(businessData, sector, options, prompt, extraImages) {
  options = options || [];
  prompt = prompt || '';
  extraImages = extraImages || [];

  const featureMap = {
    booking: 'RESERVATION EN LIGNE : Bouton "Prendre rendez-vous" qui ouvre https://calendar.google.com/calendar/appointments. Section avec calendrier visuel.',
    devis: 'DEVIS AUTOMATIQUE : Formulaire JS interactif avec type de prestation, description, urgence. Calcul automatique fourchette de prix en temps réel. Bouton envoi email.',
    acompte: 'PAIEMENT ACOMPTE : Section avec bouton de paiement acompte via lien Stripe ou SumUp. Expliquer que X% confirme le RDV.',
    whatsapp: 'BOUTON WHATSAPP FLOTTANT : Bouton vert fixe bas droite avec icone WhatsApp SVG. Lien wa.me avec le numero. Toujours visible.',
    urgence: 'URGENCE 24h/7j : Bandeau rouge en haut avec numero urgence. Section delai intervention. Badge "Disponible maintenant" anime.',
    popup: 'POPUP OFFRE : Popup elegante apres 3s avec offre bienvenue (-10% 1er RDV). Bouton fermer + CTA.',
    fidelite: 'FIDELITE : Section carte fidelite digitale. Ex: 10e soin offert. Formulaire inscription email.',
    before_after: 'AVANT APRES : Slider comparatif interactif avec poignee glissante. JS natif.',
    chatbot: 'CHATBOT FAQ : Bulle chat fixe bas droite. Clic = fenetre FAQ interactive. Pas d IA, juste questions/reponses predefinies.',
    map: 'CARTE : Iframe Google Maps avec adresse. Bouton Obtenir itineraire.',
    newsletter: 'NEWSLETTER : Formulaire inscription email avec promesse valeur.',
    multilingue: 'BILINGUE FR/EN : Toggle langue haut droite. JS switch tous les textes.',
  };

  let featuresText = '';
  if (options.length > 0) {
    const feats = options.map(function(o) { return featureMap[o] ? '- ' + featureMap[o] : ''; }).filter(Boolean);
    if (feats.length > 0) featuresText = '\n\nFONCTIONNALITES OBLIGATOIRES :\n' + feats.join('\n\n');
  }

  let imagesText = '';
  const allImages = extraImages.length > 0 ? extraImages : (businessData.images || []);
  if (allImages.length > 0) {
    imagesText = '\n\nPHOTOS A UTILISER OBLIGATOIREMENT dans img src (hero, galerie, a propos) :\n';
    imagesText += allImages.slice(0, 8).map(function(url, i) { return 'Photo ' + (i+1) + ': ' + url; }).join('\n');
  }

  let promptText = prompt ? '\nINSTRUCTIONS PRIORITAIRES DU CLIENT :\n' + prompt + '\n' : '';

  const userPrompt = 'Genere un site web complet et professionnel.\n'
    + promptText
    + '\nDONNEES DU BUSINESS :\n' + JSON.stringify(businessData, null, 2)
    + '\n\nSECTEUR : ' + (sector || businessData.sector || 'general')
    + featuresText
    + imagesText
    + '\n\nSTRUCTURE OBLIGATOIRE :\n'
    + '1. Header navigation sticky + hamburger mobile\n'
    + '2. Hero section impactante avec CTA\n'
    + '3. Services / Prestations avec prix\n'
    + '4. A propos / Histoire\n'
    + '5. ' + (options.indexOf('before_after') !== -1 ? 'Slider avant/apres' : 'Galerie photos') + '\n'
    + '6. Avis clients / Temoignages\n'
    + '7. ' + (options.indexOf('booking') !== -1 || options.indexOf('devis') !== -1 ? 'Section reservation/devis' : 'Contact') + '\n'
    + '8. Footer complet avec infos, reseaux sociaux, horaires\n'
    + '\nLE SITE DOIT ETRE 100% COMPLET jusqu\'au </html> final. Qualite professionnelle.';

  const html = await callClaude(SYSTEM_PROMPT, userPrompt, 16000);

  let clean = html.trim();
  clean = clean.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  const start = clean.indexOf('<!DOCTYPE');
  if (start > 0) clean = clean.substring(start);

  if (!clean.includes('<!DOCTYPE') && !clean.includes('<html')) {
    throw new Error('Claude n\'a pas retourne de HTML valide');
  }

  return clean;
}

module.exports = { generateSite };
