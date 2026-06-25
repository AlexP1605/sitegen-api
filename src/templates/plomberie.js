function getPlomberieTemplate() {
  return `
SECTIONS OBLIGATOIRES pour un plombier / artisan :

1. HERO
   - Message d'urgence fort : "Plombier disponible 24h/24 - Intervention rapide"
   - Nom de l'entreprise + zone géographique
   - DEUX boutons CTA : "Appeler maintenant" (tel:) + "Devis gratuit" (ancre vers formulaire)
   - Badge de confiance : "Devis gratuit | Intervention express | Artisan certifié"

2. SERVICES
   - Cards avec icônes SVG pour chaque service (fuite, débouchage, installation, urgence...)
   - Prix indicatifs si disponibles
   - Badge "Urgence 24h" si applicable

3. ZONE D'INTERVENTION
   - Liste des villes/départements couverts
   - Message sur les délais d'intervention

4. DEVIS AUTOMATIQUE
   - Formulaire interactif JS avec :
     * Type de prestation (sélect : Fuite d'eau, Débouchage, Installation, Chauffe-eau, Autre)
     * Description du problème (textarea)
     * Urgence (radio : Normal / Urgent / Très urgent)
     * Coordonnées (nom, téléphone, adresse)
     * Estimation automatique de fourchette de prix selon la sélection (en JS)
   - Bouton "Obtenir mon devis" → mailto: avec les données pré-remplies

5. POURQUOI NOUS CHOISIR
   - 3-4 arguments : Rapidité, Garantie, Certification, Prix transparents
   - Badges de certification (RGE, Qualibat, etc.) si mentionnés

6. AVIS CLIENTS
   - Étoiles et commentaires si disponibles
   - Note globale mise en avant

7. CONTACT
   - Numéro de téléphone TRÈS visible (grand, cliquable)
   - Adresse, email
   - Horaires (avec mention urgence nuit/weekend si applicable)

STYLE :
- Palette : bleu professionnel (#1E3A5F), blanc, orange/rouge pour urgences
- Typographie : sans-serif solide (Inter ou Roboto)
- Design carré et structuré, inspire confiance
- Badges et certifications bien visibles
- Contraste fort pour la lisibilité

FONCTIONNALITÉS INTERACTIVES :
- Bouton d'appel flottant (mobile) avec numéro
- Calculateur de devis JS : selon le type de prestation, affiche une fourchette de prix estimée
- Formulaire devis avec validation
- Menu hamburger mobile
- Smooth scroll

LOGIQUE DEVIS JS :
const prixEstimes = {
  'Fuite d\\'eau': '80€ - 200€',
  'Débouchage': '90€ - 180€',
  'Installation robinet': '120€ - 250€',
  'Chauffe-eau': '300€ - 800€',
  'WC / Sanitaires': '100€ - 300€',
  'Autre': 'Sur devis'
};
// Ajouter +50% si urgence "Très urgent"
`;
}

module.exports = { getPlomberieTemplate };
