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
    color: "#ef4444",
    rgb: [239, 68, 68],
    subEmotions: "Euphoria · Joy · Excitement · Passion · Triumph",
    tone: "Enthusiastic, energetic, proactive, and passionately confident.",
    face: { eyeOpen: 0.9, brow: 0.4, smile: 0.85, rgb: [239, 68, 68] }
  },
  2: {
    name: "Admiration & Trust",
    octantCode: "(+, +, -)",
    padCoords: [1, 1, -1],
    color: "#f97316",
    rgb: [249, 115, 22],
    subEmotions: "Wonder · Admiration · Surprise · Awe · Curiosity",
    tone: "Curious, inspiring, appreciative, and deeply engaged.",
    face: { eyeOpen: 0.85, brow: 0.15, smile: 0.65, rgb: [249, 115, 22] }
  },
  3: {
    name: "Serenity & Calm",
    octantCode: "(+, -, +)",
    padCoords: [1, -1, 1],
    color: "#eab308",
    rgb: [234, 179, 8],
    subEmotions: "Serenity · Contentment · Calmness · Ease · Pride",
    tone: "Calm, poised, structured, tranquil, and reassuringly grounded.",
    face: { eyeOpen: 0.6, brow: 0.0, smile: 0.4, rgb: [234, 179, 8] }
  },
  4: {
    name: "Catharsis & Relief",
    octantCode: "(+, -, -)",
    padCoords: [1, -1, -1],
    color: "#10b981",
    rgb: [16, 185, 129],
    subEmotions: "Relief · Acceptance · Comfort · Catharsis · Trust",
    tone: "Empathetic, soothing, gentle, warm, and comfortable.",
    face: { eyeOpen: 0.65, brow: -0.1, smile: 0.5, rgb: [16, 185, 129] }
  },
  5: {
    name: "Anger & Shock",
    octantCode: "(-, +, +)",
    padCoords: [-1, 1, 1],
    color: "#06b6d4",
    rgb: [6, 182, 212],
    subEmotions: "Anger · Hostility · Annoyance · Rage · Combativeness",
    tone: "Direct, decisive, assertive, bold, and punchy.",
    face: { eyeOpen: 0.8, brow: -0.85, smile: -0.5, rgb: [6, 182, 212] }
  },
  6: {
    name: "Fear & Tension",
    octantCode: "(-, +, -)",
    padCoords: [-1, 1, -1],
    color: "#3b82f6",
    rgb: [59, 130, 246],
    subEmotions: "Fear · Tension · Anxiety · Panic · Vigilance",
    tone: "Vigilant, crisp, cautious, precise, and security-minded.",
    face: { eyeOpen: 0.95, brow: 0.8, smile: -0.65, rgb: [59, 130, 246] }
  },
  7: {
    name: "Disgust & Contempt",
    octantCode: "(-, -, +)",
    padCoords: [-1, -1, 1],
    color: "#6366f1",
    rgb: [99, 102, 241],
    subEmotions: "Disgust · Contempt · Bitterness · Rejection · Disdain",
    tone: "Discerning, analytical, critical, and high-standard.",
    face: { eyeOpen: 0.45, brow: -0.5, smile: -0.4, rgb: [99, 102, 241] }
  },
  8: {
    name: "Sadness & Despair",
    octantCode: "(-, -, -)",
    padCoords: [-1, -1, -1],
    color: "#a855f7",
    rgb: [168, 85, 247],
    subEmotions: "Sadness · Depression · Despair · Helplessness · Isolation",
    tone: "Reflective, subdued, minimalist, quiet, and introspective.",
    face: { eyeOpen: 0.35, brow: 0.5, smile: -0.75, rgb: [168, 85, 247] }
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
  color: "#ef4444",
  rgb: [239, 68, 68],
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

// Organic Ambient Drift for non-manifold pages
function startAmbientAffectDrift() {
  if (typeof window === "undefined") return;

  let driftTime = 0;
  ambientDriftInterval = window.setInterval(() => {
    if (isManifoldEngineActive) return;

    driftTime += 0.05;
    // Ambient gentle oscillation in positive quadrant (Joy -> Serenity -> Admiration)
    const v = 0.55 + 0.35 * Math.sin(driftTime * 0.3);
    const a = 0.40 + 0.45 * Math.sin(driftTime * 0.25 + 0.8);
    const d = 0.50 + 0.38 * Math.cos(driftTime * 0.28);

    const mag = Math.hypot(v, a, d) || 1;
    const cx = v / mag;
    const cy = a / mag;
    const cz = d / mag;

    // Resolve closest octant
    const octId = (v >= 0 ? 1 : 5) + (a >= 0 ? 0 : 2) + (d >= 0 ? 0 : 1);
    const def = OCTANT_AFFECT_DEFINITIONS[octId] || OCTANT_AFFECT_DEFINITIONS[1];

    updateGlobalAffectState({
      valence: v,
      arousal: a,
      dominance: d,
      centroid: [cx, cy, cz],
      octantId: octId,
      octantCode: def.octantCode,
      name: def.name,
      color: def.color,
      rgb: def.rgb,
      tone: def.tone,
      subEmotions: def.subEmotions,
      face: {
        eyeOpen: def.face.eyeOpen,
        brow: def.face.brow,
        smile: def.face.smile,
        rgb: def.rgb
      }
    });
  }, 1000);
}

if (typeof window !== "undefined") {
  startAmbientAffectDrift();
}
