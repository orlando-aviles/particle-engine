// ============================================================
// main.js — Init + game loop
// ============================================================

import { engine, simulate, emitBurst, clearParticles } from "./engine.js";
import { initRenderer, resizeCanvas, render }           from "./renderer.js";
import { loadLibrary }                                   from "./presets.js";
import * as UI from "./ui.js";

// ── Bootstrap ─────────────────────────────────────────────────

const canvas = document.getElementById("canvas");
initRenderer(canvas);
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

UI.presetLibrary = loadLibrary();
UI.refreshPresetSelect();
UI.wireUI(UI.loadPreset);
UI.ui.clearOnLoadState.textContent = engine.clearOnLoad ? "ON" : "OFF";
UI.loadPreset("hit");

// Wire the quick-load chips
document.querySelectorAll(".chip[data-preset]").forEach((chip) => {
  chip.addEventListener("click", () => UI.loadPreset(chip.dataset.preset));
});

// ── Pointer input ─────────────────────────────────────────────

const pointer = { x: 0, y: 0, active: false, lastEmitX: 0, lastEmitY: 0 };

function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function spawnAt(x, y) {
  emitBurst(x, y, engine.strength, UI.currentPreset);
}

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointer.active = true;
  const pos = getCanvasPos(e);
  pointer.x = pos.x; pointer.y = pos.y;
  pointer.lastEmitX = pos.x; pointer.lastEmitY = pos.y;
  spawnAt(pos.x, pos.y);
});

canvas.addEventListener("pointermove", (e) => {
  if (!pointer.active) return;
  const pos = getCanvasPos(e);
  pointer.x = pos.x; pointer.y = pos.y;
  if (!engine.brushOnDrag) return;

  const dx   = pos.x - pointer.lastEmitX;
  const dy   = pos.y - pointer.lastEmitY;
  const dist = Math.hypot(dx, dy);

  if (dist >= engine.brushSpacing) {
    const steps = Math.floor(dist / engine.brushSpacing);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      spawnAt(pointer.lastEmitX + dx * t, pointer.lastEmitY + dy * t);
    }
    pointer.lastEmitX = pos.x;
    pointer.lastEmitY = pos.y;
  }
});

canvas.addEventListener("pointerup",    () => { pointer.active = false; });
canvas.addEventListener("pointerleave", () => { pointer.active = false; });

// ── Loop ──────────────────────────────────────────────────────

let last = performance.now();

function step(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  UI.syncEngineFromUI();
  if (!engine.paused) simulate(dt);
  render(pointer);
  UI.updateHUD();

  requestAnimationFrame(step);
}

requestAnimationFrame(step);
