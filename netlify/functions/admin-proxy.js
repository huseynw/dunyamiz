const fetch = require('node-fetch');
const crypto = require('crypto');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
function buildErrorResponse(statusCode, error, extra = {}) {
    const message = error instanceof Error ? error.message : String(error || 'Naməlum xəta');
    const stack = error instanceof Error && error.stack ? error.stack.split('\n').slice(0, 6).join('\n') : undefined;

    return {
        statusCode,
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({
            success: false,
            error: message,
            ...(stack ? { stack } : {}),
            ...extra
        })
    };
}

async function getExistingFileSha({ repoOwner, repoName, token, path }) {
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
    const response = await fetch(url, {
        headers: {
            "Authorization": `token ${token}`,
            "Accept": "application/vnd.github+json"
        }
    });

    if (response.status === 404) {
        return null;
    }

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.message || `GitHub faylı oxunmadı: ${path}`);
    }

    return data?.sha || null;
}

async function putGitHubFile({ repoOwner, repoName, token, path, content, message }) {
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
    const existingSha = await getExistingFileSha({ repoOwner, repoName, token, path });

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/vnd.github+json"
        },
        body: JSON.stringify({
            message,
            content,
            ...(existingSha ? { sha: existingSha } : {})
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.message || `GitHub upload failed for ${path}`);
    }

    return data;
}



function encodeKeyPath(key = '') {
    return String(key)
        .split('/')
        .filter(Boolean)
        .map(part => encodeURIComponent(part))
        .join('/');
}

function sha256Hex(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

function hmac(key, value, encoding) {
    return crypto.createHmac('sha256', key).update(value).digest(encoding);
}

function getAmzDates(now = new Date()) {
    const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    return {
        amzDate: `${iso.slice(0, 8)}T${iso.slice(8, 14)}Z`,
        shortDate: iso.slice(0, 8)
    };
}

function getR2Config() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET;
    const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/$/, '');

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
        throw new Error('R2 env-ləri natamamdır. R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL lazımdır.');
    }

    return {
        accountId,
        accessKeyId,
        secretAccessKey,
        bucket,
        publicBaseUrl,
        host: `${accountId}.r2.cloudflarestorage.com`,
        region: 'auto',
        service: 's3'
    };
}

async function uploadBufferToR2({ key, buffer, contentType = 'application/octet-stream', cacheControl = 'public, max-age=31536000, immutable' }) {
    const cfg = getR2Config();
    const bodyBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const payloadHash = sha256Hex(bodyBuffer);
    const { amzDate, shortDate } = getAmzDates();
    const canonicalUri = `/${cfg.bucket}/${encodeKeyPath(key)}`;

    const canonicalHeaders = [
        `content-type:${contentType}`,
        `host:${cfg.host}`,
        `x-amz-content-sha256:${payloadHash}`,
        `x-amz-date:${amzDate}`
    ].join('\n') + '\n';

    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = [
        'PUT',
        canonicalUri,
        '',
        canonicalHeaders,
        signedHeaders,
        payloadHash
    ].join('\n');

    const credentialScope = `${shortDate}/${cfg.region}/${cfg.service}/aws4_request`;
    const stringToSign = [
        'AWS4-HMAC-SHA256',
        amzDate,
        credentialScope,
        sha256Hex(canonicalRequest)
    ].join('\n');

    const kDate = hmac(`AWS4${cfg.secretAccessKey}`, shortDate);
    const kRegion = hmac(kDate, cfg.region);
    const kService = hmac(kRegion, cfg.service);
    const kSigning = hmac(kService, 'aws4_request');
    const signature = hmac(kSigning, stringToSign, 'hex');
    const authorization = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(`https://${cfg.host}${canonicalUri}`, {
        method: 'PUT',
        headers: {
            'Content-Type': contentType,
            'Cache-Control': cacheControl,
            'x-amz-content-sha256': payloadHash,
            'x-amz-date': amzDate,
            'Authorization': authorization,
            'Content-Length': String(bodyBuffer.length)
        },
        body: bodyBuffer
    });

    if (!response.ok) {
        const raw = await response.text();
        throw new Error(`R2 upload xətası (${response.status}): ${raw || response.statusText}`);
    }

    return {
        key,
        url: `${cfg.publicBaseUrl}/${encodeKeyPath(key)}`,
        bucket: cfg.bucket,
        publicBaseUrl: cfg.publicBaseUrl,
        contentType
    };
}

function inferExtensionFromUrl(url = '', fallback = '') {
    const cleaned = String(url).split('?')[0].split('#')[0];
    const match = cleaned.match(/\.([a-z0-9]{2,5})$/i);
    return match ? match[1].toLowerCase() : fallback;
}

function extensionFromContentType(contentType = '', fallback = '') {
    const normalized = String(contentType).split(';')[0].trim().toLowerCase();
    const map = {
        'audio/mpeg': 'mp3',
        'audio/mp3': 'mp3',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif'
    };
    return map[normalized] || fallback;
}

function isCloudinaryUrl(url = '') {
    return /cloudinary\.com/i.test(String(url));
}

async function fetchRemoteAsset(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Uzaq fayl yüklənmədi (${response.status}): ${url}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
        buffer: Buffer.from(arrayBuffer),
        contentType: response.headers.get('content-type') || 'application/octet-stream'
    };
}

async function listGitHubFiles({ repoOwner, repoName, token, path }) {
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github+json'
        }
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.message || `${path} qovluğu oxunmadı.`);
    }

    if (!Array.isArray(data)) {
        throw new Error(`${path} qovluğu gözlənilən formatda gəlmədi.`);
    }

    return data;
}

function toBase64Json(data) {
    return Buffer.from(JSON.stringify(data, null, 2), 'utf8').toString('base64');
}

function normalizeMeetingDateTime(value) {
    if (!value) return null;

    let normalized = String(value).trim();
    if (!normalized) return null;

    normalized = normalized.replace(' ', 'T');

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
        return `${normalized}:00+04:00`;
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(normalized)) {
        return `${normalized}+04:00`;
    }

    return normalized;
}

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { type, password, payload } = JSON.parse(event.body);
        const GH_TOKEN = process.env.GH_TOKEN;
        const repoOwner = "huseynw";
        const repoName = "dunyamiz";
        const githubNeededTypes = new Set(["upload_image", "upload_note", "upload_music_json", "upload_music", "upload_music_r2", "migrate_music_to_r2"]);

        if (githubNeededTypes.has(type) && !GH_TOKEN) {
            return {
                statusCode: 500,
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({ success: false, error: "GH_TOKEN tapılmadı." })
            };
        }

        if (password !== ADMIN_PASSWORD) {
            return {
                statusCode: 401,
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({ success: false, error: "Şifrə səhvdir!" })
            };
        }

        // =========================
        // CONFIG UPDATE
        // =========================
        if (type === "verify_site") {
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({ success: true, message: "Giriş uğurludur" })
            };
        }
        if (type === "update_config") {
            const SUPABASE_URL = process.env.SUPABASE_URL;
            const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

            if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
                throw new Error("SUPABASE_URL və ya SUPABASE_SERVICE_ROLE_KEY tapılmadı.");
            }

            const updates = {};

            const normalizedDate = normalizeMeetingDateTime(payload?.newDate);
            if (normalizedDate) {
                updates.next_meeting_date = normalizedDate;
                updates.updated_at = new Date().toISOString();
            }

            if (payload?.newCount !== undefined && payload?.newCount !== null && String(payload.newCount).trim() !== '') {
                const parsedCount = Number(payload.newCount);
                if (Number.isNaN(parsedCount)) {
                    throw new Error("Görüş sayı düzgün deyil.");
                }
                updates.meeting_count = parsedCount;
                updates.updated_at = new Date().toISOString();
            }

            if (!Object.keys(updates).length) {
                throw new Error("Dəyişiklik yoxdur.");
            }

            const response = await fetch(`${SUPABASE_URL}/rest/v1/site_settings?id=eq.1`, {
                method: 'PATCH',
                headers: {
                    "apikey": SUPABASE_SERVICE_ROLE_KEY,
                    "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    "Content-Type": "application/json",
                    "Prefer": "return=representation"
                },
                body: JSON.stringify(updates)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.message || result?.error || "Supabase update xətası baş verdi.");
            }

            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({ success: true, details: result })
            };
        }

        // =========================
        // IMAGE UPLOAD
        // =========================
        if (type === "upload_image") {
            const result = await putGitHubFile({
                repoOwner,
                repoName,
                token: GH_TOKEN,
                path: payload.path,
                content: payload.content,
                message: "Admin: Yeni şəkil yükləndi"
            });

            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, details: result })
            };
        }

        // =========================
        // NOTE UPLOAD
        // =========================
        if (type === "upload_note") {
            const result = await putGitHubFile({
                repoOwner,
                repoName,
                token: GH_TOKEN,
                path: payload.path,
                content: payload.content,
                message: "Admin: Not əlavə edildi"
            });

            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, details: result })
            };
        }
        if (type === "upload_music_json") {
            const { path, content } = payload;

            if (!path || !content) {
                return {
                    statusCode: 400,
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                    body: JSON.stringify({
                        success: false,
                        error: "Musiqi məlumatları natamamdır."
                    })
                };
            }

            const result = await putGitHubFile({
                repoOwner,
                repoName,
                token: GH_TOKEN,
                path,
                content,
                message: "Admin: Storage linkli musiqi JSON faylı əlavə edildi"
            });

            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, details: result })
            };
        }

        // =========================
        // MUSIC UPLOAD (MP3 + JSON)
        // =========================
        if (type === "upload_music") {
            const {
                slug,
                audioPath,
                jsonPath,
                audioContent,
                coverPath,
                coverContent,
                jsonContent
            } = payload;

            if (!slug || !audioPath || !jsonPath || !audioContent || !jsonContent) {
                return {
                    statusCode: 400,
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                    body: JSON.stringify({ success: false, error: "Musiqi payload məlumatları natamamdır." })
                };
            }

            // Vacib düzəliş:
            // GitHub Contents API-yə paralel PUT atanda branch SHA conflict yarana bilir.
            // Ona görə audio -> optional cover -> json ardıcıllığında yükləyirik.
            const audioResult = await putGitHubFile({
                repoOwner,
                repoName,
                token: GH_TOKEN,
                path: audioPath,
                content: audioContent,
                message: `Admin: Yeni musiqi əlavə edildi (${slug}.mp3)`
            });

            let coverResult = null;
            if (coverPath && coverContent) {
                coverResult = await putGitHubFile({
                    repoOwner,
                    repoName,
                    token: GH_TOKEN,
                    path: coverPath,
                    content: coverContent,
                    message: `Admin: Musiqi cover şəkli əlavə edildi (${slug})`
                });
            }

            const jsonResult = await putGitHubFile({
                repoOwner,
                repoName,
                token: GH_TOKEN,
                path: jsonPath,
                content: jsonContent,
                message: `Admin: Musiqi məlumat faylı əlavə edildi (${slug}.json)`
            });

            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    details: {
                        audio: audioResult,
                        cover: coverResult,
                        json: jsonResult
                    }
                })
            };
        }


if (type === "upload_music_r2") {
    const {
        slug: rawSlug,
        jsonPath: rawJsonPath,
        trackMeta: rawTrackMeta,
        r2AudioKey: rawR2AudioKey,
        audioContent,
        remoteAudioUrl,
        r2CoverKey: rawR2CoverKey,
        coverContent,
        remoteCoverUrl,
        audioContentType: incomingAudioContentType,
        coverContentType: incomingCoverContentType
    } = payload || {};

    const slug = String(rawSlug || '').trim();
    const jsonPath = String(rawJsonPath || (slug ? `musiqiler/${slug}.json` : '')).trim();
    const r2AudioKey = String(rawR2AudioKey || (slug ? `music/${slug}.mp3` : '')).trim();
    const r2CoverKey = String(rawR2CoverKey || '').trim();

    const trackMeta = rawTrackMeta && typeof rawTrackMeta === 'string'
        ? JSON.parse(rawTrackMeta)
        : (rawTrackMeta || null);

    const missingFields = [];
    if (!slug) missingFields.push('slug');
    if (!jsonPath) missingFields.push('jsonPath');
    if (!trackMeta || typeof trackMeta !== 'object') missingFields.push('trackMeta');
    if (!r2AudioKey) missingFields.push('r2AudioKey');
    if (!audioContent && !remoteAudioUrl) missingFields.push('audioContent və ya remoteAudioUrl');

    if (missingFields.length) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
                success: false,
                error: `R2 musiqi payload məlumatları natamamdır: ${missingFields.join(', ')}`
            })
        };
    }

    let audioBuffer;
    let audioContentType = incomingAudioContentType || 'audio/mpeg';

    if (audioContent) {
        audioBuffer = Buffer.from(audioContent, 'base64');
    } else {
        const remoteAudio = await fetchRemoteAsset(remoteAudioUrl);
        audioBuffer = remoteAudio.buffer;
        audioContentType = remoteAudio.contentType || audioContentType;
    }

    const audioUpload = await uploadBufferToR2({
        key: r2AudioKey,
        buffer: audioBuffer,
        contentType: audioContentType
    });

    let coverUpload = null;
    if (coverContent || remoteCoverUrl) {
        let coverBuffer;
        let coverContentType = incomingCoverContentType || 'image/jpeg';

        if (coverContent) {
            coverBuffer = Buffer.from(coverContent, 'base64');
        } else {
            const remoteCover = await fetchRemoteAsset(remoteCoverUrl);
            coverBuffer = remoteCover.buffer;
            coverContentType = remoteCover.contentType || coverContentType;
        }

        const finalCoverKey = r2CoverKey || `covers/${slug}.${extensionFromContentType(coverContentType, 'jpg') || 'jpg'}`;

        coverUpload = await uploadBufferToR2({
            key: finalCoverKey,
            buffer: coverBuffer,
            contentType: coverContentType
        });
    }

    const finalMeta = {
        ...trackMeta,
        id: trackMeta?.id || slug,
        audio: audioUpload.url,
        cover: coverUpload?.url || trackMeta?.cover || '',
        provider: 'r2',
        storage: {
            provider: 'r2',
            bucket: audioUpload.bucket,
            publicBaseUrl: audioUpload.publicBaseUrl,
            audioKey: r2AudioKey,
            coverKey: coverUpload?.key || r2CoverKey || '',
            mode: remoteAudioUrl ? 'cloudinary-import' : 'direct-upload',
            migratedFrom: remoteAudioUrl ? {
                provider: 'cloudinary',
                audioUrl: remoteAudioUrl,
                coverUrl: remoteCoverUrl || ''
            } : undefined,
            migratedAt: remoteAudioUrl ? new Date().toISOString() : undefined
        }
    };

    const jsonResult = await putGitHubFile({
        repoOwner,
        repoName,
        token: GH_TOKEN,
        path: jsonPath,
        content: toBase64Json(finalMeta),
        message: `Admin: R2 musiqi məlumat faylı əlavə edildi (${slug}.json)`
    });

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
            success: true,
            details: {
                audio: audioUpload,
                cover: coverUpload,
                json: jsonResult,
                migrated: Boolean(remoteAudioUrl)
            }
        })
    };
}

if (type === "migrate_music_to_r2") {
    const files = await listGitHubFiles({
        repoOwner,
        repoName,
        token: GH_TOKEN,
        path: 'musiqiler'
    });

    const jsonFiles = files.filter((item) => item.type === 'file' && item.name.toLowerCase().endsWith('.json'));
    const results = [];

    for (const file of jsonFiles) {
        const rawResponse = await fetch(file.download_url);
        if (!rawResponse.ok) {
            results.push({ file: file.name, status: 'skip', reason: 'JSON oxunmadı' });
            continue;
        }

        const data = await rawResponse.json();
        const audioUrl = String(data?.audio || '').trim();
        const coverUrl = String(data?.cover || '').trim();
        const slug = String(data?.id || file.name.replace(/\.json$/i, '')).trim();

        if (!isCloudinaryUrl(audioUrl) && !(coverUrl && isCloudinaryUrl(coverUrl))) {
            results.push({ file: file.name, status: 'skip', reason: 'Cloudinary link tapılmadı' });
            continue;
        }

        const audioRemote = await fetchRemoteAsset(audioUrl);
        const audioExt = inferExtensionFromUrl(audioUrl, extensionFromContentType(audioRemote.contentType, 'mp3')) || 'mp3';
        const audioKey = `music/${slug}.${audioExt}`;
        const audioUpload = await uploadBufferToR2({
            key: audioKey,
            buffer: audioRemote.buffer,
            contentType: audioRemote.contentType || 'audio/mpeg'
        });

        let coverUpload = null;
        let coverKey = '';
        if (coverUrl && isCloudinaryUrl(coverUrl)) {
            const coverRemote = await fetchRemoteAsset(coverUrl);
            const coverExt = inferExtensionFromUrl(coverUrl, extensionFromContentType(coverRemote.contentType, 'jpg')) || 'jpg';
            coverKey = `covers/${slug}.${coverExt}`;
            coverUpload = await uploadBufferToR2({
                key: coverKey,
                buffer: coverRemote.buffer,
                contentType: coverRemote.contentType || 'image/jpeg'
            });
        }

        const updated = {
            ...data,
            audio: audioUpload.url,
            cover: coverUpload?.url || (isCloudinaryUrl(coverUrl) ? '' : coverUrl),
            provider: 'r2',
            storage: {
                ...(data?.storage || {}),
                provider: 'r2',
                bucket: audioUpload.bucket,
                publicBaseUrl: audioUpload.publicBaseUrl,
                audioKey,
                coverKey,
                mode: 'cloudinary-import',
                migratedFrom: {
                    provider: 'cloudinary',
                    audioUrl,
                    coverUrl
                },
                migratedAt: new Date().toISOString()
            }
        };

        await putGitHubFile({
            repoOwner,
            repoName,
            token: GH_TOKEN,
            path: file.path,
            content: toBase64Json(updated),
            message: `Admin: Cloudinary mahnısı R2-yə köçürüldü (${slug})`
        });

        results.push({
            file: file.name,
            status: 'migrated',
            audio: audioUpload.url,
            cover: coverUpload?.url || updated.cover || ''
        });
    }

    const migratedCount = results.filter((item) => item.status === 'migrated').length;
    const skippedCount = results.filter((item) => item.status === 'skip').length;

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
            success: true,
            details: {
                migratedCount,
                skippedCount,
                results
            }
        })
    };
}

        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({ success: false, error: "Naməlum əməliyyat növü." })
        };

    } catch (error) {
        console.error('admin-proxy error:', error);
        return buildErrorResponse(500, error);
    }
};
