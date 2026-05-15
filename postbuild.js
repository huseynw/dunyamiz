const fs = require("fs");
const path = require("path");

const outDir = "dist";
const toCopy = [
  "assets", "gallery", "musiqiler", "video", "notlar",
  "manifest.json", "_headers", "OneSignalSDKWorker.js", "sitemap.xml",
  "netlify"
];

const supportedVideoExts = [
  ".mp4", ".webm", ".ogv", ".ogg", ".mov", ".m4v",
  ".avi", ".mkv", ".3gp", ".3g2", ".mpeg", ".mpg",
  ".ts", ".mts", ".m2ts"
];

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyDir(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function getVideoMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const types = {
    ".mp4": "video/mp4",
    ".m4v": "video/mp4",
    ".webm": "video/webm",
    ".ogv": "video/ogg",
    ".ogg": "video/ogg",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",
    ".3gp": "video/3gpp",
    ".3g2": "video/3gpp2",
    ".mpeg": "video/mpeg",
    ".mpg": "video/mpeg",
    ".ts": "video/mp2t",
    ".mts": "video/mp2t",
    ".m2ts": "video/mp2t"
  };
  return types[ext] || "video/mp4";
}

function walkVideos(dir, baseDir = dir) {
  if (!fs.existsSync(dir)) return [];
  let results = [];
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(walkVideos(fullPath, baseDir));
      continue;
    }
    const ext = path.extname(item).toLowerCase();
    if (!supportedVideoExts.includes(ext)) continue;
    const relativePath = path
      .relative(baseDir, fullPath)
      .replace(/\\/g, "/");
    results.push({
      name: item,
      path: `video/${relativePath}`,
      url: `video/${relativePath}`,
      type: getVideoMimeType(item)
    });
  }
  return results;
}

function generateVideoList() {
  const videoDir = path.join(__dirname, "video");
  const files = walkVideos(videoDir);
  const outputListJson = path.join(outDir, "video-list.json");
  const outputManifestJson = path.join(outDir, "video-manifest.json");

  fs.writeFileSync(outputListJson, JSON.stringify(files, null, 2));
  fs.writeFileSync(
    outputManifestJson,
    JSON.stringify(
      {
        count: files.length,
        videos: files
      },
      null,
      2
    )
  );

  console.log(`${files.length} video tapıldı.`);
  console.log("dist/video-list.json yaradıldı.");
  console.log("dist/video-manifest.json yaradıldı.");
}

async function main() {
  console.log("\n📦 Statik fayllar kopyalanır...");
  for (const item of toCopy) {
    const srcPath = path.join(".", item);
    const destPath = path.join(outDir, item);
    if (fs.existsSync(srcPath)) {
      copyDir(srcPath, destPath);
      console.log(`✓ Copied ${item}`);
    }
  }

  console.log("\n🎬 Video manifest yaradılır...");
  generateVideoList();

  console.log("\n✅ Post-build tamamlandı.");
}

main().catch(console.error);
