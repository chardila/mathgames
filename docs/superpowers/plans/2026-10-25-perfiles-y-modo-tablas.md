# Perfiles y modo para dominar las tablas — plan de implementación

> **Para agentes:** SUB-SKILL OBLIGATORIA: usa superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementar este plan tarea por tarea. Los pasos usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** perfiles por niño con zona de padres, y un modo "tablas" donde se escribe el resultado, aparece una pista si tarda, cada operación se recuerda por separado y la colección de personajes muestra el aprendizaje real.

**Arquitectura:** el motor de aprendizaje de tablas es puro y vive en un archivo nuevo, `tables.js`. Los personajes y sus melodías van en otro archivo nuevo, `characters.js`. Ambos siguen el patrón de `app.js`: variables globales en el navegador y `module.exports` en Node. El modelo de perfiles (también puro) y toda la interfaz siguen en `app.js`. Para tocar poco código, `state.settings` y `state.progress` pasan a ser referencias a los objetos del perfil activo, y todas las escrituras van a una sola clave, `ms_profiles`.

**Tecnología:** JavaScript puro (ES5, `var`, sin build) y PWA con `service-worker.js`. Las pruebas unitarias corren en Node (`node:assert`) y las de navegador en Playwright 1.62.1 (con `page.clock`). El sonido se sintetiza con Web Audio.

**Diseño:** `docs/superpowers/specs/2026-10-25-perfiles-y-modo-tablas-design.md` (APROBADO). Hay que leerlo junto con este plan.

## Restricciones globales

- JavaScript puro, sin build ni dependencias de ejecución. Los archivos nuevos usan el mismo estilo que `app.js`: `"use strict"`, `var`, funciones con nombre y comentarios cortos en inglés.
- Todo texto visible va en `I18N` de `app.js`, en `es` y en `en`, con las mismas claves. `tests/math.test.js` ya comprueba que no falte ninguna.
- No hay backend: todo queda en `localStorage`. Los datos no salen del dispositivo.
- Nada de personajes, nombres ni música de Numberblocks. Los diseños y las melodías son propios.
- Se conserva lo que ya funciona en suma, resta, multiplicación libre, división y mixto.
- `CACHE_VERSION` sube **una sola vez en la rama**, de `tablas-del-tesoro-v1` a `tablas-del-tesoro-v2` (Tarea 1). Cada archivo nuevo entra en `PRECACHE_URLS`.
- Antes de cada commit: `npm test` y `npm run validate`. En las tareas que tocan la interfaz, también `npm run test:browser`.
- La implementación se hace en una rama (`feature/perfiles-y-tablas`), nunca en `main`: un push a `main` publica en GitHub Pages.
- Hay hallazgos `por-analizar` en `docs/BACKLOG.md` que no se arreglan aquí: H-06 (bono diario en UTC), H-07, H-08, H-09 en general y H-10. El código nuevo usa fecha local por su cuenta, sin tocar `grantDailyBonus`.
- Umbrales del motor, copiados del diseño:
  - Respuesta rápida: menos de **3 s**, sin pista.
  - Dominada: **3** respuestas rápidas en **2 o más días** distintos.
  - Pista a los **5 s**; respuesta **10 s** después.
  - Una operación fallada vuelve **3–4 estaciones** después.
  - Repaso a los **1, 3, 7 y 14 días**.
  - Ronda de **15 estaciones** por defecto.
  - **2** operaciones nuevas por ronda, **3** veces cada una.
  - Orden de introducción: **1, 2, 5, 10 → 3, 4, 9 → 6, 7, 8**.

## Foco de revisión

Situaciones que el diseño implica, que ninguna prueba "natural" cubre y que más pueden afectar a una niña usando la app. Cada una tiene su prueba en la tarea indicada.

1. **Pausar, salir o cambiar de pantalla mientras corre la espera de la pista (5 s) o de la respuesta (10 s).** Ningún temporizador debe dispararse después de salir. La pausa congela la espera y el tiempo pausado no cuenta como lentitud. Prueba en la Tarea 8.
2. **Rondas sin nada "conocido" o con todo dominado.** El primer día no hay nada conocido. Al hermano, que lo domina casi todo, le pueden vencer muchos repasos el mismo día. Las rondas deben tener siempre exactamente N estaciones válidas, sin la misma operación dos veces seguidas. Prueba en la Tarea 6.
3. **Almacenamiento no disponible, corrupto o lleno.** La app arranca con un perfil por defecto en memoria y se puede jugar. Las claves antiguas (`ms_progress`, `ms_settings`) no se borran. Pruebas en las Tareas 1 y 2.
4. **Tablet en vertical (390 px) con el teclado numérico.** No hay desbordamiento horizontal. Enter en un teclado físico equivale a confirmar. Nunca se envía la respuesta sola. Prueba en la Tarea 8.
5. **Cambiar de jugador o borrar el perfil activo.** Lo que queda de una ronda del perfil A no puede escribir en el perfil B. Borrar el último perfil deja la pantalla "¿Quién juega?" usable. Prueba en la Tarea 3.

## Decisiones de este plan (para revisar)

El diseño las deja al constructor ("Lo que queda al constructor") o no las resuelve:

- **Idioma por dispositivo.** `ms_lang` sigue siendo global y se cambia desde la zona de padres.
- **Almacenamiento.** Una sola clave, `ms_profiles` = `{ version: 1, lastId, profiles: [...] }`. Las claves `ms_progress` y `ms_settings` solo se leen para migrar y no se borran.
- **Migración.** Si no hay `ms_profiles` válido pero sí datos antiguos, se crea un perfil "Jugador 1":
  - Conserva el progreso tal cual, campos desconocidos incluidos.
  - Conserva sus `sound`, `timer`, `blitz`, `quick` y `choices`.
  - Los ajustes nuevos toman los valores por defecto: `mainMode: "tables"`, `setbacks: false`, `music: true`, `tableStations: 15`.
  - Si tampoco hay datos antiguos, o el almacenamiento falla, se crea igual un perfil "Jugador 1" (en memoria si no se puede guardar).
  - La migración es idempotente.
- **"¿Quién juega?" aparece siempre**, aunque haya un solo perfil.
- **Protección de la zona de padres.** Escribir el resultado de una multiplicación de dos cifras por dos cifras (factores 12–19, p. ej. `14 × 17`). Es un freno para niños, no seguridad: la niña ya hace multiplicaciones de varias cifras, pero no de memoria y en el momento.
- **Ajustes por perfil**, con sus valores por defecto para un perfil nuevo:
  - `sound: true`, `music: true`
  - `timer: false`, `blitz: false`
  - `quick: false` (solo "Otros juegos": 10 o 25 estaciones)
  - `choices: true` (solo "Otros juegos")
  - `setbacks: false`
  - `tableStations: 15` (opciones 10/15/20/25)
  - `mainMode: "tables"` (opciones: `tables`, `add`, `sub`, `mul`, `div`, `mix`)
  - Un perfil con `mainMode` distinto de `tables` ve el menú clásico, con ese modo preseleccionado.
- **Pantallas de los niños.** Salen el botón "Ajustes" del menú y los tres interruptores de la pantalla de modos. Las fichas de dificultad se quedan.
- **Repaso lento.** Si una operación dominada sale correcta pero lenta (≥ 3 s) en su repaso, se vuelve a programar con el **mismo** intervalo: ni avanza ni baja. Solo baja a "practicando" si necesita pista o respuesta.
- **Reintento al final de la ronda.** Una operación fallada vuelve 3 estaciones después (o 4, si a los 3 cae la misma operación junto a sí misma). Si eso queda fuera de la ronda, va a la última estación. Si se falla en la última estación, no vuelve en esa ronda. La ronda nunca se alarga, salvo con el retroceso activado.
- **"Casi dominada" en el álbum.** Una operación en "practicando" con al menos 1 respuesta rápida se pinta verde-amarillo. Esa es la cuarta casilla de la leyenda.
- **Llenado del personaje.** Para cada tabla, cuenta cuántas de sus 10 operaciones se han dominado **alguna vez** (`everMastered`). Nunca baja.
- **Cronómetro visible en modo tablas** (si el perfil lo tiene activado):
  - Es el anillo actual, con `computeTimeBudget`.
  - Si se agota, la estación pasa directamente a mostrar la respuesta.
  - El relámpago (`blitz`) no aplica en modo tablas.
- **Retroceso en modo tablas** (si el perfil lo tiene activado):
  - Retrocede 3 estaciones una vez por estación, al llegar a la fase "respuesta".
  - Si la cola de operaciones se agota, se alarga con más operaciones del motor.
- **Tienda.** Los potenciadores solo se muestran a perfiles cuyo `mainMode` no es `tables`. En las rondas clásicas, el escudo se oculta (bandeja y tienda) si el perfil no tiene retroceso. En las rondas de tablas no hay bandeja: ni potenciadores ni botón ⭐ +10 s.
- **Monedas en modo tablas.** "Al primer intento" significa sin pista (resultado `fast` o `slow`). La economía es la misma de hoy.
- **Resumen en modo tablas.** La casilla "Aciertos %" se cambia por "Dominadas hoy". El recuadro de repaso de fallos se oculta: esas operaciones ya vuelven solas.

## Mapa de archivos

| Archivo                       | Qué cambia                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `tables.js` (nuevo)           | Motor puro: claves de operación, registro, dominio, repaso, composición de ronda, sondeos, trucos, álbum, personajes.   |
| `characters.js` (nuevo)       | Datos y dibujo SVG de los 10 personajes, accesorios, melodías propias y secuencia de la canción de presentación.        |
| `app.js`                      | Modelo de perfiles puro y migración, reto de padres, textos `I18N`, interfaz (perfiles, padres, modo tablas, tienda…).  |
| `index.html`                  | Pantallas nuevas, teclado numérico en la tarjeta de tarea, `<script defer>` de `tables.js` y `characters.js` antes de `app.js`. |
| `styles.css`                  | Estilos de las pantallas nuevas, bloques de la pista, álbum, personajes y temas del mapa.                               |
| `service-worker.js`           | `CACHE_VERSION` v2 y los archivos nuevos en `PRECACHE_URLS`.                                                            |
| `tests/profiles.test.js` (nuevo)   | Modelo de perfiles, migración, reto de padres.                                                                     |
| `tests/tables.test.js` (nuevo)     | Motor de tablas.                                                                                                   |
| `tests/characters.test.js` (nuevo) | Personajes, melodías, secuencia de presentación.                                                                   |
| `tests/offline.test.js`       | Número de archivos precacheados y versión de caché.                                                                     |
| `tests/browser.test.js`       | Flujo con perfiles; secciones nuevas por tarea.                                                                         |
| `package.json`, `.github/workflows/quality.yml` | Pruebas y `node --check` de los archivos nuevos.                                                      |
| `docs/BACKLOG.md`, `CHANGELOG.md` | Estado de la hoja de ruta y de los hallazgos; entrada de cambios.                                                   |

Orden de carga en `index.html`: `tables.js`, `characters.js`, `app.js`, todos con `defer`. Los scripts `defer` se ejecutan en orden.

Cómo se enlazan los módulos:

- `tables.js` define `var TablesEngine = {...}`; `characters.js` define `var TableCharacters = {...}`. Cada uno termina con `if (typeof module !== "undefined" && module.exports) module.exports = <objeto>;`.
- `app.js` obtiene el motor con `var Tables = typeof TablesEngine !== "undefined" ? TablesEngine : require("./tables.js");`, cerca del principio de la sección 2. Así funciona igual en Node.
- `TableCharacters` solo se usa dentro de `startApp` (navegador).

## Fases

| Fase | Tareas | Resultado que se puede publicar                                              |
| ---- | ------ | ---------------------------------------------------------------------------- |
| A    | 1–4    | Perfiles, zona de padres; "Otros juegos" respeta los ajustes del perfil.     |
| B    | 5–7    | Motor de tablas puro, probado en Node (sin interfaz todavía).                |
| C    | 8–9    | Inicio por perfil y ronda de modo tablas completa.                           |
| D    | 10–11  | Personajes en el inicio con anuncios del lorito; álbum para padres.          |
| E    | 12     | Música: melodías de personajes y canción de presentación.                    |
| F    | 13     | Tienda de modo tablas (cosméticos) y "Mis tesoros".                          |
| G    | 14     | Documentación y verificación final.                                          |

---

<!-- TAREAS -->
