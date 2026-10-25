# Perfiles y modo para dominar las tablas — diseño

> **Estado: APROBADO por el usuario el 2026-10-25.** Siguiente paso: plan de implementación con `superpowers:writing-plans`.

- Fecha de inicio: 2026-10-25
- Proyecto: Tablas del Tesoro (`app.js`, `index.html`, `styles.css`, PWA sin backend)
- Cubre los trabajos **1 (perfiles y zona de padres)** y **2 (modo para dominar las tablas)** de la hoja de ruta en `docs/BACKLOG.md`. El trabajo 3 (multiplicación en columnas) va en otro documento.

## Intención y el porqué

La hija del autor tiene 8 años, TDAH y está en tercero de primaria en Colombia. Entiende la multiplicación y tiene estrategias, pero **no recuerda las tablas de forma automática**: para `7 × 9` reconstruye el resultado o suma, y eso le toma tiempo. En el colegio ya hay exámenes con tiempo limitado y multiplicaciones de 3 o más cifras, donde cada operación de tabla lenta se repite muchas veces. El colegio le da adaptaciones (más tiempo, menos ejercicios), pero el objetivo es que **supere el tema y se las aprenda de memoria**.

No es un problema de memoria: se aprende canciones largas con facilidad. Le engancharon las canciones de **Numberblocks** (personajes por número, cantidades visibles como bloques, música). Le gusta **coleccionar cosas y desbloquear personajes**. **El cronómetro la bloquea: se pone nerviosa con el tiempo.**

El sitio debe seguir siendo **genérico** para que cualquier niño practique las cuatro operaciones, incluido su hermano de 6 años, que ya se sabe las tablas y va adelantado.

### Cómo se usa

- En una tablet, unos 10 minutos al día, a veces sola (sin adulto guiando).

## Qué cuenta como éxito

- Que responda las tablas **de inmediato, sin contar ni reconstruir**.
- _(Suposición del diseñador, sin objeción del usuario)_ Fracaso sería que la app se vuelva otra fuente de frustración o presión de tiempo.
- _(Suposición del diseñador)_ Las multiplicaciones de varias cifras no son objetivo directo de este diseño: mejoran solas cuando las tablas son automáticas.

## Evidencia que respalda el diseño

Base empírica pequeña (mayoría de estudios con 1–5 niños); se usa como orientación:

- **Recuperar de memoria > repasar o cantar** (estudio 2023, 48 niños de 2.º grado): practicar recordando dio más fluidez que repetir/cantar, y duró una semana después. Las canciones sirven para enganchar, no para fijar.
- **Ensayo incremental**: ~1 operación nueva por cada 8–9 conocidas (≈90 % conocidas). Efectos grandes con niños con dificultades de aprendizaje.
- **Demora constante**: mostrar la operación, esperar ~4 s y, si no responde, dar la respuesta para que la repita. Casi sin errores. Funcionó mejor con fichas canjeables (economía de fichas).
- **Ráfagas cortas**: con niños con TDAH, 3 ráfagas de 20 s rindieron más que 1 minuto seguido.
- **Aversión a la espera en TDAH**: retroalimentación y premios inmediatos, metas cortas visibles. Cuidado con exceso de premios externos.
- **Presión de tiempo**: el cronómetro ayuda solo cuando ya hay dominio parcial; al principio, mejor sin él.

Fuentes en la conversación del 2026-10-25 (Brady y Kubina 2010; Open Universiteit 2023; Codding et al.; Sonuga-Barke; Boaler; Frontiers in Education 2025).

## Metas

### Trabajo 1 · Perfiles y zona de padres

- Al abrir la app: pantalla **"¿Quién juega?"** con un avatar por niño. _(decidido por el usuario)_
- Cada perfil tiene **su propio progreso, colección y ajustes**: cronómetro sí/no, opción múltiple o escribir, retroceso en el mapa sí/no. _(decidido)_
- **Zona de padres** protegida con algo sencillo (resolver una multiplicación de dos cifras o mantener presionado un botón). Desde ahí se crean perfiles, se eligen sus ajustes y se ve el álbum. _(decidido; el mecanismo exacto de protección queda al constructor)_
- **Todo local** en la tablet (`localStorage`). Sin backend por ahora. _(decidido)_

### Trabajo 2 · Modo para dominar las tablas

- **Escribir el resultado** (recordar), no elegir entre opciones. _(decidido, boceto 1)_
- **Sin cronómetro visible** para su perfil. La velocidad se **mide en silencio**. _(decidido)_
- Si tarda unos 5 s: **pista visual** con calma — rectángulo de bloques (p. ej. 7 filas de 9) y un truco ("7 × 10 = 70, menos 7"). _(decidido, boceto 1)_
- Si aun así no sale: se muestra la respuesta y **ella la escribe**; la operación **vuelve más tarde en la misma ronda**. _(decidido, boceto 1)_
- La app **recuerda cada operación por separado** y repite más las que cuestan, con pocas nuevas mezcladas entre muchas conocidas. _(decidido en principio)_
- **Colección en dos capas** _(decidido: opciones A y C del boceto 2)_:
  - **A · Un personaje por tabla (1–10)**, al estilo Numberblocks, que se va "llenando" al dominar las operaciones de esa tabla. Mide aprendizaje real. No se compra con monedas.
  - **C · Se mantienen los 50 tesoros y los acompañantes** con monedas: premian la constancia (volver cada día, terminar la ronda).
- **Álbum de 100 casillas** (gris = nueva, amarillo = practicando, verde = dominada) como **vista para padres**, para ver qué operaciones le cuestan. No lo ve la niña. _(decidido)_
- El **retroceso de estaciones** al fallar no le sirve a ella, pero puede servir a otros niños: queda como **ajuste por perfil**. _(decidido)_
- La **opción múltiple y el cronómetro** siguen disponibles como ajustes para otros perfiles (p. ej. su hermano). _(decidido)_

### Estructura de una sesión (~10 min) _(aprobada por el usuario)_

Contexto: la niña ya probó la versión actual (aventura básica sin tiempo, acompañante "niño"). Le gustó en general y en especial **los ánimos del lorito**; lo que quiso comprar en la tienda fue el **escudo** (no ser penalizada al fallar).

- **Se mantiene el viaje por el mapa**: estaciones, tesoro al final, monedas y tienda. Cambia _qué_ operaciones salen: las elige el modo de tablas.
- **El lorito es el guía**: da la pista visual cuando tarda, celebra y anuncia logros de la colección ("¡Ya casi llenas al personaje de la tabla del 7!").
- **Sin castigo en su perfil**: fallar no hace retroceder; se muestra la respuesta, la escribe y la operación vuelve más tarde en la ronda.
- El **escudo se oculta en la tienda** cuando el retroceso está apagado en el perfil.
- **15 estaciones por defecto**, ajustable por perfil desde la zona de padres (hoy: 10 rápida / 25 normal). Afinar con los tiempos medidos.
- **Final**: tesoro y resumen como ahora, pero el resumen destaca el avance ("hoy dominaste 2 operaciones nuevas") en lugar del porcentaje de aciertos.

### Motor de aprendizaje de tablas _(propuesto por el diseñador, aprobado por el usuario)_

- **55 operaciones únicas** (pares `a ≤ b`, 1–10); `7 × 9` y `9 × 7` son la misma, pero se preguntan en ambos sentidos.
- **Estados**: nueva → practicando → dominada.
- **Dominada** = correcta en **< 3 s, sin pista, 3 veces, en ≥ 2 días distintos**. Correcta pero lenta cuenta como acierto, no como "rápida". Si necesitó pista o respuesta, se reinicia su cuenta de rápidas.
- **Descubrimiento inicial**: las primeras rondas recorren todas las operaciones para detectar las que ya salen rápido; esas quedan "casi dominadas" y se confirman otro día.
- **Orden de introducción** de lo no sabido: tablas 1, 2, 5, 10 → 3, 4, 9 → 6, 7, 8.
- **Composición de una ronda de 15**: ~2 operaciones nuevas, cada una ~3 veces y espaciadas; ~90 % practicando/conocidas. Una fallada vuelve 3–4 estaciones después.
- **Repaso espaciado** de dominadas: a 1, 3, 7 y 14 días. Si falla en repaso, vuelve a "practicando" en el álbum de padres.
- **Nunca se quita nada coleccionado**: el personaje no se vacía aunque una operación vuelva a "practicando".
- Para el hermano, las mismas reglas lo llevan a dominar casi todo en pocos días; su siguiente reto es el trabajo 3.

### Música _(propuesta del diseñador, aprobada por el usuario)_

La música motiva; no es el método principal (recordar fija más que cantar).

- **Melodía corta propia de cada personaje**, que suena cuando avanza o se desbloquea.
- **Canción de presentación al empezar una tabla nueva**: conteo rítmico (7, 14, 21…) para conocerla antes de practicarla. Solo la primera vez o a pedido, nunca en medio de la práctica.
- **Todo original y sintetizado** con Web Audio, como los sonidos actuales; sin archivos de audio ni canciones de terceros. Sin voz cantada (limitación aceptada).
- **Se puede apagar por perfil.**

### Inicio y menú _(opción B del boceto, elegida por el usuario)_

- Tras "¿Quién juega?", la **pantalla de inicio depende del perfil**. Desde la zona de padres se elige el **modo principal** de cada niño.
- Para un perfil cuyo modo principal es "tablas": saludo con el lorito, **personajes a la vista**, un **botón grande "Seguir aprendiendo"** (ronda de hoy), accesos a Tienda y Mis tesoros, y un enlace discreto a **"Otros juegos"** (suma, resta, multiplicación libre, división, mixto).
- Motivo: un único botón claro reduce decisiones al empezar (TDAH).
- Para otros perfiles, el modo principal puede ser cualquiera de los actuales.

## No metas (de este documento)

- Multiplicación de varias cifras en columnas → trabajo 3, documento aparte.
- Backend, cuentas o sincronización entre dispositivos → posible trabajo futuro.
- Más idiomas además de español e inglés.

## Restricciones

- JavaScript puro, sin build ni dependencias de ejecución; PWA offline (mantener `service-worker.js` y subir `CACHE_VERSION`).
- Textos en `I18N` de `app.js`, en `es` y `en`.
- Privacidad: los datos no salen del dispositivo.
- No usar personajes, nombres ni música de Numberblocks (propiedad de terceros): se toma la **idea** (personajes por número, cantidades visibles), con diseños propios. _(decisión del diseñador)_
- Conservar lo que ya funciona para el resto de modos (suma, resta, división, mixto).

## Decisiones del diseñador (para revisar)

- Umbrales del motor de aprendizaje (ver sección propia), aprobados por el usuario.
- `7 × 9` y `9 × 7` cuentan como la **misma operación aprendida**: dominarla suma a ambas tablas.
- Personajes con diseño propio (SVG/CSS como los tesoros actuales), no copias de Numberblocks.

### Decisiones tras la revisión del constructor _(del diseñador; el usuario puede cambiarlas)_

1. **Ciclo de una estación en modo tablas** (sigue la técnica de demora constante):
   - Se muestra la operación; ella escribe y confirma.
   - Si responde **mal antes de la pista**, o pasan **~5 s** sin respuesta → aparece la **pista visual** (bloques + truco) y tiene **otro intento**, sin límite de tiempo visible.
   - Si responde **mal después de la pista**, o pasan **~10 s más** → se muestra la **respuesta** y ella la escribe para continuar.
   - Correcta sin pista y rápida → cuenta como rápida. Correcta tras pista → "necesitó pista". Tras ver la respuesta → "necesitó respuesta". En ambos casos se reinicia su cuenta de rápidas y la operación vuelve 3–4 estaciones después.
   - Un error **nunca** suma retroceso si el perfil lo tiene apagado.
2. **Descubrimiento inicial dentro de la regla del ~90 %**: no se hace una ronda de diagnóstico aparte. Cada ronda "sondea" unas pocas operaciones aún no vistas, **siguiendo el orden de introducción** (1, 2, 5, 10 → 3, 4, 9 → 6, 7, 8). Si una tabla sale rápida en los sondeos, sus operaciones restantes se sondean antes; si falla 2 operaciones de una tabla, esa tabla pasa a "por introducir" y se deja de sondear. Una respuesta rápida en un sondeo **cuenta como 1 de las 3 rápidas**; "casi dominada" se confirma cumpliendo la regla normal (3 rápidas en ≥ 2 días).
3. **Los ajustes salen de las pantallas de los niños**: cronómetro, relámpago, rápida, opción múltiple, retroceso, duración, música y modo principal se configuran **solo en la zona de padres**, por perfil. "Otros juegos" **respeta los ajustes del perfil** (para ella: sin cronómetro y sin retroceso también allí).
4. **El modo tablas siempre es escribir**; la opción múltiple no aplica en este modo. El cronómetro visible **sí** puede activarse en el perfil (p. ej. el hermano), pero el umbral de dominio se mide igual, en silencio.
5. **Solo el modo tablas actualiza el registro por operación y el álbum.** Las respuestas en "Otros juegos" no cuentan (con opción múltiple, una respuesta rápida no prueba que la recuerde).
6. **Medición de los 3 s**: desde que aparece la operación hasta que pulsa **confirmar**. Sin envío automático (revelaría cuántas cifras tiene la respuesta). Si en la práctica el umbral resulta inalcanzable en tablet, se ajusta (p. ej. 3,5 s) con los datos medidos.

### Tienda en modo tablas _(decidido por el usuario: opción a)_

- En modo tablas se **ocultan todos los potenciadores** (comodín, 50:50, tiempo extra, escudo): o sabotean el recuerdo o no sirven al escribir sin cronómetro. Siguen disponibles en "Otros juegos" para perfiles que los usen.
- Se **añaden artículos nuevos, solo cosméticos**, que no afectan el aprendizaje, para que las monedas sigan teniendo valor. Ejemplos: accesorios para los personajes de las tablas, temas de color del mapa, melodías nuevas. Catálogo concreto y precios: al constructor, en línea con la economía actual (acompañantes de 80 a 320 monedas; hoy se gana hasta ~1 moneda por acierto al primer intento más bonos de racha, unas 20 por ronda de 15).

## Pendiente de decidir (dónde se quedó la conversación)

- Nada pendiente. Documento aprobado; siguiente paso: plan de implementación (`superpowers:writing-plans`).

## Lo que queda al constructor

- Estructura de datos por perfil en `localStorage` y migración del progreso actual (`ms_progress`) a un primer perfil.
- Mecanismo exacto de protección de la zona de padres.
- Detalles visuales de pantallas, animaciones y personajes.
