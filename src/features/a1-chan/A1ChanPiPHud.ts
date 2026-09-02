// A1-Chan Mini PiP 3D Affect HUD Renderer (1/10 Scale YouTube-Style Manifold)
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

  let currentAffect: AffectState | null = null;
  let rotY = 0;
  let rotX = 0.28;
  let animId: number | null = null;

  const width = pipCanvas.width || 56;
  const height = pipCanvas.height || 56;
  const cx = width / 2;
  const cy = height / 2;
  const sphereR = width * 0.36; // 1/10 scale sphere radius

  // Update DOM Telemetry Elements
  function updateDomLabels(affect: AffectState) {
    const col = affect.color;

    if (pipTriggerAura) {
      pipTriggerAura.style.borderColor = `${col}80`;
      pipTriggerAura.style.boxShadow = `0 0 12px ${col}60`;
    }

    if (pipOctantBadge) {
      pipOctantBadge.textContent = `O${affect.octantId} ${affect.octantCode}`;
      pipOctantBadge.style.color = col;
      pipOctantBadge.style.borderColor = `${col}70`;
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
  }

  // Subscribe to Global Affect State
  subscribeToAffectState((state) => {
    currentAffect = state;
    updateDomLabels(state);
  });

  // 3D Mini Wireframe Sphere Projection
  function project3D(x: number, y: number, z: number) {
    // Rotate Y
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    // Rotate X
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    const focal = 140;
    const scale = focal / (focal + z2);

    return {
      px: cx + x1 * scale,
      py: cy - y2 * scale,
      z: z2,
      scale
    };
  }

  function renderPiP() {
    rotY += 0.015;
    ctx!.clearRect(0, 0, width, height);

    const rgb = currentAffect?.rgb || [56, 189, 248];
    const colStr = `rgb(${rgb.join(",")})`;

    // Mini Outer Glow Ring
    ctx!.save();
    const grad = ctx!.createRadialGradient(cx, cy, 2, cx, cy, sphereR * 1.15);
    grad.addColorStop(0, `rgba(${rgb.join(",")}, 0.18)`);
    grad.addColorStop(1, "transparent");
    ctx!.fillStyle = grad;
    ctx!.beginPath();
    ctx!.arc(cx, cy, sphereR * 1.15, 0, Math.PI * 2);
    ctx!.fill();
    ctx!.restore();

    // Mini 3D Wireframe Lat/Long Rings
    ctx!.lineWidth = 0.9;
    ctx!.strokeStyle = `rgba(${rgb.join(",")}, 0.3)`;

    const latitudes = [-0.6, 0, 0.6];
    latitudes.forEach((lat) => {
      const rRing = Math.cos(lat) * sphereR;
      const yRing = Math.sin(lat) * sphereR;
      ctx!.beginPath();
      for (let step = 0; step <= 24; step++) {
        const theta = (step / 24) * Math.PI * 2;
        const pt = project3D(Math.cos(theta) * rRing, yRing, Math.sin(theta) * rRing);
        if (step === 0) ctx!.moveTo(pt.px, pt.py);
        else ctx!.lineTo(pt.px, pt.py);
      }
      ctx!.stroke();
    });

    const longitudes = [0, Math.PI / 3, (2 * Math.PI) / 3];
    longitudes.forEach((lon) => {
      ctx!.beginPath();
      for (let step = 0; step <= 24; step++) {
        const phi = (step / 24) * Math.PI * 2;
        const pt = project3D(
          Math.sin(phi) * Math.cos(lon) * sphereR,
          Math.cos(phi) * sphereR,
          Math.sin(phi) * Math.sin(lon) * sphereR
        );
        if (step === 0) ctx!.moveTo(pt.px, pt.py);
        else ctx!.lineTo(pt.px, pt.py);
      }
      ctx!.stroke();
    });

    // 3D Principal Axis Crosshairs
    const axisLen = sphereR * 1.18;
    const axX = project3D(axisLen, 0, 0);
    const axY = project3D(0, axisLen, 0);
    const axZ = project3D(0, 0, axisLen);
    const origin = project3D(0, 0, 0);

    ctx!.lineWidth = 0.8;
    // X Axis (Red)
    ctx!.strokeStyle = "rgba(239, 68, 68, 0.5)";
    ctx!.beginPath(); ctx!.moveTo(origin.px, origin.py); ctx!.lineTo(axX.px, axX.py); ctx!.stroke();
    // Y Axis (Cyan/Blue)
    ctx!.strokeStyle = "rgba(56, 189, 248, 0.5)";
    ctx!.beginPath(); ctx!.moveTo(origin.px, origin.py); ctx!.lineTo(axY.px, axY.py); ctx!.stroke();
    // Z Axis (Green)
    ctx!.strokeStyle = "rgba(16, 185, 129, 0.5)";
    ctx!.beginPath(); ctx!.moveTo(origin.px, origin.py); ctx!.lineTo(axZ.px, axZ.py); ctx!.stroke();

    // Centroid Vector & Glowing Reticle
    if (currentAffect) {
      const cx3d = currentAffect.centroid[0] * sphereR;
      const cy3d = currentAffect.centroid[1] * sphereR;
      const cz3d = currentAffect.centroid[2] * sphereR;

      const cPt = project3D(cx3d, cy3d, cz3d);

      // Centroid Vector Line
      ctx!.beginPath();
      ctx!.moveTo(origin.px, origin.py);
      ctx!.lineTo(cPt.px, cPt.py);
      ctx!.strokeStyle = colStr;
      ctx!.lineWidth = 1.4;
      ctx!.stroke();

      // Centroid Surface Reticle
      ctx!.beginPath();
      ctx!.arc(cPt.px, cPt.py, 3.2 * cPt.scale, 0, Math.PI * 2);
      ctx!.fillStyle = "#ffffff";
      ctx!.shadowColor = colStr;
      ctx!.shadowBlur = 8;
      ctx!.fill();
      ctx!.shadowBlur = 0;

      ctx!.beginPath();
      ctx!.arc(cPt.px, cPt.py, 1.8 * cPt.scale, 0, Math.PI * 2);
      ctx!.fillStyle = colStr;
      ctx!.fill();
    }

    animId = requestAnimationFrame(renderPiP);
  }

  renderPiP();

  return () => {
    if (animId !== null) cancelAnimationFrame(animId);
  };
}
