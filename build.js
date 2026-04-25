const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const filesToHash = ["hcstil.css", "hcayar.js", "gsap.min.js"];
const outDir = "dist";

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

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("md5").update(content).digest("hex").slice(0, 10);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const item of fs.readdirSync(".")) {
  if (
    item === "dist" ||
    item === "node_modules" ||
    item === ".git" ||
    item === "build.js"
  ) continue;

  const srcPath = path.join(".", item);
  const destPath = path.join(outDir, item);

  if (fs.statSync(srcPath).isDirectory()) {
    copyDir(srcPath, destPath);
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
}
function generateVideoList() {
  const videoDir = path.join(__dirname, "video");
  const outputJson = path.join(outDir, "video-list.json");
  const supportedExts = [".mp4", ".webm", ".ogv", ".mov", ".avi", ".mkv"];

  if (!fs.existsSync(videoDir)) {
    fs.writeFileSync(outputJson, JSON.stringify([]));
    console.log("video qovluğu yoxdur, boş video-list.json yaradıldı.");
    return;
  }

  const files = fs.readdirSync(videoDir)
    .filter(f => supportedExts.includes(path.extname(f).toLowerCase()))
    .map(f => ({
      name: f,
      path: `video/${f}`,
      type: `video/${f.split(".").pop().toLowerCase()}`
    }));

  fs.writeFileSync(outputJson, JSON.stringify(files, null, 2));
  console.log(`${files.length} video tapıldı → dist/video-list.json yaradıldı.`);
}
generateVideoList();
let html = fs.readFileSync(path.join(outDir, "index.html"), "utf8");

for (const file of filesToHash) {
  const originalPath = path.join(outDir, file);
  if (!fs.existsSync(originalPath)) continue;

  const ext = path.extname(file);
  const name = path.basename(file, ext);
  const hash = hashFile(originalPath);
  const hashedName = `${name}.${hash}${ext}`;

  fs.renameSync(originalPath, path.join(outDir, hashedName));

  html = html.replaceAll(file, hashedName);
}

fs.writeFileSync(path.join(outDir, "index.html"), html);

console.log("Build hazırdır: dist/");
