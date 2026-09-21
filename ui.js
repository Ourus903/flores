/**
 * Panel de control.
 *
 * El markup vive en index.html (con clases de Tailwind); aquí solo se conectan
 * los controles con la escena y se manejan los atajos de teclado.
 */

const SHORTCUTS = {
  KeyN: 'reseed',
  KeyC: 'comet',
  KeyM: 'audio',
  KeyH: 'panel',
  Space: 'motion',
};

export class Controls {
  constructor(handlers) {
    this.handlers = handlers;
    this.panel = document.getElementById('panel');
    this.toggle = document.getElementById('panel-toggle');
    this.status = document.getElementById('status');

    this.inputs = {
      density: document.getElementById('control-density'),
      bloom: document.getElementById('control-bloom'),
      motion: document.getElementById('control-motion'),
      audio: document.getElementById('control-audio'),
    };

    this.#bind();
  }

  #bind() {
    this.inputs.density.addEventListener('input', (e) =>
      this.handlers.onDensity(Number(e.target.value)),
    );
    this.inputs.bloom.addEventListener('input', (e) =>
      this.handlers.onBloom(Number(e.target.value)),
    );
    this.inputs.motion.addEventListener('change', (e) =>
      this.handlers.onMotion(e.target.checked),
    );
    this.inputs.audio.addEventListener('change', (e) =>
      this.handlers.onAudio(e.target.checked),
    );

    document.getElementById('action-reseed').addEventListener('click', () =>
      this.handlers.onReseed(),
    );
    document.getElementById('action-comet').addEventListener('click', () =>
      this.handlers.onComet(),
    );
    document.getElementById('action-share').addEventListener('click', () =>
      this.handlers.onShare(),
    );

    this.toggle.addEventListener('click', () => this.togglePanel());

    document.addEventListener('keydown', (event) => {
      const tag = event.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const action = SHORTCUTS[event.code];
      if (!action) return;
      event.preventDefault();

      if (action === 'panel') this.togglePanel();
      if (action === 'reseed') this.handlers.onReseed();
      if (action === 'comet') this.handlers.onComet();
      if (action === 'motion') this.setMotion(!this.inputs.motion.checked, true);
      if (action === 'audio') this.setAudio(!this.inputs.audio.checked, true);
    });
  }

  togglePanel() {
    const hidden = this.panel.classList.toggle('is-hidden');
    this.toggle.setAttribute('aria-expanded', String(!hidden));
  }

  /** Refleja un valor en la interfaz (sin disparar el evento de cambio). */
  sync({ density, bloom, motion, audio, seed }) {
    if (density != null) this.inputs.density.value = density;
    if (bloom != null) this.inputs.bloom.value = bloom;
    if (motion != null) this.inputs.motion.checked = motion;
    if (audio != null) this.inputs.audio.checked = audio;
    if (seed != null) document.getElementById('seed-label').textContent = seed;
  }

  setMotion(value, notify) {
    this.inputs.motion.checked = value;
    if (notify) this.handlers.onMotion(value);
  }

  setAudio(value, notify) {
    this.inputs.audio.checked = value;
    if (notify) this.handlers.onAudio(value);
  }

  /** Mensaje efímero en la esquina (compartir, semilla nueva, etc.). */
  say(message) {
    this.status.textContent = message;
    this.status.classList.remove('opacity-0');
    clearTimeout(this.statusTimer);
    this.statusTimer = setTimeout(() => this.status.classList.add('opacity-0'), 2400);
  }

  setStars(count) {
    document.getElementById('star-count').textContent = count.toLocaleString('es-GT');
  }
}
