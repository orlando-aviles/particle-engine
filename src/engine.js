// ============================================================
// engine.js — Particle state, simulation, emission
// ============================================================

import {
  rand, clamp, degToRad, safeMinMaxSwap,
  randHue, lerpHue, hsvToRgb, rgbToCss, cssFromHSV,
} from "./utils.js";

export const particles = [];

export const engine = {
  paused:        false,
  gravity:       240,
  strength:      60,
  brushOnDrag:   true,
  brushSpacing:  14,
  blendMode:     "source-over",
  maxParticles:  6000,
  clearOnLoad:   true,
};

// ── Particle pool ─────────────────────────────────────────────

export function addParticle(p) {
  if (particles.length >= engine.maxParticles) return;
  particles.push(p);
}

export function clearParticles() {
  particles.length = 0;
}

// ── Emission ──────────────────────────────────────────────────

function randomHSVFromPreset(preset) {
  return {
    h: randHue(preset.hueA, preset.hueB),
    s: rand(preset.satMin, preset.satMax),
    v: rand(preset.valMin, preset.valMax),
  };
}

export function emitBurst(x, y, strength, preset) {
  if (!preset) return;

  const n = Math.floor(clamp(strength, 1, 400) * preset.mult);

  for (let i = 0; i < n; i++) {
    const angle    = rand(degToRad(preset.spreadA), degToRad(preset.spreadB));
    const [spdMin, spdMax]   = safeMinMaxSwap(preset.speedMin,    preset.speedMax);
    const [szMin,  szMax]    = safeMinMaxSwap(preset.sizeMin,     preset.sizeMax);
    const [sdMin,  sdMax]    = safeMinMaxSwap(preset.sizeDecayMin,preset.sizeDecayMax);
    const [lfMin,  lfMax]    = safeMinMaxSwap(preset.lifeMin,     preset.lifeMax);
    const [dgMin,  dgMax]    = safeMinMaxSwap(preset.dragMin,     preset.dragMax);

    const speed     = rand(spdMin, spdMax);
    const size      = rand(szMin,  szMax);
    const sizeDecay = rand(sdMin,  sdMax);
    const life      = rand(lfMin,  lfMax);
    const drag      = rand(dgMin,  dgMax);

    const hsv0 = randomHSVFromPreset(preset);
    const hsv1 = preset.hueAnim ? randomHSVFromPreset(preset) : hsv0;
    const colorStatic = preset.hueAnim ? null : cssFromHSV(hsv0);

    addParticle({
      x, y,
      vx: Math.cos(angle) * speed + rand(-preset.jitter, preset.jitter),
      vy: Math.sin(angle) * speed + rand(-preset.jitter, preset.jitter),
      size, sizeDecay,
      life, age: 0,
      drag, gravityScale: preset.gravityScale,
      hsv0, hsv1, colorStatic,
      alpha: 1, fade: preset.fade,
      shape: preset.shape,
    });
  }
}

// ── Simulation tick ───────────────────────────────────────────

export function simulate(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.age += dt;
    if (p.age >= p.life) {
      particles.splice(i, 1);
      continue;
    }

    p.vy += engine.gravity * p.gravityScale * dt;
    p.vx -= p.vx * p.drag * dt;
    p.vy -= p.vy * p.drag * dt;
    p.x  += p.vx * dt;
    p.y  += p.vy * dt;
    p.size = Math.max(0, p.size - p.sizeDecay * dt);

    const t  = p.age / p.life;
    p.alpha  = Math.max(0, 1 - t * p.fade);
  }
}

// ── Color resolve (used by renderer) ─────────────────────────

export function resolveColor(p) {
  if (p.colorStatic) return p.colorStatic;
  const t  = p.age / p.life;
  const h  = lerpHue(p.hsv0.h, p.hsv1.h, t);
  const s  = p.hsv0.s + (p.hsv1.s - p.hsv0.s) * t;
  const v  = p.hsv0.v + (p.hsv1.v - p.hsv0.v) * t;
  return rgbToCss(hsvToRgb(h, s, v));
}
