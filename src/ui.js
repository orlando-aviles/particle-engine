// ============================================================
// ui.js — DOM refs, editor sync, color scales, event wiring
// ============================================================

import { deepClone, safeMinMaxSwap, wrap360, rand, clamp, hsvToRgb, rgbToCss } from "./utils.js";
import {
  loadLibrary, saveLibrary, listPresetsSorted,
  isBuiltIn, makeIdFromName, buildDefaultPresets,
} from "./presets.js";
import { engine, particles, clearParticles } from "./engine.js";

// ── DOM refs ──────────────────────────────────────────────────

export const ui = {
  presetName:       document.getElementById("presetName"),
  count:            document.getElementById("count"),

  presetSelect:     document.getElementById("presetSelect"),
  saveName:         document.getElementById("saveName"),
  btnLoadPreset:    document.getElementById("btnLoadPreset"),
  btnSaveNew:       document.getElementById("btnSaveNew"),
  btnOverwrite:     document.getElementById("btnOverwrite"),
  btnDelete:        document.getElementById("btnDelete"),
  btnResetDefaults: document.getElementById("btnResetDefaults"),
  btnExportJSON:    document.getElementById("btnExportJSON"),
  btnImportJSON:    document.getElementById("btnImportJSON"),
  btnClearParticles:document.getElementById("btnClearParticles"),

  ed: {
    name:         document.getElementById("ed_name"),
    shape:        document.getElementById("ed_shape"),
    hueAnim:      document.getElementById("ed_hueAnim"),
    hueA:         document.getElementById("ed_hueA"),
    hueB:         document.getElementById("ed_hueB"),
    satMin:       document.getElementById("ed_satMin"),
    satMax:       document.getElementById("ed_satMax"),
    valMin:       document.getElementById("ed_valMin"),
    valMax:       document.getElementById("ed_valMax"),
    mult:         document.getElementById("ed_mult"),
    spreadA:      document.getElementById("ed_spreadA"),
    spreadB:      document.getElementById("ed_spreadB"),
    speedMin:     document.getElementById("ed_speedMin"),
    speedMax:     document.getElementById("ed_speedMax"),
    sizeMin:      document.getElementById("ed_sizeMin"),
    sizeMax:      document.getElementById("ed_sizeMax"),
    sizeDecayMin: document.getElementById("ed_sizeDecayMin"),
    sizeDecayMax: document.getElementById("ed_sizeDecayMax"),
    lifeMin:      document.getElementById("ed_lifeMin"),
    lifeMax:      document.getElementById("ed_lifeMax"),
    dragMin:      document.getElementById("ed_dragMin"),
    dragMax:      document.getElementById("ed_dragMax"),
    gravityScale: document.getElementById("ed_gravityScale"),
    jitter:       document.getElementById("ed_jitter"),
    fade:         document.getElementById("ed_fade"),
  },

  btnRandomize:      document.getElementById("btnRandomize"),
  btnRevertSelected: document.getElementById("btnRevertSelected"),

  strength:          document.getElementById("strength"),
  gravity:           document.getElementById("gravity"),
  brushSpacing:      document.getElementById("brushSpacing"),
  brushMode:         document.getElementById("brushMode"),
  blendMode:         document.getElementById("blendMode"),
  maxParticles:      document.getElementById("maxParticles"),
  pause:             document.getElementById("pause"),
  toggleClearOnLoad: document.getElementById("toggleClearOnLoad"),
  clearOnLoadState:  document.getElementById("clearOnLoadState"),

  scaleHue:  document.getElementById("scaleHue"),
  scaleSat:  document.getElementById("scaleSat"),
  scaleVal:  document.getElementById("scaleVal"),
  roHue:     document.getElementById("roHue"),
  roSat:     document.getElementById("roSat"),
  roVal:     document.getElementById("roVal"),

  // slider readout spans (added in new HTML)
  roMult:         document.getElementById("roMult"),
  roSpread:       document.getElementById("roSpread"),
  roSpeed:        document.getElementById("roSpeed"),
  roSize:         document.getElementById("roSize"),
  roSizeDecay:    document.getElementById("roSizeDecay"),
  roLife:         document.getElementById("roLife"),
  roDrag:         document.getElementById("roDrag"),
  roGravityScale: document.getElementById("roGravityScale"),
  roJitter:       document.getElementById("roJitter"),
  roFade:         document.getElementById("roFade"),
  roStrength:     document.getElementById("roStrength"),
  roGravity:      document.getElementById("roGravity"),
  roBrushSpacing: document.getElementById("roBrushSpacing"),
  roMaxParticles: document.getElementById("roMaxParticles"),
};

// ── State ─────────────────────────────────────────────────────

export let presetLibrary  = {};
export let selectedPresetId = "hit";
export let currentPreset  = null;

// ── Color scales ──────────────────────────────────────────────

function gradientHue() {
  return "linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)";
}

function gradientSat(h) {
  const c0 = rgbToCss(hsvToRgb(h, 0,   100));
  const c1 = rgbToCss(hsvToRgb(h, 100, 100));
  return `linear-gradient(90deg, ${c0}, ${c1})`;
}

function gradientVal(h, s) {
  const c0 = rgbToCss(hsvToRgb(h, s, 0));
  const c1 = rgbToCss(hsvToRgb(h, s, 100));
  return `linear-gradient(90deg, ${c0}, ${c1})`;
}

export function updateColorScales() {
  const hA   = Number(ui.ed.hueA.value);
  const hB   = Number(ui.ed.hueB.value);
  const sMin = Number(ui.ed.satMin.value);
  const sMax = Number(ui.ed.satMax.value);
  const vMin = Number(ui.ed.valMin.value);
  const vMax = Number(ui.ed.valMax.value);

  ui.scaleHue.style.background = gradientHue();

  const hMid = wrap360(hA + (((hB - hA + 360) % 360) / 2));
  ui.scaleSat.style.background = gradientSat(hMid);
  ui.scaleVal.style.background = gradientVal(hMid, clamp((sMin + sMax) / 2, 0, 100));

  ui.roHue.textContent = `${Math.round(hA)}° → ${Math.round(hB)}°`;
  ui.roSat.textContent = `${Math.round(sMin)} → ${Math.round(sMax)}`;
  ui.roVal.textContent = `${Math.round(vMin)} → ${Math.round(vMax)}`;
}

function updateSliderReadouts() {
  const e = ui.ed;
  if (ui.roMult)         ui.roMult.textContent         = `×${Number(e.mult.value).toFixed(2)}`;
  if (ui.roSpread)       ui.roSpread.textContent       = `${e.spreadA.value}° → ${e.spreadB.value}°`;
  if (ui.roSpeed)        ui.roSpeed.textContent        = `${e.speedMin.value} → ${e.speedMax.value}`;
  if (ui.roSize)         ui.roSize.textContent         = `${e.sizeMin.value} → ${e.sizeMax.value}`;
  if (ui.roSizeDecay)    ui.roSizeDecay.textContent    = `${e.sizeDecayMin.value} → ${e.sizeDecayMax.value}`;
  if (ui.roLife)         ui.roLife.textContent         = `${Number(e.lifeMin.value).toFixed(2)}s → ${Number(e.lifeMax.value).toFixed(2)}s`;
  if (ui.roDrag)         ui.roDrag.textContent         = `${e.dragMin.value} → ${e.dragMax.value}`;
  if (ui.roGravityScale) ui.roGravityScale.textContent = `${Number(e.gravityScale.value).toFixed(2)}`;
  if (ui.roJitter)       ui.roJitter.textContent       = e.jitter.value;
  if (ui.roFade)         ui.roFade.textContent         = Number(e.fade.value).toFixed(2);
  if (ui.roStrength)     ui.roStrength.textContent     = ui.strength.value;
  if (ui.roGravity)      ui.roGravity.textContent      = ui.gravity.value;
  if (ui.roBrushSpacing) ui.roBrushSpacing.textContent = ui.brushSpacing.value;
  if (ui.roMaxParticles) ui.roMaxParticles.textContent = Number(ui.maxParticles.value).toLocaleString();
}

// ── Editor sync ───────────────────────────────────────────────

export function applyPresetToEditor(preset) {
  ui.ed.name.value         = preset.name        ?? "";
  ui.ed.shape.value        = preset.shape       ?? "circle";
  ui.ed.hueAnim.checked    = Boolean(preset.hueAnim);
  ui.ed.hueA.value         = preset.hueA        ?? 0;
  ui.ed.hueB.value         = preset.hueB        ?? 360;
  ui.ed.satMin.value       = preset.satMin      ?? 70;
  ui.ed.satMax.value       = preset.satMax      ?? 100;
  ui.ed.valMin.value       = preset.valMin      ?? 70;
  ui.ed.valMax.value       = preset.valMax      ?? 100;
  ui.ed.mult.value         = preset.mult        ?? 0.6;
  ui.ed.spreadA.value      = preset.spreadA     ?? 0;
  ui.ed.spreadB.value      = preset.spreadB     ?? 360;
  ui.ed.speedMin.value     = preset.speedMin    ?? 50;
  ui.ed.speedMax.value     = preset.speedMax    ?? 200;
  ui.ed.sizeMin.value      = preset.sizeMin     ?? 2;
  ui.ed.sizeMax.value      = preset.sizeMax     ?? 6;
  ui.ed.sizeDecayMin.value = preset.sizeDecayMin ?? 2;
  ui.ed.sizeDecayMax.value = preset.sizeDecayMax ?? 8;
  ui.ed.lifeMin.value      = preset.lifeMin     ?? 0.4;
  ui.ed.lifeMax.value      = preset.lifeMax     ?? 1.0;
  ui.ed.dragMin.value      = preset.dragMin     ?? 0.1;
  ui.ed.dragMax.value      = preset.dragMax     ?? 2.0;
  ui.ed.gravityScale.value = preset.gravityScale ?? 1.0;
  ui.ed.jitter.value       = preset.jitter      ?? 10;
  ui.ed.fade.value         = preset.fade        ?? 1.0;

  updateColorScales();
  updateSliderReadouts();
}

export function readEditorToPreset() {
  const p = deepClone(currentPreset);

  p.name      = ui.ed.name.value.trim() || "Untitled";
  p.shape     = ui.ed.shape.value;
  p.hueAnim   = Boolean(ui.ed.hueAnim.checked);
  p.hueA      = Number(ui.ed.hueA.value);
  p.hueB      = Number(ui.ed.hueB.value);
  p.satMin    = Number(ui.ed.satMin.value);
  p.satMax    = Number(ui.ed.satMax.value);
  p.valMin    = Number(ui.ed.valMin.value);
  p.valMax    = Number(ui.ed.valMax.value);
  p.mult      = Number(ui.ed.mult.value);
  p.spreadA   = Number(ui.ed.spreadA.value);
  p.spreadB   = Number(ui.ed.spreadB.value);
  p.speedMin  = Number(ui.ed.speedMin.value);
  p.speedMax  = Number(ui.ed.speedMax.value);
  p.sizeMin   = Number(ui.ed.sizeMin.value);
  p.sizeMax   = Number(ui.ed.sizeMax.value);
  p.sizeDecayMin = Number(ui.ed.sizeDecayMin.value);
  p.sizeDecayMax = Number(ui.ed.sizeDecayMax.value);
  p.lifeMin   = Number(ui.ed.lifeMin.value);
  p.lifeMax   = Number(ui.ed.lifeMax.value);
  p.dragMin   = Number(ui.ed.dragMin.value);
  p.dragMax   = Number(ui.ed.dragMax.value);
  p.gravityScale = Number(ui.ed.gravityScale.value);
  p.jitter    = Number(ui.ed.jitter.value);
  p.fade      = Number(ui.ed.fade.value);

  [p.satMin,      p.satMax]      = safeMinMaxSwap(p.satMin,      p.satMax);
  [p.valMin,      p.valMax]      = safeMinMaxSwap(p.valMin,      p.valMax);
  [p.spreadA,     p.spreadB]     = safeMinMaxSwap(p.spreadA,     p.spreadB);
  [p.speedMin,    p.speedMax]    = safeMinMaxSwap(p.speedMin,    p.speedMax);
  [p.sizeMin,     p.sizeMax]     = safeMinMaxSwap(p.sizeMin,     p.sizeMax);
  [p.sizeDecayMin,p.sizeDecayMax]= safeMinMaxSwap(p.sizeDecayMin,p.sizeDecayMax);
  [p.lifeMin,     p.lifeMax]     = safeMinMaxSwap(p.lifeMin,     p.lifeMax);
  [p.dragMin,     p.dragMax]     = safeMinMaxSwap(p.dragMin,     p.dragMax);

  currentPreset = p;
  ui.presetName.textContent = currentPreset.name;

  updateColorScales();
  updateSliderReadouts();
}

// ── Preset list ───────────────────────────────────────────────

export function refreshPresetSelect() {
  const opts = listPresetsSorted(presetLibrary);
  ui.presetSelect.innerHTML = "";
  for (const p of opts) {
    const option = document.createElement("option");
    option.value       = p.id;
    option.textContent = p.name + (isBuiltIn(p.id) ? " ★" : "");
    ui.presetSelect.appendChild(option);
  }
  if (!presetLibrary[selectedPresetId]) {
    selectedPresetId = opts[0]?.id || "hit";
  }
  ui.presetSelect.value = selectedPresetId;
}

export function loadPreset(id) {
  const preset = presetLibrary[id];
  if (!preset) return;
  selectedPresetId = id;
  currentPreset    = deepClone(preset);
  applyPresetToEditor(currentPreset);
  readEditorToPreset();
  if (engine.clearOnLoad) {
    clearParticles();
    ui.count.textContent = "0";
  }
}

// ── Save / overwrite / delete ─────────────────────────────────

function saveNewPreset() {
  const name = (ui.saveName.value || currentPreset.name || "Untitled").trim();
  const id   = makeIdFromName(name);
  const p    = deepClone(currentPreset);
  p.id       = id;
  p.name     = name;
  presetLibrary[id] = p;
  saveLibrary(presetLibrary);
  selectedPresetId = id;
  refreshPresetSelect();
  ui.presetSelect.value = id;
  ui.saveName.value = "";
}

function overwriteSelectedPreset() {
  const id = ui.presetSelect.value;
  if (!id || !presetLibrary[id]) return;
  const p  = deepClone(currentPreset);
  p.id     = id;
  p.name   = currentPreset.name || presetLibrary[id].name || "Untitled";
  presetLibrary[id] = p;
  saveLibrary(presetLibrary);
  refreshPresetSelect();
  ui.presetSelect.value = id;
}

function deleteSelectedPreset() {
  const id = ui.presetSelect.value;
  if (!id || !presetLibrary[id]) return;
  if (isBuiltIn(id)) {
    alert("Built-in presets can't be deleted. Overwrite to customise.");
    return;
  }
  delete presetLibrary[id];
  saveLibrary(presetLibrary);
  const fallback = listPresetsSorted(presetLibrary)[0]?.id || "hit";
  selectedPresetId = fallback;
  refreshPresetSelect();
  loadPreset(selectedPresetId);
}

// ── Export / Import ───────────────────────────────────────────

async function exportJSON() {
  const json = JSON.stringify(presetLibrary, null, 2);
  try {
    await navigator.clipboard.writeText(json);
    alert("Library copied to clipboard ✅");
  } catch {
    prompt("Copy this JSON:", json);
  }
}

async function importJSON() {
  let text = "";
  try {
    text = await navigator.clipboard.readText();
  } catch {
    text = prompt("Paste your JSON here:") || "";
  }
  if (!text.trim()) return;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") throw new Error();
    presetLibrary = { ...presetLibrary, ...parsed };
    saveLibrary(presetLibrary);
    refreshPresetSelect();
    loadPreset(ui.presetSelect.value);
    alert("Imported ✅");
  } catch {
    alert("Import failed — invalid JSON.");
  }
}

// ── Engine sync (called each frame) ───────────────────────────

export function syncEngineFromUI() {
  engine.gravity      = Number(ui.gravity.value);
  engine.strength     = Number(ui.strength.value);
  engine.brushSpacing = Number(ui.brushSpacing.value);
  engine.brushOnDrag  = ui.brushMode.value === "on";
  engine.blendMode    = ui.blendMode.value;
  engine.maxParticles = Number(ui.maxParticles.value);
}

// ── Wire everything ───────────────────────────────────────────

export function wireUI(onLoadPreset) {
  // Editor live-update
  Object.values(ui.ed).forEach((el) => {
    const evt = el.type === "checkbox" ? "change" : "input";
    el.addEventListener(evt,   () => readEditorToPreset());
    el.addEventListener("change", () => readEditorToPreset());
  });

  // Engine sliders → readouts
  [ui.strength, ui.gravity, ui.brushSpacing, ui.maxParticles].forEach((el) => {
    el.addEventListener("input", updateSliderReadouts);
  });

  ui.btnClearParticles.addEventListener("click", () => {
    clearParticles();
    ui.count.textContent = "0";
  });

  ui.btnLoadPreset.addEventListener("click", () => {
    const id = ui.presetSelect.value;
    if (id) onLoadPreset(id);
  });

  ui.presetSelect.addEventListener("change", () => {
    selectedPresetId = ui.presetSelect.value;
  });

  ui.btnSaveNew.addEventListener("click",       saveNewPreset);
  ui.btnOverwrite.addEventListener("click",     overwriteSelectedPreset);
  ui.btnDelete.addEventListener("click",        deleteSelectedPreset);
  ui.btnExportJSON.addEventListener("click",    exportJSON);
  ui.btnImportJSON.addEventListener("click",    importJSON);

  ui.btnResetDefaults.addEventListener("click", () => {
    if (!confirm("Reset all presets to defaults? Your saved presets will be overwritten.")) return;
    presetLibrary = buildDefaultPresets();
    saveLibrary(presetLibrary);
    selectedPresetId = "hit";
    refreshPresetSelect();
    onLoadPreset("hit");
  });

  ui.btnRandomize.addEventListener("click", () => {
    ui.ed.jitter.value   = clamp(Number(ui.ed.jitter.value)   + rand(-15, 25),  0,   120);
    ui.ed.fade.value     = clamp(Number(ui.ed.fade.value)     + rand(-0.3, 0.5),0.05, 3.0);
    ui.ed.speedMax.value = clamp(Number(ui.ed.speedMax.value) + rand(-80, 120), 0,   900);
    ui.ed.mult.value     = clamp(Number(ui.ed.mult.value)     + rand(-0.2, 0.3),0.05, 2.0);
    ui.ed.hueA.value     = wrap360(Number(ui.ed.hueA.value) + rand(-20, 20));
    ui.ed.hueB.value     = wrap360(Number(ui.ed.hueB.value) + rand(-20, 20));
    ui.ed.sizeMax.value  = clamp(Number(ui.ed.sizeMax.value) + rand(-4, 8), 0.5, 60);
    ui.ed.lifeMax.value  = clamp(Number(ui.ed.lifeMax.value) + rand(-0.3, 0.5), 0.05, 6);
    readEditorToPreset();
  });

  ui.btnRevertSelected.addEventListener("click", () => {
    onLoadPreset(ui.presetSelect.value);
  });

  ui.pause.addEventListener("click", () => {
    engine.paused = !engine.paused;
    ui.pause.innerHTML = engine.paused
      ? "▶ Resume <small>Toggle simulation</small>"
      : "⏸ Pause <small>Toggle simulation</small>";
  });

  ui.toggleClearOnLoad.addEventListener("click", () => {
    engine.clearOnLoad = !engine.clearOnLoad;
    ui.clearOnLoadState.textContent = engine.clearOnLoad ? "ON" : "OFF";
  });

  // Keyboard
  window.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return; // don't fire while typing
    if (e.code === "Space") {
      e.preventDefault();
      engine.paused = !engine.paused;
      ui.pause.innerHTML = engine.paused
        ? "▶ Resume <small>Toggle simulation</small>"
        : "⏸ Pause <small>Toggle simulation</small>";
    }
    if (e.key.toLowerCase() === "c") { clearParticles(); ui.count.textContent = "0"; }
    if (e.key === "1") onLoadPreset("hit");
    if (e.key === "2") onLoadPreset("heal");
    if (e.key === "3") onLoadPreset("shimmer");
    if (e.key === "4") onLoadPreset("smoke");
    if (e.key === "5") onLoadPreset("confetti");
  });

  // Accordion: open on desktop, collapsed on mobile
  function setAccordionDefaults() {
    const isMobile = window.matchMedia("(max-width: 900px)").matches;
    document.querySelectorAll(".accordion").forEach((d) => {
      if (isMobile) d.removeAttribute("open");
      else d.setAttribute("open", "");
    });
  }
  window.addEventListener("resize", setAccordionDefaults);
  setAccordionDefaults();
}

// ── Particle count HUD ────────────────────────────────────────

export function updateHUD() {
  ui.count.textContent = String(particles.length);
}
