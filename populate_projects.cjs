const fs = require('fs');
const path = require('path');

const projectsDir = path.join(__dirname, 'src', 'content', 'projects');

const newProjects = [
  {
    filename: 'interdigitated-devices.json',
    title: 'Development of Durable Interdigitated Electrochemical Devices',
    summary: 'Developing next-generation micro-batteries via planar interdigitated cell architecture to mitigate electrolyte degradation.',
    order: 4,
    status: 'published',
    hidden: false,
    year: '2026',
    tags: ['Research', 'Semiconductor', 'KAIST NNFC'],
    links: [],
    visual: 'paper'
  },
  {
    filename: 'patent-exam.json',
    title: 'Patent Attorney Exam Prep & Patent Filings',
    summary: 'Self-filed two patents combining deep tech engineering with legal strategy based on Patent Law study.',
    order: 5,
    status: 'published',
    hidden: false,
    year: '2025',
    tags: ['Legal', 'Patent', 'IP'],
    links: [
      { label: 'View Patent 1', href: 'https://kipris.or.kr/' }
    ],
    visual: 'paper'
  },
  {
    filename: 'glucose-ultrasound.json',
    title: 'Non-invasive Evaluation of Glucose Concentration by Measuring Ultrasound Velocity',
    summary: 'Led independent research on non-invasive glucose monitoring using ultrasonic velocity analysis. Presented as 1st Author at KSNT.',
    order: 6,
    status: 'published',
    hidden: false,
    year: '2024',
    tags: ['Research', 'Medical Tech', 'KRISS'],
    links: [],
    visual: 'graph'
  },
  {
    filename: 'pedal-blackbox.json',
    title: 'RPM-based Pedal Blackbox',
    summary: 'Designed a low-cost evidence system projecting OBD-II data onto a HUD to solve Sudden Unintended Acceleration disputes.',
    order: 7,
    status: 'published',
    hidden: false,
    year: '2024',
    tags: ['Hardware', 'Automotive', 'Legal Tech'],
    links: [],
    visual: 'console'
  },
  {
    filename: 'nitroaromatic-explosives.json',
    title: 'Analysis and Training Evaluation of Nitroaromatic Explosives Detection Data',
    summary: 'Developed a 1D-CNN and LSTM hybrid model to process environmental and photoluminescence data, achieving 51.4% MSE reduction.',
    order: 8,
    status: 'published',
    hidden: false,
    year: '2024',
    tags: ['Machine Learning', 'Data Analysis', 'Deep Learning'],
    links: [],
    visual: 'graph'
  },
  {
    filename: 'ultrasonic-high-damping.json',
    title: 'Ultrasonic Velocity Measurement & Identification of High-Damping Specimen',
    summary: 'Overcame signal attenuation via Cross-Axis Measurement to precisely identify polymer materials in a blind test.',
    order: 9,
    status: 'published',
    hidden: false,
    year: '2024',
    tags: ['Research', 'Materials', 'KRISS'],
    links: [],
    visual: 'paper'
  },
  {
    filename: 'perovskite-solar.json',
    title: 'Fabrication and Efficiency Analysis of Perovskite Solar Cells',
    summary: 'Fabricated Perovskite Solar Cells and conducted root-cause failure analysis emphasizing precision in nano-scale semiconductor fabrication.',
    order: 10,
    status: 'published',
    hidden: false,
    year: '2024',
    tags: ['Semiconductor', 'Energy', 'Fabrication'],
    links: [],
    visual: 'blank'
  },
  {
    filename: 'agricultural-water.json',
    title: 'Integrated Agricultural Water Management System Using Big Data',
    summary: 'Constructed a robust data pipeline and evaluated ML models to forecast reservoir water levels. Won Best Paper Award at AAiCON 2024.',
    order: 11,
    status: 'published',
    hidden: false,
    year: '2024',
    tags: ['Big Data', 'Machine Learning', 'Agriculture'],
    links: [],
    visual: 'graph'
  },
  {
    filename: 'greenlight-noise.json',
    title: 'Smart Noise Enforcement Sign, "Grennlight"',
    summary: 'Fused imaging sensors with deep learning sound localization to identify noise-violating vehicles. Won KOSAF Special Award.',
    order: 12,
    status: 'published',
    hidden: false,
    year: '2024',
    tags: ['Deep Learning', 'B2G', 'Open Innovation'],
    links: [],
    visual: 'deck'
  },
  {
    filename: 'reborn-reusable.json',
    title: '"RE:BORN", Innovator of the Reusable Gorge',
    summary: 'Pivoted business model for a Mobile Reusable Tableware Service targeting the MICE industry. Secured ~4M KRW mock crowdfunding.',
    order: 13,
    status: 'published',
    hidden: false,
    year: '2024',
    tags: ['Business', 'Startup', 'B2B'],
    links: [],
    visual: 'deck'
  },
  {
    filename: 'nearly-free-electron.json',
    title: 'A Study on the Nearly-Free-Electron Model',
    summary: 'Theoretical analysis of electron behavior in crystal lattices, deriving energy levels and investigating Graphene conductivity.',
    order: 14,
    status: 'published',
    hidden: false,
    year: '2023',
    tags: ['Physics', 'Quantum Mechanics', 'Research'],
    links: [],
    visual: 'paper'
  },
  {
    filename: 'park-2-gather.json',
    title: '"PARK 2 GATHER", Parking Exit Time Notification Service',
    summary: 'Commercialized a dormant patent into a BLE Beacon-based architecture resolving double-parking conflicts. Won CNU Grand Prize.',
    order: 15,
    status: 'published',
    hidden: false,
    year: '2023',
    tags: ['IoT', 'Business Strategy', 'Patent Commercialization'],
    links: [],
    visual: 'console'
  },
  {
    filename: 'ra1-robot.json',
    title: 'RA1 Autonomous Robot Control System',
    summary: 'Engineered an edge AI architecture maximizing battery efficiency via vector resonance-based hardware power gating of NPU blocks. Pending launch.',
    order: 3,
    status: 'published',
    hidden: false,
    year: '2026',
    tags: ['A1 Firms', 'Robotics', 'Patent', 'Pending'],
    links: [],
    visual: 'console'
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
