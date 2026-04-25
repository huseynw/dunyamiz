const fs = require('fs');
const path = require('path');

const OWNER = process.env.GH_OWNER || 'huseynw';
const REPO = process.env.GH_REPO || 'dunyamiz';
const FOLDER = process.env.GH_VIDEO_FOLDER || 'video';
const BRANCH = process.env.GH_BRANCH || 'main';
const TOKEN = process.env.GH_TOKEN;
const RECURSIVE = (process.env.GH_RECURSIVE || 'true') !== 'false';
const OUT = process.env.VIDEO_MANIFEST_OUT || 'video-manifest.json';

const ALLOWED_EXTENSIONS = new Set([
  'mp4', 'webm', 'ogv', 'ogg', 'mov', 'm4v', 'avi', 'mkv',
  '3gp', '3g2', 'mpeg', 'mpg', 'ts', 'mts', 'm2ts'
]);

function getExt(name = '') {
  return String(name).split('?')[0].split('#')[0].split('.').pop().toLowerCase();
}

function isVideo(name = '') {
  return ALLOWED_EXTENSIONS.has(getExt(name));
}

function titleFromName(name = '') {
  return decodeURIComponent(String(name))
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function headers() {
  const h = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'netlify-video-manifest-generator'
  };
  if (TOKEN) h.Authorization = `Bearer ${TOKEN}`;
  return h;
}

async function githubJson(url) {
  const res = await fetch(url, { headers: headers() });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GitHub API xətası ${res.status}: ${text.slice(0, 300)}`);
  }
  return JSON.parse(text);
}

async function listFolder(folder) {
  const url = `https://api.github.com/repos/${encodeURIComponent(OWNER)}/${encodeURIComponent(REPO)}/contents/${folder.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(BRANCH)}`;
  const items = await githubJson(url);
  if (!Array.isArray(items)) return [];

  const files = [];
  for (const item of items) {
    if (item.type === 'file' && isVideo(item.name)) {
      files.push({
        name: item.name,
        path: item.path,
        title: titleFromName(item.name),
        url: item.download_url
      });
    }
    if (RECURSIVE && item.type === 'dir') {
      files.push(...await listFolder(item.path));
    }
  }
  return files;
}

async function main() {
  const videos = await listFolder(FOLDER);
  const manifest = {
    generatedAt: new Date().toISOString(),
    owner: OWNER,
    repo: REPO,
    branch: BRANCH,
    folder: FOLDER,
    count: videos.length,
    videos
  };

  fs.writeFileSync(path.resolve(process.cwd(), OUT), JSON.stringify(manifest, null, 2));
  console.log(`Video manifest yaradıldı: ${videos.length} video -> ${OUT}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
