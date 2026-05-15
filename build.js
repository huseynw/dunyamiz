const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { minify } = require("terser");

// Bu fayllar minify+obfuscate ediləcək
const jsToObfuscate = ["hcayar.js", "video.js"];

const filesToHash = ["hcstil.css", "hcayar.js", "gsap.min.js"];
const outDir = "dist";

const supportedVideoExts = [
  ".mp4", ".webm", ".ogv", ".ogg", ".mov", ".m4v",
  ".avi", ".mkv", ".3gp", ".3g2", ".mpeg", ".mpg",
  ".ts", ".mts", ".m2ts"
];

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });

  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function obfuscateJsFiles() {
  for (const jsFile of jsToObfuscate) {
    const destPath = path.join(outDir, jsFile);
    if (!fs.existsSync(destPath)) continue;

    const code = fs.readFileSync(destPath, "utf8");
    const result = await minify(code, {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 3,
      },
      mangle: {
        toplevel: true,
        eval: true,
      },
      format: {
        comments: false,
        semicolons: true,
      },
      sourceMap: false,
    });

    if (result.code) {
      fs.writeFileSync(destPath, result.code, "utf8");
      const origKb = (code.length / 1024).toFixed(1);
      const newKb = (result.code.length / 1024).toFixed(1);
      console.log(`✓ Obfuscate: ${jsFile} (${origKb}kb → ${newKb}kb)`);
    }
  }
}

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("md5").update(content).digest("hex").slice(0, 10);
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

function patchHtmlFiles() {
  const htmlFiles = fs
    .readdirSync(outDir)
    .filter((file) => file.endsWith(".html"));

  for (const htmlFile of htmlFiles) {
    const htmlPath = path.join(outDir, htmlFile);
    let html = fs.readFileSync(htmlPath, "utf8");

    for (const file of filesToHash) {
      const originalPath = path.join(outDir, file);
      if (!fs.existsSync(originalPath)) continue;

      const ext = path.extname(file);
      const name = path.basename(file, ext);
      const hash = hashFile(originalPath);
      const hashedName = `${name}.${hash}${ext}`;

      if (!fs.existsSync(path.join(outDir, hashedName))) {
        fs.renameSync(originalPath, path.join(outDir, hashedName));
      }

      html = html.replaceAll(file, hashedName);
    }

    fs.writeFileSync(htmlPath, html);
  }
}

async function main() {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  for (const item of fs.readdirSync(".")) {
    if (
      item === "dist" ||
      item === "node_modules" ||
      item === ".git" ||
      item === "build.js"
    ) {
      continue;
    }

    const srcPath = path.join(".", item);
    const destPath = path.join(outDir, item);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }

  generateVideoList();
  patchHtmlFiles();

  console.log("\n🔒 JS faylları obfuscate edilir...");
  await obfuscateJsFiles();

  console.log("\n✅ Build hazırdır: dist/");
}

main().catch((err) => {
  console.error("Build xətası:", err);
  process.exit(1);
});
