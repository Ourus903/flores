/**
 * Distribución de las flores sobre el cielo.
 *
 * Las flores se reparten en tres capas de profundidad. Cada capa se mueve a
 * distinta velocidad con el puntero, así que el jardín tiene volumen en vez de
 * ser una calcomanía plana sobre la galaxia.
 */

import { COUNTS, SPECIES } from './config.js';
import { createFlower } from './flowers.js';
import { makeRng, TAU } from './utils.js';

/** Zonas que cubren toda la pantalla para distribución completa */
const ZONES = [
  [0, 25, 0, 30],
  [75, 100, 0, 30],
  [0, 25, 70, 100],
  [75, 100, 70, 100],
  [0, 20, 30, 70],
  [80, 100, 30, 70],
  [30, 70, 0, 25],
  [30, 70, 75, 100],
  [20, 40, 35, 65],
  [60, 80, 35, 65],
  [35, 65, 20, 40],
  [35, 65, 60, 80],
  [25, 45, 45, 55],
  [55, 75, 45, 55],
  [40, 60, 30, 50],
  [40, 60, 50, 70],
];

const BOUQUET_SPOTS = [
  { x: 8, y: 12, count: 4, spread: 75 },
  { x: 92, y: 15, count: 4, spread: 70 },
  { x: 12, y: 88, count: 4, spread: 78 },
  { x: 90, y: 85, count: 4, spread: 68 },
  { x: 50, y: 50, count: 3, spread: 55 },
  { x: 25, y: 35, count: 4, spread: 65 },
  { x: 75, y: 35, count: 4, spread: 62 },
  { x: 25, y: 65, count: 4, spread: 68 },
  { x: 75, y: 65, count: 4, spread: 65 },
  { x: 50, y: 20, count: 3, spread: 58 },
  { x: 50, y: 80, count: 3, spread: 58 },
  { x: 15, y: 50, count: 4, spread: 70 },
  { x: 85, y: 50, count: 4, spread: 68 },
  { x: 50, y: 35, count: 3, spread: 52 },
  { x: 50, y: 65, count: 3, spread: 52 },
];

export class Garden {
  constructor(root) {
    this.root = root;
    this.layers = [0.3, 0.62, 1].map((depth) => {
      const layer = document.createElement('div');
      layer.className = 'layer';
      layer.dataset.depth = depth;
      root.appendChild(layer);
      return layer;
    });
  }

  /** Reconstruye el jardín completo. */
  build(seed, density = 1) {
    const rng = makeRng(seed ^ 0x9e3779b9);
    this.layers.forEach((l) => l.replaceChildren());

    const compact = window.innerWidth < 720;
    const scale = compact ? 0.62 : 1;
    const bouquets = Math.max(2, Math.round(COUNTS.bouquets * (compact ? 0.6 : density)));
    const scattered = Math.max(3, Math.round(COUNTS.scattered * density * (compact ? 0.5 : 1)));

    // Mezclar los bouquet spots para mejor distribución
    const shuffledSpots = [...BOUQUET_SPOTS].sort(() => rng.chance(0.5) ? 1 : -1);
    shuffledSpots.slice(0, bouquets).forEach((spot) => {
      this.#addBouquet(spot, rng, scale);
    });

    // Usar todas las zonas cíclicamente para cubrir toda la pantalla
    for (let i = 0; i < scattered; i++) {
      const zone = ZONES[i % ZONES.length];
      const flower = createFlower(rng.pick(SPECIES), {
        seed: rng.int(1, 1e9),
        size: rng.range(25, 55) * scale,
        hueShift: rng.range(-15, 12),
      });
      flower.style.left = `${rng.range(zone[0], zone[1])}%`;
      flower.style.top = `${rng.range(zone[2], zone[3])}%`;
      this.#place(flower, rng);
    }
  }

  #addBouquet(spot, rng, scale) {
    const bouquet = document.createElement('div');
    bouquet.className = 'bouquet';
    bouquet.style.left = `${spot.x}%`;
    bouquet.style.top = `${spot.y}%`;
    bouquet.style.setProperty('--sway-duration', `${rng.range(9, 15).toFixed(1)}s`);
    bouquet.style.setProperty('--sway-delay', `${rng.range(-8, 0).toFixed(1)}s`);

    for (let i = 0; i < spot.count; i++) {
      const angle = (i / spot.count) * TAU + rng.range(-0.3, 0.3);
      const distance = spot.spread * rng.range(0.45, 1.15) * scale;
      const flower = createFlower(rng.pick(SPECIES), {
        seed: rng.int(1, 1e9),
        size: rng.range(32, 65) * scale,
        hueShift: rng.range(-15, 14),
      });
      flower.style.left = `${Math.cos(angle) * distance}px`;
      flower.style.top = `${Math.sin(angle) * distance}px`;
      bouquet.appendChild(flower);
    }

    this.#place(bouquet, rng);
  }

  /** Coloca el elemento en una capa; las flores grandes van al frente. */
  #place(node, rng) {
    // Mejor distribución: más flores en capas delanteras para mejor visibilidad
    const index = rng.chance(0.5) ? 2 : rng.chance(0.35) ? 1 : 0;
    const depth = Number(this.layers[index].dataset.depth);
    node.style.setProperty('--depth', depth);
    this.layers[index].appendChild(node);
  }
}
