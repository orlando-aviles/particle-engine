// ============================================================
// presets.js — Default presets + localStorage library
// ============================================================

export const STORAGE_KEY = "dojo_particle_presets_v2_hue";

export function buildDefaultPresets() {
  return {
    hit: {
      id: "hit", name: "Hit Sparks", shape: "circle",
      hueA: 35,  hueB: 55,  satMin: 70, satMax: 100, valMin: 70, valMax: 100, hueAnim: false,
      mult: 0.8, spreadA: 0, spreadB: 360,
      speedMin: 140, speedMax: 520, sizeMin: 2, sizeMax: 5,
      sizeDecayMin: 7, sizeDecayMax: 14, lifeMin: 0.25, lifeMax: 0.6,
      dragMin: 1.0, dragMax: 3.0, gravityScale: 1.0, jitter: 25, fade: 1.1,
    },
    heal: {
      id: "heal", name: "Heal Glow", shape: "plus",
      hueA: 155, hueB: 190, satMin: 45, satMax: 90, valMin: 75, valMax: 100, hueAnim: true,
      mult: 0.5, spreadA: -135, spreadB: -45,
      speedMin: 40, speedMax: 170, sizeMin: 4, sizeMax: 10,
      sizeDecayMin: 3, sizeDecayMax: 6, lifeMin: 0.6, lifeMax: 1.2,
      dragMin: 0.2, dragMax: 1.3, gravityScale: -0.15, jitter: 10, fade: 0.8,
    },
    shimmer: {
      id: "shimmer", name: "UI Shimmer", shape: "star",
      hueA: 200, hueB: 260, satMin: 0, satMax: 12, valMin: 88, valMax: 100, hueAnim: false,
      mult: 0.45, spreadA: 0, spreadB: 360,
      speedMin: 10, speedMax: 85, sizeMin: 1, sizeMax: 3,
      sizeDecayMin: 1, sizeDecayMax: 4, lifeMin: 0.7, lifeMax: 1.6,
      dragMin: 0.2, dragMax: 1.0, gravityScale: 0.05, jitter: 6, fade: 0.55,
    },
    smoke: {
      id: "smoke", name: "Smoke", shape: "circle",
      hueA: 0, hueB: 360, satMin: 0, satMax: 8, valMin: 30, valMax: 65, hueAnim: false,
      mult: 0.30, spreadA: -180, spreadB: 0,
      speedMin: 10, speedMax: 70, sizeMin: 10, sizeMax: 24,
      sizeDecayMin: 0.5, sizeDecayMax: 2.2, lifeMin: 1.2, lifeMax: 2.6,
      dragMin: 0.0, dragMax: 0.9, gravityScale: -0.08, jitter: 5, fade: 0.35,
    },
    confetti: {
      id: "confetti", name: "Confetti", shape: "square",
      hueA: 0, hueB: 360, satMin: 70, satMax: 100, valMin: 75, valMax: 100, hueAnim: false,
      mult: 0.85, spreadA: 0, spreadB: 360,
      speedMin: 150, speedMax: 540, sizeMin: 2, sizeMax: 6,
      sizeDecayMin: 2, sizeDecayMax: 8, lifeMin: 0.45, lifeMax: 1.15,
      dragMin: 0.8, dragMax: 2.4, gravityScale: 0.9, jitter: 45, fade: 0.7,
    },
  };
}

export function isBuiltIn(id) {
  return Boolean(buildDefaultPresets()[id]);
}

export function makeIdFromName(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) + "-" + Math.floor(Math.random() * 9999);
}

// ── Storage ──────────────────────────────────────────────────

export function loadLibrary() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const lib = buildDefaultPresets();
    saveLibrary(lib);
    return lib;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error();
    return parsed;
  } catch {
    const lib = buildDefaultPresets();
    saveLibrary(lib);
    return lib;
  }
}

export function saveLibrary(lib) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lib));
}

export function listPresetsSorted(lib) {
  return Object.values(lib).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}
