const fetch = require("node-fetch");

const OWNER = "huseynw";
const REPO = "dunyamiz";
const BRANCH = "main";

const ALLOWED_PREFIXES = ["musiqiler/", "notlar/", "gallery/", "assets/"];

exports.handler = async (event) => {
  try {
    let file = String(event.queryStringParameters?.file || "")
      .trim()
      .replace(/^\/+/, "");

    if (file.includes(".netlify/functions/github-raw")) {
      try {
        const nested = new URL(file, "https://dunyamiz.me");
        const nestedFile = nested.searchParams.get("file");
        if (nestedFile) file = nestedFile.replace(/^\/+/, "");
      } catch (_) {}
    }

    if (!file) return json(400, { success: false, error: "file parametri yoxdur" });

    if (!ALLOWED_PREFIXES.some(prefix => file.startsWith(prefix))) {
      return json(403, { success: false, error: "Bu fayla icazə yoxdur" });
    }

    const token = process.env.GH_TOKEN;
    const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodePath(file)}?ref=${BRANCH}`;

    const res = await fetch(apiUrl, {
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

    if (!data.download_url) {
      return json(404, { success: false, error: "download_url tapılmadı" });
    }

    return {
      statusCode: 302,
      headers: {
        Location: data.download_url,
        "Cache-Control": "public, max-age=300",
        "Access-Control-Allow-Origin": "*"
      },
      body: ""
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

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(body)
  };
}
