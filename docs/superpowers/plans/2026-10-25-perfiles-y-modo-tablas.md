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

## Fase B · Motor de aprendizaje de tablas (puro)

Las funciones del motor **no llaman a `Date` ni a `localStorage`**: reciben `today` (`"YYYY-MM-DD"`, fecha local) y `elapsedMs` como parámetros. Todas devuelven objetos nuevos sin modificar los que reciben. El azar usa `Math.random`, que las pruebas sustituyen por una semilla, como en `tests/learning.test.js`.

### Tarea 5: `tables.js`, registro por operación, dominio y repaso espaciado

**Archivos:**

- Crear: `tables.js`
- Crear: `tests/tables.test.js`
- Modificar: `index.html` (`<script src="tables.js" defer></script>` antes de `app.js`)
- Modificar: `service-worker.js` (`"./tables.js"` en `PRECACHE_URLS`)
- Modificar: `tests/offline.test.js` (`stores.size` 10)
- Modificar: `package.json` (`node tests/tables.test.js` en `test`; `node --check tables.js` en `validate`)
- Modificar: `.github/workflows/quality.yml` (`node --check tables.js`)
- Modificar: `app.js`:
  - la línea `var Tables = …` (ver "Mapa de archivos");
  - `normalizeProfile` y `createProfile` ponen `tables: Tables.normalizeTables(saved.tables)`;
  - `resetProgress` (del editor) también reinicia `tables`.
- Modificar: `tests/profiles.test.js` (un perfil normalizado trae 55 operaciones)

**Interfaces (`TablesEngine`):**

- Constantes:
  - `TABLE_ORDER = [1, 2, 5, 10, 3, 4, 9, 6, 7, 8]`
  - `FAST_MS = 3000`, `HINT_DELAY_MS = 5000`, `ANSWER_DELAY_MS = 10000`
  - `REVIEW_INTERVALS = [1, 3, 7, 14]`
  - `PROBE_FAILS_TO_INTRODUCE = 2`, `PROBE_FASTS_TO_PRIORITIZE = 2`
- `factKey(a, b) -> "min-max"`
- `factKeys() -> string[55]`, en orden de introducción (ver Tarea 6).
- `parseKey(key) -> [a, b]`
- `homeTable(key) -> number`: de los dos factores, el que aparece antes en `TABLE_ORDER`.
- `factTables(key) -> number[]`: `[a]` si `a === b`; si no, `[a, b]`.
- `localDateKey(date) -> "YYYY-MM-DD"` (usa `getFullYear`, `getMonth` y `getDate`)
- `addDays(dateKey, n) -> dateKey`
- `normalizeTables(saved) -> tables`, con esta forma:

```
{ facts: { "7-9": { state: "new"|"practicing"|"mastered", seen, fast, fastDays: [dateKey], lastSeen: dateKey|"",
                    avgMs, everMastered: bool, reviewStep: 0..3, nextReview: dateKey|"" }, … 55 },
  probes: { "1": { fast, fail, introduce: bool }, … "10" },
  presented: [table numbers whose intro song already played] }
```

- `classifyOutcome(stage, elapsedMs) -> "fast" | "slow" | "hint" | "answer"`. `stage` es `"ask"`, `"hint"` o `"answer"`.
- `isDue(fact, today) -> bool`: dominada y con `nextReview <= today`.
- `recordTablesAnswer(tables, item, outcome, elapsedMs, today) -> tables`. `item = { key, kind }`; `kind` sale de la Tarea 6.

Reglas de `recordTablesAnswer`, copiadas del diseño:

- **Siempre:**
  - `seen++` y `lastSeen = today`.
  - `avgMs` es una media móvil (0,7 la anterior, 0,3 la nueva; la primera muestra es el valor inicial).
  - Una operación `new` pasa a `practicing`.
- **`fast`:**
  - `fast++` y se añade `today` a `fastDays` (sin repetir; se guardan como mucho los 3 días más recientes).
  - Si no estaba dominada y queda con `fast >= 3` y `fastDays.length >= 2`, pasa a `mastered`, con `everMastered = true`, `reviewStep = 0` y `nextReview = today + 1`.
  - Si ya estaba dominada y le tocaba repaso: `reviewStep = min(reviewStep + 1, 3)` y `nextReview = today + REVIEW_INTERVALS[reviewStep]`.
- **`slow`:** no toca los contadores de rápidas. Si estaba dominada y le tocaba repaso: `nextReview = today + REVIEW_INTERVALS[reviewStep]`, sin avanzar de intervalo.
- **`hint` o `answer`:**
  - `fast = 0` y `fastDays = []`.
  - Si estaba dominada: vuelve a `practicing`, con `reviewStep = 0` y `nextReview = ""`. `everMastered` se queda en `true`.
- **Si `item.kind === "probe"`** (cambia `probes[homeTable(key)]`):
  - con `fast`: `fast++`;
  - con `hint` o `answer`: `fail++`, y con `fail >= 2`, `introduce = true`.

- [ ] **Paso 1: Pruebas que fallan** en `tests/tables.test.js` (mismo estilo; con un ayudante `rec(t, key, outcome, day, kind = "practice")`):

```js
const T = require("../tables.js");
check(T.factKeys().length === 55 && new Set(T.factKeys()).size === 55, "55 unique facts");
check(T.factKey(9, 7) === "7-9" && T.factKey(7, 9) === "7-9", "7×9 and 9×7 are one fact");
const homes = {}; T.factKeys().forEach((k) => (homes[T.homeTable(k)] = (homes[T.homeTable(k)] || 0) + 1));
assert.deepEqual(homes, { 1: 10, 2: 9, 5: 8, 10: 7, 3: 6, 4: 5, 9: 4, 6: 3, 7: 2, 8: 1 });
check(T.homeTable("7-9") === 9 && T.homeTable("2-7") === 2 && T.homeTable("6-8") === 6, "home table");
assert.deepEqual(T.factTables("7-7"), [7]); assert.deepEqual(T.factTables("1-7"), [1, 7]);
check(T.localDateKey(new Date(2026, 9, 25, 23, 30)) === "2026-10-25", "local date, not UTC");
check(T.addDays("2026-10-31", 1) === "2026-11-01" && T.addDays("2026-12-31", 14) === "2027-01-14", "addDays");
const fresh = T.normalizeTables();
check(Object.values(fresh.facts).every((f) => f.state === "new" && f.seen === 0 && !f.everMastered), "fresh facts");
check(Object.keys(fresh.probes).length === 10 && fresh.presented.length === 0, "fresh probes");
check(T.normalizeTables({ facts: { "7-9": { state: "weird", seen: -3 } } }).facts["7-9"].state === "new", "invalid fact recovers");
assert.deepEqual(T.normalizeTables(JSON.parse(JSON.stringify(fresh))), fresh);
check(T.classifyOutcome("ask", 2999) === "fast" && T.classifyOutcome("ask", 3000) === "slow" &&
  T.classifyOutcome("hint", 100) === "hint" && T.classifyOutcome("answer", 100) === "answer", "outcome thresholds");
// mastery: 3 fast on >= 2 different days
let t = fresh;
for (let i = 0; i < 3; i++) t = rec(t, "7-9", "fast", "2026-10-25");
check(t.facts["7-9"].state === "practicing" && t.facts["7-9"].fast === 3, "3 fast on one day is not mastery");
t = rec(t, "7-9", "fast", "2026-10-26");
const m = t.facts["7-9"];
check(m.state === "mastered" && m.everMastered && m.reviewStep === 0 && m.nextReview === "2026-10-27", "mastered");
// slow keeps the count; hint/answer reset it
let u = rec(rec(rec(rec(fresh, "3-4", "fast", "2026-10-25"), "3-4", "slow", "2026-10-25"), "3-4", "fast", "2026-10-26"), "3-4", "fast", "2026-10-26");
check(u.facts["3-4"].state === "mastered", "slow answers don't reset fast count");
u = rec(rec(rec(fresh, "3-4", "fast", "2026-10-25"), "3-4", "hint", "2026-10-25"), "3-4", "fast", "2026-10-26");
check(u.facts["3-4"].fast === 1 && u.facts["3-4"].fastDays.join() === "2026-10-26", "hint resets fast count");
// spaced review 1, 3, 7, 14, 14
t = rec(t, "7-9", "fast", "2026-10-26"); // same day, not due
check(t.facts["7-9"].nextReview === "2026-10-27", "not due: schedule unchanged");
for (const [day, next] of [["2026-10-27", "2026-10-30"], ["2026-10-30", "2026-11-06"], ["2026-11-06", "2026-11-20"], ["2026-11-20", "2026-12-04"]]) {
  t = rec(t, "7-9", "fast", day); check(t.facts["7-9"].nextReview === next, "review step -> " + next);
}
check(rec(t, "7-9", "slow", "2026-12-04").facts["7-9"].nextReview === "2026-12-18", "slow review keeps interval");
const failed = rec(t, "7-9", "hint", "2026-12-04").facts["7-9"];
check(failed.state === "practicing" && failed.everMastered && failed.nextReview === "" && failed.fast === 0, "failed review demotes");
// probes
let p = rec(fresh, "7-9", "hint", "2026-10-25", "probe");
check(p.probes["9"].fail === 1 && !p.probes["9"].introduce, "one failed probe");
p = rec(p, "4-9", "answer", "2026-10-25", "probe");
check(p.probes["9"].introduce, "two failed probes -> table to introduce");
check(rec(fresh, "7-9", "hint", "2026-10-25", "practice").probes["9"].fail === 0, "non-probe leaves probes alone");
check(rec(fresh, "2-5", "fast", "2026-10-25", "probe").probes["2"].fast === 1, "fast probe counted on home table");
const before = JSON.stringify(fresh); rec(fresh, "7-9", "fast", "2026-10-25"); check(JSON.stringify(fresh) === before, "pure");
const avg = rec(rec(fresh, "2-2", "slow", "2026-10-25", "practice", 2000), "2-2", "slow", "2026-10-25", "practice", 4000);
check(avg.facts["2-2"].avgMs === 2600, "moving average");
```

El ayudante es `rec(t, key, outcome, day, kind = "practice", elapsedMs = 1000)`, que llama a `T.recordTablesAnswer(t, { key, kind }, outcome, elapsedMs, day)`.

- [ ] **Paso 2: Ejecutar** `node tests/tables.test.js` → falla (`Cannot find module '../tables.js'`).
- [ ] **Paso 3: Implementar** `tables.js` con todo lo de "Interfaces". Hacer también el cableado de "Archivos". En `tests/profiles.test.js`, añadir `check(Object.keys(app.createProfile("A", "🐼", [], "J").tables.facts).length === 55, "profile has tables")`.
- [ ] **Paso 4: Verificar.** `npm test && npm run validate && npm run test:browser` → todo pasa.
- [ ] **Paso 5: Commit.** `git add -A && git commit -m "feat: per-fact tables engine with mastery and spaced review"`

---

### Tarea 6: Composición de la ronda, sondeos y reintentos

**Archivos:**

- Modificar: `tables.js`, `tests/tables.test.js`

**Interfaces:**

- Consume: todo lo de la Tarea 5.
- Produce:
  - Constantes: `NEW_PER_ROUND = 2`, `NEW_REPEATS = 3`, `NEW_SPACING = 3`, `MAX_PROBES_PER_ROUND = 3`, `MAX_PRACTICING_FOR_NEW = 10`, `PRACTICE_MAX_REPEATS = 2`.
  - `buildTablesRound(tables, today, total) -> item[]`, de longitud exacta `total`. Cada elemento es `{ key, a, b, kind }`, donde `kind` es `"review"`, `"new"`, `"probe"`, `"practice"` o `"known"`, y `a × b` es como se muestra en pantalla (`factKey(a, b) === key`).
  - `scheduleRetry(round, index) -> item[]`: misma longitud; no modifica `round`.
  - `tablesToPresent(round, tables) -> number[]`: las tablas casa de los elementos `"new"` que aún no están en `tables.presented`, sin repetir y en orden de `TABLE_ORDER`.
  - `markPresented(tables, table) -> tables`

**Orden de introducción:** las tablas según `TABLE_ORDER`. Dentro de cada tabla, sus operaciones (las que la tienen como casa) por el otro factor, de menor a mayor. `factKeys()` sigue este orden: `1-1, 1-2, …, 1-10, 2-2, 2-3, …`.

**Orden de sondeo:** el de introducción, con dos cambios:

- Primero van las tablas "rápidas" (`probes[t].fast >= 2` y `probes[t].fail === 0`), en su orden.
- Se saltan las tablas con `introduce = true`.

**`buildTablesRound`:**

1. **Repasos:** operaciones dominadas a las que les toca repaso. Primero las de `nextReview` más antiguo y, a igualdad, por orden de introducción. Como mucho `Math.floor(total / 5)` (3 en una ronda de 15).
2. **Nuevas:** solo si hay menos de `MAX_PRACTICING_FOR_NEW` operaciones en `practicing`. Se toman las no vistas (`seen === 0`) cuya tabla casa tiene `introduce`, en orden de introducción. Como mucho `NEW_PER_ROUND`, y solo mientras quepan `NEW_REPEATS` copias de cada una en lo que queda.
3. **Sondeos:** operaciones no vistas cuya tabla casa no tiene `introduce`, en orden de sondeo. Como mucho `MAX_PROBES_PER_ROUND`.
4. **Relleno**, por este orden, hasta llegar a `total`:
   - (a) `practicing`, primero las de menos `fast`, luego las de `lastSeen` más antiguo y luego por orden de introducción. Como mucho `PRACTICE_MAX_REPEATS` veces cada una en la ronda.
   - (b) Más sondeos.
   - (c) Dominadas que no estén ya en la ronda (`"known"`), primero las de `lastSeen` más antiguo.
   - (d) Las operaciones vistas hace más tiempo, del estado que sean, como `"known"` o `"practice"`, hasta llenar.
5. **Colocación:**
   - La copia `k` (0..2) de la nueva `j` (0..1) va en la posición `j + 1 + k × NEW_SPACING`. Si la posición está ocupada, en la siguiente libre.
   - El resto se baraja en los huecos.
   - Luego se recorre la ronda: si dos elementos seguidos tienen la misma `key`, el segundo se intercambia con el primer elemento posterior que no cree otro par igual.
   - Para cada elemento con `a ≠ b`, el orden se elige al azar (se pregunta en ambos sentidos).

**`scheduleRetry(round, index)`:**

- Si `index` es la última posición, devuelve una copia sin cambios.
- Si no, inserta una copia de `round[index]`, con `retry: true`, en la posición `min(index + 3, total - 1)`. Si allí quedaría junto a un elemento con la misma `key`, usa `index + 4` (también limitado a `total - 1`).
- Después recorta al tamaño `total`, quitando el último elemento.

- [ ] **Paso 1: Pruebas que fallan** (semilla de azar como en `learning.test.js`; un ayudante `stateWith(spec)` arma un `tables` con los hechos en los estados indicados):

```js
const valid = (r, total) => r.length === total && r.every((it, i) =>
  T.factKey(it.a, it.b) === it.key && ["review", "new", "probe", "practice", "known"].includes(it.kind) &&
  (i === 0 || r[i - 1].key !== it.key));
// random states x totals
for (let n = 0; n < 300; n++) for (const total of [10, 15, 20, 25])
  check(valid(T.buildTablesRound(randomTables(), "2026-11-01", total), total), "valid round");
// cold start
const cold = T.buildTablesRound(T.normalizeTables(), "2026-11-01", 15);
check(cold.every((it) => it.kind === "probe") && new Set(cold.map((i) => i.key)).size === 15, "cold start: 15 distinct probes");
assert.deepEqual(new Set(cold.map((i) => i.key)), new Set(T.factKeys().slice(0, 15)));
// introductions: table 2 to introduce, nothing practicing
const intro = T.buildTablesRound(stateWith({ seen: "table1", introduce: [2] }), "2026-11-01", 15);
const news = intro.filter((i) => i.kind === "new");
check(news.length === 6 && ["2-2", "2-3"].every((k) => news.filter((i) => i.key === k).length === 3), "2 new facts × 3");
for (const k of ["2-2", "2-3"]) {
  const pos = intro.map((it, i) => (it.key === k ? i : -1)).filter((i) => i >= 0);
  check(pos[1] - pos[0] >= 2 && pos[2] - pos[1] >= 2, "new fact copies spaced");
}
check(intro.every((it) => it.kind !== "probe" || T.homeTable(it.key) !== 2), "introduced tables are not probed");
check(T.buildTablesRound(stateWith({ practicing: 10, introduce: [2] }), "2026-11-01", 15).every((i) => i.kind !== "new"), "too many practicing -> no new");
// reviews capped at 3, oldest first
const rv = T.buildTablesRound(stateWith({ dueMastered: ["1-2@2026-10-01", "1-3@2026-10-02", "1-4@2026-10-03", "1-5@2026-10-04", "1-6@2026-10-05"] }), "2026-11-01", 15);
assert.deepEqual(rv.filter((i) => i.kind === "review").map((i) => i.key).sort(), ["1-2", "1-3", "1-4"]);
// fast table probed first
const pri = T.buildTablesRound(stateWith({ seen: "table1", probes: { 5: { fast: 2, fail: 0 } } }), "2026-11-01", 15);
check(T.homeTable(pri.find((i) => i.kind === "probe").key) === 5, "fast table probed first");
// brother: everything mastered, nothing due / everything due
check(valid(T.buildTablesRound(stateWith({ allMastered: true }), "2026-11-01", 15), 15), "all mastered round");
check(T.buildTablesRound(stateWith({ allMastered: true, allDue: true }), "2026-11-01", 15).filter((i) => i.kind === "review").length === 3, "all due -> 3 reviews + known");
// orientation
const seenOrient = new Set();
for (let n = 0; n < 300; n++) T.buildTablesRound(stateWith({ practicing: ["7-9"] }), "2026-11-01", 15)
  .filter((i) => i.key === "7-9").forEach((i) => seenOrient.add(i.a + "x" + i.b));
check(seenOrient.has("7x9") && seenOrient.has("9x7"), "asked both ways");
// retries
const r = T.factKeys().slice(0, 15).map((key) => ({ key, a: +key.split("-")[0], b: +key.split("-")[1], kind: "practice" }));
const r2 = T.scheduleRetry(r, 2);
check(r2.length === 15 && r2[5].key === r[2].key && r2[5].retry && r2[6] === r[5] && r.length === 15 && !r[5].retry, "retry 3 later");
const clash = r.slice(); clash[4] = r[2];
check(T.scheduleRetry(clash, 2)[6].key === r[2].key, "retry 4 later when 3 would sit next to itself");
check(T.scheduleRetry(r, 12)[14].key === r[12].key, "late retry clamps to last station");
assert.deepEqual(T.scheduleRetry(r, 14), r);
// presentation
const tp = T.tablesToPresent(intro, stateWith({ introduce: [2] }));
assert.deepEqual(tp, [2]);
assert.deepEqual(T.tablesToPresent(intro, T.markPresented(stateWith({ introduce: [2] }), 2)), []);
```

- [ ] **Paso 2: Ejecutar** → falla (`T.buildTablesRound is not a function`).
- [ ] **Paso 3: Implementar** lo de "Produce", con las reglas de arriba. `randomTables()` y `stateWith()` son ayudantes de la prueba, no del motor.
- [ ] **Paso 4: Verificar.** `npm test` → todo pasa.
- [ ] **Paso 5: Commit.** `git commit -am "feat: tables round composition, probing and in-round retries"`

---

### Tarea 7: Trucos de la pista, álbum, llenado de personajes y logros

**Archivos:**

- Modificar: `tables.js`, `tests/tables.test.js`
- Modificar: `app.js` (textos `trick_*` en `I18N`)

**Interfaces:**

- `tablesTrick(a, b) -> { key, vars }`:
  - Se busca el primer `p` de la lista `[1, 10, 9, 2, 5, 4, 3]` que sea igual a `a` o a `b`. `n` es el otro factor (o `p`, si los dos son `p`).
  - Si ninguno está en la lista (los dos son 6, 7 u 8), se usa `trick_split` con `a` tal como se muestra.
  - **El truco nunca dice el resultado.**

| `key`         | `vars`                            | `es`                                                              | `en`                                                         |
| ------------- | --------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| `trick_1`     | `{ n }`                           | "{n} × 1 es un solo grupo de {n}."                                | "{n} × 1 is just one group of {n}."                          |
| `trick_10`    | `{ n }`                           | "Por 10: pon un cero detrás del {n}."                             | "Times 10: put a zero after {n}."                            |
| `trick_9`     | `{ n, tens: n*10 }`               | "{n} × 10 = {tens}, menos {n}."                                   | "{n} × 10 = {tens}, minus {n}."                              |
| `trick_2`     | `{ n }`                           | "Es el doble: {n} + {n}."                                         | "It's double: {n} + {n}."                                    |
| `trick_5`     | `{ n, tens: n*10 }`               | "{n} × 10 = {tens}, y luego la mitad."                            | "{n} × 10 = {tens}, then half of it."                        |
| `trick_4`     | `{ n, double: n*2 }`              | "El doble del doble: {n} × 2 = {double}, y otra vez el doble."    | "Double, then double again: {n} × 2 = {double}, then again." |
| `trick_3`     | `{ n, double: n*2 }`              | "{n} × 2 = {double}, más {n}."                                    | "{n} × 2 = {double}, plus {n}."                              |
| `trick_split` | `{ a, five: a*5, rest: b-5 }`     | "{a} × 5 = {five}, más {a} × {rest}."                             | "{a} × 5 = {five}, plus {a} × {rest}."                       |

- `albumCells(tables) -> cell[100]`: por filas, `a` de 1 a 10 y `b` de 1 a 10. Cada casilla es `{ a, b, key, state }`, y `state` vale:
  - `"mastered"` si la operación está dominada;
  - `"almost"` si está en `practicing` y tiene `fast >= 1`;
  - `"practicing"` si está en `practicing`;
  - `"new"` en otro caso.
- `characterFill(tables, table) -> 0..10`: cuántas de las 10 operaciones con ese factor tienen `everMastered`.
- `FILL_MILESTONES = [[1, "first"], [5, "half"], [8, "almost"], [10, "full"]]`
- `fillMilestone(before, after) -> null | "first" | "half" | "almost" | "full"`: el hito más alto con `before < umbral <= after`.
- `newlyMastered(before, after) -> key[]`: dominadas en `after` que no lo estaban en `before`.

- [ ] **Paso 1: Pruebas que fallan:**

```js
assert.deepEqual(T.tablesTrick(7, 9), { key: "trick_9", vars: { n: 7, tens: 70 } }); // spec example "7 × 10 = 70, menos 7"
assert.deepEqual(T.tablesTrick(9, 7), T.tablesTrick(7, 9));
assert.deepEqual(T.tablesTrick(2, 9), { key: "trick_9", vars: { n: 2, tens: 20 } });
assert.deepEqual(T.tablesTrick(1, 1), { key: "trick_1", vars: { n: 1 } });
assert.deepEqual(T.tablesTrick(10, 10), { key: "trick_10", vars: { n: 10 } });
assert.deepEqual(T.tablesTrick(7, 8), { key: "trick_split", vars: { a: 7, five: 35, rest: 3 } });
assert.deepEqual(T.tablesTrick(8, 7), { key: "trick_split", vars: { a: 8, five: 40, rest: 2 } });
assert.deepEqual(T.tablesTrick(6, 6), { key: "trick_split", vars: { a: 6, five: 30, rest: 1 } });
const app = require("../app.js");
for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) {
  const tr = T.tablesTrick(a, b);
  check(["es", "en"].every((l) => typeof app.I18N[l][tr.key] === "string") &&
    Object.values(tr.vars).every(Number.isFinite), "trick text exists in es and en");
  // ×1 inherently names the answer; every other trick leaves the last step to the child
  check(tr.key === "trick_1" || Object.values(tr.vars).every((v) => v !== a * b), "trick does not give the answer");
}
const cells = T.albumCells(someTables); // 7-9 mastered, 3-4 practicing fast 1, 2-2 practicing fast 0
check(cells.length === 100 && cells[0].a === 1 && cells[0].b === 1 && cells[99].a === 10, "100 cells row-major");
const cell = (a, b) => cells[(a - 1) * 10 + (b - 1)];
check(cell(7, 9).state === "mastered" && cell(9, 7).state === "mastered", "both cells of one fact");
check(cell(3, 4).state === "almost" && cell(2, 2).state === "practicing" && cell(5, 5).state === "new", "album states");
// fill: 7-7 counts once for table 7; 1-7 counts for 1 and 7; never decreases
let f = masterFacts(T.normalizeTables(), ["7-7", "1-7"]);
check(T.characterFill(f, 7) === 2 && T.characterFill(f, 1) === 1, "fill counts");
f = rec(f, "1-7", "hint", "2026-11-02");
check(T.characterFill(f, 7) === 2, "fill never drops");
check(T.fillMilestone(0, 1) === "first" && T.fillMilestone(4, 5) === "half" && T.fillMilestone(7, 9) === "almost" &&
  T.fillMilestone(9, 10) === "full" && T.fillMilestone(5, 5) === null && T.fillMilestone(2, 3) === null, "milestones");
assert.deepEqual(T.newlyMastered(T.normalizeTables(), f).sort(), ["7-7"]);
```

`someTables` y `masterFacts(tables, keys)` son ayudantes de la prueba. `masterFacts` registra para cada operación 3 respuestas `fast` en dos días distintos.

- [ ] **Paso 2: Ejecutar** → falla.
- [ ] **Paso 3: Implementar** las funciones y añadir las 8 claves `trick_*` a `I18N` en `es` y `en`.
- [ ] **Paso 4: Verificar.** `npm test` → todo pasa.
- [ ] **Paso 5: Commit.** `git commit -am "feat: hint tricks, parent album cells and character fill"`

---

## Fase C · Modo tablas jugable

### Tarea 8: Inicio según el perfil y ronda de modo tablas

**Archivos:**

- Modificar: `index.html`:
  - nueva `#screen-tables-home`;
  - en `#screen-summary`, `id="sum-accuracy-lbl"` en la etiqueta de aciertos y un nuevo `p#sum-progress-line` (oculto) debajo de `.summary-grid`.
- Modificar: `app.js`
- Modificar: `styles.css` (`.tables-home`, `.blocks`, `.block`)
- Modificar: `tests/browser.test.js`

**Interfaces:**

- Consume:
  - `Tables.buildTablesRound`, `scheduleRetry`, `recordTablesAnswer`, `classifyOutcome`, `tablesTrick`, `newlyMastered`, `localDateKey`, `HINT_DELAY_MS`, `ANSWER_DELAY_MS` (Fase B);
  - `state.profile.tables`, `saveProfiles()`.
- Produce:
  - **`goHome()`.** Con `mainMode === "tables"` muestra `#screen-tables-home`. Si no, `#screen-menu`, con `state.selectedMode = mainMode` y esa `.mode-card` marcada. `goToMenu` se renombra a `goHome`, y las acciones `go-menu` y `quit` la usan.
  - **`#screen-tables-home`**, con:
    - el lorito y `#home-greeting` (`home_greeting` con `{name}`);
    - `#home-coins`;
    - `#home-characters`, vacío hasta la Tarea 10;
    - `button.btn--primary.btn--xl[data-action="start-tables"]` (`btn_continue_learning`);
    - `[data-action="go-shop"]`;
    - un enlace discreto `button.btn--ghost[data-action="go-modes"]` (`btn_other_games`);
    - `[data-action="switch-player"]`.

    `refreshMenuStats` también rellena `#home-coins`.
  - **`startTablesRun()`.** Crea `state.run` con los mismos campos que `startRun` y además:
    - `kind: "tables"`;
    - `round: Tables.buildTablesRound(state.profile.tables, today, state.settings.tableStations)`;
    - `cursor: 0`;
    - `tablesBefore`: una copia JSON de `state.profile.tables`;
    - `stage: "ask"`.

    `total` es `state.settings.tableStations`. Oculta `#powerups` (`startRun` lo vuelve a mostrar) y llama a `nextTablesStation()`. `state.lastRunKind` guarda `"tables"` o `"classic"`, y `play-again` repite el mismo tipo.
  - **Posiciones.** `run.cursor` es la posición en `run.round` y `run.index` es la estación del mapa. Sin retroceso avanzan juntos; la Tarea 9 los separa.
  - **`nextTablesStation()`:**
    - Arma `activeTask = { type: "mul", operands: [a, b], text: a + " × " + b + " =", answer: a * b, choice: false, timed: false, item }`.
    - Pone `stage = "ask"`, vacía la entrada, muestra el teclado (`setupAnswerMode`) y oculta `#hint`.
    - Pone `taskStart = now()` y llama a `startStageTimer(HINT_DELAY_MS, enterHintStage)`.
  - **Temporizador de fase:** `startStageTimer(ms, fn)` y `clearStageTimer()`, con `state.stageTimerId` y `state.stageDeadline`.
    - La pausa guarda lo que falta y lo limpia; al reanudar, lo vuelve a programar con lo que faltaba. `taskStart` ya se desplaza al reanudar.
    - `goHome`, `goToProfiles`, `startRun`, `startTablesRun` y `finishRun` lo limpian.
  - **`submitAnswer`.** Con `state.run.kind === "tables"`, deriva a `submitTablesAnswer(value)`:
    - **Correcta:**
      - `outcome = Tables.classifyOutcome(stage, now() - taskStart)`.
      - `state.profile.tables = Tables.recordTablesAnswer(state.profile.tables, item, outcome, elapsed, Tables.localDateKey(new Date()))` y `saveProfiles()`.
      - Con `hint` o `answer`: `run.round = Tables.scheduleRetry(run.round, run.cursor)`.
      - Luego `rewardCorrect(outcome === "fast" || outcome === "slow")`, avanza `index` y `cursor` y programa `nextTablesStation` a los 750 ms (`state.nextTaskId`, como hoy).
    - **Incorrecta:** la racha vuelve a 0, el lorito anima y suena el pitido de error. Luego:
      - en `ask`, pasa a `enterHintStage()`;
      - en `hint`, pasa a `enterAnswerStage()`;
      - en `answer`, solo se vacía la entrada.

      **No se llama a `recordLearning`.** El registro antiguo por operación general no se toca en modo tablas.
  - **`rewardCorrect(firstTry)`.** Se extrae de `onCorrect`: racha, combo, estrellas, monedas, bonos, mensajes, lorito, vibración, sonido e hitos cada 5. El cálculo no cambia. `onCorrect` la llama.
  - **`enterHintStage()`:**
    - Pone `stage = "hint"` y limpia la entrada.
    - En `#hint` muestra `div.blocks` (una cuadrícula CSS de `a` filas × `b` columnas de `span.block`) y debajo `t(trick.key, trick.vars)`.
    - El lorito dice `tables_hint_intro`.
    - Llama a `startStageTimer(ANSWER_DELAY_MS, enterAnswerStage)`.
  - **`enterAnswerStage()`.** Pone `stage = "answer"` y limpia el temporizador. Añade a `#hint` la línea `t("tables_write_it", { q: a + " × " + b, answer })`. Sin temporizador.
  - **`finishRun()` en modo tablas:**
    - `n = Tables.newlyMastered(run.tablesBefore, state.profile.tables).length`.
    - `#sum-accuracy` = `n` y `#sum-accuracy-lbl` = `lbl_mastered_today`.
    - `#sum-progress-line` muestra `sum_mastered_one` (si `n === 1`), `sum_mastered` (si `n > 1`) o `sum_practiced` con el número de operaciones distintas de la ronda (si `n === 0`).
    - `#review-box` se oculta.

    En las rondas clásicas se restauran `lbl_accuracy` y la línea oculta.
- Textos nuevos (`es` / `en`):
  - `home_greeting`: "¡Hola, {name}! ¿Seguimos?" / "Hi, {name}! Shall we keep going?"
  - `btn_continue_learning`: "Seguir aprendiendo" / "Keep learning"
  - `btn_other_games`: "Otros juegos" / "Other games"
  - `tables_hint_intro`: "Mira los bloques. ¡Tú puedes!" / "Look at the blocks. You can do it!"
  - `tables_write_it`: "{q} = {answer}. ¡Escríbelo!" / "{q} = {answer}. Type it in!"
  - `lbl_mastered_today`: "Dominadas hoy" / "Mastered today"
  - `sum_mastered_one`: "¡Hoy dominaste 1 operación nueva!" / "Today you mastered 1 new fact!"
  - `sum_mastered`: "¡Hoy dominaste {n} operaciones nuevas!" / "Today you mastered {n} new facts!"
  - `sum_practiced`: "¡Hoy practicaste {n} operaciones! Cada ronda cuenta." / "Today you practised {n} facts! Every round counts."

- [ ] **Paso 1: Adaptar las pruebas existentes.**
  - Los bloques clásicos empiezan con `setProfileSettings({ mainMode: "mix" })`.
  - El ayudante `start()` pulsa el `[data-action="go-modes"]` visible, sea en `#screen-menu` o en `#screen-tables-home`.
- [ ] **Paso 2: Escribir la sección "tables mode"** en `tests/browser.test.js` (falla):
  - Se siembra el perfil "Ana": `mainMode: "tables"`, `setbacks: false`, `tableStations: 10`, `sound: false`, `timer: false`.
  - Ayudantes:
    - `typeAnswer(n)`: teclas en pantalla y "Comprobar";
    - `pressAnswer(n)`: teclado físico y Enter;
    - `factOf(text)`: devuelve la `key` de la pregunta;
    - `fact(key)`: lee la operación del perfil activo en `ms_profiles`.

```js
await pickProfile("Ana");
check(await page.locator("#screen-tables-home").evaluate((el) => el.classList.contains("is-active")) &&
  (await page.locator("#home-greeting").textContent()).includes("Ana"), "tables home for tables profile");
await page.locator('[data-action="start-tables"]').click();
check((await page.locator("#numpad .key").count()) === 12 && !(await page.locator("#choices").isVisible()) &&
  !(await page.locator("#powerups").isVisible()) && !(await page.locator("#timer-ring").isVisible()), "typing, no tray, no timer");
check((await page.locator("#map-progress").textContent()).includes(" de 10"), "profile station count");
// 1) fast answer is recorded as fast
let q = await current(); await pressAnswer(q.answer); await page.clock.runFor(800);
check((await fact(factOf(q))).fast === 1, "fast answer recorded");
// 2) silence: no hint before 5 s, hint at 5 s with a×b blocks
q = await current(); await page.clock.runFor(4900);
check(!(await page.locator("#hint").isVisible()), "no hint before 5 s");
await page.clock.runFor(200);
check(await page.locator("#hint").isVisible() && (await page.locator("#hint .block").count()) === q.answer, "hint blocks at 5 s");
// 3) answer shown 10 s later; a wrong entry there costs nothing; then the fact returns 3-4 stations later
await page.clock.runFor(10000);
check((await page.locator("#hint").textContent()).includes("= " + q.answer), "answer after +10 s");
const progressBefore = await page.locator("#map-progress").textContent();
await pressAnswer(q.answer === 1 ? 2 : 1);
check((await page.locator("#map-progress").textContent()) === progressBefore, "wrong in answer stage: same station");
await pressAnswer(q.answer); await page.clock.runFor(800);
check((await fact(factOf(q))).fast === 0, "needed answer resets fast count");
const upcoming = []; for (let i = 0; i < 4; i++) { const n = await current(); upcoming.push(factOf(n)); await pressAnswer(n.answer); await page.clock.runFor(800); }
check(upcoming.slice(2).includes(factOf(q)), "missed fact returns 3-4 stations later");
// 4) wrong before the hint -> hint at once; no auto-submit
q = await current(); await pressAnswer(q.answer === 1 ? 2 : 1);
check(await page.locator("#hint").isVisible(), "wrong answer shows hint immediately");
for (const d of String(q.answer)) await page.locator("#numpad .key", { hasText: new RegExp("^" + d + "$") }).click();
await page.clock.runFor(3000);
check((await current()).text === q.text, "no auto-submit");
await page.locator('[data-action="check"]').click(); await page.clock.runFor(800);
// 5) pause freezes the 5 s wait and is not counted as slowness
q = await current(); await page.clock.runFor(1000);
await page.locator('[data-action="pause"]').click(); await page.clock.runFor(20000); await page.locator('[data-action="resume"]').click();
check(!(await page.locator("#hint").isVisible()), "pause freezes hint wait");
const fastBefore = (await fact(factOf(q))).fast; await pressAnswer(q.answer); await page.clock.runFor(800);
check((await fact(factOf(q))).fast === fastBefore + 1, "paused time not counted");
// 6) quitting during a wait leaves no timer behind
await page.clock.runFor(1000); await quit(); await page.clock.runFor(30000);
check(await page.locator("#screen-tables-home").evaluate((el) => el.classList.contains("is-active")) &&
  !(await page.locator("#hint").isVisible()), "no stray timers after quit");
// 7) a full round: never moves back, summary shows progress not accuracy
await page.locator('[data-action="start-tables"]').click();
// answer all 10 stations correctly (some after the hint); "Estación n" never decreases
check((await page.locator("#sum-accuracy-lbl").textContent()) === "Dominadas hoy" &&
  !(await page.locator("#review-box").isVisible()) && await page.locator("#sum-progress-line").isVisible(), "tables summary");
// 8) phone width
await page.setViewportSize({ width: 390, height: 844 }); await page.locator('[data-action="play-again"]').click();
check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "tables game fits 390 px");
await page.screenshot({ path: path.join(root, ".cache", "mobile-tables.png"), fullPage: true });
```

`current()` debe devolver también `text`, la pregunta tal como se ve.

- [ ] **Paso 3: Ejecutar** → falla (no existe `#screen-tables-home`).
- [ ] **Paso 4: Implementar** lo de "Produce".
- [ ] **Paso 5: Verificar.** `npm test && npm run validate && npm run test:browser` → todo pasa. Mirar `.cache/mobile-tables.png`: las teclas son grandes y los bloques de la pista caben.
- [ ] **Paso 6: Commit.** `git add -A && git commit -m "feat: tables mode round with silent timing, hint blocks and answer stage"`

---

### Tarea 9: Modo tablas con retroceso o cronómetro visible (ajustes del perfil)

**Archivos:**

- Modificar: `app.js`, `tests/browser.test.js`

**Interfaces:**

- Consume: `goBackOnMiss`, `restartTimer`, `onTimeout`, `computeTimeBudget` (existentes); `run.cursor` y `run.index` (Tarea 8).
- Produce:
  - **Retroceso:**
    - En `enterAnswerStage`, si `state.settings.setbacks && !run.setbackDone`, se llama a `goBackOnMiss(3)` y se pone `run.setbackDone = true`. `nextTablesStation` vuelve a poner `setbackDone = false`.
    - El escudo no existe en modo tablas.
    - Si `run.cursor >= run.round.length`, se alarga la cola: `run.round = run.round.concat(Tables.buildTablesRound(state.profile.tables, today, 5))`.
    - La ronda termina cuando `run.index >= run.total`.
  - **Cronómetro visible:**
    - `nextTablesStation` pone `activeTask.timed = !!state.settings.timer`; `blitz` se ignora en modo tablas.
    - `restartTimer()` y `stopTimer()` se usan como en las rondas clásicas.
    - En modo tablas, `onTimeout` llama a `enterAnswerStage()` y nada más: ni `recordMiss`, ni `recordLearning`, ni `showSolution`.
    - El umbral de 3 s se sigue midiendo igual.

- [ ] **Paso 1: Pruebas que fallan.**
  - **Retroceso.** Perfil "Leo" con `setbacks: true` y `tableStations: 10`. Se contestan bien 4 estaciones. En la 5.ª se espera 15 s (pasa a la fase de respuesta) → `#map-progress` incluye "Estación 2". Se sigue contestando bien hasta el resumen. Comprobar que la ronda termina con el resumen de tablas y que el total de respuestas registradas (suma de `seen`) es mayor que 10.
  - **Cronómetro.** Perfil "Leo" con `timer: true`. Al empezar se ven `#timer-ring` y `#game-timer-chip`. Se corre el reloj el número de segundos de `#timer-num` más 0,2 s → `#hint` incluye `"= " + respuesta` (fase de respuesta).
  - **Por defecto** ("Ana"): nada de lo anterior (ya lo cubre la Tarea 8).
- [ ] **Paso 2: Ejecutar** → falla.
- [ ] **Paso 3: Implementar** lo de "Produce".
- [ ] **Paso 4: Verificar.** `npm test && npm run validate && npm run test:browser` → todo pasa.
- [ ] **Paso 5: Commit.** `git commit -am "feat: optional setbacks and visible timer in tables mode"`

---

## Fase D · Personajes y álbum

### Tarea 10: `characters.js`, personajes en el inicio y anuncios del lorito

**Archivos:**

- Crear: `characters.js`, `tests/characters.test.js`
- Modificar:
  - `index.html` (`<script src="characters.js" defer></script>` entre `tables.js` y `app.js`)
  - `service-worker.js` (`"./characters.js"` en la precaché)
  - `tests/offline.test.js` (`stores.size` 11)
  - `package.json` (prueba y `node --check characters.js`)
  - `.github/workflows/quality.yml`
- Modificar: `app.js`, `styles.css` (`.char-card`, `.char-row`), `tests/browser.test.js`

**Interfaces (`TableCharacters`):**

- `CHARACTERS`: 10 entradas `{ table, name, color, dark, melody: [[freq, ms], …] }`, con `table` de 1 a 10. Los nombres (iguales en `es` y `en`) son: 1 Pipo, 2 Duna, 3 Tico, 4 Lola, 5 Max, 6 Kiko, 7 Nube, 8 Rayo, 9 Mora, 10 Bruno. Los colores y las melodías los elige el implementador, con las reglas de la prueba.
- `ACCESSORIES = ["none", "hat", "glasses", "scarf", "crown"]`
- `characterSvg(table, fill, accessory) -> string`:
  - Un SVG `aria-hidden="true"` cuyo cuerpo son `table` bloques apilados: una columna para 1–5 y dos columnas para 6–10. Es la idea de "cantidad visible" del diseño, con dibujo propio.
  - Una capa gris de bloques `class="cb cb--empty"` y, encima, una capa de color de bloques `class="cb cb--fill"`, recortada desde abajo por un `clipPath` cuyo rectángulo lleva `data-fill="<fill>"` y mide `fill / 10` de la altura.
  - Ojos y sonrisa en el bloque de arriba.
  - Con un accesorio distinto de `none`, un `<g class="acc acc-<id>">`.
  - `fill` se limita a 0..10; un accesorio desconocido cuenta como `none`.

**En `app.js`:**

- `renderHomeCharacters()` dibuja en `#home-characters` 10 `button.char-card[data-table]`. Cada uno lleva `characterSvg(t, Tables.characterFill(tables, t), accesorio)` (de momento `"none"`; la Tarea 13 añade los accesorios), el nombre y `"{fill}/10"`. Se llama al mostrar el inicio de tablas.
- Al pulsar un personaje, el lorito dice `char_status`. La Tarea 12 cambia esto para que suene su canción.
- En `submitTablesAnswer`, después de registrar, para cada `t` de `Tables.factTables(key)`: `m = Tables.fillMilestone(fill antes, fill después)`. Si hay hito, `mascotSay(t("char_" + m, { name, n: t }))` y `showToast` con el mismo texto. Esto va después de `rewardCorrect`, para que no lo tape el elogio.
- Textos nuevos (`es` / `en`):
  - `home_characters_label`: "Tus personajes" / "Your buddies"
  - `char_status`: "{name} · tabla del {n} · {fill} de 10" / "{name} · {n} times table · {fill} of 10"
  - `char_first`: "¡{name} despertó! Es el personaje de la tabla del {n}." / "{name} woke up! It's the {n} times table buddy."
  - `char_half`: "¡{name} ya está a la mitad!" / "{name} is half full!"
  - `char_almost`: "¡Ya casi llenas a {name}, el personaje de la tabla del {n}!" / "You've almost filled {name}, the {n} times table buddy!"
  - `char_full`: "¡{name} está completo! ¡Dominaste la tabla del {n}!" / "{name} is complete! You mastered the {n} times table!"

- [ ] **Paso 1: Pruebas unitarias que fallan** (`tests/characters.test.js`):

```js
const C = require("../characters.js");
check(C.CHARACTERS.length === 10 && C.CHARACTERS.every((c, i) => c.table === i + 1), "one character per table 1-10");
check(new Set(C.CHARACTERS.map((c) => c.name)).size === 10 && new Set(C.CHARACTERS.map((c) => c.color)).size === 10, "unique names and colours");
const numberWords = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez"];
check(C.CHARACTERS.every((c) => !numberWords.includes(c.name.toLowerCase())), "own names, not number names");
check(new Set(C.CHARACTERS.map((c) => JSON.stringify(c.melody))).size === 10 &&
  C.CHARACTERS.every((c) => c.melody.length >= 3 && c.melody.length <= 6 &&
    c.melody.every(([f, ms]) => f >= 200 && f <= 1200 && ms >= 80 && ms <= 400)), "own short melodies");
const svg = C.characterSvg(7, 4, "none");
const count = (s, needle) => s.split(needle).length - 1;
check(svg.startsWith("<svg") && svg.includes('aria-hidden="true"') && count(svg, "cb cb--empty") === 7 &&
  count(svg, "cb cb--fill") === 7 && svg.includes('data-fill="4"') && !svg.includes("acc-"), "character svg");
check(C.characterSvg(3, 99).includes('data-fill="10"') && C.characterSvg(3, -1).includes('data-fill="0"'), "fill clamped");
check(C.characterSvg(1, 0, "crown").includes('class="acc acc-crown"') && !C.characterSvg(1, 0, "cape").includes("acc-"), "accessories");
```

- [ ] **Paso 2: Prueba de navegador que falla** (contexto aparte, con `page.clock.install({ time: new Date(2026, 9, 25, 10, 0) })`):
  - Se siembra "Ana" con todas las operaciones dominadas (`everMastered`, sin repaso pendiente) **salvo** `7-8`, que está en `practicing` con `fast: 2`, `fastDays: ["2026-10-24"]` y `lastSeen: "2026-10-24"`.
  - En el inicio hay 10 `.char-card`, y la del 7 muestra "9/10" y `data-fill="9"`.
  - Empieza la ronda y se contesta todo rápido. Al contestar `7-8`, `#mascot-bubble` o un `.toast` incluye "completo", y al volver al inicio la tarjeta del 7 muestra "10/10".
- [ ] **Paso 3: Ejecutar** → falla.
- [ ] **Paso 4: Implementar** `characters.js`, el cableado de "Archivos" y lo de `app.js`.
- [ ] **Paso 5: Verificar.** `npm test && npm run validate && npm run test:browser` → todo pasa. Mirar una captura del inicio (`.cache/tables-home.png`, que la prueba guarda): los 10 personajes son distintos y se reconocen.
- [ ] **Paso 6: Commit.** `git add -A && git commit -m "feat: one character per table that fills as facts are mastered"`

---

### Tarea 11: Álbum de 100 casillas en la zona de padres

**Archivos:**

- Modificar: `index.html` (nueva `#screen-album`; botón `[data-action="open-album"]` en `#screen-profile-edit`)
- Modificar: `app.js`, `styles.css`, `tests/browser.test.js`

**Interfaces:**

- Consume: `Tables.albumCells` (Tarea 7) y el perfil en edición (Tarea 3).
- Produce:
  - `#screen-album`, con:
    - volver `[data-action="back-edit"]`;
    - `h2#album-title` (`album_title` con `{name}`);
    - `#album-summary` (`album_summary`);
    - `#album-grid`: una cuadrícula de 11 × 11, con cabeceras 1–10 en la fila y la columna;
    - `#album-legend`, con las 4 casillas y sus textos.
  - Cada operación es un `div.album-cell[data-a][data-b][data-state]` que muestra `a × b` en letra pequeña. Su `title` es `album_cell_detail`, con `{q}`, `{seen}` y `{secs}` (`avgMs / 1000`, con un decimal según el idioma; `"–"` si no se ha visto).
  - Colores:
    - `new` gris `#d7dbe6`;
    - `practicing` `var(--c-gold)`;
    - `almost` `#b8e05a`;
    - `mastered` `var(--c-correct)`.
- Textos nuevos (`es` / `en`):
  - `btn_album`: "Ver álbum" / "View album"
  - `album_title`: "Álbum de {name}" / "{name}'s album"
  - `album_summary`: "{m} de 55 dominadas · {p} practicando" / "{m} of 55 mastered · {p} practising"
  - `album_new`: "Nueva" / "New"
  - `album_practicing`: "Practicando" / "Practising"
  - `album_almost`: "Casi dominada" / "Almost there"
  - `album_mastered`: "Dominada" / "Mastered"
  - `album_cell_detail`: "{q} · {seen} veces · {secs} s" / "{q} · {seen} times · {secs} s"

- [ ] **Paso 1: Prueba que falla.**
  - Se siembra "Ana" con `7-9` dominada, `3-4` en `practicing` con `fast: 1` y `2-2` en `practicing` con `fast: 0`.
  - Freno → editar Ana → "Ver álbum". Comprobar:
    - 100 `.album-cell`;
    - `[data-a="7"][data-b="9"]` y `[data-a="9"][data-b="7"]` con `data-state="mastered"`;
    - `[data-a="4"][data-b="3"]` con `almost`;
    - `[data-a="2"][data-b="2"]` con `practicing`;
    - `[data-a="5"][data-b="5"]` con `new`;
    - `#album-summary` incluye "1 de 55".
  - Comprobar también que `[data-action="open-album"]` solo existe dentro de `#screen-profile-edit`: la niña no lo ve.
- [ ] **Paso 2: Ejecutar** → falla.
- [ ] **Paso 3: Implementar.**
- [ ] **Paso 4: Verificar.** `npm test && npm run validate && npm run test:browser` → todo pasa. Revisar la captura `.cache/album.png` a 390 px de ancho: la cuadrícula cabe sin desbordar.
- [ ] **Paso 5: Commit.** `git add -A && git commit -m "feat: 100-cell fact album in the parents area"`

---

## Fase E · Música

### Tarea 12: Melodías de personajes y canción de presentación

**Archivos:**

- Modificar: `characters.js`, `tests/characters.test.js`
- Modificar: `index.html` (overlay `#intro-overlay`)
- Modificar: `app.js`, `styles.css`, `tests/browser.test.js`

**Interfaces:**

- Produce en `TableCharacters`: `introSequence(table) -> [{ value, freq, ms }] × 10`.
  - `value = table × k`, con `k` de 1 a 10.
  - `freq` sube en una escala pentatónica que empieza en 262 Hz.
  - `ms = 420`, salvo la última nota (700).
- Produce en `app.js`:
  - `playMelody(notes)`: no hace nada si `!state.settings.music`. Si no, encadena `beep` como `playVictoryMelody`, y `beep` ya respeta `sound`: **la música necesita `sound` y `music`**.
  - `playVictoryMelody` pasa a usar `playMelody`.
  - **Al llegar a un hito de personaje** (Tarea 10): `playMelody(personaje.melody)`.
  - **`showTableIntro(table, onDone)`.** Muestra `#intro-overlay` con:
    - `#intro-title` (`intro_title` con `{n}`);
    - el personaje;
    - `#intro-number`;
    - `#intro-blocks`, que crece `table` bloques en cada paso;
    - los botones `[data-action="intro-replay"]` y `[data-action="intro-done"]` (`btn_start`).

    Los pasos avanzan con temporizadores según `ms`, aunque la música esté apagada (el conteo visual siempre se ve). `intro-done` limpia los temporizadores, oculta el overlay y llama a `onDone`. `goHome` y `goToProfiles` también lo limpian.
  - **Al empezar una ronda:** `startTablesRun` calcula `Tables.tablesToPresent(run.round, tables)`. Si no está vacío, presenta cada tabla en orden antes de la primera estación. Al terminar cada una, `state.profile.tables = Tables.markPresented(…)` y `saveProfiles()`. Si se sale a mitad, la presentación se repite la próxima vez.
  - **A pedido:** en el inicio, al pulsar `.char-card`, se llama a `showTableIntro(table, renderHomeCharacters)`, sin marcar nada. Esto reemplaza el `char_status` de la Tarea 10, que pasa al `aria-label` de la tarjeta.
  - **Nunca durante la práctica:** `showTableIntro` no se llama desde ninguna función de estación.
- Textos nuevos (`es` / `en`):
  - `intro_title`: "Conoce la tabla del {n}" / "Meet the {n} times table"
  - `btn_replay`: "Otra vez" / "Again"

- [ ] **Paso 1: Pruebas que fallan.**
  - Unitaria: `introSequence(7)` da los valores `[7, 14, …, 70]`, con `freq` estrictamente creciente, 10 pasos y la última nota de 700 ms.
  - Navegador:
    - Un `addInitScript` cuenta las llamadas a `AudioContext.prototype.createOscillator` en `window.__osc`.
    - Se siembra "Ana" con la tabla 1 ya vista, `probes["2"].introduce = true`, `presented: []`, `sound: true` y `music: true`.
    - `start-tables` → se ve `#intro-overlay` y `#intro-title` incluye "2". `runFor(6000)` → `#intro-number` es "20" y `__osc > 0`. `intro-done` → `#screen-game` activo, y `presented` en el almacén incluye 2.
    - Volver al inicio y empezar otra ronda → no aparece el overlay.
    - Pulsar `.char-card[data-table="7"]` → overlay con "7"; `intro-done` → de vuelta en el inicio.
    - Con `music: false`: se pone `__osc = 0`, se abre la presentación del 7 y `runFor(6000)` → `__osc === 0`, pero `#intro-number` es "70".
- [ ] **Paso 2: Ejecutar** → falla.
- [ ] **Paso 3: Implementar.**
- [ ] **Paso 4: Verificar.** `npm test && npm run validate && npm run test:browser` → todo pasa.
- [ ] **Paso 5: Commit.** `git add -A && git commit -m "feat: character melodies and table introduction song"`

---

## Fase F · Tienda y colección

### Tarea 13: Tienda de modo tablas con cosméticos, y "Mis tesoros"

**Archivos:**

- Modificar: `app.js` (catálogo junto a `SHOP_BUDDIES`, `defaultProgress`, `normalizeProfile`, tienda, tema del mapa, melodía de victoria, accesorios, pantalla de tesoros)
- Modificar: `index.html` (`#screen-treasures`; botón `[data-action="go-treasures"]` en `#screen-tables-home` y en `#screen-menu`)
- Modificar: `styles.css` (`.map--ocean`, `.map--forest`, `.map--sunset`, `.map--galaxy`, `.cosmetic-card`, `.treasure-grid`, `.treasure-tile`)
- Modificar: `tests/profiles.test.js`, `tests/browser.test.js`

**Interfaces:**

- `SHOP_COSMETICS` (exportado), `{ id, kind, value, price, icon, es, en }`. La economía es de unas 20 monedas por ronda de 15:

| id              | kind        | value     | precio | icono | es        | en        |
| --------------- | ----------- | --------- | ------ | ----- | --------- | --------- |
| `acc-hat`       | `accessory` | `hat`     | 40     | 🎩    | Sombrero  | Top hat   |
| `acc-glasses`   | `accessory` | `glasses` | 50     | 👓    | Gafas     | Glasses   |
| `mel-marimba`   | `melody`    | `marimba` | 50     | 🎶    | Marimba   | Marimba   |
| `theme-ocean`   | `theme`     | `ocean`   | 60     | 🌊    | Océano    | Ocean     |
| `theme-forest`  | `theme`     | `forest`  | 60     | 🌲    | Bosque    | Forest    |
| `acc-scarf`     | `accessory` | `scarf`   | 60     | 🧣    | Bufanda   | Scarf     |
| `mel-fanfare`   | `melody`    | `fanfare` | 80     | 🎺    | Fanfarria | Fanfare   |
| `theme-sunset`  | `theme`     | `sunset`  | 90     | 🌅    | Atardecer | Sunset    |
| `acc-crown`     | `accessory` | `crown`   | 120    | 👑    | Corona    | Crown     |
| `theme-galaxy`  | `theme`     | `galaxy`  | 150    | 🌌    | Galaxia   | Galaxy    |

- `VICTORY_MELODIES = { classic: <las notas actuales de playVictoryMelody>, marimba: [...], fanfare: [...] }` (exportado).
- **Progreso.** `progress.cosmetics: []` (ids comprados) y `progress.equipped: { theme: "classic", accessory: "none", melody: "classic" }`.
  - `defaultProgress` los incluye.
  - `normalizeProfile` los completa. Si algo equipado no está comprado, o no existe, vuelve a su valor por defecto.
- **Tienda:**
  - Nueva sección `h3.shop-h-cosm` (`shop_cosmetics`) con `#shop-cosmetics`, que lleva un `button.cosmetic-card[data-cosmetic-id]` por artículo. Pulsar uno que no se tiene → se compra si alcanza (si no, `not_enough_coins`) y se equipa. Pulsar uno que se tiene → se equipa. Pulsar el equipado → se vuelve al valor por defecto.
  - Si `state.settings.mainMode === "tables"`, se ocultan `.shop-h-pu` y `#shop-powerups`.
- **Se aplica así:**
  - el tema, con la clase `map--<value>` en `.map` (en `startRun`, `startTablesRun` y al equipar);
  - el accesorio, como tercer parámetro de `characterSvg` en `renderHomeCharacters` y en la presentación;
  - la melodía, con `playVictoryMelody`, que toca `VICTORY_MELODIES[equipped.melody]`.
- **`#screen-treasures`**, con:
  - volver `[data-action="go-menu"]` (que va a `goHome`);
  - `#treasure-total` (`treasure_count`);
  - `#treasure-grid`, con 50 `.treasure-tile`: los que tiene, con su SVG y nombre; los demás, `.is-locked` con "?".
- Textos nuevos (`es` / `en`):
  - `shop_cosmetics`: "Para tus personajes y tu mapa" / "For your buddies and your map"
  - `shop_unequip`: "Quitar" / "Remove"
  - `btn_treasures`: "Mis tesoros" / "My treasures"
  - `treasures_title`: "Mis tesoros" / "My treasures"

- [ ] **Paso 1: Pruebas unitarias que fallan** (`tests/profiles.test.js`):

```js
check(app.SHOP_COSMETICS.length === 10 && new Set(app.SHOP_COSMETICS.map((c) => c.id)).size === 10 &&
  app.SHOP_COSMETICS.every((c) => ["theme", "accessory", "melody"].includes(c.kind) && c.price >= 40 && c.price <= 150 && c.es && c.en),
  "cosmetic catalogue");
check(app.SHOP_COSMETICS.filter((c) => c.kind === "melody").every((c) => Array.isArray(app.VICTORY_MELODIES[c.value])) &&
  Array.isArray(app.VICTORY_MELODIES.classic), "melodies exist");
assert.deepEqual(app.defaultProgress().equipped, { theme: "classic", accessory: "none", melody: "classic" });
const eq = (cosmetics, equipped) => app.normalizeProfile({ id: "p1", progress: { cosmetics, equipped } }).progress.equipped;
check(eq([], { theme: "ocean" }).theme === "classic" && eq(["theme-ocean"], { theme: "ocean" }).theme === "ocean" &&
  eq(["acc-crown"], { accessory: "cape" }).accessory === "none", "equipped must be owned");
```

- [ ] **Paso 2: Pruebas de navegador que fallan:**
  - "Ana" (tablas), con 200 monedas: en la tienda no se ven `#shop-powerups` ni el texto "Comodín".
  - Comprar Océano → 140 monedas y `equipped.theme === "ocean"`. `start-tables` → `.map` tiene la clase `map--ocean`.
  - Comprar Corona → 20 monedas, y en el inicio el SVG de `.char-card` incluye `acc-crown`.
  - Pulsar la Corona equipada → `accessory` vuelve a `"none"`.
  - El perfil "Jugador 1" (con `mainMode: "mix"`) sí ve "Comodín". La comprobación de hoy "shop purchase" debe ejecutarse con un perfil clásico.
  - "Mis tesoros": se siembra `collection` con dos ids reales de `TREASURES`. Hay 50 `.treasure-tile`, 48 de ellas `.is-locked`, y `#treasure-total` = "2 de 50 tesoros".
- [ ] **Paso 3: Ejecutar** → falla.
- [ ] **Paso 4: Implementar.**
- [ ] **Paso 5: Verificar.** `npm test && npm run validate && npm run test:browser` → todo pasa. Revisar a ojo los cuatro temas del mapa en capturas (`.cache/theme-*.png`).
- [ ] **Paso 6: Commit.** `git add -A && git commit -m "feat: cosmetic shop for tables mode and treasure collection screen"`

---

## Fase G · Cierre

### Tarea 14: Documentación, estado del backlog y verificación final

**Archivos:**

- Modificar: `docs/BACKLOG.md`, `CHANGELOG.md`, `README.md`
- Modificar: `app.js` (`howto_body` en `es` y `en`)

- [ ] **Paso 1: Actualizar `howto_body`** (`es` y `en`) para que hable de escribir el resultado, la pista con bloques, el lorito, los personajes y la tienda. Mantener una sola frase por idea y lenguaje de 8 años.
- [ ] **Paso 2: `docs/BACKLOG.md`:**
  - Hoja de ruta: las filas 1 y 2 pasan a "hecho (rama `feature/perfiles-y-tablas`)".
  - H-01, H-02, H-04, H-05, H-11 y H-12 pasan a `hecho`, con el commit correspondiente.
  - **H-03 no se cambia:** se anota que el modo tablas elige las operaciones y no hay selector manual de tabla, y se pregunta al usuario si pasa a `descartado`.
  - Todo lo que haya salido durante la implementación se añade como hallazgo `por-analizar`.
- [ ] **Paso 3: `CHANGELOG.md`.** En `[Unreleased]`, una sección `### Added` con perfiles y zona de padres, modo tablas, personajes, álbum, música, cosméticos y "Mis tesoros". Una sección `### Changed` con: ajustes solo en la zona de padres, "Otros juegos" respeta el perfil y caché PWA en v2.
- [ ] **Paso 4: `README.md`.** Un párrafo corto: perfiles, zona de padres (cómo entrar) y que todo queda en el dispositivo.
- [ ] **Paso 5: Verificación completa.**
  - `npm test && npm run validate && npm run test:browser`: todo pasa; anotar las líneas finales de cada prueba.
  - `npx --yes prettier --check app.js tables.js characters.js index.html styles.css service-worker.js tests docs`. Corregir el formato de los archivos tocados con `npx --yes prettier --write <esos archivos>`, nunca con `npm run format`, que reformatea todo.
- [ ] **Paso 6: Prueba a mano en tablet o emulación** (`npm start` y abrir en el navegador; se puede usar la skill `run`). Una ronda entera de modo tablas, comprobando:
  - Que no se ve ningún número de tiempo.
  - Que la pista aparece sola.
  - Que el lorito celebra.
  - Que el resumen dice "dominaste" o "practicaste".
  - Que la zona de padres pide la multiplicación.

  Anotar en el informe lo que se vio.
- [ ] **Paso 7: Commit.** `git add -A && git commit -m "docs: profiles and tables mode in changelog, readme and backlog"`
- [ ] **Paso 8: Integrar la rama** con la skill `superpowers:finishing-a-development-branch`. Al hacer merge a `main` se publica en GitHub Pages; confirmar con el usuario antes.
