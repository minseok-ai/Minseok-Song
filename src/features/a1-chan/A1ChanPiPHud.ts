// A1-Chan Mini PiP Reactive AI Expression Renderer (Replaces wireframe globe with live A1ntuitize Face)
import {
  subscribeToAffectState,
  type AffectState
} from "../a1-firm/a1ntuitizeState";

export function initA1ChanPiPHud() {
  const pipCanvas = document.getElementById("a1-chan-pip-canvas") as HTMLCanvasElement | null;
  const pipTriggerAura = document.getElementById("a1-pip-trigger-aura");
  const pipOctantBadge = document.getElementById("a1-pip-octant-badge");
  const pipPadCoords = document.getElementById("a1-pip-pad-coords");
  const pipEmotionName = document.getElementById("a1-pip-emotion-name");

  if (!pipCanvas) return;

  const ctx = pipCanvas.getContext("2d");
  if (!ctx) return;

  let animId: number | null = null;
  let startTime = performance.now();

  const width = pipCanvas.width || 48;
  const height = pipCanvas.height || 48;

  // Face Affect Target & Current Smooth State
  const faceState = {
    eyeOpen: 1.0,
    targetEyeOpen: 1.0,
    brow: 0.0,
    targetBrow: 0.0,
    smile: 0.7,
    targetSmile: 0.7,
    rgb: [212, 175, 55] as [number, number, number],
    targetRgb: [212, 175, 55] as [number, number, number]
  };

  let lastAffect: AffectState | null = null;

  // Update DOM Telemetry Elements
  function updateDomLabels(affect: AffectState) {
    lastAffect = affect;
    const col = affect.color;
    const isLight = document.documentElement.getAttribute("data-theme") === "light";

    if (pipTriggerAura) {
      // Elegant, restrained champagne gold breathing ring, no rainbow flashing
      const auraColor = isLight ? "rgba(179, 138, 77, 0.25)" : "rgba(212, 175, 55, 0.30)";
      pipTriggerAura.style.borderColor = auraColor;
      pipTriggerAura.style.boxShadow = `0 0 12px ${auraColor}`;
    }

    if (pipOctantBadge) {
      pipOctantBadge.textContent = `O${affect.octantId} ${affect.octantCode}`;
      pipOctantBadge.style.color = isLight ? "#8F6932" : "#D4AF37";
      pipOctantBadge.style.borderColor = isLight ? "rgba(179, 138, 77, 0.35)" : "rgba(212, 175, 55, 0.35)";
    }

    if (pipPadCoords) {
      const v = affect.valence >= 0 ? `+${affect.valence.toFixed(2)}` : affect.valence.toFixed(2);
      const a = affect.arousal >= 0 ? `+${affect.arousal.toFixed(2)}` : affect.arousal.toFixed(2);
      const d = affect.dominance >= 0 ? `+${affect.dominance.toFixed(2)}` : affect.dominance.toFixed(2);
      pipPadCoords.textContent = `P:${v} A:${a} D:${d}`;
    }

    if (pipEmotionName) {
      pipEmotionName.textContent = affect.name;
    }

    // Map Affect PAD to Face Features
    if (affect.rgb) {
      faceState.targetRgb = [...affect.rgb];
    }
    faceState.targetSmile = Math.max(-1, Math.min(1, affect.valence * 1.3));
    faceState.targetBrow = Math.max(-1, Math.min(1, affect.dominance * 0.9));
    faceState.targetEyeOpen = Math.max(0.4, Math.min(1.2, 0.8 + affect.arousal * 0.35));
  }

  // Subscribe to Global Affect State from A1ntuitize
  subscribeToAffectState((state) => {
    updateDomLabels(state);
  });

  // Watch for light/dark theme switches to re-sync telemetry colors
  const themeObserver = new MutationObserver(() => {
    if (lastAffect) {
      updateDomLabels(lastAffect);
    }
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"]
  });

  function renderPiPFace(now: number) {
    const elapsed = (now - startTime) * 0.003;

    // Smoothly interpolate face parameters
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

    ctx!.clearRect(0, 0, width, height);

    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    const strokeCol = isLight ? "#2A2722" : colStr;
    const accentCol = colStr;

    // Natural Blinking Cycle
    const blink = Math.sin(elapsed * 1.7);
    const blinkFactor = blink > 0.95 ? Math.max(0.06, (1 - blink) * 20) : 1.0;
    const eyeH = Math.max(1.2, 8.5 * faceState.eyeOpen * blinkFactor);

    // Subtle Breathing Bob
    const bob = Math.sin(elapsed * 1.4) * 0.8;

    ctx!.save();
    // Center and scale from reference 104x76 face layout to canvas dimensions
    ctx!.translate(width / 2, height / 2 + bob);
    ctx!.scale(0.42, 0.42);
    ctx!.translate(-52, -38);

    ctx!.lineWidth = 2.4;
    ctx!.strokeStyle = strokeCol;
    ctx!.shadowColor = accentCol;
    ctx!.shadowBlur = isLight ? 0 : 6;
    ctx!.lineCap = "round";

    // Left Eyebrow
    ctx!.beginPath();
    const leftBrowY1 = 19 - faceState.brow * 4.5;
    const leftBrowY2 = 20 + faceState.brow * 2.5;
    ctx!.moveTo(18, leftBrowY1);
    ctx!.quadraticCurveTo(30, 14 - faceState.brow * 3.5, 42, leftBrowY2);
    ctx!.stroke();

    // Right Eyebrow
    ctx!.beginPath();
    const rightBrowY1 = 20 + faceState.brow * 2.5;
    const rightBrowY2 = 19 - faceState.brow * 4.5;
    ctx!.moveTo(62, rightBrowY1);
    ctx!.quadraticCurveTo(74, 14 - faceState.brow * 3.5, 86, rightBrowY2);
    ctx!.stroke();

    // Left Hologram Eye
    ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${isLight ? 0.22 : 0.28})`;
    ctx!.strokeStyle = accentCol;
    ctx!.beginPath();
    ctx!.ellipse(30, 34, 8.5, eyeH, 0, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.stroke();

    // Left Pupil (Dark ink in light mode, luminous white in dark mode)
    ctx!.fillStyle = isLight ? "#2A2722" : "#ffffff";
    ctx!.beginPath();
    ctx!.arc(30, 34, Math.min(3.2, eyeH * 0.55), 0, Math.PI * 2);
    ctx!.fill();

    // Right Hologram Eye
    ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${isLight ? 0.22 : 0.28})`;
    ctx!.strokeStyle = accentCol;
    ctx!.beginPath();
    ctx!.ellipse(74, 34, 8.5, eyeH, 0, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.stroke();

    // Right Pupil
    ctx!.fillStyle = isLight ? "#2A2722" : "#ffffff";
    ctx!.beginPath();
    ctx!.arc(74, 34, Math.min(3.2, eyeH * 0.55), 0, Math.PI * 2);
    ctx!.fill();

    // Expressive Mouth
    ctx!.beginPath();
    ctx!.strokeStyle = strokeCol;
    const mouthY = 57;
    const mouthCurve = faceState.smile * 7;
    ctx!.moveTo(37, mouthY);
    ctx!.quadraticCurveTo(52, mouthY + mouthCurve, 67, mouthY);
    ctx!.stroke();

    // Subtle Cybernetic Cheek Blush
    if (faceState.smile > 0.15) {
      ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${isLight ? 0.24 : 0.32})`;
      ctx!.beginPath();
      ctx!.arc(22, 46, 3.8, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.beginPath();
      ctx!.arc(82, 46, 3.8, 0, Math.PI * 2);
      ctx!.fill();
    }

    ctx!.shadowBlur = 0;
    ctx!.restore();

    animId = requestAnimationFrame(renderPiPFace);
  }

  animId = requestAnimationFrame(renderPiPFace);

  return () => {
    if (animId !== null) cancelAnimationFrame(animId);
    themeObserver.disconnect();
  };
}
