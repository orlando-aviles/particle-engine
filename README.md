# Particle Engine

A browser-based 2D particle system with a real-time preset editor.

**Version:** 0.3 (Hue Range Edition)

## Features

- Click or drag on the canvas to emit particles
- Full preset editor: shape, hue range, saturation, value, speed, size, decay, life, drag, gravity, jitter, fade
- Hue animation: blend birth hue → death hue over particle lifetime
- Preset library with localStorage persistence (save, load, overwrite, delete, export/import JSON)
- 5 built-in presets: Hit Sparks, Heal Glow, Shimmer, Smoke, Confetti
- Blend modes: normal, lighter (glow), screen
- Keyboard shortcuts: `Space` pause · `C` clear · `1–5` load defaults

## Getting Started

Just open `index.html` in a browser — no build step, no dependencies.

```bash
# Optional: serve locally (avoids some browser restrictions)
npx serve .
# or
python3 -m http.server
```

## Project Structure

```
particle-engine/
├── index.html      # Full app (single-file, self-contained)
├── README.md
└── src/            # Future: split-out modules
```

## Roadmap / Ideas

- [ ] Split JS into modules (`engine.js`, `presets.js`, `ui.js`, `renderer.js`)
- [ ] Emitter types: point, line, area, radial
- [ ] Trail / ribbon particles
- [ ] Attractor / repulsor forces
- [ ] Export canvas as GIF or WebM
- [ ] URL-shareable preset encoding
- [ ] Touch haptics on mobile
