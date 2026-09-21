/**
 * Utilidades compartidas.
 * Todo el azar de la escena pasa por un PRNG con semilla, para que una misma
 * semilla produzca siempre la misma galaxia (y se pueda compartir por URL).
 */

/** Generador pseudoaleatorio determinista (mulberry32). */
export function makeRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    /** Flotante en [min, max). */
    range: (min, max) => min + next() * (max - min),
    /** Entero en [min, max]. */
    int: (min, max) => Math.floor(min + next() * (max - min + 1)),
    /** Elemento al azar de un arreglo. */
    pick: (list) => list[Math.floor(next() * list.length)],
    /** true con probabilidad p. */
    chance: (p) => next() < p,
    /** Ruido con tendencia al centro (suma de 3 muestras). */
    bell: (min, max) => {
      const t = (next() + next() + next()) / 3;
      return min + t * (max - min);
    },
    raw: next,
  };
}

/** Convierte texto a semilla numérica (hash FNV-1a). */
export function seedFromString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Semilla legible de 6 caracteres, tipo "k3f9qa". */
export function randomSeedLabel() {
  return Math.random().toString(36).slice(2, 8);
}

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const TAU = Math.PI * 2;

/** ¿El sistema pide reducir animaciones? */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Lee la configuración inicial del hash de la URL: #seed=abc&density=1.2 */
export function readUrlState() {
  const params = new URLSearchParams(location.hash.slice(1));
  return {
    seed: params.get('seed') || null,
    density: params.has('density') ? Number(params.get('density')) : null,
  };
}

/** Escribe el estado en la URL sin recargar ni ensuciar el historial. */
export function writeUrlState({ seed, density }) {
  const params = new URLSearchParams();
  params.set('seed', seed);
  params.set('density', density.toFixed(2));
  history.replaceState(null, '', `#${params}`);
}
