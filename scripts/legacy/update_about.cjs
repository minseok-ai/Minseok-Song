const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const aboutPath = path.join(root, 'src', 'content', 'pages', 'about.json');
const data = JSON.parse(fs.readFileSync(aboutPath, 'utf8'));

const newBlocks = [
  {
    "id": "volunteering-timeline",
    "type": "timeline",
    "title": "Volunteering & Military",
    "events": [
      {
        "date": "Nov 2024 (1 mo)",
        "title": "Competition GTM Mentor @ Chungnam National University",
        "body": "Mentored 15 teams (~100 participants) on Go-To-Market (GTM) strategies during a university-industry hackathon."
      },
      {
        "date": "May 2017 - Feb 2019",
        "title": "Administrative Specialist @ Republic of Korea Army",
        "body": "Managed DMIS database for ~2,000 reservists and processed official military correspondence."
      }
    ]
  },
  {
    "id": "publications-timeline",
    "type": "timeline",
    "title": "Publications",
    "events": [
      {
        "date": "Nov 1, 2024",
        "title": "Non-invasive Evaluation of Glucose Concentration by Measuring Ultrasound Velocity",
        "body": "1st Author. 2024 KSNT Annual Fall Conference. Explored the feasibility of non-invasive blood glucose monitoring using ultrasound velocity and robust regression analysis."
      },
      {
        "date": "Jun 27, 2024",
        "title": "Integrated Agricultural Water Management System Using Big Data",
        "body": "2nd Author. 2024 Applied Artificial Intelligence Conference (AAiCON2024). Developed predictive model for reservoir water levels."
      }
    ]
  },
  {
    "id": "patents-timeline",
    "type": "timeline",
    "title": "Patents",
    "events": [
      {
        "date": "Filed Jan 26, 2026",
        "title": "KR1020260015575: Autonomous Robot Control System and Method",
        "body": "Sole Inventor. Engineered an edge AI architecture for autonomous robots maximizing battery efficiency via vector resonance-based hardware power gating of NPU blocks."
      },
      {
        "date": "Filed Jan 18, 2026",
        "title": "KR1020260009508: Automated Consulting Report Generation System and Method",
        "body": "Sole Inventor. Developed a multi-agent automated reporting system utilizing cross-validation among heterogeneous LLMs."
      }
    ]
  },
  {
    "id": "honors-timeline",
    "type": "timeline",
    "title": "Honors & Awards",
    "events": [
      {
        "date": "Sep 2024",
        "title": "Special Award | Startup Korea Investment Week Mock IR",
        "body": "Issued by Innopolis Venture Association (IVA)"
      },
      {
        "date": "Jun 2024",
        "title": "Best Paper Award | Applied Artificial Intelligence Conference",
        "body": "Issued by Association of Artificial Intelligence Friends (AAIF)"
      },
      {
        "date": "Jun 2024",
        "title": "Special Award | Daejeon Public Technology Startup Idea Competition",
        "body": "Issued by Korea Student Aid Foundation (KOSAF)"
      },
      {
        "date": "Feb 2024",
        "title": "Excellence Award | Winter AI Competition",
        "body": "Issued by College of Engineering, Chungnam National University"
      },
      {
        "date": "Jan 2024",
        "title": "Excellence Award | ESG Startup Idea Funding School",
        "body": "Issued by Korea Industry Intelligentization Association (KOIIA)"
      },
      {
        "date": "Nov 2023",
        "title": "Grand Prize | Intellectual Property Startup Hackathon",
        "body": "Issued by President, Chungnam National University"
      }
    ]
  }
];

const statsIndex = data.blocks.findIndex(b => b.id === 'key-stats');
if (statsIndex !== -1) {
  data.blocks.splice(statsIndex, 0, ...newBlocks);
} else {
  data.blocks.push(...newBlocks);
}

fs.writeFileSync(aboutPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated about.json');
