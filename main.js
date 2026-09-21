/**
 * Punto de entrada: arma la escena y corre un único bucle de animación.
 *
 * Un solo requestAnimationFrame coordina galaxia, parallax y cometas, con dt
 * real: la escena avanza igual en una pantalla de 60 Hz que en una de 120 Hz.
 */

import { DEFAULTS } from './config.js';
import { Chimes } from './audio.js';
import { Effects } from './effects.js';
import { Garden } from './garden.js';
import { Starfield } from './starfield.js';
import { Controls } from './ui.js';
import { installFlowerDefs } from './flowers.js';
import {
  clamp,
  prefersReducedMotion,
  randomSeedLabel,
  readUrlState,
  seedFromString,
  writeUrlState,
} from './utils.js';

const scene = document.getElementById('scene');
const canvas = document.getElementById('sky');
const glow = document.getElementById('glow');

const saved = readUrlState();
const state = {
  ...DEFAULTS,
  seedLabel: saved.seed || randomSeedLabel(),
  density: clamp(saved.density ?? DEFAULTS.density, 0.4, 1.6),
  motion: !prefersReducedMotion(),
};

installFlowerDefs();

const starfield = new Starfield(canvas);
const garden = new Garden(scene);
const chimes = new Chimes();
const effects = new Effects({
  root: scene,
  glow,
  layers: garden.layers,
  onBloom: (species) => chimes.play(species),
});

const controls = new Controls({
  onDensity: (value) => {
    state.density = value;
    rebuild();
  },
  onBloom: (value) => {
    state.bloom = value;
    starfield.bloom = value;
    document.documentElement.style.setProperty('--bloom', value);
  },
  onMotion: (value) => {
    state.motion = value;
    applyMotion();
  },
  onAudio: (value) => {
    state.audio = value;
    chimes.setEnabled(value);
    controls.say(value ? 'Sonido activado' : 'Sonido en silencio');
  },
  onReseed: () => {
    state.seedLabel = randomSeedLabel();
    rebuild();
    controls.say(`Nueva galaxia: ${state.seedLabel}`);
  },
  onComet: () => starfield.spawnComet(),
  onShare: async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      controls.say('Enlace copiado con esta semilla');
    } catch {
      controls.say(`Semilla ${state.seedLabel} — copia la URL de la barra`);
    }
  },
});

function rebuild() {
  const seed = seedFromString(state.seedLabel);
  starfield.generate(seed, state.density);
  garden.build(seed, state.density);
  starfield.bloom = state.bloom;
  applyMotion();
  writeUrlState({ seed: state.seedLabel, density: state.density });
  controls.sync({ ...state, seed: state.seedLabel });
  controls.setStars(starfield.stars.length);
}

function applyMotion() {
  starfield.motion = state.motion;
  effects.motion = state.motion;
  document.documentElement.classList.toggle('no-motion', !state.motion);
}

/* ---------- ciclo principal ---------- */

let last = performance.now();
let elapsed = 0;
let nextComet = 4;
let fpsAvg = 60;
let degraded = false;
let running = true;

function frame(now) {
  requestAnimationFrame(frame);
  if (!running) {
    last = now;
    return;
  }

  // Un dt máximo de 50 ms evita saltos al volver de una pestaña en segundo plano.
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  elapsed += dt;

  if (dt > 0) fpsAvg = fpsAvg * 0.94 + (1 / dt) * 0.06;

  if (state.motion) {
    nextComet -= dt;
    if (nextComet <= 0) {
      starfield.spawnComet();
      nextComet = 5 + Math.random() * 9;
    }
  }

  effects.update(dt, elapsed);
  starfield.setPointer(effects.current.x, effects.current.y);
  starfield.update(dt);
  starfield.render();

  guardPerformance();
}

/** Si el equipo no da abasto, baja la densidad una sola vez. */
function guardPerformance() {
  if (degraded || elapsed < 4 || fpsAvg > 42 || state.density <= 0.5) return;
  degraded = true;
  state.density = Math.max(0.5, state.density - 0.35);
  rebuild();
  controls.say('Densidad ajustada para mantener la fluidez');
}

/* ---------- eventos del documento ---------- */

let resizeTimer;
window.addEventListener('resize', () => {
  starfield.resize();
  clearTimeout(resizeTimer);
  // El jardín solo se recompone cuando el cambio de tamaño se estabiliza.
  resizeTimer = setTimeout(() => garden.build(seedFromString(state.seedLabel), state.density), 260);
});

document.addEventListener('visibilitychange', () => {
  running = !document.hidden;
});

window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
  controls.setMotion(!e.matches, true);
});

rebuild();
document.body.classList.add('is-ready');
requestAnimationFrame(frame);
