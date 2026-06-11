const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const dir = path.join(root, 'src', 'content', 'projects');

const specificScores = {
  "interdigitated-devices.json": [0, 100, 80, 40, 0],
  "patent-exam.json": [60, 0, 20, 100, 40],
  "glucose-ultrasound.json": [80, 40, 100, 30, 10],
  "pedal-blackbox.json": [40, 80, 60, 90, 80],
  "nitroaromatic-explosives.json": [100, 40, 90, 30, 0],
  "ultrasonic-high-damping.json": [10, 80, 100, 20, 0],
  "perovskite-solar.json": [0, 100, 90, 20, 0],
  "agricultural-water.json": [100, 20, 80, 60, 40],
  "greenlight-noise.json": [60, 60, 30, 90, 100],
  "reborn-reusable.json": [0, 0, 30, 80, 100],
  "nearly-free-electron.json": [0, 50, 100, 10, 0],
  "park-2-gather.json": [50, 70, 40, 100, 90]
};

for (const [file, scores] of Object.entries(specificScores)) {
  const filepath = path.join(dir, file);
  if (fs.existsSync(filepath)) {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    data.pentaPoint = scores;
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file} with pentaPoint:`, scores);
  } else {
    console.warn(`File not found: ${file}`);
  }
}
