const fetch = require('node-fetch');

const APIFY_API_URL = 'https://api.apify.com/v2';
const INSTAGRAM_ACTOR_ID = 'apify~instagram-scraper';

/**
 * Scrape un profil Instagram via Apify
 * Retourne photos, bio, reels, infos business
 */
async function scrapeInstagram(instagramUrl) {
  const apiKey = process.env.APIFY_API_KEY;
  if (!apiKey) throw new Error('APIFY_API_KEY manquante');

  console.log('📸 Apify Instagram scraping:', instagramUrl);

  // Lancer le scraper
  const runRes = await fetch(`${APIFY_API_URL}/acts/${INSTAGRAM_ACTOR_ID}/runs?token=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      directUrls: [instagramUrl],
      resultsType: 'posts',
      resultsLimit: 12,
      addParentData: true,
    })
  });

  if (!runRes.ok) {
    const err = await runRes.text();
    throw new Error(`Apify run error: ${err}`);
  }

  const run = await runRes.json();
  const runId = run.data.id;
  console.log('🚀 Apify run started:', runId);

  // Attendre la fin du run (polling)
  let status = 'RUNNING';
  let attempts = 0;
  while (status === 'RUNNING' || status === 'READY') {
    await new Promise(r => setTimeout(r, 3000));
    const statusRes = await fetch(`${APIFY_API_URL}/actor-runs/${runId}?token=${apiKey}`);
    const statusData = await statusRes.json();
    status = statusData.data.status;
    attempts++;
    console.log(`⏳ Apify status: ${status} (${attempts * 3}s)`);
    if (attempts > 40) throw new Error('Apify timeout après 120s');
  }

  if (status !== 'SUCCEEDED') throw new Error(`Apify run failed: ${status}`);

  // Récupérer les résultats
  const datasetId = run.data.defaultDatasetId;
  const resultsRes = await fetch(`${APIFY_API_URL}/datasets/${datasetId}/items?token=${apiKey}&limit=12`);
  const posts = await resultsRes.json();

  // Récupérer aussi le profil
  const profileRes = await fetch(`${APIFY_API_URL}/acts/${INSTAGRAM_ACTOR_ID}/runs?token=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      directUrls: [instagramUrl],
      resultsType: 'details',
      resultsLimit: 1,
    })
  });

  let profileData = null;
  if (profileRes.ok) {
    const profileRun = await profileRes.json();
    const profileRunId = profileRun.data.id;
    await new Promise(r => setTimeout(r, 8000));
    const pDatasetId = profileRun.data.defaultDatasetId;
    const pRes = await fetch(`${APIFY_API_URL}/datasets/${pDatasetId}/items?token=${apiKey}&limit=1`);
    const pData = await pRes.json();
    profileData = pData[0] || null;
  }

  return extractInstagramData(posts, profileData, instagramUrl);
}

/**
 * Extrait les données pertinentes des posts Instagram
 */
function extractInstagramData(posts, profile, url) {
  // Extraire les meilleures images (pas de vidéos pour les images)
  const images = [];
  const videos = [];

  for (const post of posts) {
    if (!post) continue;

    // Images
    if (post.displayUrl) images.push(post.displayUrl);
    if (post.images) images.push(...post.images.slice(0, 3));

    // Vidéos
    if (post.videoUrl) videos.push(post.videoUrl);

    // Images du carousel
    if (post.childPosts) {
      for (const child of post.childPosts) {
        if (child.displayUrl) images.push(child.displayUrl);
        if (child.videoUrl) videos.push(child.videoUrl);
      }
    }
  }

  // Extraire les hashtags et mots-clés des captions
  const captions = posts.map(p => p?.caption || '').filter(Boolean);
  const hashtags = [...new Set(captions.join(' ').match(/#\w+/g) || [])].slice(0, 20);

  // Détecter les services depuis les captions
  const serviceKeywords = ['nail', 'ongles', 'gel', 'semi', 'manucure', 'pédicure', 'lash', 'cils', 'extension',
    'plombier', 'débouchage', 'fuite', 'installation', 'coach', 'training', 'fitness',
    'coiffure', 'coiffeur', 'balayage', 'couleur', 'coupe', 'massage', 'soin', 'visage'];
  const detectedServices = serviceKeywords.filter(kw =>
    captions.join(' ').toLowerCase().includes(kw)
  );

  return {
    instagram_url: url,
    profile: profile ? {
      username: profile.username,
      full_name: profile.fullName,
      bio: profile.biography,
      followers: profile.followersCount,
      following: profile.followsCount,
      posts_count: profile.postsCount,
      profile_pic: profile.profilePicUrl,
      website: profile.externalUrl,
      is_business: profile.isBusinessAccount,
      business_category: profile.businessCategoryName,
    } : null,
    images: [...new Set(images)].slice(0, 10), // max 10 images uniques
    videos: [...new Set(videos)].slice(0, 3),  // max 3 vidéos
    posts_count: posts.length,
    hashtags,
    detected_services: detectedServices,
    top_captions: captions.slice(0, 3).map(c => c.substring(0, 200)),
  };
}

module.exports = { scrapeInstagram };
