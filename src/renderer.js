// ============================================================
// renderer.js — Canvas draw calls
// ============================================================

import { particles, engine, resolveColor } from "./engine.js";

let canvas, ctx;

export function initRenderer(canvasEl) {
  canvas = canvasEl;
  ctx    = canvas.getContext("2d");
}

// ── Canvas sizing ─────────────────────────────────────────────

export function resizeCanvas() {
  const dpr  = Math.max(1, window.devicePixelRatio || 1);
  const rect = canvas.getBoundingClientRect();
  canvas.width  = Math.floor(rect.width  * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ── Shapes ────────────────────────────────────────────────────

function drawStar(cx, cy, spikes, outerR, innerR) {
  let rot  = Math.PI / 2 * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
}

function drawPlus(cx, cy, size) {
  const arm   = size * 0.75;
  const thick = Math.max(2, size * 0.55);
  ctx.beginPath();
  ctx.rect(cx - thick / 2, cy - arm, thick, arm * 2);
  ctx.rect(cx - arm, cy - thick / 2, arm * 2, thick);
}

function drawParticle(p) {
  const { x, y, size, shape } = p;

  if (shape === "square") {
    const s = size * 2;
    ctx.fillRect(x - s / 2, y - s / 2, s, s);
    return;
  }
  if (shape === "star") {
    drawStar(x, y, 5, size * 1.6, size * 0.75);
    ctx.fill();
    return;
  }
  if (shape === "plus") {
    drawPlus(x, y, size * 1.8);
    ctx.fill();
    return;
  }
  // default: circle
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
}

// ── Main render ───────────────────────────────────────────────

export function render(pointer) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  ctx.clearRect(0, 0, w, h);

  // motion-blur trail
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle   = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = engine.blendMode;

  for (const p of particles) {
    if (p.alpha <= 0 || p.size <= 0) continue;
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle   = resolveColor(p);
    drawParticle(p);
    ctx.restore();
  }

  ctx.restore();

  // cursor ring
  if (pointer.active) {
    ctx.save();
    ctx.globalAlpha  = 0.45;
    ctx.strokeStyle  = "rgba(255,255,255,0.25)";
    ctx.lineWidth    = 1;
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
