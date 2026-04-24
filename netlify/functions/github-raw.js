const fetch = require("node-fetch");

const OWNER = "huseynw";
const REPO = "dunyamiz";
const BRANCH = "main";

const ALLOWED_PREFIXES = ["musiqiler/", "notlar/", "gallery/", "assets/"];

exports.handler = async (event) => {
  try {
    let file = String(event.queryStringParameters?.file || "").trim().replace(/^\/+/, "");

    // Əvvəlki frontend bəzən file parametrinə yenidən ".netlify/functions/github-raw?file=..." göndərirdi.
    // Bu halda real fayl yolunu çıxarırıq ki, 403 olmasın.
    if (file.includes(".netlify/functions/github-raw")) {
      try {
        const nested = new URL(file, "https://dunyamiz.me");
        const nestedFile = nested.searchParams.get("file");
        if (nestedFile) file = nestedFile.replace(/^\/+/, "");
      } catch (_) {}
    }

    if (!file) {
      return json(400, { success: false, error: "file parametri yoxdur" });
    }

    if (!ALLOWED_PREFIXES.some(prefix => file.startsWith(prefix))) {
      return json(403, { success: false, error: "Bu fayla icazə yoxdur" });
    }

    const token = process.env.GH_TOKEN;
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodePath(file)}?ref=${BRANCH}`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    const data = await res.json();

    if (!res.ok) {
      return json(res.status, {
        success: false,
        error: data?.message || "GitHub faylı alınmadı"
      });
    }

    const downloadUrl = data.download_url;

    if (!downloadUrl) {
      return json(404, { success: false, error: "download_url tapılmadı" });
    }

    const fileRes = await fetch(downloadUrl);

    if (!fileRes.ok) {
      return json(fileRes.status, {
        success: false,
        error: "Fayl yüklənmədi"
      });
    }

    const buffer = await fileRes.buffer();
    const contentType = detectContentType(file, fileRes.headers.get("content-type"));

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*"
      },
      body: buffer.toString("base64")
    };
  } catch (err) {
    return json(500, {
      success: false,
      error: err.message || "Server xətası"
    });
  }
};

function encodePath(file) {
  return file.split("/").map(encodeURIComponent).join("/");
}

function detectContentType(file, fallback) {
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
  if (file.endsWith(".mp3")) return "audio/mpeg";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".webp")) return "image/webp";
  if (file.endsWith(".lrc")) return "text/plain; charset=utf-8";
  return fallback || "application/octet-stream";
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache"
    },
    body: JSON.stringify(body)
  };
}
