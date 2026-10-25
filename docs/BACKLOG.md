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

| #   | Trabajo                                                                                                                                                         | Estado                                       | Documento                                                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| 1   | Perfiles por niño y zona de padres (álbum de 100 casillas para padres)                                                                                          | plan escrito; falta revisarlo                | `docs/superpowers/specs/2026-10-25-perfiles-y-modo-tablas-design.md`; plan: `docs/superpowers/plans/2026-10-25-perfiles-y-modo-tablas.md` |
| 2   | Modo para dominar las tablas: escribir el resultado, pista visual si tarda, repetición por operación, velocidad medida en silencio, un personaje por tabla      | plan escrito (junto con 1); falta revisarlo  | mismo diseño y mismo plan                                            |
| 3   | Multiplicación de varias cifras **paso a paso en columnas** (como en el cuaderno, con las cifras que se llevan); para el hermano de 6 años y luego para la hija | pendiente: diseñar en una sesión posterior   | —                                                                    |
| —   | Backend / sincronización                                                                                                                                        | futuro, descartado por ahora (todo local)    | —                                                                    |

Lo ya decidido para el trabajo 3: el niño escribe cifra por cifra, de derecha a izquierda, con las llevadas; si falla, se ve en qué paso (opción B del boceto del 2026-10-25). Por decidir: tamaños de números (¿empezar por 2 cifras × 1?), si incluye suma y resta en columnas.

Hallazgos que absorbe el diseño 1+2: H-01, H-02, H-03, H-04, H-05, H-11, H-12.

---

## Hallazgos

### Relevantes para memorizar las tablas

#### H-01 · La multiplicación es uniforme y sin memoria

- **Estado:** `por-analizar`
- **Dónde:** `generateMultiplication` (`app.js:345`), `generateTask`, `nextTask`
- **Qué pasa:** `a` y `b` se eligen al azar entre 1 y 10, sin usar el nivel. No hay repetición espaciada. Un error solo baja el nivel general de multiplicación, no hace que esa operación vuelva a salir.
- **Por qué importa:** memorizar exige repetir más lo que se falla. Hoy una operación fallada puede no volver a aparecer en muchas partidas.
- **Ideas (sin decidir):** cola de errores guardada en `localStorage` con prioridad al elegir la siguiente tarea; peso por operación según aciertos y velocidad.
- **A analizar:** cómo ponderar sin que el juego se vuelva frustrante; si las conmutativas (`3×7` y `7×3`) cuentan como el mismo hecho.

#### H-02 · Siempre es opción múltiple

- **Estado:** `por-analizar`
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

#### H-04 · Los fallos no se conservan entre partidas

- **Estado:** `por-analizar`
- **Dónde:** `recordMiss` (`app.js:1845`), `renderReview`
- **Qué pasa:** el repaso final muestra hasta 6 operaciones falladas, pero solo de esa partida. `state.run.missed` se pierde al terminar.
- **Por qué importa:** es la base natural para H-01.
- **A analizar:** qué se guarda (operación, fecha, nº de fallos, tiempo) y cuánto crece en `localStorage`.

#### H-05 · No hay progreso visible por tabla ni vista para padres

- **Estado:** `por-analizar`
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

### Limitaciones de diseño heredadas

#### H-10 · El progreso vive solo en un dispositivo y navegador

- **Estado:** `por-analizar`
- **Dónde:** `localStorage` (`ms_lang`, `ms_settings`, `ms_progress`)
- **Qué pasa:** no hay copia ni sincronización. Borrar datos del navegador, cambiar de tablet o usar modo privado pierde monedas, tesoros e historial.
- **Ideas (sin decidir):** exportar/importar el progreso como archivo JSON. Una sincronización en la nube chocaría con "sin servidor ni rastreo".
- **A analizar:** importancia según cuánto se acumule (H-04 y H-05 harían que perder datos duela más).

#### H-11 · Un error castiga mucho (retroceso de 3 estaciones, sin reintento)

- **Estado:** `por-analizar`
- **Dónde:** `onWrong`, `goBackOnMiss(3)`, `showSolution` (`app.js:1823–1900`)
- **Qué pasa:** un error muestra la solución, retrocede 3 estaciones y luego avanza 1, así que el neto es −2 y esa estación se repite. Con el cronómetro, un tiempo agotado hace lo mismo.
- **A analizar:** si frustra a la niña. Es una decisión de diseño del original; podría ser configurable. Tampoco se pide que repita la respuesta correcta, y escribirla o repetirla ayuda a fijarla.

#### H-12 · Los ajustes y el nivel adaptativo no distinguen entre niñas/niños

- **Estado:** `por-analizar`
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
