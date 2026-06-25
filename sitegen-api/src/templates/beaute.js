function getBeauteTemplate() {
  return `
SECTIONS OBLIGATOIRES pour un institut de beauté :

1. HERO
   - Nom de l'institut en grand + tagline poétique
   - Photo hero plein écran (ou gradient luxueux rose/gold/crème si pas de photo)
   - Bouton CTA "Prendre rendez-vous" qui ouvre un lien Google Agenda ou mailto

2. SERVICES
   - Cards élégantes pour chaque soin/prestation
   - Prix si disponibles, sinon "Nous contacter"
   - Icônes SVG inline cohérentes (fleur, diamant, étoile...)

3. À PROPOS
   - Histoire de l'institut, valeurs, certifications
   - Photo de l'équipe ou de l'espace si dispo

4. GALERIE
   - Grid responsive des photos si disponibles
   - Effet hover élégant

5. BOOKING / RÉSERVATION
   - Section claire avec bouton "Réserver en ligne"
   - Lien vers Google Agenda : https://calendar.google.com/calendar/appointments
   - OU formulaire de contact simple (nom, email, soin désiré, message)
   - Mention des horaires d'ouverture

6. AVIS CLIENTS
   - Affichage des avis si disponibles (cards avec étoiles)
   - Sinon, section témoignages fictifs cohérents avec le secteur

7. CONTACT & PLAN
   - Adresse, téléphone, email
   - Lien Google Maps intégré (iframe ou lien)
   - Réseaux sociaux (Instagram, TikTok)

STYLE :
- Palette : tons doux (rose poudré, blanc cassé, gold, taupe)
- Typographie : serif élégant pour les titres (Playfair Display), sans-serif fin pour le body (Lato ou DM Sans)
- Espacements très généreux
- Animations : fade-in au scroll, hover subtils sur les cards
- Footer élégant avec copyright

FONCTIONNALITÉS INTERACTIVES :
- Menu hamburger mobile
- Smooth scroll
- Formulaire de contact avec validation JS basique
- Bouton WhatsApp flottant si numéro disponible (icône WhatsApp SVG)
`;
}

module.exports = { getBeauteTemplate };
