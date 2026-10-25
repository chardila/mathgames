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

## Preparación (una vez, antes de la Tarea 1)

- [ ] Crear la rama: `git switch -c feature/perfiles-y-tablas`.
- [ ] Comprobar la línea base: `npm test && npm run validate && npm run test:browser`. Todo debe pasar antes de tocar nada.

---

## Fase A · Perfiles y zona de padres

### Tarea 1: Modelo de perfiles puro, migración y reto de padres

**Archivos:**

- Modificar: `app.js` (sección 2, después de `migrateLearningStart`, y `module.exports`)
- Crear: `tests/profiles.test.js`
- Modificar: `package.json` (añadir `node tests/profiles.test.js` al script `test`)
- Modificar: `service-worker.js` (`CACHE_VERSION = "tablas-del-tesoro-v2"`)
- Modificar: `tests/offline.test.js` (`caches.keys` simulado devuelve `["tablas-del-tesoro-v1", "tablas-del-tesoro-v2"]` y la prueba espera `deleted === "tablas-del-tesoro-v1"`)

**Interfaces:**

- Consume: `normalizeLearning`, `migrateLearningStart`, `randInt`, `MATH_MODES` (ya existen en `app.js`).
- Produce (exportado en `module.exports`):
  - `DEFAULT_SETTINGS`: `{ sound: true, music: true, timer: false, blitz: false, quick: false, choices: true, setbacks: false, tableStations: 15, mainMode: "tables" }`
  - `TABLE_STATION_OPTIONS = [10, 15, 20, 25]`
  - `MAIN_MODES = ["tables", "add", "sub", "mul", "div", "mix"]`
  - `PROFILE_AVATARS = ["🦊", "🐱", "🐼", "🦁", "🐸", "🐵", "🦄", "🐲", "🐧", "🐢"]`
  - `PROFILE_NAME_MAX = 20`
  - `defaultProgress() -> object`: el mismo objeto que hoy arma `resetProgress` (monedas 0, `buddies: ["kid"]`, `inventory` en cero, `learning: normalizeLearning()`, `learningStartVersion: 1`, etc.). Devuelve un objeto nuevo en cada llamada.
  - `normalizeSettings(saved) -> object`: valores de `DEFAULT_SETTINGS` donde falten o tengan un tipo inválido. Si `tableStations` no está en `TABLE_STATION_OPTIONS`, pasa a 15; si `mainMode` no está en `MAIN_MODES`, pasa a `"tables"`.
  - `cleanProfileName(name, fallback) -> string`: quita espacios sobrantes, corta a `PROFILE_NAME_MAX` y usa `fallback` si queda vacío.
  - `createProfile(name, avatar, existingIds, fallbackName) -> profile`
  - `normalizeProfile(saved) -> profile | null`: `null` si `saved` no es un objeto o no tiene `id` de texto.
  - `normalizeProfileStore(saved) -> { version: 1, lastId: string, profiles: profile[] }`
  - `migrateLegacyStorage(savedStore, legacyProgress, legacySettings, defaultName) -> store`
  - `parentChallenge() -> { a, b, answer }`
- Forma de un perfil: `{ id: "p1", name: "Ana", avatar: "🐼", settings: {...}, progress: {...}, tables: <se conserva tal cual; la Tarea 5 lo normaliza> }`. Los ids son `"p" + entero` y no se repiten dentro del almacén.

- [ ] **Paso 1: Escribir las pruebas que fallan** en `tests/profiles.test.js`, con el mismo estilo que `tests/learning.test.js` (`node:assert/strict`, un contador `check`, un `console.log` final). Casos y aserciones:

```js
const app = require("../app.js");
// normalizeSettings
assert.deepEqual(app.normalizeSettings({}), app.DEFAULT_SETTINGS);
const s = app.normalizeSettings({ tableStations: 13, mainMode: "x", timer: "yes", quick: true, extra: 1 });
check(s.tableStations === 15 && s.mainMode === "tables" && s.timer === false && s.quick === true, "settings coerced");
check(app.normalizeSettings({ tableStations: 25, mainMode: "div" }).tableStations === 25, "valid stations kept");
// defaultProgress
const p1 = app.defaultProgress(), p2 = app.defaultProgress();
check(p1 !== p2 && p1.learning !== p2.learning, "fresh objects");
check(p1.coins === 0 && p1.buddies[0] === "kid" && p1.learningStartVersion === 1 &&
  Object.values(p1.learning).every((r) => r.level === 1.5), "default progress");
// createProfile / cleanProfileName
const ana = app.createProfile("  Ana  ", "🐼", ["p1", "p2"], "Jugador");
check(ana.name === "Ana" && ana.avatar === "🐼" && !["p1", "p2"].includes(ana.id), "create profile");
assert.deepEqual(ana.settings, app.DEFAULT_SETTINGS);
check(app.cleanProfileName("x".repeat(40), "J").length === 20, "name max 20");
check(app.cleanProfileName("   ", "Jugador 2") === "Jugador 2", "empty name fallback");
check(app.createProfile("A", "🚀", [], "J").avatar === app.PROFILE_AVATARS[0], "unknown avatar -> first");
// normalizeProfile
check(app.normalizeProfile(null) === null && app.normalizeProfile({ name: "x" }) === null, "invalid profile");
const np = app.normalizeProfile({ id: "p7", name: "", progress: { coins: 5, customFutureField: "keep" } });
check(np.progress.coins === 5 && np.progress.customFutureField === "keep" && np.progress.learning.add.level === 1.5, "progress kept + learning normalized");
check(np.name.length > 0, "nameless profile gets a name");
// normalizeProfileStore
assert.deepEqual(app.normalizeProfileStore("garbage"), { version: 1, lastId: "", profiles: [] });
const st = app.normalizeProfileStore({ lastId: "p9", profiles: [{ id: "p1", name: "A" }, { id: "p1", name: "B" }, 3] });
check(st.profiles.length === 1 && st.profiles[0].name === "A" && st.lastId === "", "dedupe, drop invalid, reset unknown lastId");
// migrateLegacyStorage
const legacyProgress = { coins: 500, learning: { div: { level: 3 } }, customFutureField: "keep" };
const legacySettings = { timer: true, sound: false, quick: true };
const frozen = JSON.stringify([legacyProgress, legacySettings]);
const m = app.migrateLegacyStorage(null, legacyProgress, legacySettings, "Jugador 1");
check(m.profiles.length === 1 && m.profiles[0].name === "Jugador 1" && m.lastId === m.profiles[0].id, "one migrated profile");
const mp = m.profiles[0];
check(mp.progress.coins === 500 && mp.progress.learning.div.level === 3 && mp.progress.learning.add.level === 1.5 &&
  mp.progress.customFutureField === "keep", "legacy progress migrated");
check(mp.settings.timer === true && mp.settings.sound === false && mp.settings.quick === true &&
  mp.settings.setbacks === false && mp.settings.mainMode === "tables" && mp.settings.tableStations === 15, "legacy settings migrated");
check(JSON.stringify([legacyProgress, legacySettings]) === frozen, "legacy inputs not mutated");
assert.deepEqual(app.migrateLegacyStorage(m, { coins: 1 }, null, "X"), app.normalizeProfileStore(m)); // idempotent
const empty = app.migrateLegacyStorage(null, null, null, "Jugador 1");
check(empty.profiles.length === 1 && empty.profiles[0].progress.coins === 0, "fresh install default profile");
check(app.migrateLegacyStorage(null, 42, [], "J").profiles[0].progress.coins === 0, "non-object legacy ignored");
check(app.migrateLegacyStorage({ version: 1, lastId: "", profiles: [] }, legacyProgress, null, "J").profiles.length === 0,
  "an existing empty store stays empty (all profiles deleted)");
// parentChallenge
for (let i = 0; i < 1000; i++) {
  const c = app.parentChallenge();
  check(c.a >= 12 && c.a <= 19 && c.b >= 12 && c.b <= 19 && c.answer === c.a * c.b, "parent challenge range");
}
```

- [ ] **Paso 2: Ejecutar y ver el fallo.** `node tests/profiles.test.js` → falla con `app.normalizeSettings is not a function`.
- [ ] **Paso 3: Implementar** las funciones de la lista "Produce" en `app.js`, debajo de `migrateLearningStart`, con comentarios de una línea como el resto de la sección. Una regla que las pruebas no fijan: `migrateLegacyStorage` usa `savedStore` si es un objeto con `profiles` de tipo array (aunque esté vacío). Si no, crea un perfil a partir de los datos antiguos que sean objetos, o uno por defecto si no hay ninguno. El progreso antiguo pasa por `migrateLearningStart(Object.assign(defaultProgress(), legacyProgress))`.
- [ ] **Paso 4: Subir la caché.** Cambiar `CACHE_VERSION` y `tests/offline.test.js` como dice "Archivos". Añadir la prueba a `package.json`.
- [ ] **Paso 5: Verificar.** `npm test && npm run validate` → todo pasa, incluida la línea final de `profiles.test.js`. `npm run test:browser` sigue pasando: la interfaz aún no usa nada de esto.
- [ ] **Paso 6: Commit.** `git add app.js tests/profiles.test.js tests/offline.test.js package.json service-worker.js && git commit -m "feat: pure profile model, legacy migration and parent challenge"`

---

### Tarea 2: Perfiles en la app y pantalla "¿Quién juega?"

**Archivos:**

- Modificar: `app.js` (`startApp`: almacenamiento, estado, arranque, navegación; nuevos textos `I18N`)
- Modificar: `index.html` (nueva sección `#screen-profiles`; botón "Cambiar jugador" en `#screen-menu`)
- Modificar: `styles.css` (`.profile-grid`, `.profile-btn`)
- Modificar: `tests/browser.test.js`

**Interfaces:**

- Consume: `migrateLegacyStorage`, `normalizeProfileStore`, `DEFAULT_SETTINGS`, `defaultProgress` (Tarea 1).
- Produce, dentro de `startApp`:
  - `STORAGE_KEYS.profiles = "ms_profiles"`.
  - `state.store`: el almacén normalizado.
  - `state.profile`: el perfil activo, o `null`.
  - `state.settings` y `state.progress`: **apuntan a** `state.profile.settings` y `state.profile.progress`. Sin perfil, `state.settings` es una copia de `DEFAULT_SETTINGS`.
  - `saveProfiles()`: guarda `state.store` en `ms_profiles`. Reemplaza **todas** las llamadas `storageSet(STORAGE_KEYS.progress, …)` y `storageSet(STORAGE_KEYS.settings, …)`.
  - `useProfile(id)`: activa el perfil, guarda `lastId`, aplica el acompañante, refresca las cifras y llama a `goHome()`.
  - `goHome()`: en esta tarea muestra siempre `#screen-menu`. La Tarea 8 la hará depender de `mainMode`.
  - `goToProfiles()`: detiene temporizadores y transición, como `goToMenu`. Pone `state.run = null` y `state.profile = null`, dibuja `#profile-grid` y muestra `#screen-profiles`.
  - `renderProfileGrid()`
  - Acción `switch-player` → `goToProfiles()`.
- DOM:
  - `#screen-profiles` contiene `h1[data-i18n="who_title"]`, `#profile-grid` y `p#who-empty[data-i18n="who_empty"]` (visible solo si no hay perfiles).
  - Cada perfil es un `button.profile-btn[data-profile-id]` con su avatar (`.profile-avatar`) y su nombre (`.profile-name`).
- Textos nuevos (`es` / `en`):
  - `who_title`: "¿Quién juega?" / "Who's playing?"
  - `who_empty`: "Todavía no hay jugadores. Pide a un adulto que cree uno." / "No players yet. Ask a grown-up to add one."
  - `btn_switch_player`: "Cambiar jugador" / "Switch player"
  - `profile_default_name`: "Jugador {n}" / "Player {n}"

Al arrancar:

1. `state.store = migrateLegacyStorage(storageGet(profiles), storageGet(progress), storageGet(settings), <profile_default_name con n=1 en el idioma guardado o "es">)`.
2. `saveProfiles()`.
3. Sin idioma guardado → `#screen-language`; al elegir idioma → `goToProfiles()`. Con idioma guardado → `goToProfiles()` directamente.

`resetProgress` reinicia el perfil activo (`state.profile.progress = state.progress = defaultProgress()`).

- [ ] **Paso 1: Adaptar `tests/browser.test.js` al flujo con perfiles** (primero fallará).
  - Ayudantes nuevos, al principio de la función principal:
    - `store()` lee `ms_profiles`.
    - `saved()` devuelve el `progress` del perfil con `id === lastId`.
    - `pickProfile(name)` pulsa `#profile-grid .profile-btn` con ese texto.
    - `seedProfiles(profiles, lastId)` escribe `ms_profiles` (`{ version: 1, lastId, profiles }`) y recarga.
  - Después de cada `reload()` y de elegir "Español", el flujo pasa por `pickProfile("Jugador 1")`. Se repite lo que la prueba hacía después de recargar, incluido `page.clock.install()` si hace falta.
  - Se conservan las comprobaciones de hoy: monedas 500, `customFutureField`, `learning.div.level === 3`, `learning.add.level === 1.5`, colección, insignias y aprendizaje tras recargar. Ahora todas leen `saved()`.
  - En el bloque de instalación nueva, el `evaluate` que escribe `ms_settings` `{timer: true, blitz: true}` y `ms_progress` `"{broken"` también ejecuta `localStorage.removeItem("ms_profiles")`, para simular una instalación antigua. Las comprobaciones "existing timer preferences retained" y "corrupt storage recovers" siguen igual.
  - El contexto sin almacenamiento: Español → `pickProfile("Jugador 1")` → `go-modes` → `start-run` → hay 4 o más `.choice`.
  - Comprobaciones nuevas:

```js
check((await page.locator("#profile-grid .profile-btn").count()) === 1 &&
  (await page.locator("#profile-grid").textContent()).includes("Jugador 1"), "who plays lists migrated profile");
check((await page.evaluate(() => JSON.parse(localStorage.getItem("ms_progress")))).coins === 500, "legacy keys untouched");
// Two seeded profiles: A (coins 10), B (coins 99)
await pickProfile("A"); check((await page.locator("#menu-coins").textContent()) === "10", "profile A coins");
await page.locator('#screen-menu [data-action="switch-player"]').click();
await pickProfile("B"); check((await page.locator("#menu-coins").textContent()) === "99", "profile B coins");
// buy a joker as B -> A still has 10 coins in the store
check((await store()).profiles.find((p) => p.name === "A").progress.coins === 10, "profiles isolated");
// ms_profiles = "{broken" and no legacy keys -> one "Jugador 1" with 0 coins
check(/* ... */ true, "corrupt profile store recovers");
```

- [ ] **Paso 2: Ejecutar** `npm run test:browser` → falla porque no existe `#profile-grid`.
- [ ] **Paso 3: Implementar** lo de "Produce" y el arranque descrito arriba. El botón `switch-player` va en `#screen-menu`, debajo de los botones actuales, con `btn--ghost`. `refreshMenuStats` no cambia: ya lee `state.progress`.
- [ ] **Paso 4: Verificar.** `npm test && npm run validate && npm run test:browser` → todo pasa.
- [ ] **Paso 5: Commit.** `git commit -am "feat: per-child profiles with who-plays screen"` (antes, `git add` del HTML y el CSS si hiciera falta).

---

### Tarea 3: Zona de padres con freno y editor de perfiles; fuera los ajustes de las pantallas de niños

**Archivos:**

- Modificar: `index.html`:
  - `#screen-settings` pasa a ser `#screen-profile-edit`.
  - Nuevas `#screen-parents` y `#parent-gate` (overlay).
  - Se quita `[data-action="go-settings"]` de `#screen-menu`.
  - Se quitan los tres `switch-row` de `#screen-modes`.
- Modificar: `app.js` (acciones, `els`, `syncToggles` y `wireToggles` reescritas sobre el perfil en edición, textos)
- Modificar: `styles.css`
- Modificar: `tests/browser.test.js`

**Interfaces:**

- Consume: `parentChallenge`, `createProfile`, `cleanProfileName`, `PROFILE_AVATARS`, `TABLE_STATION_OPTIONS`, `MAIN_MODES` (Tarea 1); `goToProfiles`, `saveProfiles` (Tarea 2).
- Produce:
  - **Freno.** La acción `open-parents` (botón `#screen-profiles [data-action="open-parents"]`, con candado 🔒 y texto `btn_parents`) muestra `#parent-gate`:
    - `#gate-question`: "14 × 17 = ?"
    - `#gate-input`: `type="text" inputmode="numeric" autocomplete="off"`
    - `[data-action="gate-ok"]` y `[data-action="gate-cancel"]`
    - Con Enter en `#gate-input` se comprueba.
    - Si la respuesta es mala: se muestra `#gate-feedback` con `gate_wrong`, se pone un reto nuevo y se vacía la casilla.
    - Si es buena: se cierra y se va a `#screen-parents`.
  - **Lista.** `#screen-parents` tiene:
    - volver `[data-action="go-profiles"]`;
    - el selector de idioma (aquí se mueve `#settings-language-grid`);
    - `#parent-profiles`, con una fila `.parent-profile` por perfil y su botón `[data-edit-id]`;
    - `[data-action="add-profile"]`, que crea un perfil `profile_default_name` con `n = número de perfiles + 1`, lo guarda y abre el editor.
  - **Editor.** `#screen-profile-edit` tiene:
    - volver `[data-action="back-parents"]` (no vuelve a pedir el reto);
    - `#edit-name` (`maxlength=20`; al salir del campo, `cleanProfileName`);
    - `#edit-avatars`, con un `button[data-avatar]` por avatar;
    - `select#edit-main-mode`, con opciones `MAIN_MODES` y textos `mode_tables` y los `m_*` existentes;
    - los interruptores `#toggle-sound`, `#toggle-music`, `#toggle-timer`, `#toggle-blitz`, `#toggle-quick`, `#toggle-choices`, `#toggle-setbacks`;
    - `select#edit-stations` (10/15/20/25);
    - `[data-action="reset"]` (reinicia el perfil en edición, tras `confirm`);
    - `[data-action="delete-profile"]` (tras `confirm(t("delete_confirm", { name }))`; si era `lastId`, este pasa a `""`; vuelve a la lista).
  - `state.editingId`. El editor cambia **solo** `profile.settings` y `profile.name`/`avatar` del perfil en edición, y guarda en cada cambio. Como la zona de padres solo se abre desde `#screen-profiles`, no hay perfil activo mientras se edita.
- Textos nuevos (`es` / `en`):
  - `btn_parents`: "Zona de padres" / "Parents"
  - `gate_title`: "Solo para adultos" / "Grown-ups only"
  - `gate_wrong`: "No es correcto. Prueba con esta." / "Not quite. Try this one."
  - `btn_ok`: "Entrar" / "Enter"
  - `btn_cancel`: "Cancelar" / "Cancel"
  - `parents_title`: "Zona de padres" / "Parents area"
  - `add_profile`: "Añadir jugador" / "Add player"
  - `btn_edit`: "Editar" / "Edit"
  - `edit_title`: "Jugador" / "Player"
  - `edit_name`: "Nombre" / "Name"
  - `edit_avatar`: "Avatar" / "Avatar"
  - `edit_main_mode`: "Pantalla de inicio" / "Home screen"
  - `mode_tables`: "Aprender las tablas" / "Learn the tables"
  - `set_music`: "Música" / "Music"
  - `set_setbacks`: "Retroceder estaciones al fallar" / "Go back stations on a miss"
  - `set_stations`: "Estaciones en modo tablas" / "Stations in tables mode"
  - `set_choices`: ya existe
  - `delete_profile`: "Borrar jugador" / "Delete player"
  - `delete_confirm`: "¿Borrar a {name} y todo su progreso?" / "Delete {name} and all their progress?"

- [ ] **Paso 1: Pruebas de navegador que fallan.**
  - Cambiar el ayudante `start(mode, quick, diff, timer)`. Si `quick` o `timer` no coinciden con el perfil activo, se llama a `setProfileSettings({ quick, timer })`: un `evaluate` cambia los ajustes del perfil `lastId` en `ms_profiles`, recarga y elige el perfil. Ya no se tocan interruptores en `#screen-modes`.
  - La comprobación "optional timing" pasa a leer `#toggle-timer` y `#toggle-blitz` en el editor de "Jugador 1", tras pasar el freno.
  - El ayudante `passGate()` lee los dos números de `#gate-question`, escribe su producto en `#gate-input` y pulsa `gate-ok`.
  - Comprobaciones:

```js
check((await page.locator('#screen-menu [data-action="go-settings"]').count()) === 0 &&
  (await page.locator("#screen-modes .switch-row").count()) === 0, "no settings on child screens");
// gate: wrong answer keeps it closed
await page.locator('[data-action="open-parents"]').click();
await page.locator("#gate-input").fill("1"); await page.locator('[data-action="gate-ok"]').click();
check(await page.locator("#parent-gate").isVisible() && (await page.locator("#gate-input").inputValue()) === "" &&
  !(await page.locator("#screen-parents").evaluate((el) => el.classList.contains("is-active"))), "gate rejects wrong answer");
await passGate(); // -> #screen-parents active
// add + rename + avatar
await page.locator('[data-action="add-profile"]').click();
await page.locator("#edit-name").fill("Ana"); await page.locator("#edit-name").blur();
await page.locator('#edit-avatars [data-avatar="🐼"]').click();
await page.locator("#toggle-timer").locator("xpath=ancestor::label").click();
const ana = (await store()).profiles.find((p) => p.name === "Ana");
check(ana.avatar === "🐼" && ana.settings.timer === true, "editor saves to edited profile");
check((await store()).profiles.find((p) => p.name === "Jugador 1").settings.timer === false, "other profile untouched");
// delete every profile -> who-plays shows the empty hint and the parents button still works
check(await page.locator("#who-empty").isVisible() &&
  await page.locator('[data-action="open-parents"]').isVisible(), "empty who-plays usable");
// switching player during a pending transition writes nothing into the next profile
// (answer correctly as A, quit at once, switch, pick B, clock.runFor(1000): B's learning unchanged)
check(/* ... */ true, "no cross-profile writes after switch");
```

- [ ] **Paso 2: Ejecutar** `npm run test:browser` → falla (no existe `open-parents`).
- [ ] **Paso 3: Implementar** lo de "Produce":
  - Quitar del objeto `els` y de `wireToggles` los interruptores de `#screen-modes` y su lógica de espejo.
  - `syncToggles()` copia los ajustes del perfil en edición al editor.
  - Cada interruptor o selector cambia `profile.settings[key]` y llama a `saveProfiles()`.
  - El selector de idioma de `#screen-parents` usa `setLanguage`, como hoy.
- [ ] **Paso 4: Verificar.** `npm test && npm run validate && npm run test:browser` → todo pasa.
- [ ] **Paso 5: Commit.** `git add -A && git commit -m "feat: parents area with gate and per-profile settings editor"`

---

### Tarea 4: "Otros juegos" respeta el perfil (escribir, retroceso, escudo)

**Archivos:**

- Modificar: `index.html`. Dentro de `.task-card`, después de `#hint`:
  - `<div class="answer-display" id="answer-display" hidden>_</div>`
  - `<div id="numpad-wrap" hidden>` con `<div class="numpad" id="numpad"></div>` y `<button class="btn btn--primary btn--xl" data-action="check" data-i18n="btn_check">Comprobar</button>`

  El CSS de `.answer-display`, `.numpad` y `.key` ya existe.
- Modificar: `app.js` (`nextTask`, `showSolution`, `onWrong`, `onTimeout`, `renderPowerups`, `renderShop`)
- Modificar: `tests/browser.test.js`

**Interfaces:**

- Consume: `state.settings.choices` y `state.settings.setbacks` (Tareas 1–3).
- Produce:
  - `nextTask` pone `activeTask.choice = !!state.settings.choices`, en lugar de `true` siempre.
  - Con `choice` en falso:
    - `setupAnswerMode` ya muestra el teclado y el botón de comprobar;
    - `showSolution` muestra `#choices` con **solo** el botón `.choice--continue`;
    - el siguiente `setupAnswerMode` lo vuelve a ocultar.
  - `onWrong` y `onTimeout` llaman a `goBackOnMiss(3)` **solo si** `state.settings.setbacks`.
  - `renderPowerups` y `renderShop` omiten el potenciador `shield` si `!state.settings.setbacks`.

- [ ] **Paso 1: Pruebas que fallan.**
  - Los bloques de hoy que comprueban "three-station setback" y "shield prevents setback" deben sembrar antes `setbacks: true` en el perfil, con `setProfileSettings`.
  - Comprobaciones nuevas:

```js
await setProfileSettings({ choices: false, setbacks: false });
await start("mul", true);
check((await page.locator("#numpad .key").count()) === 12 && !(await page.locator("#choices").isVisible()), "typing mode");
for (let i = 0; i < 10; i++) { // half with on-screen keys + Check, half with keyboard digits + Enter
  const q = await current();
  if (i % 2) { await page.keyboard.type(String(q.answer)); await page.keyboard.press("Enter"); }
  else { for (const d of String(q.answer)) await page.locator("#numpad .key", { hasText: new RegExp("^" + d + "$") }).click();
         await page.locator('[data-action="check"]').click(); }
  await page.clock.runFor(800);
}
check((await page.locator("#sum-accuracy").textContent()) === "100%", "typed round completes");
// wrong typed answer at station 5 with setbacks off: stays on 5, continue -> 6
check(/* "Estación 5" then after .choice--continue "Estación 6" */ true, "no setback when off");
check((await page.locator('.powerup[aria-label^="Escudo"]').count()) === 0, "shield hidden in tray when setbacks off");
// shop: no .shop-item containing "Escudo"; with setbacks: true it is there again
check(/* ... */ true, "shield hidden in shop when setbacks off");
```

- [ ] **Paso 2: Ejecutar** → falla (`#numpad` no tiene teclas porque no existía en el HTML).
- [ ] **Paso 3: Implementar** lo de "Produce". `buildNumpad` ya funciona en cuanto `#numpad` existe.
- [ ] **Paso 4: Verificar.** `npm test && npm run validate && npm run test:browser` → todo pasa. Revisar a mano `.cache/mobile-modes.png`.
- [ ] **Paso 5: Commit.** `git add -A && git commit -m "feat: other games honour profile typing, setback and shield settings"`

---

<!-- TAREAS -->
