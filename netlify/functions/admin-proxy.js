const fetch = require('node-fetch');
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


function normalizeMeetingDateTime(value) {
    if (!value) return null;

    let normalized = String(value).trim();
    if (!normalized) return null;

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
        normalized += ':00';
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
        const githubNeededTypes = new Set(["upload_image", "upload_note", "upload_music_json", "upload_music"]);

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
