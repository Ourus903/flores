/**
 * Campanas generativas con WebAudio (sin librerías ni archivos de audio).
 *
 * Cada especie de flor tiene su propio timbre: dos osciladores desafinados,
 * envolvente corta y un eco que simula la distancia del espacio.
 * El contexto solo se crea tras un gesto del usuario, como exigen los navegadores.
 */

import { SCALE_HZ } from './config.js';

const VOICES = {
  daisy: { type: 'sine', detune: 4, decay: 1.6 },
  sunflower: { type: 'triangle', detune: 7, decay: 2.2 },
  tulip: { type: 'sine', detune: -6, decay: 1.2 },
  rose: { type: 'triangle', detune: 10, decay: 2.6 },
  lily: { type: 'sine', detune: -3, decay: 1.9 },
};

export class Chimes {
  constructor() {
    this.enabled = false;
    this.ctx = null;
    this.step = 0;
  }

  setEnabled(value) {
    this.enabled = value;
    if (value) this.#ensureContext();
    else if (this.ctx) this.ctx.suspend();
  }

  #ensureContext() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();

      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);

      // Eco corto: dos rebotes bastan para sugerir un espacio enorme.
      this.delay = this.ctx.createDelay(1);
      this.delay.delayTime.value = 0.28;
      this.feedback = this.ctx.createGain();
      this.feedback.gain.value = 0.34;
      this.delay.connect(this.feedback).connect(this.delay);
      this.delay.connect(this.master);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  /** Toca una nota de la escala pentatónica según la especie tocada. */
  play(species = 'daisy') {
    if (!this.enabled) return;
    this.#ensureContext();
    if (!this.ctx) return;

    const voice = VOICES[species] ?? VOICES.daisy;
    const now = this.ctx.currentTime;
    // Camina por la escala en vez de saltar al azar: suena melódico, no aleatorio.
    this.step = (this.step + (Math.random() < 0.5 ? 1 : 2)) % SCALE_HZ.length;
    const freq = SCALE_HZ[this.step];

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.9, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + voice.decay);
    gain.connect(this.master);
    gain.connect(this.delay);

    for (const [index, ratio] of [1, 2.01].entries()) {
      const osc = this.ctx.createOscillator();
      osc.type = voice.type;
      osc.frequency.value = freq * ratio;
      osc.detune.value = voice.detune * (index ? -1 : 1);

      const partial = this.ctx.createGain();
      partial.gain.value = index ? 0.25 : 1;
      osc.connect(partial).connect(gain);
      osc.start(now);
      osc.stop(now + voice.decay + 0.1);
    }
  }
}
