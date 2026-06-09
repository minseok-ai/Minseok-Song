const fs = require('fs');
const path = require('path');

const projectsDir = path.join(__dirname, 'src', 'content', 'projects');

// Files to delete
const toDelete = [
  'newsletter-crawler-workbench.json',
  'contact-channel-graph.json',
  'a1-site-architecture.json',
  'ra1-robot.json' // will re-create as ra1.json
];

toDelete.forEach(file => {
  const p = path.join(projectsDir, file);
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

// Update titles of existing academic projects
const updates = {
  'interdigitated-devices.json': 'Next-Gen Planar Micro-Battery Architecture',
  'patent-exam.json': 'Strategic IP Filings & Patent Engineering',
  'glucose-ultrasound.json': 'Non-Invasive Ultrasonic Glucose Monitoring System',
  'pedal-blackbox.json': 'OBD-II Synchronized RPM Pedal Blackbox',
  'nitroaromatic-explosives.json': 'Deep Learning Framework for Fluorescence-Based Explosives Detection',
  'ultrasonic-high-damping.json': 'Cross-Axis Ultrasonic Material Identification',
  'perovskite-solar.json': 'Nano-Scale Perovskite Solar Cell Fabrication',
  'agricultural-water.json': 'Predictive AI Reservoir & Agricultural Water Management System',
  'greenlight-noise.json': 'Deep Learning Noise Enforcement & Sound Localization System',
  'reborn-reusable.json': 'B2B MICE Reusable Tableware Platform',
  'nearly-free-electron.json': 'Theoretical Analysis of Graphene Dirac Cones',
  'park-2-gather.json': 'BLE Beacon-Based Predictive Parking Exit System'
};

for (const [file, newTitle] of Object.entries(updates)) {
  const p = path.join(projectsDir, file);
  if (fs.existsSync(p)) {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    data.title = newTitle;
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
  }
}

// Create / Update A1 Firms projects
const a1trategize = path.join(projectsDir, 'a1trategize.json');
if (fs.existsSync(a1trategize)) {
  const data = JSON.parse(fs.readFileSync(a1trategize, 'utf8'));
  data.title = 'A1trategize';
  data.tags = ['A1 Firms', 'Product', 'Launched'];
  data.order = 1;
  fs.writeFileSync(a1trategize, JSON.stringify(data, null, 2));
}

const a1ntuitize = path.join(projectsDir, 'a1ntuitize.json');
fs.writeFileSync(a1ntuitize, JSON.stringify({
  title: 'A1ntuitize',
  summary: 'A1 Firms project currently in development. Pending launch.',
  order: 2,
  status: 'published',
  hidden: false,
  year: '2026',
  tags: ['A1 Firms', 'Pending'],
  links: [],
  visual: 'blank'
}, null, 2));

const ra1 = path.join(projectsDir, 'ra1.json');
fs.writeFileSync(ra1, JSON.stringify({
  title: 'RA1',
  summary: 'Autonomous Robot Control System maximizing battery efficiency via vector resonance-based hardware power gating. Pending launch.',
  order: 3,
  status: 'published',
  hidden: false,
  year: '2026',
  tags: ['A1 Firms', 'Pending'],
  links: [],
  visual: 'console'
}, null, 2));

console.log('Successfully updated projects.');
