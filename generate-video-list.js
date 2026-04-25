const fs = require('fs');
const path = require('path');

const videoDir = path.join(__dirname, 'video');
const outputFile = path.join(__dirname, 'video-list.json');

const videoExtensions = ['.mp4', '.webm', '.ogv', '.mov', '.avi', '.mkv'];

try {
  if (!fs.existsSync(videoDir)) {
    console.log('⚠️ video qovluğu tapılmadı, boş siyahı yaradılır.');
    fs.writeFileSync(outputFile, JSON.stringify([]));
    process.exit(0);
  }

  const files = fs.readdirSync(videoDir);
  const videoFiles = files
    .filter(f => videoExtensions.includes(path.extname(f).toLowerCase()))
    .map(f => ({
      name: f,
      path: `video/${f}`,
      type: `video/${f.split('.').pop().toLowerCase().replace('ogv', 'ogg')}`
    }));

  fs.writeFileSync(outputFile, JSON.stringify(videoFiles, null, 2));
  console.log(`✅ ${videoFiles.length} video tapıldı → video-list.json yaradıldı.`);
} catch (err) {
  console.error('❌ Xəta:', err);
  process.exit(1);
}
