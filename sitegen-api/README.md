# SiteGen API

SaaS API qui génère des sites web professionnels depuis des URLs (Instagram, TikTok, site existant, etc.) via Claude AI.

---

## Architecture

```
POST /api/scrape      → Extrait les infos business depuis des URLs
POST /api/generate    → Génère un site HTML complet (scrape + génération en 1 appel)
GET  /api/sites       → Liste tous les sites générés
GET  /api/sites/:id   → Récupère un site spécifique
GET  /api/sites/:id/preview  → Affiche le site dans le navigateur (PUBLIC, sans auth)
GET  /api/sites/:id/export   → Télécharge le fichier HTML
DELETE /api/sites/:id → Supprime un site
GET  /health          → Status de l'API
```

---

## Installation locale

```bash
git clone <ton-repo>
cd sitegen-api
npm install
cp .env.example .env
# Éditer .env avec tes clés
npm run dev
```

---

## Déploiement sur o2switch

### 1. Prérequis o2switch
- Accès SSH activé (demander au support o2switch)
- Node.js disponible (vérifier via `node --version`)

### 2. Upload des fichiers
```bash
# Depuis ton ordinateur
scp -r ./sitegen-api ton-user@ton-serveur.o2switch.net:/home/ton-user/sitegen-api
```
Ou via le gestionnaire de fichiers cPanel.

### 3. Installation sur le serveur
```bash
ssh ton-user@ton-serveur.o2switch.net
cd sitegen-api
npm install --production
cp .env.example .env
nano .env   # Remplir ANTHROPIC_API_KEY et SITEGEN_API_KEY
```

### 4. Générer ta clé API SaaS
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copier la valeur dans .env → SITEGEN_API_KEY
```

### 5. Démarrer avec PM2
```bash
npm install -g pm2
pm2 start src/index.js --name sitegen-api
pm2 save
pm2 startup   # Pour redémarrage auto
```

### 6. Configurer le proxy dans cPanel (o2switch)
Dans cPanel → "Node.js" ou via .htaccess :

```apache
# .htaccess dans le dossier public_html/api (ou sous-domaine)
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

Ou créer un sous-domaine `api.tonsite.fr` pointant vers le port 3000.

---

## Utilisation de l'API

### Header requis pour toutes les requêtes (sauf /preview et /health)
```
X-Api-Key: ta-cle-api-secrete
Content-Type: application/json
```

---

### 1. Scraper des URLs → JSON business

```bash
curl -X POST https://api.tonsite.fr/api/scrape \
  -H "X-Api-Key: ta-cle" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://www.instagram.com/mon_institut_beaute",
      "https://maps.google.com/..."
    ]
  }'
```

**Réponse :**
```json
{
  "success": true,
  "cached": false,
  "data": {
    "business_name": "Institut Belle & Zen",
    "tagline": "Votre cocon de beauté à Paris",
    "sector": "beaute",
    "contact": {
      "phone": "06 12 34 56 78",
      "address": "12 rue de la Paix, 75001 Paris"
    },
    "services": [
      {"name": "Soin visage", "description": "Soin hydratant", "price": "65€"}
    ],
    "colors": { "primary": "#D4A0A0", "secondary": "#F5F0EB" }
  }
}
```

---

### 2. Générer un site (depuis URLs directement)

```bash
curl -X POST https://api.tonsite.fr/api/generate \
  -H "X-Api-Key: ta-cle" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://www.instagram.com/mon_plombier"],
    "sector": "plomberie"
  }'
```

**Réponse :**
```json
{
  "success": true,
  "site_id": "550e8400-e29b-41d4-a716-446655440000",
  "html": "<!DOCTYPE html>...",
  "preview_url": "/api/sites/550e8400.../preview",
  "business_data": { ... }
}
```

---

### 3. Générer depuis données déjà scrapées

```bash
curl -X POST https://api.tonsite.fr/api/generate \
  -H "X-Api-Key: ta-cle" \
  -H "Content-Type: application/json" \
  -d '{
    "business_data": {
      "business_name": "Plomberie Martin",
      "sector": "plomberie",
      "contact": {"phone": "06 00 00 00 00", "city": "Lyon"},
      "services": [{"name": "Débouchage", "price": "90€"}],
      "emergency_available": true
    },
    "sector": "plomberie"
  }'
```

---

### 4. Voir le site généré (PUBLIC)

```
GET https://api.tonsite.fr/api/sites/SITE_ID/preview
```
→ Ouvre directement le site dans le navigateur. Pas besoin de clé API.

---

### 5. Télécharger le HTML

```bash
curl -O https://api.tonsite.fr/api/sites/SITE_ID/export \
  -H "X-Api-Key: ta-cle"
```

---

### 6. Lister les sites

```bash
curl https://api.tonsite.fr/api/sites \
  -H "X-Api-Key: ta-cle"

# Filtrer par secteur
curl "https://api.tonsite.fr/api/sites?sector=beaute&limit=10" \
  -H "X-Api-Key: ta-cle"
```

---

## Secteurs supportés

| Secteur | Valeur | Features |
|---------|--------|----------|
| Institut de beauté | `beaute` | Booking Google Agenda, galerie, soins, bouton WhatsApp |
| Plombier / Artisan | `plomberie` | Devis auto JS, urgence 24h, zone intervention, calculateur prix |
| Coach / Freelance | `coach` | Calendly-like, packages, témoignages |
| Restaurant | `restaurant` | Menu, réservation, galerie |
| Autre | `autre` | Template générique professionnel |

---

## Coûts estimés Claude API (claude-sonnet-4-6)

| Opération | Tokens estimés | Coût approx. |
|-----------|---------------|--------------|
| Scrape (extraction) | ~2 000 tokens | ~0.006€ |
| Génération site | ~6 000 tokens | ~0.018€ |
| **Total par site** | **~8 000 tokens** | **~0.025€** |

→ Marge excellente si tu vends 30-50€ par site généré.

---

## Structure des fichiers

```
sitegen-api/
├── src/
│   ├── index.js              # Serveur Express principal
│   ├── routes/
│   │   ├── scrape.js         # POST /api/scrape
│   │   ├── generate.js       # POST /api/generate
│   │   └── sites.js          # GET/DELETE /api/sites
│   ├── services/
│   │   ├── claudeService.js  # Appels Claude API
│   │   ├── scrapeService.js  # Extraction données business
│   │   └── generateService.js # Génération HTML
│   ├── templates/
│   │   ├── beaute.js         # Instructions secteur beauté
│   │   └── plomberie.js      # Instructions secteur plomberie
│   └── utils/
│       └── db.js             # SQLite database
├── data/                     # Base SQLite (auto-créé)
├── .env.example
├── package.json
└── README.md
```
