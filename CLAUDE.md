# Tablas del Tesoro

Fork de AllesSuper/math-treasure-quest (MIT), en español e inglés, para que una niña memorice las tablas de multiplicar.

- JavaScript puro, sin build. `npm test` y `npm run validate` antes de commitear; `npm run test:browser` para el flujo completo.
- Textos en `I18N` de `app.js` (`es` y `en`; `en` es el respaldo). Toda clave nueva va en ambos idiomas.
- Al cambiar archivos cacheados, subir `CACHE_VERSION` en `service-worker.js`.
- **Hallazgos y backlog: `docs/BACKLOG.md`.** Los hallazgos `por-analizar` no son trabajo aprobado: no los implementes sin que el usuario los analice y acepte. Al encontrar algo nuevo, añádelo allí.
