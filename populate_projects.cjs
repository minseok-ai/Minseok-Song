const fs = require('fs');
const path = require('path');

const projectsDir = path.join(__dirname, 'src', 'content', 'projects');

const newProjects = [
  {
    filename: 'interdigitated-devices.json',
    title: 'Planar Micro-Battery Architecture',
    summary: 'Developing next-generation micro-batteries via planar interdigitated cell architecture to mitigate electrolyte degradation.',
    order: 5,
    status: 'published',
    hidden: false,
    year: '2026',
    tags: ['Research', 'Semiconductor', 'KAIST NNFC'],
    links: [],
    visual: 'paper',
    pentaPoint: [0, 100, 80, 40, 0]
  },
  {
    filename: 'portfolio-site.json',
    title: 'Dual-Engine Strategy Portfolio & Curation Engine',
    summary: 'Designed and built this high-fidelity personal portfolio architecture using Astro, featuring dynamic dark/light mode synchronization, integrated data validation schemas, and an embedded signal curation pipeline.',
    order: 4,
    status: 'published',
    hidden: false,
    year: '2026',
    tags: ['Astro', 'Architecture', 'Tailored UX', 'Launched'],
    links: [],
    visual: 'console',
    pentaPoint: [90, 70, 60, 50, 80]
  },
  {
    filename: 'glucose-ultrasound.json',
    title: 'Ultrasonic Glucose Monitoring',
    summary: 'Led independent research on non-invasive glucose monitoring using ultrasonic velocity analysis. Presented as 1st Author at KSNT.',
    order: 6,
    status: 'published',
    hidden: false,
    year: '2024',
    tags: ['Research', 'Medical Tech', 'KRISS'],
    links: [],
    visual: 'graph',
    pentaPoint: [80, 40, 100, 30, 10]
  },
  {
    filename: 'pedal-blackbox.json',
    title: 'OBD-II Pedal Evidence Blackbox',
    summary: 'Designed a low-cost evidence system projecting OBD-II data onto a HUD to solve Sudden Unintended Acceleration disputes.',
    order: 7,
    status: 'published',
    hidden: false,
    year: '2024',
    tags: ['Hardware', 'Automotive', 'Legal Tech'],
    links: [],
    visual: 'console',
    pentaPoint: [40, 80, 60, 90, 80]
  },
  {
    filename: 'nitroaromatic-explosives.json',
    title: 'Fluorescence Explosives Detection AI',
    summary: 'Developed a 1D-CNN and LSTM hybrid model to process environmental and photoluminescence data, achieving 51.4% MSE reduction.',
    order: 8,
    status: 'published',
    hidden: false,
    year: '2024',
    tags: ['Machine Learning', 'Data Analysis', 'Deep Learning'],
    links: [],
    visual: 'graph',
    pentaPoint: [100, 40, 90, 30, 0]
  },
  {
    filename: 'ultrasonic-high-damping.json',
    title: 'Cross-Axis Ultrasonic Identification',
    summary: 'Overcame signal attenuation via Cross-Axis Measurement to precisely identify polymer materials in a blind test.',
    order: 9,
    status: 'published',
    hidden: false,
    year: '2024',
    tags: ['Research', 'Materials', 'KRISS'],
    links: [],
    visual: 'paper',
    pentaPoint: [10, 80, 100, 20, 0]
  },
  {
    filename: 'perovskite-solar.json',
    title: 'Nano-Scale Perovskite Fabrication',
    summary: 'Fabricated Perovskite Solar Cells and conducted root-cause failure analysis emphasizing precision in nano-scale semiconductor fabrication.',
    order: 10,
    status: 'published',
    hidden: false,
    year: '2024',
    tags: ['Semiconductor', 'Energy', 'Fabrication'],
    links: [],
    visual: 'blank',
    pentaPoint: [0, 100, 90, 20, 0]
  },
  {
    filename: 'agricultural-water.json',
    title: 'Predictive Reservoir Intelligence',
    summary: 'Constructed a robust data pipeline and evaluated ML models to forecast reservoir water levels. Won Best Paper Award at AAiCON 2024.',
    order: 11,
    status: 'published',
    hidden: false,
    year: '2024',
    tags: ['Big Data', 'Machine Learning', 'Agriculture'],
    links: [],
    visual: 'graph',
    pentaPoint: [100, 20, 80, 60, 40]
  },
  {
    filename: 'greenlight-noise.json',
    title: 'Deep-Learning Noise Enforcement',
    summary: 'Fused imaging sensors with deep learning sound localization to identify noise-violating vehicles. Won KOSAF Special Award.',
    order: 12,
    status: 'published',
    hidden: false,
    year: '2024',
    tags: ['Deep Learning', 'B2G', 'Open Innovation'],
    links: [],
    visual: 'deck',
    pentaPoint: [60, 60, 30, 90, 100]
  },
  {
    filename: 'reborn-reusable.json',
    title: 'Reusable Tableware MICE Platform',
    summary: 'Pivoted business model for a Mobile Reusable Tableware Service targeting the MICE industry. Secured ~4M KRW mock crowdfunding.',
    order: 13,
    status: 'published',
    hidden: false,
    year: '2024',
    tags: ['Business', 'Startup', 'B2B'],
    links: [],
    visual: 'deck',
    pentaPoint: [0, 0, 30, 80, 100]
  },
  {
    filename: 'nearly-free-electron.json',
    title: 'Graphene Dirac Cone Analysis',
    summary: 'Theoretical analysis of electron behavior in crystal lattices, deriving energy levels and investigating Graphene conductivity.',
    order: 14,
    status: 'published',
    hidden: false,
    year: '2023',
    tags: ['Physics', 'Quantum Mechanics', 'Research'],
    links: [],
    visual: 'paper',
    pentaPoint: [0, 50, 100, 10, 0]
  },
  {
    filename: 'park-2-gather.json',
    title: 'Predictive Parking Exit System',
    summary: 'Commercialized a dormant patent into a BLE Beacon-based architecture resolving double-parking conflicts. Won CNU Grand Prize.',
    order: 15,
    status: 'published',
    hidden: false,
    year: '2023',
    tags: ['IoT', 'Business Strategy', 'Patent Commercialization'],
    links: [],
    visual: 'console',
    pentaPoint: [50, 70, 40, 100, 90]
  },
  {
    filename: 'ra1.json',
    title: 'RA1 Edge Robotics Control System',
    summary: 'A next-generation autonomous edge AI robot control system that performs multi-layered physical verification through geometric 3D volume analysis and edge NPU power gating based on vector resonance.',
    order: 3,
    status: 'published',
    hidden: false,
    year: '2026',
    tags: ['A1 Firms', 'Robotics', 'Hardware AI', 'Pending'],
    links: [
      {
        label: 'Pending',
        href: '#'
      }
    ],
    visual: 'graph',
    pentaPoint: [85, 95, 80, 20, 40]
  }
];

newProjects.forEach(proj => {
  const { filename, ...data } = proj;
  const filePath = path.join(projectsDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
});

// Update a1trategize and a1-site-architecture
const a1trategizePath = path.join(projectsDir, 'a1trategize.json');
if (fs.existsSync(a1trategizePath)) {
  const data = JSON.parse(fs.readFileSync(a1trategizePath, 'utf8'));
  data.tags = ['A1 Firms', 'AI Strategy', 'Product', 'Launched'];
  fs.writeFileSync(a1trategizePath, JSON.stringify(data, null, 2), 'utf8');
}

const a1SitePath = path.join(projectsDir, 'a1-site-architecture.json');
if (fs.existsSync(a1SitePath)) {
  const data = JSON.parse(fs.readFileSync(a1SitePath, 'utf8'));
  data.tags = ['A1 Firms', 'Architecture', 'Pending'];
  data.summary = data.summary + ' Pending launch.';
  fs.writeFileSync(a1SitePath, JSON.stringify(data, null, 2), 'utf8');
}

console.log('Successfully populated projects.');
