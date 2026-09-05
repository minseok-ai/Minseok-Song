// A1ntuitize 8-Octant PAD Inelastic Accretion & Core Affect Centroid Engine
import {
  setManifoldEngineActive,
  updateGlobalAffectState,
  OCTANT_AFFECT_DEFINITIONS
} from './a1ntuitizeState';

export function initA1ntuitizeEngine() {
  const manifoldBox = document.getElementById('manifold-box');
  const canvas = document.getElementById('manifold-canvas') as HTMLCanvasElement | null;
  const calloutsContainer = document.getElementById('manifold-callouts');
  const hudActiveLobe = document.getElementById('hud-active-lobe');

  if (!manifoldBox || !canvas) return;

  setManifoldEngineActive(true);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 600;
  let height = 520;

  // Dynamic Proportional Scale Dimensions
  let curScaleRatio = 1.0;
  let universeR = 170;
  let baseScale = 46;
  let axisLen = 190;
  let focal = 520;

  const resizeCanvas = () => {
    const rect = manifoldBox.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(280, Math.floor(rect.width));
    height = Math.max(280, Math.floor(rect.height)) || (width < 600 ? 330 : 520);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Reset matrix to avoid compounding DPR scale transforms
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Fit cosmic celestial sphere within the canvas viewport with comfortable padding
    const minDim = Math.min(width, height);
    curScaleRatio = Math.min(1.0, Math.max(0.42, minDim / 540));
    universeR = 158 * curScaleRatio;
    baseScale = 46 * curScaleRatio;
    axisLen = universeR + 18 * curScaleRatio;
    focal = 520 * curScaleRatio;
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(resizeCanvas).observe(manifoldBox);
  }

  // 8-Octant 3D PAD (Pleasure, Arousal, Dominance) Memory Sector Poles
  interface OctantSector {
    octantId: number;
    octantCode: string; // "(+, +, +)"
    name: string;
    padCoords: [number, number, number]; // [P/X, A/Y, D/Z]
    rgb: [number, number, number];
    hex: string;
    mass: number; // Accumulated memory mass M_k
    targetMass: number;
    phase: number;
    eyeOpen: number;
    brow: number;
    smile: number;
    desc: string;
    subEmotions: string;
    dir: [number, number, number];
  }

  const octantSectors: OctantSector[] = [
    {
      octantId: 1,
      octantCode: "(+, +, +)",
      name: "Joy & Euphoria",
      padCoords: [1, 1, 1],
      rgb: [212, 175, 55],
      hex: "#D4AF37",
      mass: 1.0,
      targetMass: 1.0,
      phase: 0.0,
      eyeOpen: 0.95,
      brow: 0.65,
      smile: 0.95,
      desc: "Positive, high-energy & proactive situation mastery",
      subEmotions: "Euphoria · Joy · Excitement · Passion · Triumph",
      dir: [0, 0, 0]
    },
    {
      octantId: 2,
      octantCode: "(+, +, -)",
      name: "Admiration & Trust",
      padCoords: [1, 1, -1],
      rgb: [229, 195, 120],
      hex: "#E5C378",
      mass: 0.85,
      targetMass: 0.85,
      phase: 0.8,
      eyeOpen: 0.85,
      brow: 0.45,
      smile: 0.75,
      desc: "Positive & energized aesthetic reverence or awe",
      subEmotions: "Wonder · Admiration · Surprise · Awe · Curiosity",
      dir: [0, 0, 0]
    },
    {
      octantId: 3,
      octantCode: "(+, -, +)",
      name: "Serenity & Calm",
      padCoords: [1, -1, 1],
      rgb: [197, 160, 89],
      hex: "#C5A059",
      mass: 0.75,
      targetMass: 0.75,
      phase: 1.6,
      eyeOpen: 0.55,
      brow: 0.15,
      smile: 0.55,
      desc: "Positive, meditative tranquility & stable control",
      subEmotions: "Serenity · Contentment · Calmness · Ease · Pride",
      dir: [0, 0, 0]
    },
    {
      octantId: 4,
      octantCode: "(+, -, -)",
      name: "Catharsis & Relief",
      padCoords: [1, -1, -1],
      rgb: [179, 152, 104],
      hex: "#B39868",
      mass: 0.70,
      targetMass: 0.70,
      phase: 2.4,
      eyeOpen: 0.65,
      brow: 0.25,
      smile: 0.85,
      desc: "Positive, low-arousal tension release & acceptance",
      subEmotions: "Relief · Acceptance · Comfort · Catharsis · Trust",
      dir: [0, 0, 0]
    },
    {
      octantId: 5,
      octantCode: "(-, +, +)",
      name: "Anger & Shock",
      padCoords: [-1, 1, 1],
      rgb: [203, 213, 225],
      hex: "#CBD5E1",
      mass: 0.60,
      targetMass: 0.60,
      phase: 3.2,
      eyeOpen: 1.05,
      brow: -0.85,
      smile: -0.65,
      desc: "Negative, high arousal assertive aggression & surge",
      subEmotions: "Anger · Hostility · Annoyance · Rage · Combativeness",
      dir: [0, 0, 0]
    },
    {
      octantId: 6,
      octantCode: "(-, +, -)",
      name: "Fear & Tension",
      padCoords: [-1, 1, -1],
      rgb: [148, 163, 184],
      hex: "#94A3B8",
      mass: 0.55,
      targetMass: 0.55,
      phase: 4.0,
      eyeOpen: 1.15,
      brow: -0.65,
      smile: -0.35,
      desc: "Negative & energized vigilance with loss of control",
      subEmotions: "Fear · Tension · Anxiety · Panic · Vigilance",
      dir: [0, 0, 0]
    },
    {
      octantId: 7,
      octantCode: "(-, -, +)",
      name: "Disgust & Contempt",
      padCoords: [-1, -1, 1],
      rgb: [120, 130, 146],
      hex: "#788292",
      mass: 0.45,
      targetMass: 0.45,
      phase: 4.8,
      eyeOpen: 0.45,
      brow: -0.75,
      smile: -0.55,
      desc: "Negative, low energy active rejection & disdain",
      subEmotions: "Disgust · Contempt · Bitterness · Rejection · Disdain",
      dir: [0, 0, 0]
    },
    {
      octantId: 8,
      octantCode: "(-, -, -)",
      name: "Sadness & Despair",
      padCoords: [-1, -1, -1],
      rgb: [100, 116, 139],
      hex: "#64748B",
      mass: 0.40,
      targetMass: 0.40,
      phase: 5.6,
      eyeOpen: 0.35,
      brow: -0.45,
      smile: -0.85,
      desc: "Negative, depleted energy & complete helplessness",
      subEmotions: "Sadness · Depression · Despair · Helplessness · Isolation",
      dir: [0, 0, 0]
    }
  ];

  // Initialize normalized 3D unit vectors for each Octant
  octantSectors.forEach(p => {
    const len = Math.hypot(p.padCoords[0], p.padCoords[1], p.padCoords[2]) || 1;
    p.dir = [p.padCoords[0] / len, p.padCoords[1] / len, p.padCoords[2] / len];
  });

  // Spherical Color Field Evaluation
  function getSphericalColor(nx: number, ny: number, nz: number, alpha: number = 1.0): string {
    let rTotal = 0, gTotal = 0, bTotal = 0, weightSum = 0;
    for (let k = 0; k < octantSectors.length; k++) {
      const p = octantSectors[k];
      const dot = nx * p.dir[0] + ny * p.dir[1] + nz * p.dir[2];
      if (dot > 0.02) {
        const w = Math.pow(dot, 2.2) * p.mass;
        rTotal += p.rgb[0] * w;
        gTotal += p.rgb[1] * w;
        bTotal += p.rgb[2] * w;
        weightSum += w;
      }
    }

    if (weightSum > 0.001) {
      const r = Math.min(255, Math.floor(rTotal / weightSum));
      const g = Math.min(255, Math.floor(gTotal / weightSum));
      const b = Math.min(255, Math.floor(bTotal / weightSum));
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return `rgba(212, 175, 55, ${alpha})`;
  }

  // Inward Shooting Sensory Particles undergoing Inelastic Collisions
  interface InflowParticle {
    startX: number;
    startY: number;
    startZ: number;
    dir: [number, number, number];
    progress: number;
    speed: number;
    isBurst?: boolean;
    octantId: number;
  }

  const NUM_INFLOW = 24;
  const inflowParticles: InflowParticle[] = Array.from({ length: NUM_INFLOW }).map((_, i) => {
    const octant = octantSectors[i % octantSectors.length];
    const spread = 0.22;
    const nx = octant.dir[0] + (Math.random() - 0.5) * spread;
    const ny = octant.dir[1] + (Math.random() - 0.5) * spread;
    const nz = octant.dir[2] + (Math.random() - 0.5) * spread;
    const len = Math.hypot(nx, ny, nz) || 1;
    const unx = nx / len, uny = ny / len, unz = nz / len;
    return {
      startX: unx * universeR,
      startY: uny * universeR,
      startZ: unz * universeR,
      dir: [unx, uny, unz],
      progress: i / NUM_INFLOW,
      speed: 0.014 + Math.random() * 0.008,
      octantId: octant.octantId
    };
  });

  // Inelastic Collision Impact Flashes on the Manifold Surface
  interface ImpactFlash {
    x: number;
    y: number;
    z: number;
    radius: number;
    maxRadius: number;
    alpha: number;
    color: string;
    isInward?: boolean;
  }

  const impactFlashes: ImpactFlash[] = [];

  // Attached Crystalline Facet Grains (Tetris-like atomic accretion)
  const NUM_GRAINS = 72;
  const attachedGrains = Array.from({ length: NUM_GRAINS }).map((_, i) => {
    const octant = octantSectors[i % octantSectors.length];
    return {
      u: Math.random() * Math.PI * 2,
      v: (Math.random() - 0.5) * Math.PI,
      brightness: 0.6 + Math.random() * 0.4,
      size: 1.8 + Math.random() * 2.0,
      octantId: octant.octantId
    };
  });

  // 3D Perspective Orbit Transformation & Direct Canvas Sector Probing
  let rotX = -0.28, rotY = 0.65;
  let targetRotX = -0.28, targetRotY = 0.65;
  let isDragging = false;
  let isAutoOrbit = true;
  let lastX = 0, lastY = 0;
  let startPointerX = 0, startPointerY = 0;
  let activePointerId: number | null = null;

  manifoldBox.style.cursor = 'grab';

  const onDown = (e: PointerEvent) => {
    isDragging = true;
    activePointerId = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    startPointerX = e.clientX;
    startPointerY = e.clientY;
    manifoldBox.style.cursor = 'grabbing';
    manifoldBox.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };

  const onMove = (e: PointerEvent) => {
    if (!isDragging) return;
    if (activePointerId !== null && e.pointerId !== activePointerId) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    targetRotY += dx * 0.005;
    targetRotX += dy * 0.005;
    targetRotX = Math.max(-1.4, Math.min(1.4, targetRotX));
    lastX = e.clientX;
    lastY = e.clientY;
    e.preventDefault();
  };

  const onUp = (e: PointerEvent) => {
    if (activePointerId !== null && e.pointerId !== activePointerId) return;
    const moved = Math.hypot(e.clientX - startPointerX, e.clientY - startPointerY);
    isDragging = false;
    activePointerId = null;
    manifoldBox.style.cursor = 'grab';
    manifoldBox.releasePointerCapture?.(e.pointerId);

    // If clean tap/click on canvas (moved < 7px), project and steer to nearest octant sector
    if (moved < 7) {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cx = width / 2, cy = height / 2;

      let closestOctId = 1;
      let minDist = 9999;
      octantSectors.forEach(p => {
        const pr = project(p.dir[0] * universeR, p.dir[1] * universeR, p.dir[2] * universeR, cosX, sinX, cosY, sinY, cx, cy);
        const d = Math.hypot(clickX - pr.x, clickY - pr.y);
        if (d < minDist) {
          minDist = d;
          closestOctId = p.octantId;
        }
      });
      if (minDist < 120) {
        steerPersonalityToSector(closestOctId);
      }
    }
  };

  manifoldBox.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);

  // Camera Presets Toolbar Handler
  const camButtons = document.querySelectorAll('.cam-btn[data-view]');
  camButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      camButtons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const view = btn.getAttribute('data-view');
      if (view === 'orbit') {
        isAutoOrbit = true;
        targetRotX = -0.28;
      } else if (view === 'top') {
        isAutoOrbit = false;
        targetRotX = Math.PI / 2 - 0.06;
        targetRotY = 0;
      } else if (view === 'front') {
        isAutoOrbit = false;
        targetRotX = 0;
        targetRotY = 0;
      } else if (view === 'side') {
        isAutoOrbit = false;
        targetRotX = 0;
        targetRotY = Math.PI / 2;
      }
    });
  });

  // Dynamic Inelastic Accretion Steering & Gradient Emotion Morphing Engine
  let userOverrideTime = 0;
  let activeSelectedOctantId = 1;

  function steerPersonalityToSector(octantId: number) {
    activeSelectedOctantId = octantId;
    userOverrideTime = performance.now();
    const targetSector = octantSectors.find(p => p.octantId === octantId) || octantSectors[0];

    // Accretion Mass Target Reallocation:
    // Boost targetMass of selected octant, smoothly decay other sectors toward resting baseline
    octantSectors.forEach(s => {
      if (s.octantId === octantId) {
        s.targetMass = 2.5; // High memory accretion target
      } else {
        // Ebbinghaus entropy half-life decay toward resting baseline
        s.targetMass = Math.max(0.30, s.targetMass * 0.68);
      }
    });

    // Inflow Particle Accretion Stream: launch inward sensory particles along selected sector trajectory
    for (let i = 0; i < 10; i++) {
      const spread = 0.16;
      const nx = targetSector.dir[0] + (Math.random() - 0.5) * spread;
      const ny = targetSector.dir[1] + (Math.random() - 0.5) * spread;
      const nz = targetSector.dir[2] + (Math.random() - 0.5) * spread;
      const len = Math.hypot(nx, ny, nz) || 1;
      inflowParticles.push({
        startX: (nx / len) * universeR,
        startY: (ny / len) * universeR,
        startZ: (nz / len) * universeR,
        dir: [nx / len, ny / len, nz / len],
        progress: -i * 0.045,
        speed: 0.026 + Math.random() * 0.012,
        isBurst: true,
        octantId: targetSector.octantId
      });
    }

    // Inelastic contact impact flash on manifold facet
    impactFlashes.push({
      x: targetSector.dir[0] * 38 * curScaleRatio,
      y: targetSector.dir[1] * 38 * curScaleRatio,
      z: targetSector.dir[2] * 38 * curScaleRatio,
      radius: 5 * curScaleRatio,
      maxRadius: 34 * curScaleRatio,
      alpha: 1.0,
      color: `rgb(${targetSector.rgb.join(',')})`
    });

    updateActiveOctantUI(octantId);
  }

  // Sensory Salvo Inelastic Pulse Burst Engine (Backward-compatible alias)
  function fireSensorySalvo(octantId: number | null = null) {
    if (typeof octantId === 'number') {
      steerPersonalityToSector(octantId);
    } else {
      const randomOct = octantSectors[Math.floor(Math.random() * octantSectors.length)];
      steerPersonalityToSector(randomOct.octantId);
    }
  }

  // Autonomous Sensory Assimilation Bridge (stimulates inelastic collision from real conversational/vision input)
  function stimulateTopologicalAccretion(v: number, a: number, d: number) {
    let closestSector = octantSectors[0];
    let maxSimilarity = -999;
    octantSectors.forEach(s => {
      const dot = v * s.dir[0] + a * s.dir[1] + d * s.dir[2];
      if (dot > maxSimilarity) {
        maxSimilarity = dot;
        closestSector = s;
      }
    });

    steerPersonalityToSector(closestSector.octantId);
  }

  // UI Active Octant State Updater
  const cmAngleBadge = document.getElementById('cm-angle-badge');
  const cmActiveName = document.getElementById('cm-active-name');
  const cmSubEmotions = document.getElementById('cm-sub-emotions');
  const cmCoords = document.getElementById('cm-coords');
  const padValenceGauge = document.getElementById('pad-val-gauge');
  const padArousalGauge = document.getElementById('pad-aro-gauge');
  const padDominanceGauge = document.getElementById('pad-dom-gauge');
  const padValenceText = document.getElementById('pad-val-text');
  const padArousalText = document.getElementById('pad-aro-text');
  const padDominanceText = document.getElementById('pad-dom-text');

  function updateActiveOctantUI(octantId: number) {
    activeSelectedOctantId = octantId;
    const targetSector = octantSectors.find(p => p.octantId === octantId) || octantSectors[0];

    // Highlight sector buttons
    document.querySelectorAll('.oct-seg-btn').forEach(btn => {
      const bId = parseInt(btn.getAttribute('data-octant') || '0', 10);
      if (bId === octantId) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });

    // Update Banner Readouts
    if (cmAngleBadge) cmAngleBadge.textContent = `OCTANT ${targetSector.octantId} · ${targetSector.octantCode}`;
    if (cmActiveName) cmActiveName.textContent = targetSector.name;
    if (cmSubEmotions) cmSubEmotions.textContent = targetSector.subEmotions;
    if (cmCoords) {
      cmCoords.textContent = `[P:${targetSector.padCoords[0] > 0 ? '+' : ''}${targetSector.padCoords[0]} A:${targetSector.padCoords[1] > 0 ? '+' : ''}${targetSector.padCoords[1]} D:${targetSector.padCoords[2] > 0 ? '+' : ''}${targetSector.padCoords[2]}]`;
    }

    const cmResonanceVal = document.getElementById('cm-resonance-val');
    if (cmResonanceVal) {
      const pct = Math.min(100, Math.max(10, Math.round((targetSector.mass / 2.8) * 100)));
      cmResonanceVal.textContent = `ACCRETION: ${pct}% · ACTIVE`;
    }
  }

  // 8 Interactive Segmented Sector Telemetry Probes - Direct Interactive Steering
  document.querySelectorAll('.oct-seg-btn[data-octant]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const octantId = parseInt(btn.getAttribute('data-octant') || '1', 10);
      steerPersonalityToSector(octantId);
    });
  });

  // LaTeX Clipboard Copy Handlers (Topological Personality Field Mathematics)
  const latexMap: Record<string, string> = {
    "1": String.raw`\begin{gathered} \vec{v}_{\text{step}} = \operatorname{Norm}\left( w_{\text{in}} \cdot (-\vec{n}_0) + w_{\text{bias}} \cdot \vec{B}_{\text{spike}}(\mathbf{S}) \right) \\[6pt] \vec{B}_{\text{spike}}(\mathbf{S}) = \frac{\sum_{j=1}^4 (h_j + s_j) \cdot \hat{p}_j}{\sum_{j=1}^4 (h_j + s_j)} - \vec{d}_0 \end{gathered}`,
    "2": String.raw`\begin{gathered} (b_x, b_y, b_z) = \left\lfloor \frac{\vec{p}}{\Delta g} \right\rceil \implies \begin{cases} \Delta h_k = I_{\text{score}} \cdot \left(0.55 + \left(1 - \frac{r_k}{R_{\text{field}}}\right)\right) \\[4pt] \Delta s_k = \gamma_{\text{gain}} \cdot \max\left(0.2, \ \frac{r_k}{R_{\text{field}}}\right) \\[4pt] \Delta M_k = I_{\text{score}} \end{cases} \end{gathered}`,
    "3": String.raw`\begin{gathered} \vec{C}_{\text{mass}} = \frac{\sum_k M_k \cdot \vec{p}_k}{\sum_k M_k}, \quad \vec{D}_{\text{drift}}(t) = \vec{C}_{\text{mass}}(t) - \vec{C}_{\text{mass}}(t-1) \\[6pt] \mathcal{S}_{\text{stability}} = \frac{h_{\text{dominant}}}{\sum_{j=1}^6 h_j + \epsilon} \in [0, 1] \end{gathered}`,
    "4": String.raw`\begin{gathered} s_k(t+1) = s_k(t) \cdot (1 - \delta_{\text{base}}) \\[4pt] h_k(t+1) = h_k(t) \cdot (1 - \delta_{\text{spike}}) \cdot \begin{cases} 0.92 & \text{if } s_k < s_{\text{floor}} \\ 1.0 & \text{otherwise} \end{cases} \end{gathered}`
  };

  document.querySelectorAll('.copy-latex-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const eqId = btn.getAttribute('data-eq');
      const latex = (eqId && latexMap[eqId]) || btn.getAttribute('data-latex');
      if (!latex) return;
      try {
        await navigator.clipboard.writeText(latex);
        const original = btn.innerHTML;
        btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span style="color:#10b981">Copied!</span>`;
        btn.classList.add('is-copied');
        setTimeout(() => {
          btn.innerHTML = original;
          btn.classList.remove('is-copied');
        }, 2000);
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    });
  });

  // 3D Perspective Projection Function
  function project(x: number, y: number, z: number, cosX: number, sinX: number, cosY: number, sinY: number, cx: number, cy: number) {
    const x1 = x * cosY - z * sinY;
    const z1 = z * cosY + x * sinY;
    const y2 = (-y) * cosX - z1 * sinX;
    const z2 = z1 * cosX + (-y) * sinX;

    const scale = focal / (focal + z2 + 250 * curScaleRatio);
    return {
      x: x1 * scale + cx,
      y: y2 * scale + cy,
      z: z2,
      scale: scale
    };
  }

  // Real-Time Smooth Interpolated Hologram AI Face Engine
  const faceCanvas = document.getElementById('ai-face-canvas') as HTMLCanvasElement | null;
  const fctx = faceCanvas ? faceCanvas.getContext('2d') : null;
  const faceCanvasMobile = document.getElementById('ai-face-canvas-mobile') as HTMLCanvasElement | null;
  const fctxMobile = faceCanvasMobile ? faceCanvasMobile.getContext('2d') : null;

  const faceState: {
    eyeOpen: number;
    brow: number;
    smile: number;
    rgb: [number, number, number];
    targetEyeOpen: number;
    targetBrow: number;
    targetSmile: number;
    targetRgb: [number, number, number];
  } = {
    eyeOpen: 0.8,
    brow: 0.3,
    smile: 0.6,
    rgb: [212, 175, 55],
    targetEyeOpen: 0.8,
    targetBrow: 0.3,
    targetSmile: 0.6,
    targetRgb: [212, 175, 55]
  };

  function updateAndDrawAIFace(time: number) {
    if (!fctx || !faceCanvas) return;

    faceState.eyeOpen += (faceState.targetEyeOpen - faceState.eyeOpen) * 0.08;
    faceState.brow += (faceState.targetBrow - faceState.brow) * 0.08;
    faceState.smile += (faceState.targetSmile - faceState.smile) * 0.08;
    faceState.rgb[0] += (faceState.targetRgb[0] - faceState.rgb[0]) * 0.08;
    faceState.rgb[1] += (faceState.targetRgb[1] - faceState.rgb[1]) * 0.08;
    faceState.rgb[2] += (faceState.targetRgb[2] - faceState.rgb[2]) * 0.08;

    const r = Math.round(faceState.rgb[0]);
    const g = Math.round(faceState.rgb[1]);
    const b = Math.round(faceState.rgb[2]);
    const colStr = `rgb(${r}, ${g}, ${b})`;

    fctx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

    const blink = Math.sin(time * 1.6);
    const blinkFactor = blink > 0.96 ? Math.max(0.08, (1 - blink) * 25) : 1.0;
    const eyeH = Math.max(1.4, 9 * faceState.eyeOpen * blinkFactor);

    fctx.lineWidth = 2.2;
    fctx.strokeStyle = colStr;
    fctx.shadowColor = colStr;
    fctx.shadowBlur = 6;
    fctx.lineCap = 'round';

    // Left Brow
    fctx.beginPath();
    const leftBrowY1 = 19 - faceState.brow * 4.5;
    const leftBrowY2 = 20 + faceState.brow * 2.5;
    fctx.moveTo(18, leftBrowY1);
    fctx.quadraticCurveTo(30, 14 - faceState.brow * 3.5, 42, leftBrowY2);
    fctx.stroke();

    // Right Brow
    fctx.beginPath();
    const rightBrowY1 = 20 + faceState.brow * 2.5;
    const rightBrowY2 = 19 - faceState.brow * 4.5;
    fctx.moveTo(62, rightBrowY1);
    fctx.quadraticCurveTo(74, 14 - faceState.brow * 3.5, 86, rightBrowY2);
    fctx.stroke();

    // Cybernetic Hologram Eyes
    fctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.22)`;
    fctx.beginPath();
    fctx.ellipse(30, 34, 8.5, eyeH, 0, 0, Math.PI * 2);
    fctx.fill();
    fctx.stroke();

    const isLightFace = document.documentElement.getAttribute('data-theme') === 'light';
    fctx.fillStyle = isLightFace ? '#2A2722' : '#ffffff';
    fctx.beginPath();
    fctx.arc(30, 34, Math.min(3.2, eyeH * 0.55), 0, Math.PI * 2);
    fctx.fill();

    fctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.22)`;
    fctx.beginPath();
    fctx.ellipse(74, 34, 8.5, eyeH, 0, 0, Math.PI * 2);
    fctx.fill();
    fctx.stroke();

    fctx.fillStyle = isLightFace ? '#2A2722' : '#ffffff';
    fctx.beginPath();
    fctx.arc(74, 34, Math.min(3.2, eyeH * 0.55), 0, Math.PI * 2);
    fctx.fill();

    // Expressive Mouth
    fctx.beginPath();
    const mouthY = 57;
    const mouthCurve = faceState.smile * 7;
    fctx.moveTo(37, mouthY);
    fctx.quadraticCurveTo(52, mouthY + mouthCurve, 67, mouthY);
    fctx.stroke();
    fctx.shadowBlur = 0;
  }

  // Inelastic Polyhedral Accretion Core:
  // An 8-octant faceted crystalline polyhedron where each sector's radial accretion
  // grows outward proportionally to accumulated mass M_k via inelastic collision.
  function evalSolidManifold(u: number, v: number, t: number): [number, number, number] {
    const cosU = Math.cos(u), sinU = Math.sin(u);
    const cosV = Math.cos(v), sinV = Math.sin(v);

    // Direction vector on unit sphere S²
    const nx = cosU * cosV;
    const ny = sinV;
    const nz = sinU * cosV;

    // Discrete crystalline polyhedral facet base profile (geodesic crystal core)
    const ax = Math.abs(nx);
    const ay = Math.abs(ny);
    const az = Math.abs(nz);
    // Smooth polyhedral facet metric: transitions between octahedral and cubic facet boundaries
    const facetMetric = Math.pow(Math.pow(ax, 3.2) + Math.pow(ay, 3.2) + Math.pow(az, 3.2), 1.0 / 3.2);
    const baseCoreR = 1.0 / (facetMetric || 1);
    const polyR = 0.72 + 0.28 * baseCoreR;

    // Physical Inelastic Collision Accretion along 8 Octant Poles:
    // When sensory particles impact sector k, mass M_k accumulates,
    // causing an anisotropic crystalline facet accretion protrusion.
    let accretionGrowth = 0;
    for (let k = 0; k < octantSectors.length; k++) {
      const p = octantSectors[k];
      const dot = nx * p.dir[0] + ny * p.dir[1] + nz * p.dir[2];
      if (dot > 0.0) {
        // High-order directional lobe concentrating on the octant pole
        const lobe = Math.pow(dot, 3.8);
        accretionGrowth += p.mass * lobe * 0.95;
      }
    }

    const totalR = polyR * (0.82 + accretionGrowth);

    // Strict boundary confinement inside celestial sphere
    const maxAllowedR = (universeR * 0.90) / (baseScale || 1);
    const clampedR = Math.min(maxAllowedR, totalR);

    return [
      nx * clampedR * baseScale,
      ny * clampedR * baseScale,
      nz * clampedR * baseScale
    ];
  }

  const NU = 32;
  const NV = 20;
  const GLOBE_NU = 26;
  const GLOBE_NV = 14;

  // Active Centroid Coordinates & Dominant Octant State
  let sphericalCentroid = { x: 0.58, y: 0.58, z: 0.58 };
  let currentPeakLobe = octantSectors[0];

  let time = 0;
  let lastAffectBroadcastTime = 0;
  function render() {
    time += 0.004;

    if (!isDragging && isAutoOrbit) {
      targetRotY += 0.001;
    }

    rotX += (targetRotX - rotX) * 0.06;
    rotY += (targetRotY - rotY) * 0.06;

    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

    const cx = width / 2;
    const cy = height / 2;

    ctx!.clearRect(0, 0, width, height);

    // Autonomous Organic Cognitive Drift (when user has not clicked recently, >14s)
    const nowMs = performance.now();
    const isUserOverriding = (nowMs - userOverrideTime) < 14000;

    if (!isUserOverriding) {
      // Very smooth, graceful harmonic drift across adjacent affective regions
      // (Period ~ 42 seconds)
      const driftCycle = time * 0.032;
      const waveX = Math.cos(driftCycle) * 0.72 + 0.28 * Math.cos(driftCycle * 0.5);
      const waveY = Math.sin(driftCycle * 0.85) * 0.68;
      const waveZ = Math.cos(driftCycle * 0.65 + 1.2) * 0.65;

      octantSectors.forEach(s => {
        const dot = waveX * s.dir[0] + waveY * s.dir[1] + waveZ * s.dir[2];
        const target = Math.max(0.28, 0.40 + 1.5 * Math.max(0, dot));
        s.targetMass += (target - s.targetMass) * 0.015;
      });
    }

    // Continuous Inelastic Mass Integration:
    // dM_k/dt = lambda * (targetMass - M_k)
    let sumVx = 0, sumVy = 0, sumVz = 0;
    octantSectors.forEach((p, idx) => {
      // Gentle cognitive pulse
      const cognitivePulse = 0.03 * Math.sin(time * 0.05 + p.phase);
      p.mass += (p.targetMass + cognitivePulse - p.mass) * 0.024;

      sumVx += p.mass * p.dir[0];
      sumVy += p.mass * p.dir[1];
      sumVz += p.mass * p.dir[2];

      // Update live mass gauge bars and numeric labels in UI
      const massBar = document.getElementById(`mass-bar-${p.octantId}`);
      const massVal = document.getElementById(`mass-val-${p.octantId}`);
      if (massBar) {
        const pct = Math.min(100, Math.max(10, Math.round((p.mass / 2.8) * 100)));
        massBar.style.width = `${pct}%`;
        if (massVal) massVal.textContent = `${pct}%`;
      }
    });

    const centroidMag = Math.hypot(sumVx, sumVy, sumVz);
    if (centroidMag > 0.001) {
      const targetCx = sumVx / centroidMag;
      const targetCy = sumVy / centroidMag;
      const targetCz = sumVz / centroidMag;

      // Heavy physical inertia for smooth continuous gradient glide (tau ~ 1.8s)
      sphericalCentroid.x += (targetCx - sphericalCentroid.x) * 0.022;
      sphericalCentroid.y += (targetCy - sphericalCentroid.y) * 0.022;
      sphericalCentroid.z += (targetCz - sphericalCentroid.z) * 0.022;

      const normC = Math.hypot(sphericalCentroid.x, sphericalCentroid.y, sphericalCentroid.z) || 1;
      sphericalCentroid.x /= normC;
      sphericalCentroid.y /= normC;
      sphericalCentroid.z /= normC;
    }

    // Continuous 8-Octant Softmax Weight Distribution (Gradient Blending)
    let totalWeight = 0;
    const weights: number[] = [];
    octantSectors.forEach(p => {
      const dot = sphericalCentroid.x * p.dir[0] + sphericalCentroid.y * p.dir[1] + sphericalCentroid.z * p.dir[2];
      const w = Math.exp(3.2 * dot) * p.mass;
      weights.push(w);
      totalWeight += w;
    });

    let blendedR = 0, blendedG = 0, blendedB = 0;
    let blendedSmile = 0, blendedBrow = 0, blendedEyeOpen = 0;
    let maxWeightIdx = 0, maxW = -1;

    for (let k = 0; k < octantSectors.length; k++) {
      const nw = weights[k] / (totalWeight || 1);
      const p = octantSectors[k];
      blendedR += p.rgb[0] * nw;
      blendedG += p.rgb[1] * nw;
      blendedB += p.rgb[2] * nw;
      blendedSmile += p.smile * nw;
      blendedBrow += p.brow * nw;
      blendedEyeOpen += p.eyeOpen * nw;

      if (weights[k] > maxW) {
        maxW = weights[k];
        maxWeightIdx = k;
      }
    }

    // Hysteresis on discrete Peak Lobe identification
    const currentIdx = octantSectors.indexOf(currentPeakLobe);
    const currentWeight = currentIdx >= 0 ? weights[currentIdx] : 0;
    if (octantSectors[maxWeightIdx] !== currentPeakLobe) {
      if (maxW > currentWeight * 1.15) {
        currentPeakLobe = octantSectors[maxWeightIdx];
        if (!isUserOverriding) {
          updateActiveOctantUI(currentPeakLobe.octantId);
        }
      }
    }

    // Update 3-Axis Live Telemetry Faders
    if (padValenceGauge && padValenceText) {
      const vPct = Math.round(((sphericalCentroid.x + 1) / 2) * 100);
      padValenceGauge.style.width = `${vPct}%`;
      padValenceText.textContent = `${sphericalCentroid.x >= 0 ? '+' : ''}${sphericalCentroid.x.toFixed(2)}`;
    }
    if (padArousalGauge && padArousalText) {
      const aPct = Math.round(((sphericalCentroid.y + 1) / 2) * 100);
      padArousalGauge.style.width = `${aPct}%`;
      padArousalText.textContent = `${sphericalCentroid.y >= 0 ? '+' : ''}${sphericalCentroid.y.toFixed(2)}`;
    }
    if (padDominanceGauge && padDominanceText) {
      const dPct = Math.round(((sphericalCentroid.z + 1) / 2) * 100);
      padDominanceGauge.style.width = `${dPct}%`;
      padDominanceText.textContent = `${sphericalCentroid.z >= 0 ? '+' : ''}${sphericalCentroid.z.toFixed(2)}`;
    }

    // Continuous gradient morphing on AI Cybernetic Face Avatar
    faceState.targetEyeOpen = blendedEyeOpen;
    faceState.targetBrow = blendedBrow;
    faceState.targetSmile = blendedSmile;
    faceState.targetRgb = [Math.round(blendedR), Math.round(blendedG), Math.round(blendedB)];

    updateAndDrawAIFace(time);
    // Mirror face canvas to mobile HUD
    if (faceCanvas && fctxMobile && faceCanvasMobile) {
      fctxMobile.clearRect(0, 0, faceCanvasMobile.width, faceCanvasMobile.height);
      fctxMobile.drawImage(faceCanvas, 0, 0, faceCanvasMobile.width, faceCanvasMobile.height);
    }

    // Render 360° Celestial Sphere Wireframe
    interface GlobeQuad {
      pr00: { x: number; y: number; z: number; scale: number };
      pr10: { x: number; y: number; z: number; scale: number };
      pr11: { x: number; y: number; z: number; scale: number };
      pr01: { x: number; y: number; z: number; scale: number };
      z: number;
      nz2: number;
      nx: number;
      ny: number;
      nz: number;
    }

    const globeQuads: GlobeQuad[] = [];
    for (let i = 0; i < GLOBE_NU; i++) {
      const u1 = (i / GLOBE_NU) * Math.PI * 2;
      const u2 = ((i + 1) / GLOBE_NU) * Math.PI * 2;

      for (let j = 0; j < GLOBE_NV; j++) {
        const v1 = (j / GLOBE_NV - 0.5) * Math.PI;
        const v2 = ((j + 1) / GLOBE_NV - 0.5) * Math.PI;

        const p00 = { x: Math.cos(u1)*Math.cos(v1)*universeR, y: Math.sin(v1)*universeR, z: Math.sin(u1)*Math.cos(v1)*universeR };
        const p10 = { x: Math.cos(u2)*Math.cos(v1)*universeR, y: Math.sin(v1)*universeR, z: Math.sin(u2)*Math.cos(v1)*universeR };
        const p11 = { x: Math.cos(u2)*Math.cos(v2)*universeR, y: Math.sin(v2)*universeR, z: Math.sin(u2)*Math.cos(v2)*universeR };
        const p01 = { x: Math.cos(u1)*Math.cos(v2)*universeR, y: Math.sin(v2)*universeR, z: Math.sin(u1)*Math.cos(v2)*universeR };

        const pr00 = project(p00.x, p00.y, p00.z, cosX, sinX, cosY, sinY, cx, cy);
        const pr10 = project(p10.x, p10.y, p10.z, cosX, sinX, cosY, sinY, cx, cy);
        const pr11 = project(p11.x, p11.y, p11.z, cosX, sinX, cosY, sinY, cx, cy);
        const pr01 = project(p01.x, p01.y, p01.z, cosX, sinX, cosY, sinY, cx, cy);

        const midU = (u1 + u2) * 0.5;
        const midV = (v1 + v2) * 0.5;
        const nx = Math.cos(midU) * Math.cos(midV);
        const ny = Math.sin(midV);
        const nz = Math.sin(midU) * Math.cos(midV);

        const nx1 = nx * cosY - nz * sinY;
        const nz1 = nz * cosY + nx * sinY;
        const nz2 = nz1 * cosX + (-ny) * sinX;

        const avgZ = (pr00.z + pr10.z + pr11.z + pr01.z) * 0.25;

        globeQuads.push({
          pr00, pr10, pr11, pr01,
          z: avgZ,
          nz2: nz2,
          nx, ny, nz
        });
      }
    }

    globeQuads.sort((a, b) => a.z - b.z);

    globeQuads.forEach(q => {
      if (q.nz2 > -0.3) {
        ctx!.beginPath();
        ctx!.moveTo(q.pr00.x, q.pr00.y);
        ctx!.lineTo(q.pr10.x, q.pr10.y);
        ctx!.lineTo(q.pr11.x, q.pr11.y);
        ctx!.lineTo(q.pr01.x, q.pr01.y);
        ctx!.closePath();

        const frontFactor = Math.max(0, q.nz2);
        const alpha = 0.04 + 0.10 * frontFactor;
        const strokeAlpha = 0.06 + 0.16 * frontFactor;

        ctx!.fillStyle = getSphericalColor(q.nx, q.ny, q.nz, alpha);
        ctx!.fill();

        ctx!.strokeStyle = getSphericalColor(q.nx, q.ny, q.nz, strokeAlpha);
        ctx!.lineWidth = 0.5;
        ctx!.stroke();
      }
    });

    // Render 8 Octant Reference Nodes
    octantSectors.forEach((p) => {
      const pole3D = {
        x: p.dir[0] * universeR,
        y: p.dir[1] * universeR,
        z: p.dir[2] * universeR
      };

      const polePr = project(pole3D.x, pole3D.y, pole3D.z, cosX, sinX, cosY, sinY, cx, cy);

      const nx = p.dir[0], ny = p.dir[1], nz = p.dir[2];
      const nx1 = nx * cosY - nz * sinY;
      const nz1 = nz * cosY + nx * sinY;
      const nz2 = nz1 * cosX + (-ny) * sinX;

      if (nz2 > -0.15) {
        const isDominant = (p === currentPeakLobe);
        const nodeAlpha = Math.max(0.35, Math.min(1.0, (nz2 + 0.15) * 1.3));
        const color = `rgb(${p.rgb.join(',')})`;

        ctx!.beginPath();
        ctx!.arc(polePr.x, polePr.y, (isDominant ? 5.2 : 2.8) * polePr.scale, 0, Math.PI * 2);
        ctx!.fillStyle = color;
        ctx!.shadowColor = color;
        ctx!.shadowBlur = isDominant ? 16 : 4;
        ctx!.globalAlpha = nodeAlpha;
        ctx!.fill();
        ctx!.shadowBlur = 0;
        ctx!.globalAlpha = 1.0;

        if (isDominant) {
          ctx!.strokeStyle = color;
          ctx!.lineWidth = 1.4;
          ctx!.beginPath();
          ctx!.arc(polePr.x, polePr.y, (8.5 + Math.sin(time * 3) * 2) * polePr.scale, 0, Math.PI * 2);
          ctx!.stroke();

          ctx!.beginPath();
          ctx!.arc(polePr.x, polePr.y, (12 + Math.sin(time * 3 + 1) * 2.5) * polePr.scale, 0, Math.PI * 2);
          ctx!.strokeStyle = `${color}55`;
          ctx!.lineWidth = 0.8;
          ctx!.stroke();

          // Discrete indicator tag next to node
          ctx!.font = 'bold 8.5px monospace';
          ctx!.fillStyle = color;
          ctx!.fillText(`O${p.octantId}`, polePr.x + 8, polePr.y + 3);
        } else {
          ctx!.font = '8px monospace';
          const isLight = document.documentElement.getAttribute('data-theme') === 'light';
          ctx!.fillStyle = isLight ? `rgba(30, 41, 59, ${Math.max(0.65, nodeAlpha)})` : `rgba(255, 255, 255, ${nodeAlpha * 0.55})`;
          ctx!.fillText(`O${p.octantId}`, polePr.x + 5, polePr.y + 3);
        }
      }
    });

    // Render 3D PAD Coordinate Axes - Elegant Hairline Platinum & Titanium Guides
    const originPr = project(0, 0, 0, cosX, sinX, cosY, sinY, cx, cy);
    const isLightCanvas = document.documentElement.getAttribute('data-theme') === 'light';
    const axisStroke = isLightCanvas ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)';
    const labelColor = isLightCanvas ? 'rgba(71, 85, 105, 0.85)' : 'rgba(203, 213, 225, 0.75)';

    ctx!.lineWidth = 0.8;
    ctx!.strokeStyle = axisStroke;
    ctx!.font = '600 8.5px "JetBrains Mono", monospace';
    ctx!.fillStyle = labelColor;

    // X Axis (Valence)
    const posX = project(axisLen, 0, 0, cosX, sinX, cosY, sinY, cx, cy);
    const negX = project(-axisLen, 0, 0, cosX, sinX, cosY, sinY, cx, cy);
    ctx!.beginPath();
    ctx!.moveTo(negX.x, negX.y);
    ctx!.lineTo(posX.x, posX.y);
    ctx!.stroke();
    ctx!.fillText('+X', posX.x + 4, posX.y + 3);
    ctx!.fillText('-X', negX.x - 16, negX.y + 3);

    // Y Axis (Arousal)
    const posY = project(0, axisLen, 0, cosX, sinX, cosY, sinY, cx, cy);
    const negY = project(0, -axisLen, 0, cosX, sinX, cosY, sinY, cx, cy);
    ctx!.beginPath();
    ctx!.moveTo(negY.x, negY.y);
    ctx!.lineTo(posY.x, posY.y);
    ctx!.stroke();
    ctx!.fillText('+Y', posY.x + 4, posY.y - 3);
    ctx!.fillText('-Y', negY.x + 4, negY.y + 10);

    // Z Axis (Dominance)
    const posZ = project(0, 0, axisLen, cosX, sinX, cosY, sinY, cx, cy);
    const negZ = project(0, 0, -axisLen, cosX, sinX, cosY, sinY, cx, cy);
    ctx!.beginPath();
    ctx!.moveTo(negZ.x, negZ.y);
    ctx!.lineTo(posZ.x, posZ.y);
    ctx!.stroke();
    ctx!.fillText('+Z', posZ.x + 4, posZ.y + 8);
    ctx!.fillText('-Z', negZ.x - 16, negZ.y - 4);

    // Origin Zero-Point Sink (0,0,0) - Champagne Gold
    ctx!.beginPath();
    ctx!.arc(originPr.x, originPr.y, 3.2 * originPr.scale, 0, Math.PI * 2);
    ctx!.fillStyle = isLightCanvas ? '#8F6932' : '#D4AF37';
    ctx!.shadowColor = isLightCanvas ? 'rgba(179, 138, 77, 0.4)' : 'rgba(212, 175, 55, 0.4)';
    ctx!.shadowBlur = 8;
    ctx!.fill();
    ctx!.shadowBlur = 0;

    // Evaluate Solid Polyhedral Manifold
    const grid3D: [number, number, number][][] = [];
    const gridProj: { x: number; y: number; z: number; scale: number }[][] = [];

    for (let i = 0; i <= NU; i++) {
      const u = (i / NU) * Math.PI * 2;
      grid3D[i] = [];
      gridProj[i] = [];

      for (let j = 0; j <= NV; j++) {
        const v = (j / NV - 0.5) * Math.PI;
        const pos = evalSolidManifold(u, v, time);
        grid3D[i][j] = pos;
        gridProj[i][j] = project(pos[0], pos[1], pos[2], cosX, sinX, cosY, sinY, cx, cy);
      }
    }

    // Depth Sort and Render Facets
    interface ManifoldQuad {
      pr00: { x: number; y: number; z: number; scale: number };
      pr10: { x: number; y: number; z: number; scale: number };
      pr11: { x: number; y: number; z: number; scale: number };
      pr01: { x: number; y: number; z: number; scale: number };
      z: number;
      nx: number;
      ny: number;
      nz: number;
    }

    const quads: ManifoldQuad[] = [];
    for (let i = 0; i < NU; i++) {
      for (let j = 0; j < NV; j++) {
        const p00 = grid3D[i][j];
        const p10 = grid3D[i + 1][j];
        const p11 = grid3D[i + 1][j + 1];
        const p01 = grid3D[i][j + 1];

        const pr00 = gridProj[i][j];
        const pr10 = gridProj[i + 1][j];
        const pr11 = gridProj[i + 1][j + 1];
        const pr01 = gridProj[i][j + 1];

        const avgZ = (pr00.z + pr10.z + pr11.z + pr01.z) * 0.25;

        const cx3 = (p00[0] + p10[0] + p11[0] + p01[0]) * 0.25;
        const cy3 = (p00[1] + p10[1] + p11[1] + p01[1]) * 0.25;
        const cz3 = (p00[2] + p10[2] + p11[2] + p01[2]) * 0.25;
        const len = Math.hypot(cx3, cy3, cz3) || 1;

        quads.push({
          pr00, pr10, pr11, pr01,
          z: avgZ,
          nx: cx3 / len,
          ny: cy3 / len,
          nz: cz3 / len
        });
      }
    }

    quads.sort((a, b) => a.z - b.z);

    quads.forEach(q => {
      const nx1 = q.nx * cosY - q.nz * sinY;
      const nz1 = q.nz * cosY + q.nx * sinY;
      const nz2 = nz1 * cosX + (-q.ny) * sinX;

      ctx!.beginPath();
      ctx!.moveTo(q.pr00.x, q.pr00.y);
      ctx!.lineTo(q.pr10.x, q.pr10.y);
      ctx!.lineTo(q.pr11.x, q.pr11.y);
      ctx!.lineTo(q.pr01.x, q.pr01.y);
      ctx!.closePath();

      const light = Math.max(0.18, nz2 * 0.6 + 0.45);
      ctx!.fillStyle = getSphericalColor(q.nx, q.ny, q.nz, light * 0.82);
      ctx!.fill();

      ctx!.strokeStyle = `rgba(255, 255, 255, ${Math.max(0.08, light * 0.28)})`;
      ctx!.lineWidth = 0.7;
      ctx!.stroke();
    });

    // Render Inward Particles along 8-Octant Inflow
    for (let i = inflowParticles.length - 1; i >= 0; i--) {
      const p = inflowParticles[i];
      p.progress += p.speed;

      if (p.progress < 0) continue;

      if (p.progress >= 1.0) {
        impactFlashes.push({
          x: p.dir[0] * 35 * curScaleRatio,
          y: p.dir[1] * 35 * curScaleRatio,
          z: p.dir[2] * 35 * curScaleRatio,
          radius: 3 * curScaleRatio,
          maxRadius: 22 * curScaleRatio,
          alpha: 1.0,
          color: getSphericalColor(p.dir[0], p.dir[1], p.dir[2], 1.0)
        });

        if (p.isBurst) {
          inflowParticles.splice(i, 1);
          continue;
        } else {
          p.progress = 0;
          const activeTarget = octantSectors.find(s => s.octantId === (activeSelectedOctantId || currentPeakLobe.octantId)) || currentPeakLobe;
          const targetOct = (Math.random() < 0.65) ? activeTarget : octantSectors[Math.floor(Math.random() * octantSectors.length)];
          const spread = 0.18;
          const nx = targetOct.dir[0] + (Math.random() - 0.5) * spread;
          const ny = targetOct.dir[1] + (Math.random() - 0.5) * spread;
          const nz = targetOct.dir[2] + (Math.random() - 0.5) * spread;
          const len = Math.hypot(nx, ny, nz) || 1;
          p.dir = [nx / len, ny / len, nz / len];
          p.startX = p.dir[0] * universeR;
          p.startY = p.dir[1] * universeR;
          p.startZ = p.dir[2] * universeR;
          p.octantId = targetOct.octantId;
        }
      }

      const curX = p.startX * (1 - p.progress);
      const curY = p.startY * (1 - p.progress);
      const curZ = p.startZ * (1 - p.progress);

      const tailProg = Math.max(0, p.progress - 0.08);
      const tailX = p.startX * (1 - tailProg);
      const tailY = p.startY * (1 - tailProg);
      const tailZ = p.startZ * (1 - tailProg);

      const prHead = project(curX, curY, curZ, cosX, sinX, cosY, sinY, cx, cy);
      const prTail = project(tailX, tailY, tailZ, cosX, sinX, cosY, sinY, cx, cy);

      const pColor = getSphericalColor(p.dir[0], p.dir[1], p.dir[2], 0.95);

      ctx!.strokeStyle = pColor;
      ctx!.lineWidth = (p.isBurst ? 2.4 : 1.4) * prHead.scale;
      ctx!.beginPath();
      ctx!.moveTo(prTail.x, prTail.y);
      ctx!.lineTo(prHead.x, prHead.y);
      ctx!.stroke();

      ctx!.beginPath();
      ctx!.arc(prHead.x, prHead.y, (p.isBurst ? 3.0 : 1.8) * prHead.scale, 0, Math.PI * 2);
      const isLightEngine = document.documentElement.getAttribute('data-theme') === 'light';
      ctx!.fillStyle = isLightEngine ? '#0f172a' : '#ffffff';
      ctx!.fill();
    }

    // Render Attached Crystalline Surface Grains
    attachedGrains.forEach(g => {
      const pos = evalSolidManifold(g.u, g.v, time);
      const pr = project(pos[0], pos[1], pos[2], cosX, sinX, cosY, sinY, cx, cy);

      const isLightEngine = document.documentElement.getAttribute('data-theme') === 'light';
      ctx!.beginPath();
      ctx!.arc(pr.x, pr.y, g.size * pr.scale, 0, Math.PI * 2);
      ctx!.fillStyle = isLightEngine ? `rgba(15, 23, 42, ${g.brightness * 0.75})` : `rgba(255, 255, 255, ${g.brightness * 0.85})`;
      ctx!.fill();
    });

    // Render Impact Flashes
    for (let i = impactFlashes.length - 1; i >= 0; i--) {
      const f = impactFlashes[i];
      if (f.isInward) {
        f.radius -= 1.2 * curScaleRatio;
        f.alpha -= 0.035;
        if (f.radius <= 1 || f.alpha <= 0) {
          impactFlashes.splice(i, 1);
          continue;
        }
      } else {
        f.radius += 0.8 * curScaleRatio;
        f.alpha -= 0.05;
        if (f.alpha <= 0 || f.radius >= f.maxRadius) {
          impactFlashes.splice(i, 1);
          continue;
        }
      }

      const pr = project(f.x, f.y, f.z, cosX, sinX, cosY, sinY, cx, cy);
      ctx!.beginPath();
      ctx!.arc(pr.x, pr.y, Math.max(1, f.radius * pr.scale), 0, Math.PI * 2);
      ctx!.strokeStyle = f.color;
      ctx!.globalAlpha = f.alpha;
      ctx!.lineWidth = f.isInward ? 2.0 : 1.5;
      ctx!.shadowColor = f.color;
      ctx!.shadowBlur = f.isInward ? 14 : 8;
      ctx!.stroke();
      ctx!.shadowBlur = 0;
      ctx!.globalAlpha = 1.0;
    }

    // Dynamic Projected Weighted Sum Centroid Ray (P_centroid)
    const centroid3D = {
      x: sphericalCentroid.x * universeR,
      y: sphericalCentroid.y * universeR,
      z: sphericalCentroid.z * universeR
    };
    const centroidPr = project(centroid3D.x, centroid3D.y, centroid3D.z, cosX, sinX, cosY, sinY, cx, cy);

    const isLightCentroid = document.documentElement.getAttribute('data-theme') === 'light';
    ctx!.lineWidth = 1.6;
    ctx!.strokeStyle = isLightCentroid ? '#B38A4D' : '#D4AF37';
    ctx!.shadowColor = isLightCentroid ? 'rgba(179, 138, 77, 0.45)' : 'rgba(212, 175, 55, 0.45)';
    ctx!.shadowBlur = 10;
    ctx!.beginPath();
    ctx!.moveTo(originPr.x, originPr.y);
    ctx!.lineTo(centroidPr.x, centroidPr.y);
    ctx!.stroke();
    ctx!.shadowBlur = 0;

    // Centroid Surface Reticle
    ctx!.beginPath();
    ctx!.arc(centroidPr.x, centroidPr.y, 5.0 * centroidPr.scale, 0, Math.PI * 2);
    ctx!.fillStyle = isLightCentroid ? '#FAF8F5' : '#ffffff';
    ctx!.shadowColor = isLightCentroid ? 'rgba(179, 138, 77, 0.45)' : 'rgba(212, 175, 55, 0.5)';
    ctx!.shadowBlur = 10;
    ctx!.fill();
    ctx!.shadowBlur = 0;

    ctx!.beginPath();
    ctx!.arc(centroidPr.x, centroidPr.y, 2.4 * centroidPr.scale, 0, Math.PI * 2);
    ctx!.fillStyle = isLightCentroid ? '#8F6932' : '#C5A059';
    ctx!.fill();

    // Update HUD Meta (desktop + mobile mirror)
    const aiFaceDesc = document.getElementById('ai-face-desc');
    const aiSpikeBadge = document.getElementById('ai-spike-badge');
    const aiFaceDescMobile = document.getElementById('ai-face-desc-mobile');
    const aiSpikeBadgeMobile = document.getElementById('ai-spike-badge-mobile');
    const hudActiveLobeMobile = document.getElementById('hud-active-lobe-mobile');

    const colStr = `rgb(${faceState.rgb[0]}, ${faceState.rgb[1]}, ${faceState.rgb[2]})`;
    const descText = `${currentPeakLobe.desc} (${currentPeakLobe.subEmotions})`;
    const badgeText = `CORE AFFECT · O${currentPeakLobe.octantId} ${currentPeakLobe.octantCode}`;
    const lobeHtml = `<span class="pulse-dot" style="background:${colStr}; box-shadow:0 0 8px ${colStr};"></span> <span class="lobe-name">${currentPeakLobe.name.toUpperCase()}</span>`;

    if (aiFaceDesc) aiFaceDesc.textContent = descText;
    if (aiFaceDescMobile) aiFaceDescMobile.textContent = descText;

    if (aiSpikeBadge) {
      aiSpikeBadge.style.color = colStr;
      aiSpikeBadge.style.borderColor = `${colStr}60`;
      aiSpikeBadge.textContent = badgeText;
    }
    if (aiSpikeBadgeMobile) {
      aiSpikeBadgeMobile.style.color = colStr;
      aiSpikeBadgeMobile.style.borderColor = `${colStr}60`;
      aiSpikeBadgeMobile.textContent = badgeText;
    }

    if (hudActiveLobe) hudActiveLobe.innerHTML = lobeHtml;
    if (hudActiveLobeMobile) hudActiveLobeMobile.innerHTML = lobeHtml;

    if (calloutsContainer) {
      calloutsContainer.innerHTML = '';
    }

    // Broadcast Real-time 3D PAD Affect State to Global Bus (throttled to 10Hz)
    const nowTime = performance.now();
    if (nowTime - lastAffectBroadcastTime > 100) {
      lastAffectBroadcastTime = nowTime;
      const octantDef = OCTANT_AFFECT_DEFINITIONS[currentPeakLobe.octantId];
      updateGlobalAffectState({
        valence: sphericalCentroid.x,
        arousal: sphericalCentroid.y,
        dominance: sphericalCentroid.z,
        centroid: [sphericalCentroid.x, sphericalCentroid.y, sphericalCentroid.z],
        octantId: currentPeakLobe.octantId,
        octantCode: currentPeakLobe.octantCode,
        name: currentPeakLobe.name,
        color: colStr,
        rgb: [...faceState.rgb],
        tone: octantDef?.tone || currentPeakLobe.name,
        subEmotions: currentPeakLobe.subEmotions,
        face: {
          eyeOpen: faceState.eyeOpen,
          brow: faceState.brow,
          smile: faceState.smile,
          rgb: [...faceState.rgb]
        }
      });
    }

    requestAnimationFrame(render);
  }

  render();
}
