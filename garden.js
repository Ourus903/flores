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

/** Zonas seguras: evitan el centro, donde el núcleo galáctico debe respirar. */
const ZONES = [
  [4, 26, 8, 34],
  [72, 94, 8, 34],
  [4, 24, 62, 90],
  [74, 95, 60, 90],
  [34, 66, 4, 18],
  [32, 68, 80, 94],
];

const BOUQUET_SPOTS = [
  { x: 13, y: 22, count: 6, spread: 62 },
  { x: 82, y: 26, count: 5, spread: 54 },
  { x: 19, y: 76, count: 6, spread: 64 },
  { x: 86, y: 72, count: 5, spread: 52 },
  { x: 50, y: 52, count: 3, spread: 40 },
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

    BOUQUET_SPOTS.slice(0, bouquets).forEach((spot) => {
      this.#addBouquet(spot, rng, scale);
    });

    for (let i = 0; i < scattered; i++) {
      const zone = ZONES[i % ZONES.length];
      const flower = createFlower(rng.pick(SPECIES), {
        seed: rng.int(1, 1e9),
        size: rng.range(34, 60) * scale,
        hueShift: rng.range(-12, 10),
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
      const distance = spot.spread * rng.range(0.35, 1) * scale;
      const flower = createFlower(rng.pick(SPECIES), {
        seed: rng.int(1, 1e9),
        size: rng.range(40, 68) * scale,
        hueShift: rng.range(-14, 12),
      });
      flower.style.left = `${Math.cos(angle) * distance}px`;
      flower.style.top = `${Math.sin(angle) * distance}px`;
      bouquet.appendChild(flower);
    }

    this.#place(bouquet, rng);
  }

  /** Coloca el elemento en una capa; las flores grandes van al frente. */
  #place(node, rng) {
    const index = rng.chance(0.4) ? 2 : rng.chance(0.5) ? 1 : 0;
    const depth = Number(this.layers[index].dataset.depth);
    node.style.setProperty('--depth', depth);
    this.layers[index].appendChild(node);
  }
}
