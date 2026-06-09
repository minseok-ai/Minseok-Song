const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/content/projects');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const translations = {
  "a1trategize.json": "An enterprise B2B strategy system that automates the generation of logically flawless consulting reports through user intent-based dynamic prompt expansion and adaptive collaboration between heterogeneous Large Language Models (LLMs).",
  "a1ntuitize.json": "A hyper-realistic dual-engine AI system that processes visual inputs, extracts observation vectors, and maintains long-term entity memories to prevent physical and logical hallucination.",
  "ra1.json": "A next-generation autonomous edge AI robot control system that performs multi-layered physical verification through geometric 3D volume analysis and edge NPU power gating based on vector resonance."
};

function guessScores(tags, summary, title) {
  const text = (tags.join(' ') + ' ' + summary + ' ' + title).toLowerCase();
  
  let ai = 10;
  let semi = 10;
  let physics = 10;
  let biz = 10;
  let strategy = 10;

  if (text.includes('ai') || text.includes('model') || text.includes('machine learning') || text.includes('automation') || text.includes('robot')) ai += 70;
  if (text.includes('semiconductor') || text.includes('device') || text.includes('electronic') || text.includes('npu')) semi += 70;
  if (text.includes('resonance') || text.includes('solar') || text.includes('material') || text.includes('damping') || text.includes('electron') || text.includes('water')) physics += 70;
  if (text.includes('product') || text.includes('app') || text.includes('market') || text.includes('b2b') || text.includes('firm')) biz += 70;
  if (text.includes('strategy') || text.includes('consulting') || text.includes('patent') || text.includes('report') || text.includes('architect')) strategy += 70;
  
  // Specific overrides based on known files
  if (title === 'A1trategize') { ai = 75; semi = 10; physics = 10; biz = 85; strategy = 95; }
  if (title === 'A1ntuitize') { ai = 95; semi = 15; physics = 25; biz = 30; strategy = 60; }
  if (title === 'RA1') { ai = 85; semi = 95; physics = 80; biz = 20; strategy = 40; }
  
  // Add some randomness for the rest
  if (title !== 'A1trategize' && title !== 'A1ntuitize' && title !== 'RA1') {
    ai += Math.floor(Math.random() * 20);
    semi += Math.floor(Math.random() * 20);
    physics += Math.floor(Math.random() * 20);
    biz += Math.floor(Math.random() * 20);
    strategy += Math.floor(Math.random() * 20);
  }

  return [
    Math.max(5, Math.min(100, ai)), 
    Math.max(5, Math.min(100, semi)), 
    Math.max(5, Math.min(100, physics)), 
    Math.max(5, Math.min(100, biz)),
    Math.max(5, Math.min(100, strategy))
  ];
}

for (const file of files) {
  const filepath = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  
  if (translations[file]) {
    data.summary = translations[file];
  }
  
  if (data.triplePoint) {
    delete data.triplePoint;
  }
  
  data.pentaPoint = guessScores(data.tags || [], data.summary || '', data.title || '');
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`Updated ${file} with pentaPoint:`, data.pentaPoint);
}
