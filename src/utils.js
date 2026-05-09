// ============================================================
// utils.js — Math & color helpers
// ============================================================

export function rand(min, max) {
  return Math.random() * (max - min) + min;
}

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function degToRad(d) {
  return (d * Math.PI) / 180;
}

export function safeMinMaxSwap(minVal, maxVal) {
  if (minVal > maxVal) return [maxVal, minVal];
  return [minVal, maxVal];
}

export function wrap360(h) {
  h = h % 360;
  if (h < 0) h += 360;
  return h;
}

// Pick a random hue along the shortest arc between A and B (wrap-aware)
export function randHue(hA, hB) {
  hA = wrap360(hA);
  hB = wrap360(hB);
  let delta = (hB - hA + 360) % 360;
  if (delta > 180) delta -= 360;
  return wrap360(hA + delta * Math.random());
}

// Interpolate hue along the shortest arc (wrap-aware)
export function lerpHue(h0, h1, t) {
  h0 = wrap360(h0);
  h1 = wrap360(h1);
  let delta = (h1 - h0 + 360) % 360;
  if (delta > 180) delta -= 360;
  return wrap360(h0 + delta * t);
}

// HSV → RGB  (h: 0–360, s/v: 0–100)
export function hsvToRgb(h, s, v) {
  s /= 100;
  v /= 100;
  const c  = v * s;
  const hh = wrap360(h) / 60;
  const x  = c * (1 - Math.abs((hh % 2) - 1));
  const m  = v - c;
  let r = 0, g = 0, b = 0;
  if      (hh < 1) [r, g, b] = [c, x, 0];
  else if (hh < 2) [r, g, b] = [x, c, 0];
  else if (hh < 3) [r, g, b] = [0, c, x];
  else if (hh < 4) [r, g, b] = [0, x, c];
  else if (hh < 5) [r, g, b] = [x, 0, c];
  else             [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function rgbToCss({ r, g, b }) {
  return `rgb(${r},${g},${b})`;
}

export function cssFromHSV(hsv) {
  return rgbToCss(hsvToRgb(hsv.h, hsv.s, hsv.v));
}
