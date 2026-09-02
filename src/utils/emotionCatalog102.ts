// Complete 102-Emotion Equal-Area Spherical Placement Catalog (360° x 360° Domain)
// Generated from AXIS_EMOTIONS (47) + PH_ANCHORS unique sequence via Golden Angle spiral

export interface EmotionNode {
  index: number;
  name: string;
  category: string;
  rgb: [number, number, number];
  z: number;
  elevDeg: number;
  azDeg: number;
  dir: [number, number, number];
}

const baseEmotionsList: { name: string; cat: string; rgb: [number, number, number] }[] = [
  // Joy (10)
  { name: 'joy', cat: 'Joy', rgb: [245, 158, 11] },
  { name: 'pleasure', cat: 'Joy', rgb: [251, 191, 36] },
  { name: 'delight', cat: 'Joy', rgb: [252, 211, 77] },
  { name: 'cheerfulness', cat: 'Joy', rgb: [253, 230, 138] },
  { name: 'playfulness', cat: 'Joy', rgb: [254, 240, 138] },
  { name: 'contentment', cat: 'Joy', rgb: [234, 179, 8] },
  { name: 'relief', cat: 'Joy', rgb: [202, 138, 4] },
  { name: 'satisfaction', cat: 'Joy', rgb: [161, 98, 7] },
  { name: 'amusement', cat: 'Joy', rgb: [245, 158, 11] },
  { name: 'warmth', cat: 'Joy', rgb: [251, 146, 60] },

  // Anger (8)
  { name: 'anger', cat: 'Anger', rgb: [239, 68, 68] },
  { name: 'irritation', cat: 'Anger', rgb: [248, 113, 113] },
  { name: 'resentment', cat: 'Anger', rgb: [220, 38, 38] },
  { name: 'rage', cat: 'Anger', rgb: [185, 28, 28] },
  { name: 'hostility', cat: 'Anger', rgb: [153, 27, 27] },
  { name: 'frustration', cat: 'Anger', rgb: [244, 63, 94] },
  { name: 'bitterness', cat: 'Anger', rgb: [190, 18, 60] },
  { name: 'wrath', cat: 'Anger', rgb: [159, 18, 57] },

  // Sadness (9)
  { name: 'sadness', cat: 'Sadness', rgb: [59, 130, 246] },
  { name: 'grief', cat: 'Sadness', rgb: [37, 99, 235] },
  { name: 'melancholy', cat: 'Sadness', rgb: [29, 78, 216] },
  { name: 'loneliness', cat: 'Sadness', rgb: [30, 64, 175] },
  { name: 'heartbreak', cat: 'Sadness', rgb: [30, 58, 138] },
  { name: 'loss', cat: 'Sadness', rgb: [71, 85, 105] },
  { name: 'emptiness', cat: 'Sadness', rgb: [100, 116, 139] },
  { name: 'despair', cat: 'Sadness', rgb: [51, 65, 85] },
  { name: 'sorrow', cat: 'Sadness', rgb: [30, 41, 59] },

  // Fear (8)
  { name: 'fear', cat: 'Fear', rgb: [168, 85, 247] },
  { name: 'anxiety', cat: 'Fear', rgb: [192, 132, 252] },
  { name: 'terror', cat: 'Fear', rgb: [147, 51, 234] },
  { name: 'unease', cat: 'Fear', rgb: [126, 34, 206] },
  { name: 'nervousness', cat: 'Fear', rgb: [107, 33, 168] },
  { name: 'panic', cat: 'Fear', rgb: [88, 28, 135] },
  { name: 'dread', cat: 'Fear', rgb: [74, 4, 78] },
  { name: 'alarm', cat: 'Fear', rgb: [134, 25, 143] },

  // Surprise (6)
  { name: 'surprise', cat: 'Surprise', rgb: [6, 182, 212] },
  { name: 'shock', cat: 'Surprise', rgb: [34, 211, 238] },
  { name: 'astonishment', cat: 'Surprise', rgb: [103, 232, 249] },
  { name: 'startlement', cat: 'Surprise', rgb: [165, 243, 252] },
  { name: 'bewilderment', cat: 'Surprise', rgb: [14, 165, 233] },
  { name: 'wonder', cat: 'Surprise', rgb: [56, 189, 248] },

  // Disgust (6)
  { name: 'disgust', cat: 'Disgust', rgb: [132, 204, 22] },
  { name: 'revulsion', cat: 'Disgust', rgb: [101, 163, 13] },
  { name: 'aversion', cat: 'Disgust', rgb: [77, 124, 15] },
  { name: 'repulsion', cat: 'Disgust', rgb: [63, 98, 18] },
  { name: 'distaste', cat: 'Disgust', rgb: [163, 230, 53] },
  { name: 'discomfort', cat: 'Disgust', rgb: [190, 242, 100] }
];

const phAnchorsList: { name: string; cat: string; rgb: [number, number, number] }[] = [
  // pH 1~3
  { name: 'horror', cat: 'pH 1~3 (Aversion)', rgb: [153, 27, 27] },
  { name: 'annihilation', cat: 'pH 1~3 (Aversion)', rgb: [127, 29, 29] },
  { name: 'collapse', cat: 'pH 1~3 (Aversion)', rgb: [69, 10, 10] },
  { name: 'mourning', cat: 'pH 1~3 (Aversion)', rgb: [136, 19, 55] },
  { name: 'contamination', cat: 'pH 1~3 (Aversion)', rgb: [113, 63, 18] },
  { name: 'shame', cat: 'pH 1~3 (Aversion)', rgb: [159, 18, 57] },
  { name: 'nausea', cat: 'pH 1~3 (Aversion)', rgb: [88, 28, 135] },

  // pH 4~6
  { name: 'friction', cat: 'pH 4~6 (Tension)', rgb: [194, 65, 12] },
  { name: 'violence', cat: 'pH 4~6 (Tension)', rgb: [180, 83, 9] },
  { name: 'tension', cat: 'pH 4~6 (Tension)', rgb: [168, 85, 247] },
  { name: 'jealousy', cat: 'pH 4~6 (Tension)', rgb: [217, 70, 239] },
  { name: 'pressure', cat: 'pH 4~6 (Tension)', rgb: [192, 38, 211] },
  { name: 'instability', cat: 'pH 4~6 (Tension)', rgb: [147, 51, 234] },
  { name: 'fatigue', cat: 'pH 4~6 (Tension)', rgb: [100, 116, 139] },
  { name: 'distance', cat: 'pH 4~6 (Tension)', rgb: [71, 85, 105] },
  { name: 'regret', cat: 'pH 4~6 (Tension)', rgb: [51, 65, 85] },
  { name: 'drift', cat: 'pH 4~6 (Tension)', rgb: [99, 102, 241] },

  // pH 7
  { name: 'neutrality', cat: 'pH 7 (Neutral)', rgb: [148, 163, 184] },
  { name: 'stillness', cat: 'pH 7 (Neutral)', rgb: [203, 213, 225] },
  { name: 'boredom', cat: 'pH 7 (Neutral)', rgb: [100, 116, 139] },
  { name: 'passivity', cat: 'pH 7 (Neutral)', rgb: [148, 163, 184] },
  { name: 'flatness', cat: 'pH 7 (Neutral)', rgb: [71, 85, 105] },

  // pH 8~9
  { name: 'calm', cat: 'pH 8~9 (Calm/Focus)', rgb: [20, 184, 166] },
  { name: 'ease', cat: 'pH 8~9 (Calm/Focus)', rgb: [45, 212, 191] },
  { name: 'settling', cat: 'pH 8~9 (Calm/Focus)', rgb: [94, 234, 212] },
  { name: 'quiet safety', cat: 'pH 8~9 (Calm/Focus)', rgb: [13, 148, 136] },
  { name: 'curiosity', cat: 'pH 8~9 (Calm/Focus)', rgb: [14, 165, 233] },
  { name: 'interest', cat: 'pH 8~9 (Calm/Focus)', rgb: [56, 189, 248] },
  { name: 'attention', cat: 'pH 8~9 (Calm/Focus)', rgb: [6, 182, 212] },
  { name: 'engagement', cat: 'pH 8~9 (Calm/Focus)', rgb: [8, 145, 178] },
  { name: 'focus', cat: 'pH 8~9 (Calm/Focus)', rgb: [3, 105, 161] },

  // pH 10~11
  { name: 'admiration', cat: 'pH 10~11 (Admiration)', rgb: [244, 63, 94] },
  { name: 'respect', cat: 'pH 10~11 (Admiration)', rgb: [251, 113, 133] },
  { name: 'trust', cat: 'pH 10~11 (Admiration)', rgb: [253, 164, 175] },
  { name: 'attraction', cat: 'pH 10~11 (Admiration)', rgb: [244, 114, 182] },
  { name: 'regard', cat: 'pH 10~11 (Admiration)', rgb: [236, 72, 153] },
  { name: 'affection', cat: 'pH 10~11 (Admiration)', rgb: [219, 39, 119] },
  { name: 'fondness', cat: 'pH 10~11 (Admiration)', rgb: [190, 24, 93] },
  { name: 'intimacy', cat: 'pH 10~11 (Admiration)', rgb: [157, 23, 77] },
  { name: 'tenderness', cat: 'pH 10~11 (Admiration)', rgb: [251, 113, 133] },
  { name: 'warm attachment', cat: 'pH 10~11 (Admiration)', rgb: [244, 63, 94] },

  // pH 12~14
  { name: 'excitement', cat: 'pH 12~14 (Ecstatic)', rgb: [245, 158, 11] },
  { name: 'thrill', cat: 'pH 12~14 (Ecstatic)', rgb: [251, 146, 60] },
  { name: 'hope', cat: 'pH 12~14 (Ecstatic)', rgb: [52, 211, 153] },
  { name: 'brightness', cat: 'pH 12~14 (Ecstatic)', rgb: [110, 231, 183] },
  { name: 'catharsis', cat: 'pH 12~14 (Ecstatic)', rgb: [16, 185, 129] },
  { name: 'release', cat: 'pH 12~14 (Ecstatic)', rgb: [5, 150, 105] },
  { name: 'triumph', cat: 'pH 12~14 (Ecstatic)', rgb: [4, 120, 87] },
  { name: 'awakening', cat: 'pH 12~14 (Ecstatic)', rgb: [6, 182, 212] },
  { name: 'rush', cat: 'pH 12~14 (Ecstatic)', rgb: [14, 165, 233] },
  { name: 'ecstasy', cat: 'pH 12~14 (Ecstatic)', rgb: [217, 70, 239] },
  { name: 'awe', cat: 'pH 12~14 (Ecstatic)', rgb: [56, 189, 248] },
  { name: 'rapture', cat: 'pH 12~14 (Ecstatic)', rgb: [168, 85, 247] },
  { name: 'transcendence', cat: 'pH 12~14 (Ecstatic)', rgb: [139, 92, 246] },
  { name: 'overwhelming uplift', cat: 'pH 12~14 (Ecstatic)', rgb: [124, 58, 237] }
];

// Deduplicate preserving insertion order
const rawCatalog: { name: string; cat: string; rgb: [number, number, number] }[] = [];
const seen = new Set<string>();

for (const item of [...baseEmotionsList, ...phAnchorsList]) {
  if (!seen.has(item.name)) {
    seen.add(item.name);
    rawCatalog.push(item);
  }
}

const GOLDEN_ANGLE = 137.50776405;
const total = rawCatalog.length; // 102

export const all102Emotions: EmotionNode[] = rawCatalog.map((item, index) => {
  const z = 1.0 - (2.0 * (index + 0.5) / total);
  const elevRad = Math.acos(z);
  const elevDeg = (elevRad * 180 / Math.PI) * (359 / 180);
  const azDeg = (index * GOLDEN_ANGLE) % 360;

  const azRad = (azDeg * Math.PI) / 180;
  const sinElev = Math.sin(elevRad);
  const cosElev = z; // cos(acos(z)) = z

  // Standard 3D spherical direction where +Y is elevation pole, X & Z are equatorial plane
  const x = Math.sin(elevRad) * Math.cos(azRad);
  const y = cosElev;
  const dirZ = Math.sin(elevRad) * Math.sin(azRad);

  return {
    index,
    name: item.name,
    category: item.cat,
    rgb: item.rgb,
    z,
    elevDeg,
    azDeg,
    dir: [x, y, dirZ]
  };
});
