# Backlog y hallazgos

Este archivo separa dos cosas a propósito:

- **Hallazgos**: cosas que se vieron al revisar el código. Todavía **no son trabajo comprometido**. Hay que analizarlas primero: confirmarlas, decidir si importan y cómo resolverlas.
- **Backlog**: hallazgos ya analizados y aceptados, con una decisión tomada.

Un hallazgo pasa al backlog solo cuando alguien lo analiza y lo acepta. Si se descarta, se queda aquí con el motivo para no volver a discutirlo.

## Estados

| Estado         | Significado                                      |
| -------------- | ------------------------------------------------ |
| `por-analizar` | Detectado, sin revisar. No planificar todavía.   |
| `aceptado`     | Analizado y aprobado. Pasa a la sección Backlog. |
| `descartado`   | Analizado y rechazado. Se anota el motivo.       |
| `hecho`        | Implementado. Se anota el commit.                |

## Origen y contexto

- Fecha: 2026-10-25.
- Base: revisión de `app.js` del clon (v1.3.0 del original, ya reducido a español/inglés).
- Objetivo del proyecto: que una niña aprenda de memoria las tablas de multiplicar.
- Las referencias de línea son de `app.js` en el commit `5bd7f7b` y pueden cambiar.

## Hoja de ruta

Trabajos con dirección decidida en la conversación del 2026-10-25 (diseño con niños con TDAH en mente). Cada uno necesita su documento de diseño aprobado y un plan antes de tocar código.

| #   | Trabajo                                                                                                                                                         | Estado                                     | Documento                                                                                                                                 |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Perfiles por niño y zona de padres (álbum de 100 casillas para padres)                                                                                          | hecho (rama `feature/perfiles-y-tablas`)   | `docs/superpowers/specs/2026-10-25-perfiles-y-modo-tablas-design.md`; plan: `docs/superpowers/plans/2026-10-25-perfiles-y-modo-tablas.md` |
| 2   | Modo para dominar las tablas: escribir el resultado, pista visual si tarda, repetición por operación, velocidad medida en silencio, un personaje por tabla      | hecho (rama `feature/perfiles-y-tablas`)   | mismo diseño y mismo plan                                                                                                                 |
| 3   | Multiplicación de varias cifras **paso a paso en columnas** (como en el cuaderno, con las cifras que se llevan); para el hermano de 6 años y luego para la hija | pendiente: diseñar en una sesión posterior | —                                                                                                                                         |
| —   | Backend / sincronización                                                                                                                                        | futuro, descartado por ahora (todo local)  | —                                                                                                                                         |

Lo ya decidido para el trabajo 3: el niño escribe cifra por cifra, de derecha a izquierda, con las llevadas; si falla, se ve en qué paso (opción B del boceto del 2026-10-25). Por decidir: tamaños de números (¿empezar por 2 cifras × 1?), si incluye suma y resta en columnas.

Hallazgos que absorbe el diseño 1+2: H-01, H-02, H-03, H-04, H-05, H-11, H-12. Los que salieron al implementarlo están en H-14 a H-20.

---

## Hallazgos

### Relevantes para memorizar las tablas

#### H-01 · La multiplicación es uniforme y sin memoria

- **Estado:** `hecho` (`905737c`: registro por operación con dominio y repaso espaciado; `a8e8b6d`: la operación fallada vuelve dentro de la ronda). Solo en el modo tablas.
- **Dónde:** `generateMultiplication` (`app.js:345`), `generateTask`, `nextTask`
- **Qué pasa:** `a` y `b` se eligen al azar entre 1 y 10, sin usar el nivel. No hay repetición espaciada. Un error solo baja el nivel general de multiplicación, no hace que esa operación vuelva a salir.
- **Por qué importa:** memorizar exige repetir más lo que se falla. Hoy una operación fallada puede no volver a aparecer en muchas partidas.
- **Ideas (sin decidir):** cola de errores guardada en `localStorage` con prioridad al elegir la siguiente tarea; peso por operación según aciertos y velocidad.
- **A analizar:** cómo ponderar sin que el juego se vuelva frustrante; si las conmutativas (`3×7` y `7×3`) cuentan como el mismo hecho.

#### H-02 · Siempre es opción múltiple

- **Estado:** `hecho` (`2c1a3e9`: el modo tablas siempre se responde escribiendo; `a41e254`: en los otros juegos el ajuste "botones en lugar de escribir" de cada perfil vuelve a funcionar).
- **Dónde:** `nextTask` fija `activeTask.choice = true` (`app.js:1652`); `setupAnswerMode`, `renderChoices`
- **Qué pasa:** el teclado numérico, el botón de comprobar, la entrada por teclado físico y el ajuste "botones en lugar de escribir" (`settings.choices`) son **código muerto**: el ajuste se guarda pero no cambia nada.
- **Por qué importa:** reconocer la respuesta entre varias es más fácil que recordarla, lo que va en contra de memorizar.
- **Ideas (sin decidir):** reactivar la respuesta escrita como modo de recuerdo, quizá combinada con dificultad (opciones al principio, escribir después); o eliminar el código y el ajuste si no se usan.
- **A analizar:** ¿la niña ya escribe números con comodidad? ¿teclado en pantalla en tablet? Hay que revisar que `validateAnswer` y las pruebas sigan cubriendo ese camino.

#### H-03 · No se puede elegir una tabla concreta

- **Estado:** `por-analizar`
- **Dónde:** `wireModeSelection` (`app.js:2564`), `createRoundModes`, pantalla de modos en `index.html`
- **Qué pasa:** solo hay suma, resta, multiplicación, división y mixto. No existe "solo la del 7".
- **Por qué importa:** es la forma natural de estudiar tablas: una a la vez, luego varias.
- **Ideas (sin decidir):** selector de tablas (1–10, una o varias) que acote `a` o `b` en el generador.
- **A analizar:** relación con H-01 (el selector y la ponderación se pisan) y con la división inversa.
- **Nota (2026-10-26):** el modo tablas (rama `feature/perfiles-y-tablas`) elige solo las operaciones de cada ronda según el orden de presentación de las tablas y el dominio de cada una; no hay selector manual de tabla. **Pregunta para el usuario:** ¿pasa a `descartado`?

#### H-04 · Los fallos no se conservan entre partidas

- **Estado:** `hecho` (`905737c`: cada operación guarda aciertos, tiempo medio, estado y fecha dentro del perfil).
- **Dónde:** `recordMiss` (`app.js:1845`), `renderReview`
- **Qué pasa:** el repaso final muestra hasta 6 operaciones falladas, pero solo de esa partida. `state.run.missed` se pierde al terminar.
- **Por qué importa:** es la base natural para H-01.
- **A analizar:** qué se guarda (operación, fecha, nº de fallos, tiempo) y cuánto crece en `localStorage`.

#### H-05 · No hay progreso visible por tabla ni vista para padres

- **Estado:** `hecho` (`e947c65`: un personaje por tabla que se llena al dominarla; `950c596`: álbum de 100 casillas en la zona de padres).
- **Dónde:** `state.progress.learning` guarda solo un nivel por operación (suma/resta/mul/div)
- **Qué pasa:** no se sabe qué operaciones concretas domina o le cuestan. El progreso no se ve ni para la niña ni para los padres.
- **Ideas (sin decidir):** cuadrícula 10×10 con color por dominio; pantalla simple para padres.
- **A analizar:** depende de H-04 (hay que registrar datos por operación). Cuidar que el original prometía "sin rastreo"; los datos deben quedarse en el dispositivo.

### Defectos y deuda técnica

#### H-06 · El bono diario usa hora UTC

- **Estado:** `por-analizar`
- **Dónde:** `grantDailyBonus` (`app.js:1541`) usa `new Date().toISOString().slice(0, 10)`
- **Qué pasa:** `toISOString()` devuelve fecha UTC. En Colombia (UTC−5) el "día" cambia a las 19:00 locales, así que el bono puede darse dos veces en la tarde-noche o no darse a la mañana siguiente.
- **A analizar:** usar la fecha local. `dailyTreasureIndex` ya usa fecha local (`getFullYear/getMonth/getDate`), así que ambas quedan inconsistentes. Hay que decidir si cambiarlo afecta a quien ya tiene `lastPlayed` guardado.

#### H-07 · Export duplicado en `module.exports`

- **Estado:** `por-analizar`
- **Dónde:** final de `app.js`, `I18N: I18N,` aparece dos veces
- **Qué pasa:** inofensivo, pero es ruido. Prettier/ESLint no lo marcan.
- **A analizar:** probablemente basta con borrar una línea.

#### H-08 · Textos accesibles estáticos solo en español

- **Estado:** `por-analizar`
- **Dónde:** atributos `aria-label` y `title` fijos en `index.html` (dificultad, racha, monedas, tiempo, respuestas, potenciadores, cofre, pausa)
- **Qué pasa:** no pasan por `data-i18n`, así que en inglés siguen en español. El original tenía el mismo problema pero en alemán.
- **A analizar:** si importa para este proyecto; la solución sería un atributo `data-i18n-aria` o asignarlos desde `applyI18n`.

#### H-09 · Las pruebas de navegador dependen de textos de la interfaz

- **Estado:** `por-analizar`
- **Dónde:** `tests/browser.test.js` (busca por texto como "Español", "Comodín", "Escudo", "Estación 2", " de 25")
- **Qué pasa:** cada cambio de redacción en `I18N` puede romper pruebas. Ya pasó al pasar del alemán al español.
- **A analizar:** usar atributos estables (`data-*`, ids) en lugar de texto.

#### H-13 · `app.js` mezcla toda la interfaz en un solo archivo

- **Estado:** `por-analizar`
- **Dónde:** `startApp()` en `app.js`: unas 1600 de sus 2800 líneas, con la tienda, el mapa, la ronda, los ajustes y, cuando se implemente el plan, los perfiles.
- **Qué pasa:** cualquier cambio en la interfaz obliga a moverse dentro de un archivo enorme que comparte `state` y `els` en una sola clausura. Leerlo cuesta mucho contexto y es fácil pisar algo sin querer.
- **Ideas (sin decidir):** separar la interfaz en archivos por área (`shop.js`, `map.js`, `profiles.js`…) con el mismo patrón que `tables.js` (variable global más `module.exports`, sin build). Habría que añadir cada archivo a `index.html` y a la caché de `service-worker.js`.
- **A analizar:** cuándo hacerlo (¿después del plan de perfiles, para no mezclar los dos cambios?), cómo compartir `state`, `els` y `t` entre archivos y cómo probarlo sin romper `tests/browser.test.js`.

### Salidos al implementar perfiles y modo tablas (2026-10-26)

Referencias por nombre de función, no por línea. Ninguno está aprobado: hay que analizarlos.

#### H-14 · Ritmo del modo tablas: pista, retroceso y cronómetro

- **Estado:** `por-analizar`
- **Dónde:** `enterHintStage`, `enterAnswerStage`, `nextTablesStation`, `restartTimer`, `computeTimeBudget`
- **Qué pasa:**
  - Al aparecer la pista a los 5 s se borra lo que la niña ya estaba tecleando (`currentInput = ""`). Es una decisión de producto: ¿conservarlo?
  - Con el retroceso activado, la ronda puede rebotar entre las estaciones 1 y 2 y crecer sin fin (`Tables.appendRound` añade 5 operaciones cada vez que se agota). Habría que poner un tope.
  - Con el cronómetro visible, 1×1 recibe unos 6 s y la pista se ve ~1 s antes de agotarse. El presupuesto sale de `computeTimeBudget` con las estadísticas del modo clásico, que el modo tablas no actualiza.
- **A analizar:** si se conserva lo tecleado; tope de estaciones extra con retroceso; presupuesto propio para el modo tablas o no mostrar cronómetro durante la pista.

#### H-15 · Premios, contadores y potenciadores en la pantalla de juego

- **Estado:** `por-analizar`
- **Dónde:** `rewardCorrect`, `evaluateBadges`, `finishRun`, `startRun`/`startTablesRun`, `removeTwoWrong`
- **Qué pasa:**
  - Con el cronómetro activado, el bono de una moneda por tiempo y `blitzWins` (insignia "speedy") también se suman desde el modo tablas.
  - Las insignias del modo clásico (rachas, "Maestro del combo", "Primer tesoro") también se ganan en el modo tablas: en la emulación de la primera ronda salieron cuatro.
  - Los contadores de racha y monedas de la pantalla de juego no se reinician al empezar una ronda (ya pasaba antes de la rama).
  - En los otros juegos, con un perfil que responde escribiendo, el botón del potenciador 50:50 sigue a la vista pero no hace nada (no hay botones que quitar; tampoco se gasta).
- **A analizar:** qué premios del modo clásico tienen sentido en el modo tablas; ocultar o desactivar el 50:50 al escribir.

#### H-16 · Música y presentación de tablas

- **Estado:** `por-analizar`
- **Dónde:** `playMelody`, `playVictoryMelody`, `showTableIntro`, `presentTables`
- **Qué pasa:**
  - `playVictoryMelody` pasa por `playMelody`, que ahora exige `music` además de `sound`: en el modo clásico, con la música apagada, ya no suena la melodía de victoria.
  - Una melodía nueva corta la que está sonando.
  - El título de la presentación no se retraduce si cambia el idioma con ella abierta.
  - Los personajes de las tablas 1 y 2 se ven pequeños en la presentación.
  - Si en una ronda entran varias tablas nuevas, salen varias presentaciones seguidas, cada una con su "¡Vamos!".
- **A analizar:** si la melodía de victoria debe depender solo de `sound`; si conviene una sola presentación para varias tablas.

#### H-17 · Tesoros y tienda de tablas

- **Estado:** `por-analizar`
- **Dónde:** `revealTreasure`, `renderTreasures`, clave `treasure_count`, `renderShop`/`renderCosmetics`, `.buddy-card` en `styles.css`
- **Qué pasa:**
  - `revealTreasure` cuenta con `collection.length` y puede no coincidir con "Mis tesoros" si hay ids huérfanos en la colección.
  - `treasure_count` lleva el total "50" escrito en el texto.
  - `.buddy-card` no tiene `font: inherit`.
  - En la tienda de tablas los compañeros compiten con los cosméticos por las mismas monedas, y la tienda es larga en móvil.
- **A analizar:** contar solo tesoros válidos; tomar el total de `TREASURES.length`; si los compañeros deben salir en la tienda de tablas.

#### H-18 · Accesibilidad de las piezas nuevas

- **Estado:** `por-analizar`
- **Dónde:** `buildNumpad`, `renderAlbum`/`albumCell`, `.char-count` en `styles.css`, `nextTablesStation`
- **Qué pasa:**
  - Las teclas del numpad no tienen un atributo estable (`data-key`); las pruebas las buscan por texto (relacionado con H-09).
  - Las casillas del álbum no tienen `role="img"` (o equivalente) para leer su estado.
  - Contraste y tamaño del texto del álbum (6–7 px) y de `.char-count` (0.7rem) son bajos.
  - En el modo tablas `run.attemptsOnCurrent` se pone a 0 pero no se usa.
- **A analizar:** cuáles merecen la pena; se puede hacer junto con H-08 y H-09.

#### H-19 · Robustez de datos y de la zona de padres

- **Estado:** `por-analizar`
- **Dónde:** `normalizeProfileStore` (`seen = {}`), `normalizeCosmetics` (`known = {}`), `DATE_RE` en `tables.js`, `recordTablesAnswer`, `openGate`/`closeGate`, campo `#edit-name`
- **Qué pasa:**
  - Los objetos `seen` y `known` heredan de `Object.prototype`: un id como "constructor" se trataría como ya visto.
  - `DATE_RE` acepta fechas imposibles (p. ej. `2026-13-45`).
  - `recordTablesAnswer` lanza un error si recibe una clave de operación desconocida.
  - El control de padres no se cierra con Escape ni devuelve el foco al botón que lo abrió.
  - `#edit-name` solo guarda el nombre al salir del campo.
- **A analizar:** usar `Object.create(null)`; validar la fecha de verdad; ignorar claves desconocidas; Escape y foco en el control; guardar al escribir.

#### H-20 · "Cómo jugar" solo se abre desde el menú clásico

- **Estado:** `por-analizar`
- **Dónde:** botón `go-howto` (solo en `#screen-menu`), `howto_body`
- **Qué pasa:** el texto de "Cómo jugar" describe el modo tablas (escribir, bloques, personajes), pero el botón solo está en el menú de los otros juegos. Un perfil de tablas no llega a esa pantalla, y quien la ve juega con botones por defecto, sin bloques ni personajes.
- **A analizar:** poner "Cómo jugar" en el inicio de tablas, o tener un texto por modo.

### Limitaciones de diseño heredadas

#### H-10 · El progreso vive solo en un dispositivo y navegador

- **Estado:** `por-analizar`
- **Dónde:** `localStorage` (`ms_lang`, `ms_settings`, `ms_progress`)
- **Qué pasa:** no hay copia ni sincronización. Borrar datos del navegador, cambiar de tablet o usar modo privado pierde monedas, tesoros e historial.
- **Ideas (sin decidir):** exportar/importar el progreso como archivo JSON. Una sincronización en la nube chocaría con "sin servidor ni rastreo".
- **A analizar:** importancia según cuánto se acumule (H-04 y H-05 harían que perder datos duela más).

#### H-11 · Un error castiga mucho (retroceso de 3 estaciones, sin reintento)

- **Estado:** `hecho` (`2c1a3e9`: en el modo tablas un fallo no retrocede, da más ayuda y pide escribir la respuesta; `08cd768`: retroceso opcional por perfil; `a41e254`: los otros juegos respetan ese ajuste).
- **Dónde:** `onWrong`, `goBackOnMiss(3)`, `showSolution` (`app.js:1823–1900`)
- **Qué pasa:** un error muestra la solución, retrocede 3 estaciones y luego avanza 1, así que el neto es −2 y esa estación se repite. Con el cronómetro, un tiempo agotado hace lo mismo.
- **A analizar:** si frustra a la niña. Es una decisión de diseño del original; podría ser configurable. Tampoco se pide que repita la respuesta correcta, y escribirla o repetirla ayuda a fijarla.

#### H-12 · Los ajustes y el nivel adaptativo no distinguen entre niñas/niños

- **Estado:** `hecho` (`2e6f1e8`: modelo de perfiles y migración; `856274e`: pantalla "¿Quién juega?" y un perfil por niño).
- **Dónde:** `state.progress` es único por navegador
- **Qué pasa:** si más de una persona usa el mismo dispositivo, comparten nivel, monedas y logros.
- **A analizar:** solo importa si hay más de un usuario.

---

## Backlog

_(vacío: ningún hallazgo ha sido analizado y aceptado todavía)_

Formato sugerido al aceptar un hallazgo:

```
### B-01 · Título
- Origen: H-0X
- Decisión: qué se va a hacer y qué no
- Criterio de terminado: cómo se sabe que está hecho
- Prioridad:
- Estado: aceptado
```

## Descartados

_(ninguno)_
