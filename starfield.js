/**
 * Cielo en canvas.
 *
 * El original creaba ~900 <div> animados por CSS: cada fotograma el navegador
 * recalcula estilo y capa de compositing para cada uno. Aquí todo el cielo vive
 * en un solo canvas: 2200 estrellas cuestan menos que 300 divs.
 *
 * Trucos de rendimiento:
 *  - Sprites pregenerados (un gradiente radial por temperatura de estrella) que
 *    se dibujan con drawImage en vez de recalcular gradientes 2200 veces.
 *  - Nebulosas rasterizadas una sola vez en un canvas de baja resolución.
 *  - Composición "lighter" para que el brillo se sume como luz real.
 */

import { COUNTS, GALAXY, NEBULA_COLORS, STAR_TIERS } from './config.js';
import { makeRng, TAU, clamp } from './utils.js';

const SPRITE_SIZE = 64;

export class Starfield {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.dpr = 1;
    this.width = 0;
    this.height = 0;

    this.stars = [];
    this.dust = [];
    this.nebulae = [];
    this.comets = [];

    this.pointer = { x: 0, y: 0 };
    this.bloom = 1;
    this.motion = true;

    this.sprites = STAR_TIERS.map((tier) => buildStarSprite(tier));
    this.nebulaLayer = document.createElement('canvas');
  }

  /** Reconstruye la galaxia completa con una semilla y densidad dadas. */
  generate(seed, density = 1) {
    const rng = makeRng(seed);
    this.seed = seed;
    this.density = density;
    this.#buildStars(rng, density);
    this.#buildDust(rng, density);
    this.#buildNebulae(rng, density);
    this.resize();
  }

  #buildStars(rng, density) {
    const armTotal = Math.round(COUNTS.armStars * density);
    const fieldTotal = Math.round(COUNTS.fieldStars * density);
    const stars = [];

    for (let i = 0; i < armTotal; i++) {
      const inBulge = rng.chance(GALAXY.coreBulge);
      // t avanza a lo largo del brazo; la raíz concentra estrellas al centro.
      const t = inBulge ? Math.pow(rng.raw(), 2) * 0.28 : Math.sqrt(rng.raw());
      const arm = rng.int(0, GALAXY.arms - 1);
      const base = (arm / GALAXY.arms) * TAU + t * GALAXY.spin * TAU;

      // La dispersión crece con el radio: brazos nítidos al centro, difusos afuera.
      const spread = GALAXY.scatter * (0.4 + t * 2.2);
      const angle = base + rng.bell(-spread, spread) * TAU * 0.5;
      const radius = clamp(t + rng.bell(-0.03, 0.03), 0.02, 1.05);

      stars.push(makeStar(rng, angle, radius, inBulge ? 1.25 : 1));
    }

    // Estrellas de fondo repartidas por toda la pantalla, sin estructura espiral.
    for (let i = 0; i < fieldTotal; i++) {
      const star = makeStar(rng, rng.range(0, TAU), rng.range(0.15, 1.9), 0.55);
      star.field = true;
      stars.push(star);
    }

    this.stars = stars;
  }

  #buildDust(rng, density) {
    this.dust = Array.from({ length: Math.round(COUNTS.dust * density) }, () => ({
      x: rng.raw(),
      y: rng.raw(),
      size: rng.range(0.6, 2.4),
      speed: rng.range(0.004, 0.018),
      drift: rng.range(-0.006, 0.006),
      alpha: rng.range(0.15, 0.6),
      depth: rng.range(0.2, 1),
    }));
  }

  #buildNebulae(rng, density) {
    this.nebulae = Array.from(
      { length: Math.round(COUNTS.nebulae * density) },
      () => ({
        x: rng.range(0.08, 0.92),
        y: rng.range(0.1, 0.9),
        rx: rng.range(0.12, 0.38),
        ry: rng.range(0.08, 0.24),
        rotation: rng.range(0, TAU),
        color: rng.pick(NEBULA_COLORS),
        phase: rng.range(0, TAU),
        speed: rng.range(0.05, 0.14),
      }),
    );
  }

  /** Ajusta el canvas al viewport y repinta la capa de nebulosas. */
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.dpr = dpr;
    this.width = w;
    this.height = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.radius = Math.max(w, h) * 0.62;
    this.background = this.#buildBackground();
    this.#paintNebulaLayer();
  }

  #buildBackground() {
    const { ctx, width: w, height: h } = this;
    const g = ctx.createRadialGradient(
      w * 0.5,
      h * 0.5,
      0,
      w * 0.5,
      h * 0.5,
      Math.max(w, h) * 0.78,
    );
    g.addColorStop(0, '#221c3a');
    g.addColorStop(0.42, '#120f24');
    g.addColorStop(1, '#04040c');
    return g;
  }

  /** Las nebulosas se pintan una vez, desenfocadas, a 1/3 de resolución. */
  #paintNebulaLayer() {
    const scale = 0.34;
    const c = this.nebulaLayer;
    c.width = Math.max(1, Math.round(this.width * scale));
    c.height = Math.max(1, Math.round(this.height * scale));

    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.filter = 'blur(14px)';

    for (const n of this.nebulae) {
      const cx = n.x * c.width;
      const cy = n.y * c.height;
      const rx = n.rx * c.width;
      const ry = n.ry * c.height;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(n.rotation);
      ctx.scale(1, ry / rx);

      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, n.color);
      g.addColorStop(0.55, n.color.replace(/[\d.]+\)$/, '0.05)'));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.filter = 'none';
  }

  setPointer(nx, ny) {
    this.pointer.x = nx;
    this.pointer.y = ny;
  }

  /** Lanza un cometa desde un borde aleatorio hacia el interior. */
  spawnComet() {
    const fromLeft = Math.random() < 0.65;
    const angle = fromLeft
      ? Math.random() * 0.5 + 0.12 // hacia abajo-derecha
      : Math.PI - (Math.random() * 0.5 + 0.12);
    const speed = 620 + Math.random() * 520;

    this.comets.push({
      x: fromLeft ? -60 : this.width + 60,
      y: Math.random() * this.height * 0.55,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      ttl: 2.4,
      len: 90 + Math.random() * 120,
    });
  }

  /** Avanza la simulación. dt en segundos. */
  update(dt) {
    const step = this.motion ? dt : 0;

    if (step) {
      for (const star of this.stars) {
        // Rotación diferencial: el núcleo gira más rápido que el borde.
        star.angle += (GALAXY.rotation * step) / (0.22 + star.radius);
      }
      for (const d of this.dust) {
        d.x += d.speed * step * 0.35;
        d.y += d.drift * step * 0.35 - d.speed * step * 0.12;
        if (d.x > 1.05) d.x -= 1.1;
        if (d.y < -0.05) d.y += 1.1;
        if (d.y > 1.05) d.y -= 1.1;
      }
    }

    for (const comet of this.comets) {
      comet.life += dt;
      comet.x += comet.vx * dt;
      comet.y += comet.vy * dt;
    }
    this.comets = this.comets.filter((c) => c.life < c.ttl);

    // Reloj propio: con el movimiento apagado el titileo también se detiene.
    this.time = (this.time || 0) + step;
  }

  render() {
    const { ctx, width: w, height: h } = this;
    const time = this.time || 0;
    const px = this.pointer.x * 26;
    const py = this.pointer.y * 18;

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.background;
    ctx.fillRect(0, 0, w, h);

    // Nebulosas: respiran lentamente con un pulso global suave.
    const pulse = 0.72 + Math.sin(time * 0.22) * 0.12;
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = clamp(pulse * this.bloom, 0, 1);
    ctx.drawImage(this.nebulaLayer, px * 0.4, py * 0.4, w, h);

    ctx.globalCompositeOperation = 'lighter';

    const cx = w * 0.5;
    const cy = h * 0.5;
    const R = this.radius;

    for (const star of this.stars) {
      const r = star.radius;
      const x = cx + Math.cos(star.angle) * r * R + px * star.depth;
      const y = cy + Math.sin(star.angle) * r * R * GALAXY.flatten + py * star.depth;
      if (x < -40 || x > w + 40 || y < -40 || y > h + 40) continue;

      const twinkle = 0.55 + Math.sin(time * star.speed + star.phase) * 0.45;
      const size = star.size * (0.85 + twinkle * 0.5) * this.bloom;

      ctx.globalAlpha = clamp(star.alpha * twinkle * this.bloom, 0, 1);
      ctx.drawImage(this.sprites[star.tier], x - size, y - size, size * 2, size * 2);
    }

    // Polvo cósmico: puntos diminutos a la deriva.
    for (const d of this.dust) {
      ctx.globalAlpha = d.alpha * 0.7 * this.bloom;
      ctx.drawImage(
        this.sprites[0],
        d.x * w - d.size + px * d.depth,
        d.y * h - d.size + py * d.depth,
        d.size * 2,
        d.size * 2,
      );
    }

    this.#renderComets();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  #renderComets() {
    const { ctx } = this;
    for (const comet of this.comets) {
      const fade = 1 - comet.life / comet.ttl;
      const nx = comet.vx / Math.hypot(comet.vx, comet.vy);
      const ny = comet.vy / Math.hypot(comet.vx, comet.vy);
      const tailX = comet.x - nx * comet.len;
      const tailY = comet.y - ny * comet.len;

      const g = ctx.createLinearGradient(tailX, tailY, comet.x, comet.y);
      g.addColorStop(0, 'rgba(255, 180, 40, 0)');
      g.addColorStop(1, `rgba(255, 236, 160, ${fade})`);

      ctx.globalAlpha = 1;
      ctx.strokeStyle = g;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(comet.x, comet.y);
      ctx.stroke();

      ctx.globalAlpha = fade;
      ctx.drawImage(this.sprites[1], comet.x - 9, comet.y - 9, 18, 18);
    }
  }
}

function makeStar(rng, angle, radius, sizeBoost) {
  const roll = rng.raw();
  const tier = roll < STAR_TIERS[0].weight ? 0 : roll < 0.75 ? 1 : 2;

  return {
    angle,
    radius,
    tier,
    size: rng.bell(0.7, 3.4) * sizeBoost,
    alpha: rng.range(0.45, 1),
    phase: rng.range(0, TAU),
    speed: rng.range(0.5, 2.4),
    depth: rng.range(0.1, 1),
  };
}

/** Sprite reutilizable: núcleo blanco-oro que cae a transparente. */
function buildStarSprite(tier) {
  const c = document.createElement('canvas');
  c.width = c.height = SPRITE_SIZE;
  const ctx = c.getContext('2d');
  const half = SPRITE_SIZE / 2;

  const g = ctx.createRadialGradient(half, half, 0, half, half, half);
  g.addColorStop(0, tier.core);
  g.addColorStop(0.18, tier.mid);
  g.addColorStop(0.42, hexToRgba(tier.edge, 0.45));
  g.addColorStop(1, hexToRgba(tier.edge, 0));

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  return c;
}

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
