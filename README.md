# Vía Láctea Amarilla

Galaxia generativa en tonos dorados con un jardín de flores flotando entre las estrellas.
Cada escena nace de una semilla: la misma semilla produce siempre la misma galaxia.

## Ejecutar

Los módulos ES necesitan servirse por HTTP (abrir `index.html` con doble clic falla por CORS):

```bash
cd via-lactea
python3 -m http.server 5173
# abrir http://localhost:5173
```

¿Necesitás un solo archivo para subir a cualquier hosting o abrir sin servidor?

```bash
python3 tools/build.py   # genera dist/via-lactea.html, autocontenido
```

## Estructura

```
index.html                 markup y panel (Tailwind por CDN)
src/styles/main.css        animaciones, flores, capas, accesibilidad
src/js/config.js           paleta, conteos y parámetros de la espiral
src/js/utils.js            PRNG con semilla, helpers, estado en la URL
src/js/starfield.js        motor canvas: estrellas, nebulosas, polvo, cometas
src/js/flowers.js          generador de flores en SVG
src/js/garden.js           ramos, dispersión y capas de profundidad
src/js/effects.js          parallax, luz del puntero, estallido de pétalos
src/js/audio.js            campanas generativas con WebAudio
src/js/ui.js               enlaza el panel con la escena
src/js/main.js             bucle de animación y orquestación
tools/build.py             empaquetador a un solo HTML
```

## Qué cambió respecto a la versión original

| Antes | Ahora |
| --- | --- |
| ~900 `<div>` animados por CSS para el cielo | Un canvas con 2 200 estrellas y sprites pregenerados |
| Hasta 45 `<div>` por flor | Un `<svg>` vectorial por flor, nítido en cualquier escala |
| Estrellas en espiral aproximada con `sin` | Espiral logarítmica real con brazos, bulbo central y rotación diferencial |
| `left`/`top` en cada `mousemove` | `transform` interpolado sobre tres capas de parallax |
| Escena fija | Semilla reproducible y compartible por URL |
| Sin controles | Panel con densidad, brillo, movimiento y sonido |
| Sin accesibilidad | Foco por teclado en cada flor, `prefers-reduced-motion`, etiquetas ARIA |
| Animaciones siempre activas | Pausa al ocultar la pestaña y densidad adaptativa si bajan los FPS |

## Atajos

| Tecla | Acción |
| --- | --- |
| `N` | Crear otra galaxia |
| `C` | Lanzar un cometa |
| `M` | Silenciar o activar el sonido |
| `H` | Mostrar u ocultar el panel |
| `Espacio` | Pausar o reanudar el movimiento |

También: `Tab` recorre las flores y `Enter` las abre.

## Notas técnicas

- **Sprites en vez de gradientes por estrella.** Un gradiente radial se rasteriza una vez por
  temperatura de color y luego se dibuja con `drawImage`; recalcularlo 2 200 veces por
  fotograma haría caer los FPS.
- **Composición `lighter`.** El brillo de las estrellas se suma como luz real, así los cúmulos
  se ven más intensos sin dibujar nada extra.
- **`dt` real.** El bucle usa el delta entre fotogramas, así que la escena avanza igual a 60 Hz
  que a 120 Hz, y limita `dt` a 50 ms para evitar saltos al volver de otra pestaña.
- **Semillas de girasol en espiral de Fermat** con el ángulo áureo: es el patrón que siguen los
  capítulos florales reales.
- **Audio sin librerías.** Dos osciladores desafinados, envolvente exponencial y un delay con
  realimentación; cada especie tiene su timbre y las notas caminan por una escala pentatónica.
