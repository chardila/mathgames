# 🏆 Tablas del Tesoro

Un juego de aventuras para aprenderse de memoria las **tablas de multiplicar**. Se viaja por un mapa, se resuelve una operación en cada estación y al final del viaje aparece un tesoro.

🌍 Español e inglés • 📱 Apto para tablet • 🔒 Sin anuncios ni rastreo • 📶 Funciona sin conexión (PWA) • 🎮 Aprendizaje con premios

> **Es un clon (fork) de [Math Treasure Quest](https://github.com/AllesSuper/math-treasure-quest)**, creado por [AllesSuper](https://github.com/AllesSuper). Mil gracias al autor original por el enorme trabajo y por compartirlo con licencia MIT: casi todo lo bueno de este juego viene de su proyecto. 💛
>
> **This is a clone (fork) of [Math Treasure Quest](https://github.com/AllesSuper/math-treasure-quest)** by [AllesSuper](https://github.com/AllesSuper). Heartfelt thanks to the original author for the great work and for sharing it under the MIT license.

---

## Qué cambia respecto al original

- Solo **español e inglés** (el original trae 16 idiomas). El español es el idioma por defecto.
- Se completaron las traducciones al español que faltaban (tienda, elogios, tesoros, insignias).
- Se eliminaron los informes de pruebas en alemán y las capturas del original.
- El proyecto seguirá personalizándose para practicar las tablas de multiplicar.

Todo lo demás se conserva: mapa de aventura, dificultad adaptativa, pistas tras un error, estrellas, rachas, monedas, insignias, 50 tesoros, tienda con potenciadores y acompañantes, modo con temporizador, modo rápido y funcionamiento sin conexión.

## ✨ Características

- ➕ Suma, ➖ resta, ✖️ multiplicación (1×1 a 10×10), ➗ división exacta y 🌈 modo mixto
- 🗺️ Mapa de aventura con 25 estaciones (10 en modo rápido)
- 🎯 Dificultad que se adapta a cada operación
- 💡 Pistas amables cuando hay un error
- ⭐ Estrellas, 🔥 rachas, 🪙 monedas, 🎖️ insignias y 💎 un tesoro por viaje
- ⏱️ Temporizador opcional
- 🔒 Sin servidor, sin cuenta, sin anuncios, sin APIs externas; el progreso se guarda solo en el dispositivo

## 🚀 Cómo ejecutarlo

No necesita compilación ni dependencias. Cualquier servidor estático sirve:

```bash
npm start                    # http://localhost:8080
# o, sin Node:
python3 -m http.server 8080
```

> El service worker (modo sin conexión) requiere `http://localhost` o HTTPS.

Para instalarlo en una tablet: abrir la dirección en el navegador y elegir **Añadir a la pantalla de inicio**.

## 📝 Backlog y hallazgos

Lo que se ha detectado para mejorar (todavía por analizar, no comprometido) está en [docs/BACKLOG.md](docs/BACKLOG.md).

## 🧪 Pruebas

```bash
npm test                     # matemáticas, aprendizaje adaptativo y caché offline
npm run validate             # sintaxis y JSON
npm ci && npx playwright install chromium
npm run test:browser         # pruebas en navegador real
```

## 🗂️ Estructura

```
index.html          # pantallas de la app
styles.css          # tema y animaciones
app.js              # motor del juego, textos (i18n) y generadores de operaciones
manifest.json       # metadatos PWA
service-worker.js   # caché sin conexión
tests/              # pruebas
```

Los textos están en el objeto `I18N` de `app.js` (`es` y `en`; el inglés es el idioma de respaldo).

## 📄 Licencia y créditos

Publicado bajo la [licencia MIT](LICENSE).

- Obra original: © 2026 Mathe-Schatzreise contributors — [AllesSuper/math-treasure-quest](https://github.com/AllesSuper/math-treasure-quest)
- Modificaciones: © 2026 Carlos Ardila

Gracias de nuevo al autor original por su esfuerzo y generosidad.
