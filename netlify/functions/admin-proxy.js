const fetch = require('node-fetch');

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

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { type, password, payload } = JSON.parse(event.body);
        const GH_TOKEN = process.env.GH_TOKEN;
        const repoOwner = "huseynw";
        const repoName = "dunyamiz";

        if (!GH_TOKEN) {
            return {
                statusCode: 500,
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({ success: false, error: "GH_TOKEN tapılmadı." })
            };
        }

        if (password !== "030825") {
            return {
                statusCode: 401,
                headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({ success: false, error: "Şifrə səhvdir!" })
            };
        }

        // =========================
        // CONFIG UPDATE
        // =========================
        if (type === "update_config") {
            const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${payload.path}`;

            const res = await fetch(url, {
                headers: { "Authorization": `token ${GH_TOKEN}` }
            });

            const fileData = await res.json();

            if (!res.ok) {
                throw new Error(fileData?.message || "hcayar.js oxunmadı");
            }

            const sha = fileData.sha;
            let oldContent = Buffer.from(fileData.content, 'base64').toString('utf-8');

            if (payload.newDate) {
                oldContent = oldContent.replace(
                    /const targetDate = new Date\("[^"]+"\);/,
                    `const targetDate = new Date("${payload.newDate}:00");`
                );
            }

            if (payload.newCount) {
                oldContent = oldContent.replace(
                    /meetingCount: \d+,/,
                    `meetingCount: ${payload.newCount},`
                );
            }

            const finalContent = Buffer.from(oldContent).toString('base64');

            const ghResponse = await fetch(url, {
                method: 'PUT',
                headers: {
                    "Authorization": `token ${GH_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: "Admin: Məlumatlar yeniləndi",
                    content: finalContent,
                    sha
                })
            });

            const resData = await ghResponse.json();

            return {
                statusCode: 200,
                body: JSON.stringify({ success: ghResponse.ok, details: resData })
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
