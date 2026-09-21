/**
 * Flores en SVG.
 *
 * El original apilaba entre 12 y 45 <div> por flor (cada pétalo un div con
 * gradiente y box-shadow). Aquí cada flor es un solo <svg> con geometría
 * vectorial: se ve nítida en cualquier escala, pesa menos y el glow se resuelve
 * con un único drop-shadow en CSS en vez de dos sombras por pétalo.
 *
 * Los degradados viven en un <defs> global compartido por todas las flores.
 */

import { NAMES } from './config.js';
import { makeRng, TAU } from './utils.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const GRADIENTS = [
  { id: 'gp-daisy', type: 'linear', stops: ['#fffde3', '#ffd83d', '#ffab2e'] },
  { id: 'gc-daisy', type: 'radial', stops: ['#ffcb45', '#ff8f1f', '#ef5b18'] },
  { id: 'gp-sunflower', type: 'linear', stops: ['#ffe680', '#ffc21f', '#ef7d15'] },
  { id: 'gc-sunflower', type: 'radial', stops: ['#7a5a3a', '#4a3020', '#2a1a12'] },
  { id: 'gp-tulip', type: 'linear', stops: ['#fff6a8', '#ffd93b', '#f5a623'] },
  { id: 'gc-tulip', type: 'radial', stops: ['#ffb42e', '#f2701c', '#d94a14'] },
  { id: 'gp-rose', type: 'radial', stops: ['#fff8cf', '#ffd034', '#f08a1c'] },
  { id: 'gc-rose', type: 'radial', stops: ['#ffe071', '#ffa626', '#e8721a'] },
  { id: 'gp-lily', type: 'linear', stops: ['#fffbd0', '#ffe94f', '#f8c01e'] },
  { id: 'gc-lily', type: 'radial', stops: ['#ffb02e', '#f4701d', '#c9440f'] },
];

/** Inyecta una sola vez los degradados reutilizados por todas las flores. */
export function installFlowerDefs(host = document.body) {
  if (document.getElementById('flower-defs')) return;

  const svg = el('svg', { id: 'flower-defs', 'aria-hidden': 'true', focusable: 'false' });
  svg.classList.add('sr-defs');
  const defs = el('defs');

  for (const g of GRADIENTS) {
    const node =
      g.type === 'linear'
        ? el('linearGradient', { id: g.id, x1: '0', y1: '0', x2: '0', y2: '1' })
        : el('radialGradient', { id: g.id, cx: '0.4', cy: '0.35', r: '0.75' });

    g.stops.forEach((color, i) => {
      node.appendChild(
        el('stop', { offset: i / (g.stops.length - 1), 'stop-color': color }),
      );
    });
    defs.appendChild(node);
  }

  svg.appendChild(defs);
  host.appendChild(svg);
}

/**
 * Crea una flor.
 * @param {string} species  daisy | sunflower | tulip | rose | lily
 * @param {object} options  { seed, size, hueShift }
 */
export function createFlower(species, { seed = 1, size = 56, hueShift = 0 } = {}) {
  const rng = makeRng(seed);
  const svg = el('svg', {
    viewBox: '0 0 100 100',
    role: 'button',
    tabindex: '0',
    'aria-label': `${NAMES[species] ?? 'Flor'} dorada`,
  });
  svg.classList.add('flower', `flower--${species}`);
  svg.style.setProperty('--size', `${size}px`);
  svg.style.setProperty('--hue-shift', `${hueShift}deg`);
  svg.style.setProperty('--float-duration', `${rng.range(6, 12).toFixed(2)}s`);
  svg.style.setProperty('--float-delay', `${rng.range(-6, 0).toFixed(2)}s`);
  svg.style.setProperty('--spin', `${rng.range(-6, 6).toFixed(1)}deg`);
  svg.dataset.species = species;

  BUILDERS[species](svg, rng);
  return svg;
}

const BUILDERS = { daisy, sunflower, tulip, rose, lily };

function daisy(svg, rng) {
  const petals = 13;
  const group = el('g', { class: 'petals' });

  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * 360;
    group.appendChild(
      el('ellipse', {
        cx: 50,
        cy: 26 + rng.range(-1.5, 1.5),
        rx: 7.5,
        ry: 19,
        fill: 'url(#gp-daisy)',
        transform: `rotate(${angle + rng.range(-3, 3)} 50 50)`,
      }),
    );
  }

  svg.append(group, el('circle', { cx: 50, cy: 50, r: 11, fill: 'url(#gc-daisy)' }));
  svg.appendChild(el('circle', { cx: 46, cy: 46, r: 3.4, fill: 'rgba(255,250,214,.65)' }));
}

function sunflower(svg, rng) {
  const group = el('g', { class: 'petals' });

  // Dos coronas de pétalos desfasadas dan volumen sin duplicar el conteo.
  [
    { count: 22, cy: 18, rx: 5.2, ry: 20, offset: 0 },
    { count: 18, cy: 27, rx: 4.6, ry: 15, offset: 9 },
  ].forEach((ring) => {
    for (let i = 0; i < ring.count; i++) {
      const angle = (i / ring.count) * 360 + ring.offset;
      group.appendChild(
        el('ellipse', {
          cx: 50,
          cy: ring.cy,
          rx: ring.rx,
          ry: ring.ry,
          fill: 'url(#gp-sunflower)',
          opacity: ring.offset ? 0.92 : 1,
          transform: `rotate(${angle + rng.range(-2, 2)} 50 50)`,
        }),
      );
    }
  });

  svg.append(group, el('circle', { cx: 50, cy: 50, r: 17, fill: 'url(#gc-sunflower)' }));

  // Semillas en espiral de Fermat (el patrón real de un capítulo floral).
  const seeds = el('g', { opacity: 0.55 });
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < 90; i++) {
    const r = 16 * Math.sqrt(i / 90);
    const a = i * golden;
    seeds.appendChild(
      el('circle', {
        cx: 50 + Math.cos(a) * r,
        cy: 50 + Math.sin(a) * r,
        r: 0.85,
        fill: '#1f1208',
      }),
    );
  }
  svg.appendChild(seeds);
}

function tulip(svg, rng) {
  const group = el('g', { class: 'petals' });
  const cup = 'M50 92 C 32 74, 28 38, 50 14 C 72 38, 68 74, 50 92 Z';

  // Pétalos abiertos en abanico desde la base de la copa.
  [-34, -17, 0, 17, 34].forEach((angle, i) => {
    group.appendChild(
      el('path', {
        d: cup,
        fill: 'url(#gp-tulip)',
        opacity: i === 2 ? 1 : 0.88,
        transform: `rotate(${angle + rng.range(-2, 2)} 50 86)`,
      }),
    );
  });

  svg.append(group, el('ellipse', { cx: 50, cy: 52, rx: 6, ry: 12, fill: 'url(#gc-tulip)' }));
}

function rose(svg, rng) {
  const group = el('g', { class: 'petals' });

  // Capas concéntricas rotadas: imita la espiral de una rosa abierta.
  for (let layer = 3; layer >= 0; layer--) {
    const count = 5 + layer * 2;
    const radius = 7 + layer * 8.5;
    const petal = 10 + layer * 3.5;

    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + layer * 0.4;
      group.appendChild(
        el('ellipse', {
          cx: 50 + Math.cos(a) * radius,
          cy: 50 + Math.sin(a) * radius,
          rx: petal,
          ry: petal * 0.86,
          fill: 'url(#gp-rose)',
          opacity: 0.72 + layer * 0.07,
          transform: `rotate(${(a * 180) / Math.PI + rng.range(-8, 8)} 50 50)`,
        }),
      );
    }
  }

  svg.append(group, el('circle', { cx: 50, cy: 50, r: 7, fill: 'url(#gc-rose)' }));
}

function lily(svg, rng) {
  const group = el('g', { class: 'petals' });
  const blade = 'M50 88 C 38 64, 34 30, 50 8 C 66 30, 62 64, 50 88 Z';

  for (let i = 0; i < 6; i++) {
    group.appendChild(
      el('path', {
        d: blade,
        fill: 'url(#gp-lily)',
        opacity: i % 2 ? 0.88 : 1,
        transform: `rotate(${i * 60 + rng.range(-3, 3)} 50 50)`,
      }),
    );
  }
  svg.appendChild(group);

  // Estambres: la firma visual del lirio.
  const stamens = el('g');
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.28;
    const x = 50 + Math.cos(a) * 20;
    const y = 50 + Math.sin(a) * 20;
    stamens.appendChild(
      el('path', {
        d: `M50 50 Q ${50 + (x - 50) * 0.5} ${y + 6} ${x} ${y}`,
        stroke: 'rgba(255, 236, 160, .75)',
        'stroke-width': 1.4,
        fill: 'none',
      }),
    );
    stamens.appendChild(el('circle', { cx: x, cy: y, r: 2.4, fill: 'url(#gc-lily)' }));
  }

  svg.append(stamens, el('circle', { cx: 50, cy: 50, r: 4.5, fill: 'url(#gc-lily)' }));
}

/** Crea un elemento SVG con atributos. */
function el(name, attrs = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, value);
  }
  return node;
}
