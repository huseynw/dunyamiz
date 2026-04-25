const OWNER = process.env.GH_OWNER || 'huseynw';
const REPO = process.env.GH_REPO || 'dunyamiz';
const FOLDER = process.env.GH_VIDEO_FOLDER || 'video';
const BRANCH_ENV = process.env.GH_BRANCH || 'main';
const TOKEN = process.env.GH_TOKEN;
const RECURSIVE = (process.env.GH_RECURSIVE || 'true') !== 'false';

const ALLOWED_EXTENSIONS = [
  'mp4', 'webm', 'ogv', 'ogg', 'mov', 'm4v', 'avi', 'mkv',
  '3gp', '3g2', 'mpeg', 'mpg', 'ts', 'mts', 'm2ts'
];

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60'
    },
    body: JSON.stringify(body)
  };
}

function getExt(name = '') {
  return String(name).split('?')[0].split('#')[0].split('.').pop().toLowerCase();
}

function isVideo(name = '') {
  return ALLOWED_EXTENSIONS.includes(getExt(name));
}

function mimeType(name = '') {
  const ext = getExt(name);
  return {
    mp4: 'video/mp4',
    m4v: 'video/mp4',
    webm: 'video/webm',
    ogv: 'video/ogg',
    ogg: 'video/ogg',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    '3gp': 'video/3gpp',
    '3g2': 'video/3gpp2',
    mpeg: 'video/mpeg',
    mpg: 'video/mpeg',
    ts: 'video/mp2t',
    mts: 'video/mp2t',
    m2ts: 'video/mp2t'
  }[ext] || 'application/octet-stream';
}

function authHeaders(extra = {}) {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'netlify-github-video-loader',
    ...extra
  };

  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  return headers;
}

async function getDefaultBranch() {
  if (BRANCH_ENV) return BRANCH_ENV;

  const url = `https://api.github.com/repos/${encodeURIComponent(OWNER)}/${encodeURIComponent(REPO)}`;
  const res = await fetch(url, { headers: authHeaders() });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Repo oxunmadı: ${res.status} ${text.slice(0, 180)}`);
  }

  const data = await res.json();
  return data.default_branch || 'main';
}

async function listFolder(folder, branch) {
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(OWNER)}/${encodeURIComponent(REPO)}/contents/${encodeURIComponent(folder)}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(apiUrl, { headers: authHeaders() });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Video qovluğu oxunmadı: ${res.status} ${text.slice(0, 180)}`);
  }

  const items = await res.json();
  if (!Array.isArray(items)) return [];

  const files = [];

  for (const item of items) {
    if (item.type === 'file' && isVideo(item.name)) {
      files.push({
        name: item.name,
        path: item.path,
        title: item.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '),
        url: `/.netlify/functions/github-videos?file=${encodeURIComponent(item.path)}`
      });
    }

    if (RECURSIVE && item.type === 'dir') {
      const nested = await listFolder(item.path, branch);
      files.push(...nested);
    }
  }

  return files;
}

async function streamFile(path, branch, rangeHeader) {
  if (!path || path.includes('..') || !path.startsWith(`${FOLDER}/`)) {
    return json(400, { error: 'Yanlış video path.' });
  }

  if (!isVideo(path)) {
    return json(415, { error: 'Bu fayl video formatı deyil.' });
  }

  const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(OWNER)}/${encodeURIComponent(REPO)}/${encodeURIComponent(branch)}/${path.split('/').map(encodeURIComponent).join('/')}`;
  const headers = authHeaders({ Accept: '*/*' });
  if (rangeHeader) headers.Range = rangeHeader;

  const upstream = await fetch(rawUrl, { headers });

  if (!upstream.ok && upstream.status !== 206) {
    const text = await upstream.text();
    return json(upstream.status, { error: `Video oxunmadı: ${upstream.status}`, details: text.slice(0, 180) });
  }

  const responseHeaders = {
    'Content-Type': upstream.headers.get('content-type') || mimeType(path),
    'Cache-Control': 'public, max-age=3600',
    'Accept-Ranges': 'bytes'
  };

  const contentLength = upstream.headers.get('content-length');
  const contentRange = upstream.headers.get('content-range');
  if (contentLength) responseHeaders['Content-Length'] = contentLength;
  if (contentRange) responseHeaders['Content-Range'] = contentRange;

  const arrayBuffer = await upstream.arrayBuffer();

  return {
    statusCode: upstream.status,
    headers: responseHeaders,
    body: Buffer.from(arrayBuffer).toString('base64'),
    isBase64Encoded: true
  };
}

exports.handler = async (event) => {
  try {
    const branch = await getDefaultBranch();
    const filePath = event.queryStringParameters && event.queryStringParameters.file;

    if (filePath) {
      return await streamFile(filePath, branch, event.headers.range || event.headers.Range);
    }

    const files = await listFolder(FOLDER, branch);
    return json(200, {
      owner: OWNER,
      repo: REPO,
      branch,
      folder: FOLDER,
      count: files.length,
      videos: files
    });
  } catch (err) {
    return json(500, {
      error: err.message || 'Bilinməyən Netlify/GitHub xətası',
      hint: 'Netlify Environment Variables: GH_TOKEN, GH_OWNER, GH_REPO, GH_VIDEO_FOLDER yoxla.'
    });
  }
};
