/**
 * Capa de interacción: parallax, luz que sigue al puntero y estallido de
 * pétalos al activar una flor.
 *
 * Detalles que el original no tenía:
 *  - El seguimiento del puntero se suaviza con interpolación y se aplica con
 *    `transform` (compositor) en vez de `left/top` (layout en cada fotograma).
 *  - Sin puntero (móvil o inactividad) la escena deriva sola.
 *  - Las flores responden a teclado: Tab para enfocar, Enter o Espacio para abrir.
 */

import { lerp, clamp, TAU } from './utils.js';

const PETAL_COLORS = ['#ffe259', '#ffc32b', '#ff9a1f', '#fff3b0'];

export class Effects {
  constructor({ root, glow, layers, onBloom }) {
    this.root = root;
    this.glow = glow;
    this.layers = layers;
    this.onBloom = onBloom || (() => {});

    this.target = { x: 0, y: 0 };
    this.current = { x: 0, y: 0 };
    this.pointerActive = false;
    this.motion = true;

    this.#bindPointer();
    this.#bindActivation();
  }

  #bindPointer() {
    window.addEventListener(
      'pointermove',
      (event) => {
        this.pointerActive = true;
        this.target.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.target.y = (event.clientY / window.innerHeight) * 2 - 1;
        this.glow.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
        this.glow.style.opacity = event.pointerType === 'touch' ? '0' : '1';
      },
      { passive: true },
    );

    window.addEventListener('pointerleave', () => {
      this.pointerActive = false;
      this.glow.style.opacity = '0';
    });
  }

  #bindActivation() {
    this.root.addEventListener('pointerdown', (event) => {
      const flower = event.target.closest('.flower');
      if (flower) this.bloom(flower);
    });

    this.root.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const flower = event.target.closest('.flower');
      if (!flower) return;
      event.preventDefault();
      this.bloom(flower);
    });
  }

  /** Abre una flor: pulso de escala, pétalos que salen disparados y sonido. */
  bloom(flower) {
    flower.classList.remove('is-blooming');
    void flower.offsetWidth; // fuerza reinicio de la animación
    flower.classList.add('is-blooming');

    const rect = flower.getBoundingClientRect();
    this.#burst(rect.left + rect.width / 2, rect.top + rect.height / 2, rect.width);
    this.onBloom(flower.dataset.species || 'daisy');
  }

  #burst(x, y, size) {
    const count = clamp(Math.round(size / 5), 8, 18);
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const petal = document.createElement('span');
      petal.className = 'petal-spark';
      petal.style.background = PETAL_COLORS[i % PETAL_COLORS.length];
      petal.style.left = `${x}px`;
      petal.style.top = `${y}px`;
      fragment.appendChild(petal);

      const angle = (i / count) * TAU + Math.random() * 0.4;
      const distance = size * (0.7 + Math.random() * 1.1);
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance + size * 0.5; // leve caída

      petal.animate(
        [
          { transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 },
          {
            transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.2) rotate(${
              Math.random() * 540 - 270
            }deg)`,
            opacity: 0,
          },
        ],
        { duration: 700 + Math.random() * 500, easing: 'cubic-bezier(.16,.84,.44,1)' },
      ).onfinish = () => petal.remove();
    }

    document.body.appendChild(fragment);
  }

  /** Suaviza el puntero y aplica el desplazamiento a cada capa. */
  update(dt, time) {
    if (!this.pointerActive && this.motion) {
      // Deriva lenta en reposo, para que la escena nunca quede congelada.
      this.target.x = Math.sin(time * 0.12) * 0.35;
      this.target.y = Math.cos(time * 0.09) * 0.25;
    }

    const ease = this.motion ? 1 - Math.pow(0.001, dt) : 1;
    this.current.x = lerp(this.current.x, this.target.x, ease);
    this.current.y = lerp(this.current.y, this.target.y, ease);

    for (const layer of this.layers) {
      const depth = Number(layer.dataset.depth);
      const x = -this.current.x * 40 * depth;
      const y = -this.current.y * 26 * depth;
      layer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    }
  }
}
