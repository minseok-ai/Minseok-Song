// A1ntuitize Global Affect State Bus
// Bridges 3D PAD Emotional Manifold Coordinates to A1-Chan PiP HUD & Conversational Prompt Engine

export interface AffectFaceState {
  eyeOpen: number;
  brow: number;
  smile: number;
  rgb: [number, number, number];
}

export interface AffectState {
  valence: number;     // X axis: -1 (Hostile/Negative) to +1 (Positive/Pleasure)
  arousal: number;     // Y axis: -1 (Static/Low Energy) to +1 (Dynamic/High Energy)
  dominance: number;   // Z axis: -1 (Helpless/Passive) to +1 (Mastery/Proactive)
  centroid: [number, number, number];
  octantId: number;    // 1 to 8
  octantCode: string;  // (+, +, +)
  name: string;        // Joy & Euphoria, etc.
  color: string;       // #ef4444
  rgb: [number, number, number];
  tone: string;        // Conversational style directive
  subEmotions: string; // Psychological spectrum breakdown
  face: AffectFaceState;
  timestamp: number;
}

export const OCTANT_AFFECT_DEFINITIONS: Record<number, {
  name: string;
  octantCode: string;
  padCoords: [number, number, number];
  color: string;
  rgb: [number, number, number];
  subEmotions: string;
  tone: string;
  face: AffectFaceState;
}> = {
  1: {
    name: "Joy & Euphoria",
    octantCode: "(+, +, +)",
    padCoords: [1, 1, 1],
    color: "#D4AF37",
    rgb: [212, 175, 55],
    subEmotions: "Euphoria · Joy · Excitement · Passion · Triumph",
    tone: "Enthusiastic, energetic, proactive, and passionately confident.",
    face: { eyeOpen: 0.9, brow: 0.4, smile: 0.85, rgb: [212, 175, 55] }
  },
  2: {
    name: "Admiration & Trust",
    octantCode: "(+, +, -)",
    padCoords: [1, 1, -1],
    color: "#E5C378",
    rgb: [229, 195, 120],
    subEmotions: "Wonder · Admiration · Surprise · Awe · Curiosity",
    tone: "Curious, inspiring, appreciative, and deeply engaged.",
    face: { eyeOpen: 0.85, brow: 0.15, smile: 0.65, rgb: [229, 195, 120] }
  },
  3: {
    name: "Serenity & Calm",
    octantCode: "(+, -, +)",
    padCoords: [1, -1, 1],
    color: "#C5A059",
    rgb: [197, 160, 89],
    subEmotions: "Serenity · Contentment · Calmness · Ease · Pride",
    tone: "Calm, poised, structured, tranquil, and reassuringly grounded.",
    face: { eyeOpen: 0.6, brow: 0.0, smile: 0.4, rgb: [197, 160, 89] }
  },
  4: {
    name: "Catharsis & Relief",
    octantCode: "(+, -, -)",
    padCoords: [1, -1, -1],
    color: "#B39868",
    rgb: [179, 152, 104],
    subEmotions: "Relief · Acceptance · Comfort · Catharsis · Trust",
    tone: "Empathetic, soothing, gentle, warm, and comfortable.",
    face: { eyeOpen: 0.65, brow: -0.1, smile: 0.5, rgb: [179, 152, 104] }
  },
  5: {
    name: "Anger & Shock",
    octantCode: "(-, +, +)",
    padCoords: [-1, 1, 1],
    color: "#CBD5E1",
    rgb: [203, 213, 225],
    subEmotions: "Anger · Hostility · Annoyance · Rage · Combativeness",
    tone: "Direct, decisive, assertive, bold, and punchy.",
    face: { eyeOpen: 0.8, brow: -0.85, smile: -0.5, rgb: [203, 213, 225] }
  },
  6: {
    name: "Fear & Tension",
    octantCode: "(-, +, -)",
    padCoords: [-1, 1, -1],
    color: "#94A3B8",
    rgb: [148, 163, 184],
    subEmotions: "Fear · Tension · Anxiety · Panic · Vigilance",
    tone: "Vigilant, crisp, cautious, precise, and security-minded.",
    face: { eyeOpen: 0.95, brow: 0.8, smile: -0.65, rgb: [148, 163, 184] }
  },
  7: {
    name: "Disgust & Contempt",
    octantCode: "(-, -, +)",
    padCoords: [-1, -1, 1],
    color: "#788292",
    rgb: [120, 130, 146],
    subEmotions: "Disgust · Contempt · Bitterness · Rejection · Disdain",
    tone: "Discerning, analytical, critical, and high-standard.",
    face: { eyeOpen: 0.45, brow: -0.5, smile: -0.4, rgb: [120, 130, 146] }
  },
  8: {
    name: "Sadness & Despair",
    octantCode: "(-, -, -)",
    padCoords: [-1, -1, -1],
    color: "#64748B",
    rgb: [100, 116, 139],
    subEmotions: "Sadness · Depression · Despair · Helplessness · Isolation",
    tone: "Reflective, subdued, minimalist, quiet, and introspective.",
    face: { eyeOpen: 0.35, brow: 0.5, smile: -0.75, rgb: [100, 116, 139] }
  }
};

let currentAffectState: AffectState = {
  valence: 0.58,
  arousal: 0.58,
  dominance: 0.58,
  centroid: [0.577, 0.577, 0.577],
  octantId: 1,
  octantCode: "(+, +, +)",
  name: "Joy & Euphoria",
  color: "#D4AF37",
  rgb: [212, 175, 55],
  tone: OCTANT_AFFECT_DEFINITIONS[1].tone,
  subEmotions: OCTANT_AFFECT_DEFINITIONS[1].subEmotions,
  face: { ...OCTANT_AFFECT_DEFINITIONS[1].face },
  timestamp: Date.now()
};

let isManifoldEngineActive = false;
let ambientDriftInterval: number | null = null;

export function setManifoldEngineActive(active: boolean) {
  isManifoldEngineActive = active;
  if (!active && !ambientDriftInterval && typeof window !== "undefined") {
    startAmbientAffectDrift();
  }
}

export function getGlobalAffectState(): AffectState {
  return currentAffectState;
}

export function updateGlobalAffectState(partial: Partial<AffectState>) {
  currentAffectState = {
    ...currentAffectState,
    ...partial,
    timestamp: Date.now()
  };

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("a1ntuitize:affect-update", {
      detail: currentAffectState
    }));
  }
}

export function subscribeToAffectState(callback: (state: AffectState) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (e: Event) => {
    const customEvt = e as CustomEvent<AffectState>;
    if (customEvt.detail) {
      callback(customEvt.detail);
    }
  };

  window.addEventListener("a1ntuitize:affect-update", handler);
  // Immediate initial callback
  callback(currentAffectState);

  return () => {
    window.removeEventListener("a1ntuitize:affect-update", handler);
  };
}

// Organic Ambient Drift for non-manifold pages (Continuous Smooth Gradient Drift)
function startAmbientAffectDrift() {
  if (typeof window === "undefined") return;

  let driftTime = 0;
  let currentOctId = 1;

  ambientDriftInterval = window.setInterval(() => {
    if (isManifoldEngineActive) return;

    // Slow, organic drift period (~3 minutes)
    driftTime += 0.015;
    const v = 0.58 + 0.28 * Math.sin(driftTime * 0.15);
    const a = 0.50 + 0.32 * Math.sin(driftTime * 0.12 + 0.8);
    const d = 0.52 + 0.26 * Math.cos(driftTime * 0.14);

    const mag = Math.hypot(v, a, d) || 1;
    const cx = v / mag;
    const cy = a / mag;
    const cz = d / mag;

    // Continuous softmax blend across octant definitions
    let totalW = 0;
    let bR = 0, bG = 0, bB = 0;
    let bSmile = 0, bBrow = 0, bEyeOpen = 0;
    let bestOctId = 1, bestW = -1;

    for (let id = 1; id <= 8; id++) {
      const def = OCTANT_AFFECT_DEFINITIONS[id];
      const dirLen = Math.hypot(...def.padCoords) || 1;
      const dot = cx * (def.padCoords[0] / dirLen) + cy * (def.padCoords[1] / dirLen) + cz * (def.padCoords[2] / dirLen);
      const w = Math.exp(3.0 * dot);
      totalW += w;
      bR += def.rgb[0] * w;
      bG += def.rgb[1] * w;
      bB += def.rgb[2] * w;
      bSmile += def.face.smile * w;
      bBrow += def.face.brow * w;
      bEyeOpen += def.face.eyeOpen * w;

      if (w > bestW) {
        bestW = w;
        bestOctId = id;
      }
    }

    const nw = totalW || 1;
    const blendedR = Math.round(bR / nw);
    const blendedG = Math.round(bG / nw);
    const blendedB = Math.round(bB / nw);
    const blendedColor = `rgb(${blendedR}, ${blendedG}, ${blendedB})`;

    if (bestOctId !== currentOctId) {
      currentOctId = bestOctId;
    }
    const def = OCTANT_AFFECT_DEFINITIONS[currentOctId] || OCTANT_AFFECT_DEFINITIONS[1];

    updateGlobalAffectState({
      valence: v,
      arousal: a,
      dominance: d,
      centroid: [cx, cy, cz],
      octantId: currentOctId,
      octantCode: def.octantCode,
      name: def.name,
      color: blendedColor,
      rgb: [blendedR, blendedG, blendedB],
      tone: def.tone,
      subEmotions: def.subEmotions,
      face: {
        eyeOpen: bEyeOpen / nw,
        brow: bBrow / nw,
        smile: bSmile / nw,
        rgb: [blendedR, blendedG, blendedB]
      }
    });
  }, 1200);
}

if (typeof window !== "undefined") {
  startAmbientAffectDrift();
}
