const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../../data');
const SITES_FILE = path.join(DATA_DIR, 'sites.json');
const CACHE_FILE = path.join(DATA_DIR, 'scrape_cache.json');

function initDB() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SITES_FILE)) fs.writeFileSync(SITES_FILE, JSON.stringify([]));
  if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, JSON.stringify({}));
  console.log('✅ Base de données initialisée (JSON)');
}

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return file === CACHE_FILE ? {} : []; }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

const db = {
  // Sites
  insertSite(site) {
    const sites = readJSON(SITES_FILE);
    sites.unshift(site);
    writeJSON(SITES_FILE, sites);
  },
  getSite(id) {
    return readJSON(SITES_FILE).find(s => s.id === id) || null;
  },
  listSites({ sector, limit = 20, offset = 0 } = {}) {
    let sites = readJSON(SITES_FILE);
    if (sector) sites = sites.filter(s => s.sector === sector);
    return { sites: sites.slice(offset, offset + limit), total: sites.length };
  },
  deleteSite(id) {
    const sites = readJSON(SITES_FILE);
    const idx = sites.findIndex(s => s.id === id);
    if (idx === -1) return false;
    sites.splice(idx, 1);
    writeJSON(SITES_FILE, sites);
    return true;
  },

  // Cache scrape
  getCacheEntry(key) {
    const cache = readJSON(CACHE_FILE);
    const entry = cache[key];
    if (!entry) return null;
    const age = Date.now() - entry.timestamp;
    if (age > 24 * 60 * 60 * 1000) { delete cache[key]; writeJSON(CACHE_FILE, cache); return null; }
    return entry.data;
  },
  setCacheEntry(key, url, data) {
    const cache = readJSON(CACHE_FILE);
    cache[key] = { url, data, timestamp: Date.now() };
    writeJSON(CACHE_FILE, cache);
  }
};

function getDB() { return db; }

module.exports = { initDB, getDB };
