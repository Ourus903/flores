/**
 * Parámetros de la escena en un solo lugar.
 * Cambiar algo aquí no debería obligar a tocar ningún otro archivo.
 */

/** Tres temperaturas de estrella: oro, ámbar y brasa. */
export const STAR_TIERS = [
  { core: '#fffbe0', mid: '#ffd54a', edge: '#ff9d1c', weight: 0.42 },
  { core: '#fffde7', mid: '#ffe95c', edge: '#ffc107', weight: 0.33 },
  { core: '#ffe9b0', mid: '#ff9f2e', edge: '#ff5e2b', weight: 0.25 },
];

export const NEBULA_COLORS = [
  'rgba(255, 196, 64, 0.20)',
  'rgba(255, 233, 120, 0.14)',
  'rgba(255, 137, 42, 0.12)',
  'rgba(180, 130, 255, 0.07)', // un violeta muy tenue da profundidad al oro
];

/** Conteos base; el slider de densidad los multiplica. */
export const COUNTS = {
  armStars: 1500,
  fieldStars: 700,
  dust: 180,
  nebulae: 9,
  bouquets: 7,
  scattered: 18,
};

export const GALAXY = {
  arms: 3,
  spin: 3.1, // vueltas que da cada brazo
  flatten: 0.46, // achatamiento vertical del disco
  scatter: 0.055, // dispersión perpendicular al brazo
  coreBulge: 0.22, // fracción de estrellas concentradas en el núcleo
  rotation: 0.012, // rad/s en el borde (el centro gira más rápido)
};

export const SPECIES = ['daisy', 'sunflower', 'tulip', 'rose', 'lily'];

export const NAMES = {
  daisy: 'Margarita',
  sunflower: 'Girasol',
  tulip: 'Tulipán',
  rose: 'Rosa',
  lily: 'Lirio',
};

/** Escala pentatónica mayor (Do), en Hz, para el sonido al tocar una flor. */
export const SCALE_HZ = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66];

export const DEFAULTS = {
  density: 1,
  bloom: 1,
  motion: true,
  audio: false,
};
