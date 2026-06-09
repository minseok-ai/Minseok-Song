const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/content/projects');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

function guessScores(tags, summary, title) {
  const text = (tags.join(' ') + ' ' + summary + ' ' + title).toLowerCase();
  
  let ai = 30;
  let semi = 30;
  let biz = 30;

  if (text.includes('ai') || text.includes('model') || text.includes('machine learning') || text.includes('automation') || text.includes('robot')) ai += 50;
  if (text.includes('semiconductor') || text.includes('device') || text.includes('nano') || text.includes('material') || text.includes('solar') || text.includes('electronic')) semi += 50;
  if (text.includes('strategy') || text.includes('business') || text.includes('firm') || text.includes('product') || text.includes('app') || text.includes('patent') || text.includes('platform')) biz += 50;
  
  // Add some randomness so they don't look identical
  ai += Math.floor(Math.random() * 20) - 10;
  semi += Math.floor(Math.random() * 20) - 10;
  biz += Math.floor(Math.random() * 20) - 10;

  return [Math.max(10, Math.min(100, ai)), Math.max(10, Math.min(100, semi)), Math.max(10, Math.min(100, biz))];
}

for (const file of files) {
  const filepath = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  
  if (!data.triplePoint) {
    data.triplePoint = guessScores(data.tags || [], data.summary || '', data.title || '');
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`Updated ${file} with triplePoint:`, data.triplePoint);
  }
}
