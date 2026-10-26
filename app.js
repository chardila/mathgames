/*
 * Tablas del Tesoro - app.js
 * Vanilla JavaScript game engine for an offline math adventure.
 *
 * Structure:
 *   1. Language list + i18n dictionary (English is the canonical fallback).
 *   2. Pure math generators + validation helpers (also exported for tests).
 *   3. Persistent storage helpers (localStorage).
 *   4. UI controller (screens, number pad, adventure map, rewards).
 *
 * The math/i18n core is written so it can run under Node.js for unit tests:
 * all DOM/browser access is guarded and the bootstrap only runs in a browser.
 */

"use strict";

/* ================================================================== */
/* 1. Languages + i18n dictionary                                      */
/* ================================================================== */

// Order matters: Spanish is first (default). Native labels are used in the UI.
var LANGUAGES = [
  {
    code: "es",
    label: "Espa\u00f1ol",
    flag: "\uD83C\uDDEA\uD83C\uDDF8",
    dir: "ltr",
  },
  {
    code: "en",
    label: "English",
    flag: "\uD83C\uDDEC\uD83C\uDDE7",
    dir: "ltr",
  },
];

/*
 * I18N dictionary. Every language provides the same set of keys.
 * English (en) is the canonical reference and the fallback for missing keys.
 * Templated strings use {n} / {total} placeholders.
 */
var I18N = {
  en: {
    lang_title: "Choose your language",
    lang_hint: "You can change it later in the settings.",
    tagline: "Solve number puzzles and find the great treasure!",
    btn_play: "Start adventure",
    btn_settings: "Settings",
    btn_switch_player: "Switch player",
    who_title: "Who's playing?",
    who_empty: "No players yet. Ask a grown-up to add one.",
    profile_default_name: "Player {n}",
    btn_howto: "How to play",
    btn_back: "Back",
    btn_start: "Let's go!",
    btn_check: "Check",
    btn_hint: "Hint",
    btn_resume: "Continue",
    btn_quit: "Quit",
    btn_menu: "Main menu",
    mode_title: "Choose your math",
    m_add: "Addition",
    m_sub: "Subtraction",
    m_mul: "Multiplication",
    m_mix: "Colorful mix",
    m_add_desc: "Add 2 or 3 numbers up to 100.",
    m_sub_desc: "Subtract numbers up to 100.",
    m_mul_desc: "The times tables.",
    m_mix_desc: "Everything mixed together.",
    diff_title: "Difficulty",
    d_adaptive: "Adaptive",
    d_easy: "Easy",
    d_medium: "Medium",
    d_hard: "Hard",
    feedback_correct: "Correct! Well done!",
    feedback_wrong: "Almost! Take a look at the hint.",
    lbl_stars: "Stars",
    lbl_coins: "Coins",
    lbl_accuracy: "Accuracy",
    lbl_best_streak: "Best streak",
    run_complete: "Journey complete!",
    treasure_found: "You found the treasure!",
    set_title: "Settings",
    set_sound: "Sounds",
    set_timer: "Timer mode",
    set_quick: "Quick run (10 tasks)",
    set_lang: "Language",
    set_reset: "Reset progress",
    reset_confirm: "Really delete all progress?",
    howto_title: "How to play",
    howto_body:
      "Travel across the map and solve a math task at every station. Tap the correct answer from the buttons. If you miss, we show you the worked solution – tap it to continue. Collect stars, coins and badges. Spend stars for extra time, and coins in the shop for power-ups like the Joker and new buddies. At the end of every journey you open a treasure chest with a new treasure each day!",
    play_again: "New journey",
    paused: "Paused",
    station_progress: "Station {n} of {total}",
    well_done: "Great job!",
    new_badge: "New badge!",
    set_blitz: "Lightning tasks with timer",
    set_choices: "Answer buttons instead of typing",
    btn_parents: "Parents",
    gate_title: "Grown-ups only",
    gate_wrong: "Not quite. Try this one.",
    btn_ok: "Enter",
    btn_cancel: "Cancel",
    parents_title: "Parents area",
    add_profile: "Add player",
    btn_edit: "Edit",
    edit_title: "Player",
    edit_name: "Name",
    edit_avatar: "Avatar",
    edit_main_mode: "Home screen",
    mode_tables: "Learn the tables",
    set_music: "Music",
    set_setbacks: "Go back stations on a miss",
    set_stations: "Stations in tables mode",
    delete_profile: "Delete player",
    delete_confirm: "Delete {name} and all their progress?",
    choose_answer: "Tap the correct answer",
    blitz_tag: "Blitz!",
    combo_tag: "Combo ×{x}",
    time_bonus: "Time bonus +{n}",
    daily_bonus: "Daily bonus +{n} coins!",
    timeout_msg: "Time's up! You'll get the next one.",
    tap_chest: "Tap the chest!",
    daily_treasure: "Treasure of the day!",
    treasure_count: "{n} of 50 treasures",
    new_treasure: "New treasure! +{n} coins",
    coin_treasure: "Coins in the treasure! +{n} \uD83E\uDE99",
    next_task: "Next ➜",
    buy_time: "+10 seconds for 3 stars",
    time_added_10: "+10 seconds!",
    time_added: "+5 seconds!",
    time_only_timed: "Only on timed tasks",
    not_enough_stars: "Not enough stars",
    btn_shop: "Shop",
    shop_title: "Coin shop",
    shop_powerups: "Power-ups",
    shop_buddies: "Buddies",
    shop_buy: "Buy",
    shop_equip: "Select",
    shop_equipped: "Active",
    not_enough_coins: "Not enough coins",
    no_powerup: "Buy it in the shop first",
    joker_used: "Joker! Solved.",
    fifty_used: "Two removed!",
    shield_armed: "Shield ready",
    shield_saved: "Shield saved you!",
    review_title: "Let's practice these again",
    praise_1: "Awesome!",
    praise_2: "Great!",
    praise_3: "Keep going!",
    encourage_1: "Almost!",
    encourage_2: "Nearly there!",
    encourage_3: "Don't give up!",
    trick_1: "{n} \u00d7 1 is just one group of {n}.",
    trick_10: "Times 10: put a zero after {n}.",
    trick_9: "{n} \u00d7 10 = {tens}, minus {n}.",
    trick_2: "It's double: {n} + {n}.",
    trick_5: "{n} \u00d7 10 = {tens}, then half of it.",
    trick_4: "Double, then double again: {n} \u00d7 2 = {double}, then again.",
    trick_3: "{n} \u00d7 2 = {double}, plus {n}.",
    trick_split: "{a} \u00d7 5 = {five}, plus {a} \u00d7 {rest}.",
    home_greeting: "Hi, {name}! Shall we keep going?",
    btn_continue_learning: "Keep learning",
    btn_other_games: "Other games",
    tables_hint_intro: "Look at the blocks. You can do it!",
    home_characters_label: "Your buddies",
    char_status: "{name} \u00b7 {n} times table \u00b7 {fill} of 10",
    char_first: "{name} woke up! It's the {n} times table buddy.",
    char_half: "{name} is half full!",
    char_almost: "You've almost filled {name}, the {n} times table buddy!",
    char_full: "{name} is complete! You mastered the {n} times table!",
    tables_write_it: "{q} = {answer}. Type it in!",
    lbl_mastered_today: "Mastered today",
    sum_mastered_one: "Today you mastered 1 new fact!",
    sum_mastered: "Today you mastered {n} new facts!",
    sum_practiced: "Today you practised {n} facts! Every round counts.",
    btn_album: "View album",
    album_title: "{name}'s album",
    album_summary: "{m} of 55 mastered · {p} practising",
    album_new: "New",
    album_practicing: "Practising",
    album_almost: "Almost there",
    album_mastered: "Mastered",
    album_cell_detail: "{q} · {seen} times · {secs} s",
  },
  es: {
    lang_title: "Elige tu idioma",
    lang_hint: "Puedes cambiarlo m\u00e1s tarde en los ajustes.",
    tagline:
      "\u00a1Resuelve acertijos de n\u00fameros y encuentra el gran tesoro!",
    btn_play: "Empezar aventura",
    btn_settings: "Ajustes",
    btn_switch_player: "Cambiar jugador",
    who_title: "\u00bfQui\u00e9n juega?",
    who_empty: "Todav\u00eda no hay jugadores. Pide a un adulto que cree uno.",
    profile_default_name: "Jugador {n}",
    btn_howto: "C\u00f3mo jugar",
    btn_back: "Atr\u00e1s",
    btn_start: "\u00a1Vamos!",
    btn_check: "Comprobar",
    btn_hint: "Pista",
    btn_resume: "Continuar",
    btn_quit: "Salir",
    btn_menu: "Men\u00fa principal",
    mode_title: "Elige tu c\u00e1lculo",
    m_add: "Sumas",
    m_sub: "Restas",
    m_mul: "Multiplicaci\u00f3n",
    m_mix: "Mezcla colorida",
    m_add_desc: "Suma 2 o 3 n\u00fameros hasta 100.",
    m_sub_desc: "Resta n\u00fameros hasta 100.",
    m_mul_desc: "Las tablas de multiplicar.",
    m_mix_desc: "Todo mezclado.",
    diff_title: "Dificultad",
    d_adaptive: "Adaptable",
    d_easy: "F\u00e1cil",
    d_medium: "Media",
    d_hard: "Dif\u00edcil",
    feedback_correct: "\u00a1Correcto! \u00a1Muy bien!",
    feedback_wrong: "\u00a1Casi! Mira la pista.",
    lbl_stars: "Estrellas",
    lbl_coins: "Monedas",
    lbl_accuracy: "Aciertos",
    lbl_best_streak: "Mejor racha",
    run_complete: "\u00a1Viaje completado!",
    treasure_found: "\u00a1Has encontrado el tesoro!",
    set_title: "Ajustes",
    set_sound: "Sonidos",
    set_timer: "Modo tiempo",
    set_quick: "Ronda r\u00e1pida (10 tareas)",
    set_lang: "Idioma",
    set_reset: "Reiniciar progreso",
    reset_confirm: "\u00bfBorrar todo el progreso?",
    howto_title: "C\u00f3mo jugar",
    howto_body:
      "Viaja por el mapa y resuelve una tarea en cada estaci\u00f3n. Escribe tu respuesta con las teclas grandes y pulsa Comprobar. Re\u00fane estrellas, monedas e insignias. \u00a1Un cofre del tesoro te espera al final de cada viaje!",
    play_again: "Nuevo viaje",
    paused: "Pausa",
    station_progress: "Estaci\u00f3n {n} de {total}",
    well_done: "\u00a1Bien hecho!",
    new_badge: "\u00a1Nueva insignia!",
    set_blitz: "Tareas rel\u00e1mpago con cron\u00f3metro",
    set_choices: "Botones de respuesta en lugar de escribir",
    btn_parents: "Zona de padres",
    gate_title: "Solo para adultos",
    gate_wrong: "No es correcto. Prueba con esta.",
    btn_ok: "Entrar",
    btn_cancel: "Cancelar",
    parents_title: "Zona de padres",
    add_profile: "A\u00f1adir jugador",
    btn_edit: "Editar",
    edit_title: "Jugador",
    edit_name: "Nombre",
    edit_avatar: "Avatar",
    edit_main_mode: "Pantalla de inicio",
    mode_tables: "Aprender las tablas",
    set_music: "M\u00fasica",
    set_setbacks: "Retroceder estaciones al fallar",
    set_stations: "Estaciones en modo tablas",
    delete_profile: "Borrar jugador",
    delete_confirm: "\u00bfBorrar a {name} y todo su progreso?",
    choose_answer: "Toca la respuesta correcta",
    blitz_tag: "\u00a1Rel\u00e1mpago!",
    combo_tag: "Combo \u00d7{x}",
    time_bonus: "Bono de tiempo +{n}",
    daily_bonus: "\u00a1Bono diario +{n} monedas!",
    timeout_msg: "\u00a1Se acab\u00f3 el tiempo! Ya viene la siguiente.",
    tap_chest: "\u00a1Toca el cofre!",
    daily_treasure: "\u00a1Tesoro del d\u00eda!",
    treasure_count: "{n} de 50 tesoros",
    new_treasure: "\u00a1Nuevo tesoro! +{n} monedas",
    coin_treasure: "\u00a1Monedas en el tesoro! +{n} \ud83e\ude99",
    next_task: "Siguiente \u279c",
    buy_time: "+10 segundos por 3 estrellas",
    time_added_10: "\u00a1+10 segundos!",
    time_added: "\u00a1+5 segundos!",
    time_only_timed: "Solo en tareas con tiempo",
    not_enough_stars: "No tienes suficientes estrellas",
    btn_shop: "Tienda",
    shop_title: "Tienda de monedas",
    shop_powerups: "Potenciadores",
    shop_buddies: "Compa\u00f1eros",
    shop_buy: "Comprar",
    shop_equip: "Elegir",
    shop_equipped: "Activo",
    not_enough_coins: "No tienes suficientes monedas",
    no_powerup: "Primero c\u00f3mpralo en la tienda",
    joker_used: "\u00a1Comod\u00edn! Resuelto.",
    fifty_used: "\u00a1Quitadas dos!",
    shield_armed: "Escudo listo",
    shield_saved: "\u00a1El escudo te salv\u00f3!",
    review_title: "Practiquemos estas otra vez",
    praise_1: "\u00a1Genial!",
    praise_2: "\u00a1Muy bien!",
    praise_3: "\u00a1Sigue as\u00ed!",
    encourage_1: "\u00a1Casi!",
    encourage_2: "\u00a1Ya casi lo tienes!",
    encourage_3: "\u00a1No te rindas!",
    trick_1: "{n} \u00d7 1 es un solo grupo de {n}.",
    trick_10: "Por 10: pon un cero detr\u00e1s del {n}.",
    trick_9: "{n} \u00d7 10 = {tens}, menos {n}.",
    trick_2: "Es el doble: {n} + {n}.",
    trick_5: "{n} \u00d7 10 = {tens}, y luego la mitad.",
    trick_4:
      "El doble del doble: {n} \u00d7 2 = {double}, y otra vez el doble.",
    trick_3: "{n} \u00d7 2 = {double}, m\u00e1s {n}.",
    trick_split: "{a} \u00d7 5 = {five}, m\u00e1s {a} \u00d7 {rest}.",
    home_greeting: "\u00a1Hola, {name}! \u00bfSeguimos?",
    btn_continue_learning: "Seguir aprendiendo",
    btn_other_games: "Otros juegos",
    tables_hint_intro: "Mira los bloques. \u00a1T\u00fa puedes!",
    home_characters_label: "Tus personajes",
    char_status: "{name} \u00b7 tabla del {n} \u00b7 {fill} de 10",
    char_first:
      "\u00a1{name} despert\u00f3! Es el personaje de la tabla del {n}.",
    char_half: "\u00a1{name} ya est\u00e1 a la mitad!",
    char_almost:
      "\u00a1Ya casi llenas a {name}, el personaje de la tabla del {n}!",
    char_full:
      "\u00a1{name} est\u00e1 completo! \u00a1Dominaste la tabla del {n}!",
    tables_write_it: "{q} = {answer}. \u00a1Escr\u00edbelo!",
    lbl_mastered_today: "Dominadas hoy",
    sum_mastered_one: "\u00a1Hoy dominaste 1 operaci\u00f3n nueva!",
    sum_mastered: "\u00a1Hoy dominaste {n} operaciones nuevas!",
    sum_practiced: "\u00a1Hoy practicaste {n} operaciones! Cada ronda cuenta.",
    btn_album: "Ver \u00e1lbum",
    album_title: "\u00c1lbum de {name}",
    album_summary: "{m} de 55 dominadas \u00b7 {p} practicando",
    album_new: "Nueva",
    album_practicing: "Practicando",
    album_almost: "Casi dominada",
    album_mastered: "Dominada",
    album_cell_detail: "{q} \u00b7 {seen} veces \u00b7 {secs} s",
  },
};

// Third-grade additions for every supported language, preserving old strings.
var LEARNING_TEXT = {
  en: [
    "Division",
    "Divide exactly: up to 100 by 1 to 10.",
    "A balanced mix of all four operations.",
    "You solved {n} tasks! Keep going!",
    "because",
  ],
  es: [
    "División",
    "Divide sin resto: hasta 100 entre 1 y 10.",
    "Las cuatro operaciones equilibradas.",
    "¡Ya resolviste {n} tareas! ¡Sigue así!",
    "porque",
  ],
};
Object.keys(LEARNING_TEXT).forEach(function (code) {
  var strings = LEARNING_TEXT[code];
  I18N[code].m_div = strings[0];
  I18N[code].m_div_desc = strings[1];
  I18N[code].m_mix_desc = strings[2];
  I18N[code].milestone = strings[3];
  I18N[code].division_because = strings[4];
});

// Badge labels exist in Spanish + English; `en` is the fallback.
var BADGE_LABELS = {
  first_treasure: {
    es: "Primer tesoro",
    en: "First treasure",
    icon: "\uD83D\uDC8E",
  },
  streak5: { es: "Racha de 5", en: "5 streak", icon: "\uD83D\uDD25" },
  streak10: { es: "Racha de 10", en: "10 streak", icon: "\u26A1" },
  coins100: { es: "100 monedas", en: "100 coins", icon: "\uD83E\uDE99" },
  perfect: { es: "Sin errores", en: "Flawless", icon: "\uD83C\uDFAF" },
  explorer: { es: "Explorador", en: "Explorer", icon: "\uD83E\uDDED" },
  speedy: { es: "Calculadora veloz", en: "Speed solver", icon: "\uD83D\uDE80" },
  combo_master: {
    es: "Maestro del combo",
    en: "Combo master",
    icon: "\uD83C\uDF1F",
  },
};

/* ================================================================== */
/* 2. Pure math generators + validation (test-friendly)                */
/* ================================================================== */

// Tables-mode learning engine (loaded by index.html in the browser).
var Tables =
  typeof TablesEngine !== "undefined" ? TablesEngine : require("./tables.js");
// One character per table (loaded by index.html in the browser).
var Characters =
  typeof TableCharacters !== "undefined"
    ? TableCharacters
    : require("./characters.js");

// Inclusive random integer in [min, max].
function randInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Difficulty levels run from 1 (easiest) to 5 (hardest).
var MIN_LEVEL = 1;
var MAX_LEVEL = 5;
var START_LEVEL = 1.5;

/*
 * Addition with 2 or 3 numbers, each between 0 and 100, and a sum that never
 * exceeds 100 so results stay inside the requested range.
 */
function generateAddition(level) {
  level = clamp(level || 1, MIN_LEVEL, MAX_LEVEL);
  var maxSum = Math.round(20 + (level - 1) * 20);
  var useThree = level >= 3 && Math.random() < (level >= 4 ? 0.6 : 0.35);
  var operands;
  if (useThree) {
    var capA = Math.min(40, 8 + level * 7);
    var a = randInt(0, Math.min(capA, maxSum));
    var b = randInt(0, Math.min(40, maxSum - a));
    var c = randInt(0, maxSum - a - b);
    operands = [a, b, c];
  } else {
    var x = randInt(0, maxSum);
    var y = randInt(0, maxSum - x);
    operands = [x, y];
  }
  var answer = operands.reduce(function (sum, n) {
    return sum + n;
  }, 0);
  return {
    type: "add",
    operands: operands,
    text: operands.join(" + ") + " =",
    answer: answer,
  };
}

/*
 * Subtraction within 0..100. The minuend is always greater than or equal to
 * the subtrahend, so the result can never be negative in normal play.
 */
function generateSubtraction(level) {
  level = clamp(level || 1, MIN_LEVEL, MAX_LEVEL);
  var maxValue = Math.round(20 + (level - 1) * 20);
  var a = randInt(level < 2 ? 2 : 10, maxValue);
  var b = randInt(0, a);
  return {
    type: "sub",
    operands: [a, b],
    text: a + " \u2212 " + b + " =",
    answer: a - b,
  };
}

/*
 * The complete 1..10 times tables are available from the very first task.
 */
function generateMultiplication(level) {
  var a = randInt(1, 10);
  var b = randInt(1, 10);
  return {
    type: "mul",
    operands: [a, b],
    text: a + " \u00d7 " + b + " =",
    answer: a * b,
  };
}

// Generate exact division using a divisor and quotient, never a remainder.
function generateDivision(level) {
  var divisor = randInt(1, 10);
  var quotient = randInt(1, 10);
  var dividend = divisor * quotient;
  return {
    type: "div",
    operands: [dividend, divisor],
    text: dividend + " ÷ " + divisor + " =",
    answer: quotient,
  };
}

var MATH_MODES = ["add", "sub", "mul", "div"];

// Balanced station plan, also used when a setback revisits a station.
function createRoundModes(mode, total) {
  var plan = [];
  var pool = MATH_MODES.slice();
  for (var i = pool.length - 1; i > 0; i--) {
    var j = randInt(0, i);
    var tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  for (var n = 0; n < total; n++) {
    plan.push(mode === "mix" ? pool[n % pool.length] : mode);
  }
  for (var k = plan.length - 1; k > 0; k--) {
    var r = randInt(0, k);
    var value = plan[k];
    plan[k] = plan[r];
    plan[r] = value;
  }
  return plan;
}

// Pick a generator for the chosen mode.
function generateTask(mode, level) {
  var effectiveMode = mode;
  if (mode === "mix") {
    var pool = MATH_MODES;
    effectiveMode = pool[randInt(0, pool.length - 1)];
  }
  if (effectiveMode === "sub") return generateSubtraction(level);
  if (effectiveMode === "mul") return generateMultiplication(level);
  if (effectiveMode === "div") return generateDivision(level);
  return generateAddition(level);
}

// Internal validation helper: confirms a task stays within allowed ranges.
function validateTask(task) {
  if (!task || !Number.isInteger(task.answer) || !Array.isArray(task.operands))
    return false;
  if (!task.operands.every(Number.isInteger)) return false;
  if (task.type !== "add" && task.operands.length !== 2) return false;
  if (task.type === "add") {
    if (task.operands.length !== 2 && task.operands.length !== 3) return false;
    var inRange = task.operands.every(function (n) {
      return n >= 0 && n <= 100;
    });
    var sum = task.operands.reduce(function (s, n) {
      return s + n;
    }, 0);
    return inRange && sum === task.answer && sum >= 0 && sum <= 100;
  }
  if (task.type === "sub") {
    var a = task.operands[0];
    var b = task.operands[1];
    return (
      a >= 0 &&
      a <= 100 &&
      b >= 0 &&
      b <= 100 &&
      a - b === task.answer &&
      task.answer >= 0
    );
  }
  if (task.type === "mul") {
    var f1 = task.operands[0];
    var f2 = task.operands[1];
    return (
      f1 >= 1 && f1 <= 10 && f2 >= 1 && f2 <= 10 && f1 * f2 === task.answer
    );
  }
  if (task.type === "div") {
    var dividend = task.operands[0];
    var divisor = task.operands[1];
    return (
      dividend >= 1 &&
      dividend <= 100 &&
      divisor >= 1 &&
      divisor <= 10 &&
      task.answer >= 1 &&
      task.answer <= 10 &&
      dividend % divisor === 0 &&
      dividend / divisor === task.answer
    );
  }
  return false;
}

// Build a short, child-friendly hint for a task (numbers are language-neutral).
function buildHint(task) {
  if (task.type === "div") return buildSolution(task);
  if (task.type === "add") {
    if (task.operands.length === 3) {
      var partial = task.operands[0] + task.operands[1];
      return (
        task.operands[0] +
        " + " +
        task.operands[1] +
        " = " +
        partial +
        ", " +
        partial +
        " + " +
        task.operands[2] +
        " = ?"
      );
    }
    var base = task.operands[0];
    var add = task.operands[1];
    return (
      base +
      " + " +
      add +
      ": " +
      base +
      " \u2192 " +
      (base + add) +
      " (+" +
      add +
      ")"
    );
  }
  if (task.type === "sub") {
    return (
      task.operands[1] +
      " + ? = " +
      task.operands[0] +
      "  (" +
      task.operands[0] +
      " \u2212 " +
      task.operands[1] +
      ")"
    );
  }
  if (task.type === "mul") {
    var a = task.operands[0];
    var b = task.operands[1];
    var chain = [];
    for (var i = 0; i < b && i < 6; i++) chain.push(String(a));
    var shown = chain.join(" + ");
    if (b > 6) shown += " + \u2026";
    return a + " \u00d7 " + b + " = " + shown;
  }
  return "";
}

/*
 * Build multiple-choice answers: the correct answer plus plausible, unique,
 * non-negative distractors, returned in random order. Pure + testable.
 */
function generateChoices(task, count) {
  count = clamp(count || 4, 4, 8);
  var correct = task.answer;
  var range = answerRange(task);
  var choices = [correct];
  var a = task.operands[0];
  var b = task.operands.length > 1 ? task.operands[1] : 0;
  var spread = Math.max(2, Math.round(Math.abs(correct) * 0.2)) + 3;
  var guard = 0;
  while (choices.length < count && guard < 400) {
    guard++;
    var candidate;
    if (task.type === "mul") {
      // Distractors that mimic common multiplication slips.
      var slips = [
        correct + a,
        correct - a,
        correct + b,
        correct - b,
        (a + 1) * b,
        a * (b + 1),
        correct + 1,
        correct - 1,
        correct + 2,
      ];
      candidate = slips[randInt(0, slips.length - 1)];
    } else {
      var delta = randInt(1, spread);
      candidate = Math.random() < 0.5 ? correct - delta : correct + delta;
    }
    if (candidate < 0) candidate = Math.abs(candidate);
    if (
      candidate >= range.min &&
      candidate <= range.max &&
      choices.indexOf(candidate) === -1
    )
      choices.push(candidate);
  }
  // Pad from the valid answer domain if nearby values were exhausted.
  var pad = range.min;
  while (choices.length < count) {
    var v = pad;
    if (choices.indexOf(v) === -1) choices.push(v);
    pad++;
  }
  // Fisher-Yates shuffle so the correct answer is not always in one spot.
  for (var i = choices.length - 1; i > 0; i--) {
    var j = randInt(0, i);
    var tmp = choices[i];
    choices[i] = choices[j];
    choices[j] = tmp;
  }
  return choices;
}

// Number of answer choices for a level: 4 (easy) up to 6 (hard).
function choiceCountForLevel(level) {
  level = clamp(level || 1, MIN_LEVEL, MAX_LEVEL);
  return clamp(Math.floor(3 + level), 4, 6);
}

/*
 * Adaptive countdown in seconds, derived from the child's smoothed average
 * solving time (ms) and the current difficulty level. As the child gets
 * faster the average drops and the budget shrinks, so it evolves over time.
 * Pure + testable.
 */
function computeTimeBudget(avgMs, level, task) {
  if (task && validateTask(task)) {
    var a = task.operands[0];
    var b = task.operands[1];
    var pace = clamp((avgMs || 0) / 1000 - 8, 0, 4);
    if (task.type === "mul")
      return clamp(Math.round(6 + (14 * (a + b - 2)) / 18 + pace), 6, 20);
    if (task.type === "div") {
      var divisionDifficulty =
        b === 1 ? 0 : (0.65 * (a - 1)) / 99 + (0.35 * (b - 1)) / 9;
      return clamp(Math.round(10 + 20 * divisionDifficulty + pace), 10, 30);
    }
    var magnitude = task.type === "add" ? task.answer : a;
    var crossing =
      task.type === "add" ? (a % 10) + (b % 10) >= 10 : a % 10 < b % 10;
    return clamp(
      Math.round(
        12 +
          magnitude / 6 +
          (crossing ? 4 : 0) +
          (task.operands.length === 3 ? 4 : 0) +
          pace,
      ),
      12,
      40,
    );
  }
  level = clamp(level || 1, MIN_LEVEL, MAX_LEVEL);
  var base = avgMs && avgMs > 0 ? avgMs / 1000 : 11;
  var budget = base * 1.7 + 3 + (level - 1) * 1.2;
  return clamp(Math.round(budget), 6, 40);
}

// Smooth the average solving time with an exponential moving average (ms).
function updateAvgMs(prevAvg, sampleMs) {
  if (!sampleMs || sampleMs <= 0) return prevAvg || 0;
  sampleMs = clamp(sampleMs, 600, 60000); // ignore absurd outliers
  if (!prevAvg || prevAvg <= 0) return Math.round(sampleMs);
  return Math.round(prevAvg * 0.7 + sampleMs * 0.3);
}

function answerRange(task) {
  return task.type === "div"
    ? { min: 1, max: 10 }
    : task.type === "mul"
      ? { min: 1, max: 100 }
      : { min: 0, max: 100 };
}

function validateAnswer(task, value) {
  if (!validateTask(task) || !Number.isInteger(value)) return false;
  var range = answerRange(task);
  return value >= range.min && value <= range.max;
}

// Add learning records without replacing any existing reward/storage fields.
function normalizeLearning(saved) {
  var records = {};
  MATH_MODES.forEach(function (mode) {
    var old = (saved && saved[mode]) || {};
    records[mode] = {
      level: Number.isFinite(old.level) ? clamp(old.level, 1, 5) : START_LEVEL,
      successes: Number.isInteger(old.successes)
        ? clamp(old.successes, 0, 3)
        : 0,
      attempts: Number.isInteger(old.attempts) ? Math.max(0, old.attempts) : 0,
      correct: Number.isInteger(old.correct) ? Math.max(0, old.correct) : 0,
      avgMs: Number.isFinite(old.avgMs) ? clamp(old.avgMs, 0, 60000) : 0,
    };
  });
  return records;
}

// Lift older low starts once, but retain higher progress and later easing.
function migrateLearningStart(progress) {
  var next = Object.assign({}, progress);
  next.learning = normalizeLearning(next.learning);
  if (next.learningStartVersion !== 1) {
    MATH_MODES.forEach(function (mode) {
      next.learning[mode].level = Math.max(
        START_LEVEL,
        next.learning[mode].level,
      );
    });
    next.learningStartVersion = 1;
  }
  return next;
}

// Per-profile defaults, options and limits.
var DEFAULT_SETTINGS = {
  sound: true,
  music: true,
  timer: false,
  blitz: false,
  quick: false,
  choices: true,
  setbacks: false,
  tableStations: 15,
  mainMode: "tables",
};
var TABLE_STATION_OPTIONS = [10, 15, 20, 25];
var MAIN_MODES = ["tables", "add", "sub", "mul", "div", "mix"];
var PROFILE_AVATARS = [
  "🦊",
  "🐱",
  "🐼",
  "🦁",
  "🐸",
  "🐵",
  "🦄",
  "🐲",
  "🐧",
  "🐢",
];
var PROFILE_NAME_MAX = 20;

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

// A brand-new progress record (fresh object on every call).
function defaultProgress() {
  return {
    coins: 0,
    treasures: 0,
    badges: [],
    bestStreak: 0,
    avgMs: 0,
    totalCorrect: 0,
    lastPlayed: "",
    blitzWins: 0,
    bestCombo: 0,
    stars: 0,
    collection: [],
    inventory: { joker: 0, fifty: 0, time: 0, shield: 0 },
    buddies: ["kid"],
    buddy: "kid",
    learning: normalizeLearning(),
    learningStartVersion: 1,
  };
}

// Keep only known settings, falling back to defaults on missing/invalid values.
function normalizeSettings(saved) {
  var src = isPlainObject(saved) ? saved : {};
  var out = {};
  Object.keys(DEFAULT_SETTINGS).forEach(function (key) {
    var def = DEFAULT_SETTINGS[key];
    out[key] = typeof src[key] === typeof def ? src[key] : def;
  });
  if (TABLE_STATION_OPTIONS.indexOf(out.tableStations) === -1) {
    out.tableStations = DEFAULT_SETTINGS.tableStations;
  }
  if (MAIN_MODES.indexOf(out.mainMode) === -1) {
    out.mainMode = DEFAULT_SETTINGS.mainMode;
  }
  return out;
}

// Trim, cap the length and fall back when the name ends up empty.
function cleanProfileName(name, fallback) {
  var clean = typeof name === "string" ? name.trim() : "";
  clean = clean.slice(0, PROFILE_NAME_MAX).trim();
  return clean || fallback;
}

// Ids look like "p<integer>"; pick the first one not already taken.
function nextProfileId(existingIds) {
  var n = 1;
  while (existingIds.indexOf("p" + n) !== -1) n++;
  return "p" + n;
}

function createProfile(name, avatar, existingIds, fallbackName) {
  return {
    id: nextProfileId(existingIds || []),
    name: cleanProfileName(name, fallbackName),
    avatar:
      PROFILE_AVATARS.indexOf(avatar) === -1 ? PROFILE_AVATARS[0] : avatar,
    settings: normalizeSettings(),
    progress: defaultProgress(),
    tables: Tables.normalizeTables(),
  };
}

// Repair a saved profile; null when it cannot be recognised.
function normalizeProfile(saved) {
  if (!isPlainObject(saved) || typeof saved.id !== "string" || !saved.id) {
    return null;
  }
  var profile = {
    id: saved.id,
    name: cleanProfileName(saved.name, "Jugador"),
    avatar:
      PROFILE_AVATARS.indexOf(saved.avatar) === -1
        ? PROFILE_AVATARS[0]
        : saved.avatar,
    settings: normalizeSettings(saved.settings),
    progress: migrateLearningStart(
      Object.assign(
        defaultProgress(),
        isPlainObject(saved.progress) ? saved.progress : {},
      ),
    ),
    tables: Tables.normalizeTables(saved.tables),
  };
  return profile;
}

// Repair the whole store: drop invalid and duplicate profiles, validate lastId.
function normalizeProfileStore(saved) {
  var store = { version: 1, lastId: "", profiles: [] };
  if (!isPlainObject(saved) || !Array.isArray(saved.profiles)) return store;
  var seen = {};
  saved.profiles.forEach(function (item) {
    var profile = normalizeProfile(item);
    if (!profile || seen[profile.id]) return;
    seen[profile.id] = true;
    store.profiles.push(profile);
  });
  if (seen[saved.lastId]) store.lastId = saved.lastId;
  return store;
}

// Use the saved store if present; otherwise build one profile from legacy data.
function migrateLegacyStorage(
  savedStore,
  legacyProgress,
  legacySettings,
  defaultName,
) {
  if (isPlainObject(savedStore) && Array.isArray(savedStore.profiles)) {
    return normalizeProfileStore(savedStore);
  }
  var profile = createProfile(defaultName, PROFILE_AVATARS[0], [], defaultName);
  if (isPlainObject(legacyProgress)) {
    profile.progress = migrateLearningStart(
      Object.assign(defaultProgress(), legacyProgress),
    );
  }
  if (isPlainObject(legacySettings)) {
    profile.settings = normalizeSettings(legacySettings);
  }
  return normalizeProfileStore({ lastId: profile.id, profiles: [profile] });
}

// Simple 12-19 multiplication to keep young children out of parent settings.
function parentChallenge() {
  var a = randInt(12, 19);
  var b = randInt(12, 19);
  return { a: a, b: b, answer: a * b };
}

// Four independent successes raise the rating by just one eighth of a level.
function updateLearning(record, correct, elapsed) {
  var next = Object.assign({}, record);
  next.attempts++;
  if (correct) {
    next.correct++;
    next.successes++;
    next.avgMs = updateAvgMs(next.avgMs, elapsed);
    if (next.successes >= 4) {
      next.level = clamp(next.level + 0.125, 1, 5);
      next.successes = 0;
    }
  } else {
    next.level = clamp(next.level - 0.125, 1, 5);
    next.successes = 0;
  }
  return next;
}

// Worked solutions use intermediate steps and the inverse multiplication.
function buildSolution(task, because) {
  if (!validateTask(task)) return "";
  var ops = task.operands;
  if (task.type === "div") {
    return (
      ops[0] +
      " ÷ " +
      ops[1] +
      " = " +
      task.answer +
      ", " +
      (because || "denn") +
      " " +
      ops[1] +
      " × " +
      task.answer +
      " = " +
      ops[0]
    );
  }
  if (task.type === "mul") {
    var count = Math.min(ops[0], ops[1]);
    var term = Math.max(ops[0], ops[1]);
    var parts = [];
    for (var i = 0; i < count; i++) parts.push(term);
    return (
      ops[0] + " × " + ops[1] + " = " + parts.join(" + ") + " = " + task.answer
    );
  }
  if (task.type === "sub") {
    var tens = Math.floor(ops[1] / 10) * 10;
    var intermediate = ops[0] - tens;
    return (
      ops[0] +
      " − " +
      ops[1] +
      " = " +
      task.answer +
      " · " +
      ops[0] +
      " − " +
      tens +
      " = " +
      intermediate +
      ", " +
      intermediate +
      " − " +
      (ops[1] % 10) +
      " = " +
      task.answer
    );
  }
  if (ops.length === 3) {
    var partial = ops[0] + ops[1];
    return (
      ops.join(" + ") +
      " = " +
      task.answer +
      " · " +
      ops[0] +
      " + " +
      ops[1] +
      " = " +
      partial +
      ", " +
      partial +
      " + " +
      ops[2] +
      " = " +
      task.answer
    );
  }
  var addTens = Math.floor(ops[1] / 10) * 10;
  var step = ops[0] + addTens;
  return (
    ops.join(" + ") +
    " = " +
    task.answer +
    " · " +
    ops[0] +
    " + " +
    addTens +
    " = " +
    step +
    ", " +
    step +
    " + " +
    (ops[1] % 10) +
    " = " +
    task.answer
  );
}

/* ================================================================== */
/* The remaining code is the browser UI controller. It is wrapped so the     */
/* file can also be required by Node.js for unit tests without a DOM.        */
/* ================================================================== */

/* ================================================================== */
/* Treasures, daily reward + coin shop catalog (test-friendly, no DOM) */
/* ================================================================== */

// Five jewel palettes. Combined with the ten shapes below they produce fifty
// unique collectible treasures (5 x 10 = 50).
var TREASURE_PALETTES = [
  {
    key: "ruby",
    es: "Rub\u00ed",
    en: "Ruby",
    main: "#e23b5a",
    dark: "#9c1b33",
    light: "#ff8aa0",
    accent: "#ffd84d",
  },
  {
    key: "sapphire",
    es: "Zafiro",
    en: "Sapphire",
    main: "#3b6fe2",
    dark: "#1c3a9c",
    light: "#8ab0ff",
    accent: "#9be7ff",
  },
  {
    key: "emerald",
    es: "Esmeralda",
    en: "Emerald",
    main: "#18b56a",
    dark: "#0c7a45",
    light: "#7ff0b6",
    accent: "#d8ff8a",
  },
  {
    key: "amethyst",
    es: "Amatista",
    en: "Amethyst",
    main: "#9b5ce2",
    dark: "#5e2f9c",
    light: "#cfa8ff",
    accent: "#ff9be7",
  },
  {
    key: "gold",
    es: "Oro",
    en: "Gold",
    main: "#ffb53d",
    dark: "#c47a00",
    light: "#ffe08a",
    accent: "#fff3c4",
  },
];

// Ten little vector drawings. Each receives a palette and returns SVG markup.
var TREASURE_SHAPES = [
  {
    key: "gem",
    es: "Gema",
    en: "Gem",
    draw: function (p) {
      return (
        '<polygon points="50,8 80,38 50,92 20,38" fill="' +
        p.main +
        '"/>' +
        '<polygon points="50,8 80,38 50,38" fill="' +
        p.light +
        '"/>' +
        '<polygon points="20,38 50,38 50,92" fill="' +
        p.dark +
        '"/>' +
        '<line x1="20" y1="38" x2="80" y2="38" stroke="' +
        p.accent +
        '" stroke-width="2"/>'
      );
    },
  },
  {
    key: "coin",
    es: "Moneda",
    en: "Coin",
    draw: function (p) {
      return (
        '<circle cx="50" cy="50" r="40" fill="' +
        p.main +
        '"/>' +
        '<circle cx="50" cy="50" r="40" fill="none" stroke="' +
        p.dark +
        '" stroke-width="4"/>' +
        '<circle cx="50" cy="50" r="30" fill="none" stroke="' +
        p.light +
        '" stroke-width="3"/>' +
        '<polygon points="50,30 56,46 73,46 59,56 64,72 50,62 36,72 41,56 27,46 44,46" fill="' +
        p.accent +
        '"/>'
      );
    },
  },
  {
    key: "crown",
    es: "Corona",
    en: "Crown",
    draw: function (p) {
      return (
        '<polygon points="18,72 22,38 38,56 50,30 62,56 78,38 82,72" fill="' +
        p.main +
        '"/>' +
        '<rect x="18" y="72" width="64" height="12" rx="3" fill="' +
        p.dark +
        '"/>' +
        '<circle cx="22" cy="36" r="5" fill="' +
        p.accent +
        '"/>' +
        '<circle cx="50" cy="28" r="5" fill="' +
        p.accent +
        '"/>' +
        '<circle cx="78" cy="36" r="5" fill="' +
        p.accent +
        '"/>'
      );
    },
  },
  {
    key: "ring",
    es: "Anillo",
    en: "Ring",
    draw: function (p) {
      return (
        '<circle cx="50" cy="62" r="26" fill="none" stroke="' +
        p.main +
        '" stroke-width="9"/>' +
        '<circle cx="50" cy="62" r="26" fill="none" stroke="' +
        p.light +
        '" stroke-width="3"/>' +
        '<polygon points="50,12 62,30 50,40 38,30" fill="' +
        p.accent +
        '"/>' +
        '<polygon points="50,12 62,30 50,30" fill="#ffffff"/>'
      );
    },
  },
  {
    key: "key",
    es: "Llave",
    en: "Key",
    draw: function (p) {
      return (
        '<circle cx="34" cy="40" r="20" fill="none" stroke="' +
        p.main +
        '" stroke-width="8"/>' +
        '<circle cx="34" cy="40" r="7" fill="' +
        p.dark +
        '"/>' +
        '<rect x="50" y="36" width="38" height="8" rx="3" fill="' +
        p.main +
        '"/>' +
        '<rect x="78" y="36" width="8" height="18" rx="2" fill="' +
        p.main +
        '"/>' +
        '<rect x="66" y="36" width="8" height="14" rx="2" fill="' +
        p.main +
        '"/>'
      );
    },
  },
  {
    key: "trophy",
    es: "Trofeo",
    en: "Trophy",
    draw: function (p) {
      return (
        '<path d="M30 22 H70 V40 A20 20 0 0 1 30 40 Z" fill="' +
        p.main +
        '"/>' +
        '<path d="M30 26 H18 A10 10 0 0 0 30 40" fill="none" stroke="' +
        p.dark +
        '" stroke-width="5"/>' +
        '<path d="M70 26 H82 A10 10 0 0 1 70 40" fill="none" stroke="' +
        p.dark +
        '" stroke-width="5"/>' +
        '<rect x="46" y="58" width="8" height="14" fill="' +
        p.dark +
        '"/>' +
        '<rect x="34" y="72" width="32" height="10" rx="3" fill="' +
        p.dark +
        '"/>' +
        '<polygon points="50,28 53,36 61,36 55,41 57,49 50,44 43,49 45,41 39,36 47,36" fill="' +
        p.accent +
        '"/>'
      );
    },
  },
  {
    key: "star",
    es: "Estrella",
    en: "Star",
    draw: function (p) {
      return (
        '<polygon points="50,8 61,38 93,38 67,58 77,90 50,70 23,90 33,58 7,38 39,38" fill="' +
        p.main +
        '"/>' +
        '<polygon points="50,8 61,38 39,38" fill="' +
        p.light +
        '"/>' +
        '<circle cx="50" cy="52" r="8" fill="' +
        p.accent +
        '"/>'
      );
    },
  },
  {
    key: "potion",
    es: "Poci\u00f3n m\u00e1gica",
    en: "Potion",
    draw: function (p) {
      return (
        '<rect x="42" y="14" width="16" height="16" rx="2" fill="' +
        p.dark +
        '"/>' +
        '<path d="M40 28 H60 L72 64 A26 26 0 0 1 28 64 Z" fill="' +
        p.light +
        '"/>' +
        '<path d="M31 54 A24 24 0 0 0 69 54 L72 64 A26 26 0 0 1 28 64 Z" fill="' +
        p.main +
        '"/>' +
        '<circle cx="44" cy="60" r="3" fill="#ffffff"/>' +
        '<circle cx="56" cy="68" r="2" fill="#ffffff"/>'
      );
    },
  },
  {
    key: "map",
    es: "Mapa del tesoro",
    en: "Map",
    draw: function (p) {
      return (
        '<rect x="22" y="20" width="56" height="60" rx="4" fill="' +
        p.light +
        '"/>' +
        '<rect x="22" y="20" width="56" height="60" rx="4" fill="none" stroke="' +
        p.dark +
        '" stroke-width="3"/>' +
        '<path d="M30 40 Q45 30 60 42 T74 46" fill="none" stroke="' +
        p.main +
        '" stroke-width="3" stroke-dasharray="4 4"/>' +
        '<path d="M58 62 l8 8 M66 62 l-8 8" stroke="' +
        p.main +
        '" stroke-width="3"/>'
      );
    },
  },
  {
    key: "pearl",
    es: "Perla",
    en: "Pearl",
    draw: function (p) {
      return (
        '<path d="M50 30 A38 38 0 0 1 88 78 H12 A38 38 0 0 1 50 30 Z" fill="' +
        p.main +
        '"/>' +
        '<path d="M50 30 V78 M30 36 L34 78 M70 36 L66 78" stroke="' +
        p.dark +
        '" stroke-width="2" fill="none"/>' +
        '<circle cx="50" cy="74" r="9" fill="' +
        p.light +
        '"/>' +
        '<circle cx="47" cy="71" r="3" fill="#ffffff"/>'
      );
    },
  },
];

// Build the fifty treasures once. Each entry: { id, es, en, svg }.
function buildTreasures() {
  var list = [];
  for (var s = 0; s < TREASURE_SHAPES.length; s++) {
    for (var c = 0; c < TREASURE_PALETTES.length; c++) {
      var shape = TREASURE_SHAPES[s];
      var pal = TREASURE_PALETTES[c];
      var sparkles = "";
      for (var k = 0; k <= c; k++) {
        var sx = 12 + ((k * 23 + s * 7) % 74);
        var sy = 10 + ((k * 13 + s * 5) % 16);
        sparkles +=
          '<circle cx="' +
          sx +
          '" cy="' +
          sy +
          '" r="2.2" fill="#ffffff" opacity="0.85"/>';
      }
      var svg =
        '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">' +
        '<circle cx="50" cy="50" r="48" fill="' +
        pal.dark +
        '" opacity="0.12"/>' +
        shape.draw(pal) +
        sparkles +
        "</svg>";
      list.push({
        id: shape.key + "-" + pal.key,
        es: shape.es + " de " + pal.es,
        en: pal.en + " " + shape.en,
        svg: svg,
      });
    }
  }
  return list;
}

var TREASURES = buildTreasures();

// Deterministic "treasure of the day": stable within a calendar day, changes
// every day, and cycles through all fifty treasures over time.
function dailyTreasureIndex(date) {
  var d = date || new Date();
  var dayKey = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
  var n = TREASURES.length || 1;
  return ((dayKey % n) + n) % n;
}

// Rough difficulty score (1..14): the harder the task, the longer the buzz.
function taskDifficultyScore(task, level) {
  if (!task || !task.operands) return 1;
  var typeScore = task.type === "mul" ? 6 : task.type === "sub" ? 3 : 2;
  if (task.type === "add" && task.operands.length === 3) typeScore += 2;
  var maxOperand = 0;
  for (var i = 0; i < task.operands.length; i++) {
    if (task.operands[i] > maxOperand) maxOperand = task.operands[i];
  }
  var magScore = Math.min(4, Math.floor(maxOperand / 25));
  var lvlScore = clamp((level || 1) - 1, 0, 4);
  return clamp(typeScore + magScore + lvlScore, 1, 14);
}

// Map a task's difficulty to a vibration length in milliseconds.
function vibrationForTask(task, level, firstTry) {
  var ms = 30 + taskDifficultyScore(task, level) * 12;
  if (!firstTry) ms = Math.round(ms * 0.6);
  return ms;
}

// Harder tasks grant a little more thinking time than easy ones (0..7 s).
function extraTimeForTask(task, level) {
  return clamp(Math.round((taskDifficultyScore(task, level) - 3) * 0.7), 0, 7);
}

// Coin shop catalog. Power-ups are consumable helpers; buddies are one-time
// cosmetic unlocks for the traveller on the map.
var SHOP_POWERUPS = [
  {
    id: "time",
    price: 8,
    icon: "⏳",
    es: "Tiempo extra",
    en: "Extra time",
    esDesc: "+5 segundos en una tarea con cronómetro",
    enDesc: "+5 seconds on a timed task",
  },
  {
    id: "joker",
    price: 10,
    icon: "🪄",
    es: "Comod\u00edn",
    en: "Joker",
    esDesc: "Resuelve la tarea al instante",
    enDesc: "Solves the task instantly",
  },
  {
    id: "fifty",
    price: 6,
    icon: "✂️",
    es: "50:50",
    en: "50:50",
    esDesc: "Quita dos respuestas incorrectas",
    enDesc: "Removes two wrong answers",
  },
  {
    id: "shield",
    price: 8,
    icon: "🛡️",
    es: "Escudo",
    en: "Shield",
    esDesc: "Te protege de un retroceso",
    enDesc: "Blocks one setback",
  },
];

var SHOP_BUDDIES = [
  { id: "kid", price: 0, emoji: "🧒", es: "Ni\u00f1o", en: "Kid" },
  { id: "fox", price: 80, emoji: "🦊", es: "Zorro", en: "Fox" },
  { id: "cat", price: 110, emoji: "🐱", es: "Gato", en: "Cat" },
  { id: "monkey", price: 140, emoji: "🐵", es: "Mono", en: "Monkey" },
  { id: "robot", price: 180, emoji: "🤖", es: "Robot", en: "Robot" },
  { id: "unicorn", price: 240, emoji: "🦄", es: "Unicornio", en: "Unicorn" },
  { id: "dragon", price: 320, emoji: "🐲", es: "Drag\u00f3n", en: "Dragon" },
];

function startApp() {
  /* ---------------- Storage helpers ---------------- */
  var STORAGE_KEYS = {
    lang: "ms_lang",
    settings: "ms_settings",
    progress: "ms_progress",
    profiles: "ms_profiles",
  };

  function storageGet(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }
  function storageSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* Storage may be unavailable in private mode; fail silently. */
    }
  }

  /* ---------------- App state ---------------- */
  // Until a player is chosen, settings and progress are throwaway defaults
  // that are never saved; afterwards they point into the active profile.
  var state = {
    lang: storageGet(STORAGE_KEYS.lang, null),
    store: null,
    profile: null,
    settings: normalizeSettings(),
    progress: defaultProgress(),
    selectedMode: "add",
    selectedDiff: "adaptive",
    editingId: "",
    gate: null,
    run: null,
    timerId: null,
    stageTimerId: null,
    stageDeadline: 0,
    stageFn: null,
    pausedStage: null,
    lastRunKind: "classic",
  };

  var bootDict = I18N[state.lang] || I18N.es;
  state.store = migrateLegacyStorage(
    storageGet(STORAGE_KEYS.profiles, null),
    storageGet(STORAGE_KEYS.progress, null),
    storageGet(STORAGE_KEYS.settings, null),
    bootDict.profile_default_name.replace("{n}", "1"),
  );

  // Persist the whole profile store (settings and progress of every child).
  function saveProfiles() {
    storageSet(STORAGE_KEYS.profiles, state.store);
  }
  saveProfiles();

  /* ---------------- i18n ---------------- */
  function t(key, vars) {
    var dict = I18N[state.lang] || I18N.en;
    var value = dict[key];
    if (value === undefined) value = I18N.en[key]; // fall back to English
    if (value === undefined) value = key;
    if (vars) {
      value = value.replace(/\{(\w+)\}/g, function (match, name) {
        return vars[name] !== undefined ? vars[name] : match;
      });
    }
    return value;
  }

  function applyI18n() {
    var lang = state.lang || "es";
    var meta =
      LANGUAGES.filter(function (l) {
        return l.code === lang;
      })[0] || LANGUAGES[0];
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", meta.dir);

    var nodes = document.querySelectorAll("[data-i18n]");
    nodes.forEach(function (node) {
      node.textContent = t(node.getAttribute("data-i18n"));
    });
  }

  /* ---------------- Screen routing ---------------- */
  function showScreen(id) {
    var screens = document.querySelectorAll(".screen");
    screens.forEach(function (s) {
      s.classList.toggle("is-active", s.id === id);
    });
  }

  /* ---------------- Element references ---------------- */
  var els = {
    languageGrid: document.getElementById("language-grid"),
    profileGrid: document.getElementById("profile-grid"),
    whoEmpty: document.getElementById("who-empty"),
    settingsLanguageGrid: document.getElementById("settings-language-grid"),
    menuCoins: document.getElementById("menu-coins"),
    menuTreasures: document.getElementById("menu-treasures"),
    menuBadges: document.getElementById("menu-badges"),
    homeCoins: document.getElementById("home-coins"),
    homeCharacters: document.getElementById("home-characters"),
    homeGreeting: document.getElementById("home-greeting"),
    gameStreak: document.getElementById("game-streak"),
    gameCoins: document.getElementById("game-coins"),
    gameTimer: document.getElementById("game-timer"),
    gameTimerChip: document.getElementById("game-timer-chip"),
    question: document.getElementById("game-question"),
    answerDisplay: document.getElementById("answer-display"),
    feedback: document.getElementById("feedback"),
    hint: document.getElementById("hint"),
    numpad: document.getElementById("numpad"),
    mapStations: document.getElementById("map-stations"),
    mapWalker: document.getElementById("map-walker"),
    mapPath: document.getElementById("map-path"),
    mapProgress: document.getElementById("map-progress"),
    sumStars: document.getElementById("sum-stars"),
    sumCoins: document.getElementById("sum-coins"),
    sumAccuracy: document.getElementById("sum-accuracy"),
    sumAccuracyLbl: document.getElementById("sum-accuracy-lbl"),
    sumProgressLine: document.getElementById("sum-progress-line"),
    sumStreak: document.getElementById("sum-streak"),
    badgeShelf: document.getElementById("badge-shelf"),
    treasureLine: document.getElementById("treasure-line"),
    chest: document.getElementById("chest"),
    treasureReveal: document.getElementById("treasure-reveal"),
    pauseOverlay: document.getElementById("pause-overlay"),
    fxLayer: document.getElementById("fx-layer"),
    howtoBody: document.querySelector(".howto-body"),
    toggleSound: document.getElementById("toggle-sound"),
    toggleMusic: document.getElementById("toggle-music"),
    toggleTimer: document.getElementById("toggle-timer"),
    toggleBlitz: document.getElementById("toggle-blitz"),
    toggleQuick: document.getElementById("toggle-quick"),
    toggleChoices: document.getElementById("toggle-choices"),
    toggleSetbacks: document.getElementById("toggle-setbacks"),
    parentGate: document.getElementById("parent-gate"),
    gateQuestion: document.getElementById("gate-question"),
    gateInput: document.getElementById("gate-input"),
    gateFeedback: document.getElementById("gate-feedback"),
    parentProfiles: document.getElementById("parent-profiles"),
    editName: document.getElementById("edit-name"),
    editAvatars: document.getElementById("edit-avatars"),
    editMainMode: document.getElementById("edit-main-mode"),
    editStations: document.getElementById("edit-stations"),
    albumTitle: document.getElementById("album-title"),
    albumSummary: document.getElementById("album-summary"),
    albumGrid: document.getElementById("album-grid"),
    albumLegend: document.getElementById("album-legend"),
    numpadWrap: document.getElementById("numpad-wrap"),
    choices: document.getElementById("choices"),
    powerups: document.getElementById("powerups"),
    checkBtn: document.querySelector('[data-action="check"]'),
    timerRing: document.getElementById("timer-ring"),
    timerArc: document.getElementById("timer-arc"),
    timerNum: document.getElementById("timer-num"),
    blitzTag: document.getElementById("blitz-tag"),
    comboTag: document.getElementById("combo-tag"),
    mascot: document.getElementById("mascot"),
    mascotBubble: document.getElementById("mascot-bubble"),
    mapTrail: document.getElementById("map-trail"),
    mapStationsFx: document.getElementById("map-stations-fx"),
    reviewBox: document.getElementById("review-box"),
    reviewList: document.getElementById("review-list"),
  };

  /* ---------------- Optional sound (synthesised, no asset files) ---------------- */
  var audioCtx = null;
  function beep(frequency, durationMs, type) {
    if (!state.settings.sound) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type || "sine";
      osc.frequency.value = frequency;
      gain.gain.value = 0.06;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioCtx.currentTime + durationMs / 1000,
      );
      osc.stop(audioCtx.currentTime + durationMs / 1000);
    } catch (e) {
      /* Audio is a nice-to-have; ignore failures. */
    }
  }

  /* ---------------- Header / menu stats ---------------- */
  function refreshMenuStats() {
    els.menuCoins.textContent = state.progress.coins;
    els.menuTreasures.textContent = state.progress.treasures;
    els.menuBadges.textContent = state.progress.badges.length;
    els.homeCoins.textContent = state.progress.coins;
  }

  /* ---------------- Language grids ---------------- */
  function buildLanguageButton(meta, onPick) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lang-btn";
    btn.setAttribute("lang", meta.code);
    if (meta.code === state.lang) btn.classList.add("is-selected");
    var flag = document.createElement("span");
    flag.className = "flag";
    flag.setAttribute("aria-hidden", "true");
    flag.textContent = meta.flag;
    var label = document.createElement("span");
    label.textContent = meta.label;
    btn.appendChild(flag);
    btn.appendChild(label);
    btn.addEventListener("click", function () {
      onPick(meta.code);
    });
    return btn;
  }

  function renderLanguageGrids() {
    els.languageGrid.innerHTML = "";
    els.settingsLanguageGrid.innerHTML = "";
    LANGUAGES.forEach(function (meta) {
      els.languageGrid.appendChild(
        buildLanguageButton(meta, function (code) {
          setLanguage(code);
          goToProfiles();
        }),
      );
      els.settingsLanguageGrid.appendChild(
        buildLanguageButton(meta, function (code) {
          setLanguage(code);
          renderLanguageGrids();
        }),
      );
    });
  }

  function setLanguage(code) {
    state.lang = code;
    storageSet(STORAGE_KEYS.lang, code);
    applyI18n();
    refreshDynamicText();
  }

  // Refresh strings that are not driven by [data-i18n] attributes.
  function refreshDynamicText() {
    els.howtoBody.textContent = t("howto_body");
    document
      .querySelector('[data-action="pause"]')
      .setAttribute("aria-label", t("paused"));
    if (state.run) updateMapProgressLabel();
    if (state.profile) {
      renderHomeGreeting();
      renderHomeCharacters();
    }
  }

  /* ---------------- Number pad ---------------- */
  var currentInput = "";
  function buildNumpad() {
    if (!els.numpad) return;
    var layout = [
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "clear",
      "0",
      "del",
    ];
    els.numpad.innerHTML = "";
    layout.forEach(function (item) {
      var key = document.createElement("button");
      key.type = "button";
      key.className = "key";
      if (item === "clear" || item === "del") key.className += " key--action";
      if (item === "clear") {
        key.textContent = "C";
        key.setAttribute("aria-label", "Clear");
      } else if (item === "del") {
        key.textContent = "\u232B";
        key.setAttribute("aria-label", "Delete");
      } else {
        key.textContent = item;
      }
      key.addEventListener("click", function () {
        handleKey(item);
      });
      els.numpad.appendChild(key);
    });
  }

  function handleKey(item) {
    if (item === "clear") {
      currentInput = "";
    } else if (item === "del") {
      currentInput = currentInput.slice(0, -1);
    } else if (/^[0-9]$/.test(item)) {
      if (
        currentInput.length < 3 &&
        activeTask &&
        Number(currentInput + item) <= answerRange(activeTask).max
      )
        currentInput += item;
    }
    renderAnswer();
  }

  function renderAnswer() {
    if (!els.answerDisplay) return;
    els.answerDisplay.textContent = currentInput === "" ? "_" : currentInput;
    els.answerDisplay.classList.remove("is-correct", "is-wrong");
  }

  /* ---------------- Adventure run ---------------- */
  var DIFF_START_LEVEL = {
    easy: START_LEVEL,
    medium: 3,
    hard: 5,
    adaptive: START_LEVEL,
  };

  // Fields shared by classic and tables rounds.
  function newRun(kind, total) {
    return {
      kind: kind,
      milestones: [],
      index: 0,
      total: total,
      correct: 0,
      firstTry: 0,
      attemptsOnCurrent: 0,
      stars: 0,
      coins: 0,
      streak: 0,
      bestStreak: 0,
      combo: 1,
      blitzWins: 0,
      timeBonus: 0,
      starStations: [],
      missed: [],
      taskStart: 0,
      newBadges: [],
    };
  }

  // Stop every timer and pending transition before a new round starts.
  function resetRunTimers() {
    stopTimer();
    clearStageTimer();
    state.pausedStage = null;
    window.clearTimeout(state.nextTaskId);
    state.awaitingNext = false;
  }

  function startRun() {
    resetRunTimers();
    state.lastRunKind = "classic";
    var total = state.settings.quick ? 10 : 25;
    state.run = newRun("classic", total);
    state.run.mode = state.selectedMode;
    state.run.diff = state.selectedDiff;
    state.run.level = DIFF_START_LEVEL[state.selectedDiff] || START_LEVEL;
    state.run.modes = createRoundModes(state.selectedMode, total);
    grantDailyBonus();
    hideComboTag();
    buildMap(total);
    applyBuddy();
    if (els.powerups) els.powerups.hidden = false;
    renderPowerups();
    showScreen("screen-game");
    nextTask();
  }

  // Tables mode: a per-fact round from the engine, always typed, no tray.
  function startTablesRun() {
    resetRunTimers();
    state.lastRunKind = "tables";
    var total = state.settings.tableStations;
    var today = Tables.localDateKey(new Date());
    state.run = newRun("tables", total);
    state.run.round = Tables.buildTablesRound(
      state.profile.tables,
      today,
      total,
    );
    state.run.cursor = 0;
    state.run.tablesBefore = JSON.parse(JSON.stringify(state.profile.tables));
    state.run.stage = "ask";
    grantDailyBonus();
    hideComboTag();
    buildMap(total);
    applyBuddy();
    if (els.powerups) els.powerups.hidden = true;
    showScreen("screen-game");
    nextTablesStation();
  }

  // Next station of whichever kind of round is running.
  function nextStation() {
    if (!state.run) return;
    if (state.run.kind === "tables") nextTablesStation();
    else nextTask();
  }

  function nextTablesStation() {
    var run = state.run;
    if (!run) return;
    // run.cursor walks run.round; run.index is the map station.
    if (run.index >= run.total) {
      finishRun();
      return;
    }
    // Setbacks can run the round out before the last station: add more.
    if (run.cursor >= run.round.length) {
      run.round = Tables.appendRound(
        run.round,
        Tables.buildTablesRound(
          state.profile.tables,
          Tables.localDateKey(new Date()),
          5,
        ),
      );
    }
    var item = run.round[run.cursor];
    var a = item.a;
    var b = item.b;
    run.attemptsOnCurrent = 0;
    run.stage = "ask";
    run.setbackDone = false;
    activeTask = {
      type: "mul",
      operands: [a, b],
      text: a + " \u00d7 " + b + " =",
      answer: a * b,
      choice: false,
      // Visible timer only if the profile asks for it (Blitz is ignored).
      timed: !!state.settings.timer,
      item: item,
    };
    currentInput = "";
    els.question.textContent = activeTask.text;
    els.feedback.textContent = "";
    els.feedback.className = "feedback";
    els.hint.className = "hint";
    els.hint.onclick = null;
    els.hint.hidden = true;
    els.hint.textContent = "";
    els.hint.setAttribute("data-stage", "ask");
    renderAnswer();
    setupAnswerMode();
    moveWalker(run.index);
    updateMapProgressLabel();
    run.taskStart = now();
    restartTimer();
    startStageTimer(Tables.HINT_DELAY_MS, enterHintStage);
  }

  // One pending stage change (hint, then answer) of the tables cycle.
  function startStageTimer(ms, fn) {
    clearStageTimer();
    state.stageFn = fn;
    state.stageDeadline = Date.now() + ms;
    state.stageTimerId = window.setTimeout(function () {
      state.stageTimerId = null;
      state.stageFn = null;
      fn();
    }, ms);
  }
  function clearStageTimer() {
    if (state.stageTimerId) window.clearTimeout(state.stageTimerId);
    state.stageTimerId = null;
    state.stageFn = null;
    state.stageDeadline = 0;
  }

  // Hint stage: a × b blocks plus a trick that never names the result.
  function enterHintStage() {
    if (!state.run || state.run.kind !== "tables" || !activeTask) return;
    var a = activeTask.operands[0];
    var b = activeTask.operands[1];
    state.run.stage = "hint";
    currentInput = "";
    renderAnswer();
    els.hint.textContent = "";
    var grid = document.createElement("div");
    grid.className = "blocks";
    grid.setAttribute("aria-hidden", "true");
    // Block size comes from the larger side, so the grid stays ~100 px.
    grid.style.setProperty("--n", String(Math.max(a, b)));
    grid.style.gridTemplateColumns = "repeat(" + b + ", var(--cell))";
    for (var i = 0; i < a * b; i++) {
      var block = document.createElement("span");
      block.className = "block";
      grid.appendChild(block);
    }
    var trick = Tables.tablesTrick(a, b);
    var line = document.createElement("p");
    line.className = "hint-trick";
    line.textContent = t(trick.key, trick.vars);
    els.hint.appendChild(grid);
    els.hint.appendChild(line);
    els.hint.setAttribute("data-stage", "hint");
    els.hint.hidden = false;
    mascotSay(t("tables_hint_intro"), "\uD83E\uDD9C");
    startStageTimer(Tables.ANSWER_DELAY_MS, enterAnswerStage);
  }

  // Answer stage: show the result; she types it to move on (no timer).
  function enterAnswerStage() {
    if (!state.run || state.run.kind !== "tables" || !activeTask) return;
    if (state.run.stage === "answer") return;
    clearStageTimer();
    // The visible timer ends here and stays off (also after a pause).
    stopTimer();
    activeTask.timed = false;
    state.run.stage = "answer";
    if (state.settings.setbacks && !state.run.setbackDone) {
      goBackOnMiss(3);
      state.run.setbackDone = true;
    }
    var line = document.createElement("p");
    line.className = "hint-answer";
    line.textContent = t("tables_write_it", {
      q: activeTask.operands[0] + " \u00d7 " + activeTask.operands[1],
      answer: activeTask.answer,
    });
    els.hint.appendChild(line);
    els.hint.setAttribute("data-stage", "answer");
    els.hint.hidden = false;
  }

  function submitTablesAnswer(value) {
    var run = state.run;
    if (value === activeTask.answer) {
      clearStageTimer();
      var elapsed = run.taskStart ? Math.max(0, now() - run.taskStart) : 0;
      var outcome = Tables.classifyOutcome(run.stage, elapsed);
      var factTables = Tables.factTables(activeTask.item.key);
      var fillsBefore = factTables.map(function (table) {
        return Tables.characterFill(state.profile.tables, table);
      });
      state.profile.tables = Tables.recordTablesAnswer(
        state.profile.tables,
        activeTask.item,
        outcome,
        Math.round(elapsed),
        Tables.localDateKey(new Date()),
      );
      saveProfiles();
      // Needed help: the fact comes back a few stations later (if it fits).
      if (outcome === "hint" || outcome === "answer") {
        run.round = Tables.scheduleRetry(run.round, run.cursor);
      }
      rewardCorrect(outcome === "fast" || outcome === "slow");
      // After the praise, so the character news is what stays on screen.
      announceFillMilestones(factTables, fillsBefore);
      stopTimer();
      run.index++;
      run.cursor++;
      moveWalker(run.index);
      activeTask = null;
      state.nextTaskId = window.setTimeout(nextStation, 750);
      return;
    }
    // Wrong: no setback and no general learning record; just more help.
    run.streak = 0;
    run.combo = 1;
    hideComboTag();
    els.gameStreak.textContent = 0;
    els.feedback.textContent = t("feedback_wrong");
    els.feedback.className = "feedback is-wrong";
    mascotSay(pickEncourage(), "\uD83E\uDD9C");
    haptic([8, 40, 8]);
    beep(180, 220, "sawtooth");
    currentInput = "";
    renderAnswer();
    if (run.stage === "ask") enterHintStage();
    else if (run.stage === "hint") enterAnswerStage();
  }

  // The parrot announces when a table's character wakes up, is half full,
  // almost full or complete.
  function announceFillMilestones(factTables, fillsBefore) {
    factTables.forEach(function (table, i) {
      var after = Tables.characterFill(state.profile.tables, table);
      var milestone = Tables.fillMilestone(fillsBefore[i], after);
      if (!milestone) return;
      var message = t("char_" + milestone, {
        name: Characters.characterFor(table).name,
        n: table,
      });
      mascotSay(message, "\uD83E\uDD9C");
      var toast = showToast(message, "\uD83C\uDF89");
      if (toast) {
        toast.setAttribute("data-milestone", milestone);
        toast.setAttribute("data-table", table);
      }
    });
  }

  // The first run of each calendar day grants a small welcome bonus, to gently
  // encourage the "little and often" habit that the research recommends.
  function grantDailyBonus() {
    var today = new Date().toISOString().slice(0, 10);
    if (state.progress.lastPlayed !== today) {
      state.progress.lastPlayed = today;
      var bonus = 3;
      state.progress.coins += bonus;
      saveProfiles();
      refreshMenuStats();
      showToast(t("daily_bonus", { n: bonus }), "\uD83C\uDF1E");
    }
  }

  function buildMap(total) {
    els.mapStations.innerHTML = "";
    if (els.mapStationsFx) els.mapStationsFx.innerHTML = "";
    var path = els.mapPath;
    var length = path.getTotalLength ? path.getTotalLength() : 0;
    // Prepare the animated trail (the filled-in part of the route).
    if (els.mapTrail && length) {
      els.mapTrail.style.strokeDasharray = length + " " + length;
      els.mapTrail.style.strokeDashoffset = String(length);
    }
    for (var i = 0; i < total; i++) {
      var ratio = total > 1 ? i / (total - 1) : 0;
      var point =
        length && path.getPointAtLength
          ? path.getPointAtLength(ratio * length)
          : { x: 20 + ratio * 960, y: 90 };
      var circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      circle.setAttribute("cx", point.x);
      circle.setAttribute("cy", point.y);
      circle.setAttribute("r", "10");
      circle.setAttribute("class", "map-station");
      circle.dataset.index = String(i);
      els.mapStations.appendChild(circle);
      // A little flag on every fifth station as a milestone marker.
      if (els.mapStationsFx && (i % 5 === 4 || i === total - 1)) {
        var flag = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text",
        );
        flag.setAttribute("x", point.x);
        flag.setAttribute("y", point.y - 16);
        flag.setAttribute("text-anchor", "middle");
        flag.setAttribute("font-size", "22");
        flag.textContent = i === total - 1 ? "\uD83C\uDFC1" : "\uD83D\uDEA9";
        els.mapStationsFx.appendChild(flag);
      }
    }
    moveWalker(0);
  }

  function moveWalker(index) {
    var path = els.mapPath;
    var total = state.run ? state.run.total : 1;
    var ratio = total > 1 ? clamp(index, 0, total - 1) / (total - 1) : 0;
    if (path.getTotalLength && path.getPointAtLength) {
      var len = path.getTotalLength();
      var pt = path.getPointAtLength(ratio * len);
      els.mapWalker.setAttribute("x", pt.x);
      els.mapWalker.setAttribute("y", pt.y - 16);
      // Fill the colourful trail up to the walker's position.
      if (els.mapTrail) {
        els.mapTrail.style.strokeDashoffset = String(len - ratio * len);
      }
    }
    var stations = els.mapStations.querySelectorAll(".map-station");
    stations.forEach(function (s, i) {
      s.classList.toggle("is-done", i < index);
      s.classList.toggle("is-current", i === index);
      s.classList.toggle(
        "is-star",
        !!(state.run && state.run.starStations.indexOf(i) !== -1),
      );
    });
  }

  function updateMapProgressLabel() {
    var n = Math.min(state.run.index + 1, state.run.total);
    els.mapProgress.textContent = t("station_progress", {
      n: n,
      total: state.run.total,
    });
    els.mapProgress.setAttribute("data-station", String(n));
    els.mapProgress.setAttribute("data-total", String(state.run.total));
  }

  var activeTask = null;
  function nextTask() {
    if (!state.run) return;
    if (state.run.index >= state.run.total) {
      finishRun();
      return;
    }
    state.run.attemptsOnCurrent = 0;
    var mode = state.run.modes[state.run.index];
    state.run.level =
      state.run.diff === "adaptive"
        ? state.progress.learning[mode].level
        : DIFF_START_LEVEL[state.run.diff];
    activeTask = generateTask(mode, state.run.level);
    // Safety net: regenerate if a task ever falls outside the valid ranges.
    var guard = 0;
    while (!validateTask(activeTask) && guard < 10) {
      activeTask = generateTask(mode, state.run.level);
      guard++;
    }
    // Decide per task whether it is timed (Blitz) and/or multiple choice.
    activeTask.timed =
      state.settings.timer || (state.settings.blitz && Math.random() < 0.4);
    // The profile decides between answer buttons and typing on the number pad.
    activeTask.choice = !!state.settings.choices;

    currentInput = "";
    els.question.textContent = activeTask.text;
    els.feedback.textContent = "";
    els.feedback.className = "feedback";
    els.hint.hidden = true;
    els.hint.textContent = "";
    renderAnswer();
    setupAnswerMode();
    moveWalker(state.run.index);
    updateMapProgressLabel();
    state.run.taskStart = now();
    restartTimer();
    renderPowerups();
  }

  function now() {
    return typeof window !== "undefined" &&
      window.performance &&
      window.performance.now
      ? window.performance.now()
      : Date.now();
  }

  // Switch the input area between number pad and multiple-choice buttons,
  // and reveal the Blitz badge for timed tasks.
  function setupAnswerMode() {
    var useChoice = !!activeTask.choice;
    if (els.numpadWrap) els.numpadWrap.hidden = useChoice;
    if (els.checkBtn) els.checkBtn.hidden = useChoice;
    if (els.answerDisplay) els.answerDisplay.hidden = useChoice;
    if (els.choices) els.choices.hidden = !useChoice;
    if (useChoice) renderChoices();
    if (els.blitzTag) {
      els.blitzTag.hidden =
        !activeTask.timed || !!(state.run && state.run.kind === "tables");
    }
    renderPowerups();
  }

  function renderChoices() {
    els.choices.innerHTML = "";
    var count = choiceCountForLevel(state.run.level);
    var options = generateChoices(activeTask, count);
    options.forEach(function (value) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.textContent = String(value);
      btn.addEventListener("click", function () {
        if (btn.disabled) return;
        submitAnswer(value, btn);
      });
      els.choices.appendChild(btn);
    });
  }

  function checkAnswer() {
    if (!activeTask || activeTask.choice || currentInput === "") return;
    submitAnswer(parseInt(currentInput, 10), null);
  }

  // Shared entry point for both the number pad and the choice buttons.
  function submitAnswer(value, sourceBtn) {
    if (
      !activeTask ||
      state.awaitingNext ||
      !els.pauseOverlay.hidden ||
      !validateAnswer(activeTask, value)
    )
      return;
    state.run.attemptsOnCurrent++;
    if (state.run.kind === "tables") {
      submitTablesAnswer(value);
      return;
    }
    if (value === activeTask.answer) {
      if (sourceBtn) markChoice(true, sourceBtn);
      onCorrect();
    } else {
      if (sourceBtn) markChoice(false, sourceBtn);
      onWrong();
    }
  }

  function markChoice(correct, btn) {
    btn.classList.add(correct ? "is-correct" : "is-wrong");
    if (correct && els.choices) {
      els.choices.querySelectorAll(".choice").forEach(function (c) {
        c.disabled = true;
      });
    }
  }

  function onCorrect() {
    var firstTry = state.run.attemptsOnCurrent === 1;
    var elapsed = state.run.taskStart ? now() - state.run.taskStart : 0;
    // Learn the child's pace so the adaptive timer evolves with them.
    if (firstTry && elapsed > 0) {
      state.progress.avgMs = updateAvgMs(state.progress.avgMs, elapsed);
      state.progress.totalCorrect = (state.progress.totalCorrect || 0) + 1;
    }
    recordLearning(firstTry, elapsed);
    rewardCorrect(firstTry);
    stopTimer();
    state.run.index++;
    moveWalker(state.run.index);
    activeTask = null;
    state.nextTaskId = window.setTimeout(nextStation, 750);
  }

  // Streak, combo, stars, coins, bonuses, messages and effects of a right
  // answer (shared by classic and tables rounds).
  function rewardCorrect(firstTry) {
    state.run.correct++;
    if (firstTry) {
      state.run.firstTry++;
      state.run.starStations.push(state.run.index);
      // Stars double as a spendable currency for buying extra time.
      state.progress.stars = (state.progress.stars || 0) + 1;
    }
    state.run.streak++;
    if (state.run.streak > state.run.bestStreak) {
      state.run.bestStreak = state.run.streak;
    }

    // Combo multiplier grows with the streak (x1 .. x4).
    state.run.combo = clamp(1 + Math.floor(state.run.streak / 3), 1, 4);

    // Modest, predictable economy: roughly one Joker per successful run, two
    // when a strong streak is earned, and a new buddy after about 4-5 runs.
    // Coins are only earned on first-try answers.
    var earned = firstTry ? 1 : 0;
    // Reward sustained, *earned* streaks with a small bonus every 5 in a row.
    if (firstTry && state.run.streak > 0 && state.run.streak % 5 === 0) {
      earned += 2;
    }

    // Beating the Blitz timer earns a single bonus coin.
    var timeBonus = 0;
    if (activeTask.timed && firstTry && state.timerRemaining > 0) {
      timeBonus = 1;
      state.run.blitzWins++;
      state.run.timeBonus += timeBonus;
    }
    earned += timeBonus;

    state.run.coins += earned;
    state.run.stars += firstTry ? 1 : 0;
    els.gameStreak.textContent = state.run.streak;
    els.gameCoins.textContent = state.run.coins;
    if (els.answerDisplay) els.answerDisplay.classList.add("is-correct");
    els.feedback.textContent = t("feedback_correct");
    els.feedback.className = "feedback is-correct";
    showComboTag();
    if (earned > 0) floatCoins(earned);
    if (timeBonus > 0)
      showToast(t("time_bonus", { n: timeBonus }), "\u23F1\uFE0F");
    mascotSay(pickPraise(), "\uD83E\uDD9C");
    haptic(vibrationForTask(activeTask, state.run.level, firstTry));
    beep(660, 140, "triangle");

    if (
      state.run.correct % 5 === 0 &&
      state.run.milestones.indexOf(state.run.correct) === -1
    ) {
      state.run.milestones.push(state.run.correct);
      mascotSay(t("milestone", { n: state.run.correct }), "🌟");
    }
  }

  function recordLearning(correct, elapsed) {
    var mode = activeTask.type;
    state.progress.learning[mode] = updateLearning(
      state.progress.learning[mode],
      correct,
      elapsed,
    );
    saveProfiles();
  }

  function onWrong() {
    stopTimer();
    state.run.streak = 0;
    state.run.combo = 1;
    hideComboTag();
    els.gameStreak.textContent = 0;
    if (els.answerDisplay) els.answerDisplay.classList.add("is-wrong");
    els.feedback.textContent = t("feedback_wrong");
    els.feedback.className = "feedback is-wrong";
    mascotSay(pickEncourage(), "\uD83E\uDD9C");
    haptic([8, 40, 8]);
    beep(180, 220, "sawtooth");
    recordMiss();
    // Penalty (if the profile allows it): a wrong answer sends the traveller back.
    if (state.settings.setbacks) goBackOnMiss(3);
    recordLearning(false, 0);
    currentInput = "";
    // Show the worked calculation path; tap it to move to the next task.
    showSolution();
  }

  // Remember a missed task so we can show a short review at the end.
  function recordMiss() {
    if (!activeTask) return;
    var text =
      activeTask.text.replace(/\s*=\s*$/, "") + " = " + activeTask.answer;
    if (state.run.missed.indexOf(text) === -1) state.run.missed.push(text);
  }

  // Penalty movement: a wrong or too-slow answer sends the traveller back
  // along the path. The walker animates to the earlier station and a small
  // toast shows the setback. Clamped so the journey never goes before start.
  function goBackOnMiss(steps) {
    // A ready shield absorbs one setback (there is no shield in tables mode).
    if (state.run && state.run.shieldArmed && state.run.kind !== "tables") {
      state.run.shieldArmed = false;
      renderPowerups();
      showToast(t("shield_saved"), "🛡️");
      return;
    }
    var back = steps || 3;
    var before = state.run.index;
    state.run.index = clamp(state.run.index - back, 0, state.run.total);
    if (state.run.index !== before) {
      moveWalker(state.run.index);
      updateMapProgressLabel();
      showToast(String(state.run.index - before), "\u2B05\uFE0F");
    }
  }

  // After a wrong or too-slow answer: reveal the worked path and wait for a tap
  // before moving on (no retries, no separate hint).
  function showSolution() {
    stopTimer();
    state.awaitingNext = true;
    if (els.choices) {
      els.choices.querySelectorAll(".choice").forEach(function (c) {
        if (parseInt(c.textContent, 10) === activeTask.answer) {
          c.classList.add("is-correct");
        }
        c.disabled = true;
      });
    }
    if (els.hint) {
      els.hint.textContent = buildSolution(activeTask, t("division_because"));
      els.hint.hidden = false;
      els.hint.classList.add("solution");
      els.hint.onclick = advanceAfterWrong;
    }
    if (els.choices) {
      // Typing mode: swap the number pad for the choices area holding only
      // the continue button (the next setupAnswerMode restores both).
      if (!activeTask.choice) {
        if (els.numpadWrap) els.numpadWrap.hidden = true;
        els.choices.innerHTML = "";
        els.choices.hidden = false;
      }
      var cont = document.createElement("button");
      cont.type = "button";
      cont.className = "choice choice--continue";
      cont.textContent = t("next_task");
      cont.addEventListener("click", advanceAfterWrong);
      els.choices.appendChild(cont);
    }
  }
  function advanceAfterWrong() {
    if (!state.awaitingNext) return;
    state.awaitingNext = false;
    if (els.hint) {
      els.hint.classList.remove("solution");
      els.hint.onclick = null;
    }
    state.run.index++;
    moveWalker(state.run.index);
    nextStation();
  }

  /* ---------------- Juicy feedback helpers ---------------- */
  function pickPraise() {
    return t("praise_" + randInt(1, 3));
  }
  function pickEncourage() {
    return t("encourage_" + randInt(1, 3));
  }
  function mascotSay(message, face) {
    if (!els.mascot || !els.mascotBubble) return;
    els.mascot.textContent = face || "\uD83E\uDD9C";
    els.mascotBubble.textContent = message;
    els.mascot.classList.remove("is-pop");
    void els.mascot.offsetWidth; // restart the pop animation
    els.mascot.classList.add("is-pop");
  }
  function showComboTag() {
    if (!els.comboTag) return;
    if (state.run.combo > 1) {
      els.comboTag.textContent = t("combo_tag", { x: state.run.combo });
      els.comboTag.hidden = false;
      els.comboTag.classList.remove("is-pop");
      void els.comboTag.offsetWidth;
      els.comboTag.classList.add("is-pop");
    } else {
      hideComboTag();
    }
  }
  function hideComboTag() {
    if (els.comboTag) els.comboTag.hidden = true;
  }
  function floatCoins(amount) {
    if (!els.fxLayer) return;
    var node = document.createElement("span");
    node.className = "float-coin";
    node.textContent = "+" + amount + " \uD83E\uDE99";
    els.fxLayer.appendChild(node);
    window.setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
    }, 1200);
  }
  function showToast(message, icon) {
    if (!els.fxLayer) return;
    var node = document.createElement("div");
    node.className = "toast";
    node.textContent = (icon ? icon + " " : "") + message;
    els.fxLayer.appendChild(node);
    window.setTimeout(function () {
      node.classList.add("is-out");
    }, 1400);
    window.setTimeout(function () {
      if (node.parentNode) node.parentNode.removeChild(node);
    }, 2000);
    return node;
  }
  function haptic(pattern) {
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (e) {
      /* Vibration is optional. */
    }
  }

  /* ---------------- Adaptive Blitz timer ---------------- */
  // Circumference of the ring (r = 26 -> 2 * pi * 26 ~= 163.36).
  var RING_LEN = 163.36;
  function restartTimer(resume) {
    stopTimer();
    state.timerRemaining = 0;
    if (!activeTask || !activeTask.timed) {
      if (els.timerRing) els.timerRing.setAttribute("hidden", "");
      return;
    }
    if (state.awaitingNext) return;
    var budget = resume
      ? state.pausedRemaining
      : computeTimeBudget(
          state.progress.learning[activeTask.type].avgMs,
          state.run.level,
          activeTask,
        );
    state.timerBudget = budget;
    state.timerRemaining = budget;
    if (els.gameTimerChip) els.gameTimerChip.hidden = false;
    if (els.timerRing) {
      els.timerRing.removeAttribute("hidden");
      els.timerRing.classList.remove("is-low");
    }
    updateTimerRing(state.timerBudget, state.timerBudget);
    state.timerDeadline = Date.now() + budget * 1000;
    state.timerId = window.setInterval(function () {
      var remaining = Math.max(0, (state.timerDeadline - Date.now()) / 1000);
      state.timerRemaining = remaining;
      updateTimerRing(remaining, state.timerBudget);
      if (remaining <= 0) {
        stopTimer();
        onTimeout();
      }
    }, 100);
  }
  function updateTimerRing(remaining, budget) {
    if (els.gameTimer) els.gameTimer.textContent = String(Math.ceil(remaining));
    if (els.timerNum) els.timerNum.textContent = String(Math.ceil(remaining));
    if (els.timerArc && els.timerRing) {
      var frac = budget > 0 ? clamp(remaining / budget, 0, 1) : 0;
      els.timerArc.style.strokeDashoffset = String((1 - frac) * RING_LEN);
      els.timerRing.classList.toggle(
        "is-low",
        remaining <= Math.max(3, budget * 0.25),
      );
    }
  }
  function onTimeout() {
    // Tables mode: time up just shows the answer; no miss is recorded.
    if (state.run && state.run.kind === "tables") {
      enterAnswerStage();
      return;
    }
    if (state.run.attemptsOnCurrent === 0) state.run.attemptsOnCurrent = 1;
    els.feedback.textContent = t("timeout_msg");
    els.feedback.className = "feedback is-wrong";
    mascotSay(pickEncourage(), "\u23F0");
    haptic([10, 40, 10]);
    beep(160, 240, "sawtooth");
    state.run.streak = 0;
    state.run.combo = 1;
    hideComboTag();
    els.gameStreak.textContent = 0;
    recordMiss();
    recordLearning(false, 0);
    // Too slow on the Blitz timer: send the traveller back (if allowed).
    if (state.settings.setbacks) goBackOnMiss(3);
    showSolution();
  }
  function stopTimer() {
    if (state.timerId) {
      window.clearInterval(state.timerId);
      state.timerId = null;
    }
    if (els.timerRing) els.timerRing.setAttribute("hidden", "");
    if (els.gameTimerChip) els.gameTimerChip.hidden = true;
  }

  /* ---------------- Finish + rewards ---------------- */
  function awardBadge(id) {
    if (state.progress.badges.indexOf(id) !== -1) return;
    state.progress.badges.push(id);
    state.run.newBadges.push(id);
  }

  function evaluateBadges() {
    if (state.progress.treasures >= 1) awardBadge("first_treasure");
    if (state.run.bestStreak >= 5) awardBadge("streak5");
    if (state.run.bestStreak >= 10) awardBadge("streak10");
    if (state.progress.coins >= 100) awardBadge("coins100");
    if (state.run.firstTry === state.run.total) awardBadge("perfect");
    if (state.progress.treasures >= 5) awardBadge("explorer");
    if (state.progress.blitzWins >= 10) awardBadge("speedy");
    if (state.run.combo >= 4) awardBadge("combo_master");
  }

  function badgeLabel(id) {
    var entry = BADGE_LABELS[id];
    if (!entry) return id;
    var text = entry[state.lang] || entry.en;
    return entry.icon + " " + text;
  }

  function finishRun() {
    stopTimer();
    clearStageTimer();
    // Persist progress.
    state.progress.coins += state.run.coins;
    state.progress.treasures += 1;
    if (state.run.bestStreak > state.progress.bestStreak) {
      state.progress.bestStreak = state.run.bestStreak;
    }
    if (state.run.combo > (state.progress.bestCombo || 0)) {
      state.progress.bestCombo = state.run.combo;
    }
    state.progress.blitzWins =
      (state.progress.blitzWins || 0) + state.run.blitzWins;
    evaluateBadges();
    saveProfiles();

    // Fill summary screen.
    els.sumStars.textContent = state.run.stars;
    els.sumCoins.textContent = state.run.coins;
    els.sumStreak.textContent = state.run.bestStreak;
    if (state.run.kind === "tables") {
      renderTablesSummary();
    } else {
      var accuracy =
        state.run.total > 0
          ? Math.round((state.run.correct / state.run.total) * 100)
          : 0;
      els.sumAccuracy.textContent = accuracy + "%";
      setSummaryLabel("lbl_accuracy");
      els.sumProgressLine.hidden = true;
      els.sumProgressLine.textContent = "";
      renderReview();
    }
    prepareChestReveal();

    renderBadges();
    showScreen("screen-summary");
    els.chest.classList.add("is-shaking");
    playVictoryMelody();
    haptic([60, 40, 60, 40, 140]);
    refreshMenuStats();
  }

  function setSummaryLabel(key) {
    els.sumAccuracyLbl.setAttribute("data-i18n", key);
    els.sumAccuracyLbl.textContent = t(key);
  }

  // Tables summary: facts mastered today instead of accuracy, no review.
  function renderTablesSummary() {
    var run = state.run;
    var n = Tables.newlyMastered(run.tablesBefore, state.profile.tables).length;
    els.sumAccuracy.textContent = String(n);
    setSummaryLabel("lbl_mastered_today");
    var line;
    if (n === 1) line = t("sum_mastered_one");
    else if (n > 1) line = t("sum_mastered", { n: n });
    else {
      var keys = [];
      run.round.slice(0, run.cursor).forEach(function (item) {
        if (keys.indexOf(item.key) === -1) keys.push(item.key);
      });
      line = t("sum_practiced", { n: keys.length });
    }
    els.sumProgressLine.textContent = line;
    els.sumProgressLine.hidden = false;
    if (els.reviewBox) els.reviewBox.hidden = true;
  }

  // Show up to six missed tasks so the child can practise them again.
  function renderReview() {
    if (!els.reviewBox || !els.reviewList) return;
    els.reviewList.innerHTML = "";
    if (!state.run.missed.length) {
      els.reviewBox.hidden = true;
      return;
    }
    els.reviewBox.hidden = false;
    var head = els.reviewBox.querySelector(".review-title");
    if (head) head.textContent = t("review_title");
    state.run.missed.slice(0, 6).forEach(function (text) {
      var li = document.createElement("li");
      li.textContent = text;
      els.reviewList.appendChild(li);
    });
  }

  // Random final treasure description, recombined every run.
  function pickTreasure() {
    var chests = [
      "\uD83D\uDC8E",
      "\uD83D\uDC51",
      "\uD83E\uDED9",
      "\uD83C\uDFC6",
      "\u2728",
      "\uD83E\uDDED",
      "\uD83D\uDDDD\uFE0F",
      "\uD83D\uDC8D",
    ];
    var pick = chests[randInt(0, chests.length - 1)];
    return pick + " " + t("treasure_found");
  }

  function renderBadges() {
    els.badgeShelf.innerHTML = "";
    state.progress.badges.forEach(function (id) {
      var span = document.createElement("span");
      span.className = "badge";
      if (state.run.newBadges.indexOf(id) !== -1)
        span.className += " badge--new";
      span.textContent = badgeLabel(id);
      els.badgeShelf.appendChild(span);
    });
  }

  function openChest() {
    els.chest.classList.remove("is-shaking");
    els.chest.classList.add("is-open");
    burstConfetti();
    beep(880, 200, "triangle");
    revealTreasure();
    window.setTimeout(function () {
      els.chest.classList.remove("is-open");
    }, 600);
  }

  /* ---------------- Confetti FX (pure DOM/CSS) ---------------- */
  function burstConfetti() {
    var colors = ["#ff8a3d", "#6c5ce7", "#18c29c", "#ffc83d", "#ef6a5a"];
    for (var i = 0; i < 40; i++) {
      var piece = document.createElement("span");
      piece.className = "confetti";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.background = colors[i % colors.length];
      piece.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
      piece.style.animationDelay = Math.random() * 0.3 + "s";
      els.fxLayer.appendChild(piece);
      (function (node) {
        window.setTimeout(function () {
          if (node.parentNode) node.parentNode.removeChild(node);
        }, 3200);
      })(piece);
    }
  }

  /* ---------------- Daily treasure reveal ---------------- */
  function treasureName(tr) {
    return tr[state.lang] || tr.en;
  }

  // Reset the chest to its closed, tappable state before the summary shows.
  function prepareChestReveal() {
    state.revealed = false;
    els.treasureLine.textContent = t("tap_chest");
    if (els.treasureReveal) {
      els.treasureReveal.hidden = true;
      els.treasureReveal.innerHTML = "";
    }
  }

  // Reveal the treasure of the day, collect it, and celebrate. Triggered when
  // the child taps the chest on the summary screen.
  function revealTreasure() {
    if (state.revealed) return;
    state.revealed = true;
    var tr = TREASURES[dailyTreasureIndex(new Date())];
    if (!state.progress.collection) state.progress.collection = [];
    var isNew = state.progress.collection.indexOf(tr.id) === -1;
    if (isNew) {
      state.progress.collection.push(tr.id);
    }
    // A treasure can occasionally also contain a few coins (rather rare).
    if (Math.random() < 0.18) {
      var reward = randInt(3, 9);
      state.progress.coins += reward;
      showToast(t("coin_treasure", { n: reward }), "\uD83E\uDE99");
    }
    saveProfiles();
    if (els.treasureReveal) {
      els.treasureReveal.hidden = false;
      els.treasureReveal.innerHTML =
        '<div class="treasure-img">' +
        tr.svg +
        '</div><div class="treasure-name"></div><div class="treasure-count"></div>';
      els.treasureReveal.querySelector(".treasure-name").textContent =
        treasureName(tr);
      els.treasureReveal.querySelector(".treasure-count").textContent = t(
        "treasure_count",
        { n: state.progress.collection.length },
      );
      els.treasureReveal.classList.remove("is-pop");
      void els.treasureReveal.offsetWidth;
      els.treasureReveal.classList.add("is-pop");
    }
    els.treasureLine.textContent = t("daily_treasure");
    refreshMenuStats();
  }

  // A short, cheerful arpeggio when the goal is reached (respects sound).
  function playVictoryMelody() {
    var notes = [
      [523, 150],
      [659, 150],
      [784, 150],
      [1047, 320],
    ];
    var delay = 0;
    notes.forEach(function (note) {
      window.setTimeout(function () {
        beep(note[0], note[1], "triangle");
      }, delay);
      delay += note[1] + 20;
    });
  }

  /* ---------------- Coin shop + power-ups ---------------- */
  function shopLabel(item) {
    return item[state.lang] || item.en;
  }
  function shopDesc(item) {
    return (state.lang === "es" ? item.esDesc : item.enDesc) || item.enDesc;
  }
  function inventoryCount(id) {
    return (state.progress.inventory && state.progress.inventory[id]) || 0;
  }

  var STAR_TIME_COST = 3;
  function starBank() {
    return state.progress.stars || 0;
  }
  // Spend stars during a timed task to gain ten extra seconds of thinking time.
  function buyTimeWithStars() {
    if (state.run && state.run.kind === "tables") return;
    if (!activeTask || !activeTask.timed || !state.timerId) {
      showToast(t("time_only_timed"), "⏳");
      return;
    }
    if (starBank() < STAR_TIME_COST) {
      showToast(t("not_enough_stars"), "⭐");
      return;
    }
    state.progress.stars = starBank() - STAR_TIME_COST;
    state.timerDeadline += 10000;
    state.timerBudget = (state.timerBudget || 10) + 10;
    saveProfiles();
    showToast(t("time_added_10"), "⏳");
    beep(620, 140, "sine");
    refreshMenuStats();
    renderPowerups();
  }

  // The little tray of power-up buttons shown during a run.
  function renderPowerups() {
    if (!els.powerups) return;
    els.powerups.innerHTML = "";
    // Stars -> +10s button (handy on timed Blitz tasks).
    var starBtn = document.createElement("button");
    starBtn.type = "button";
    starBtn.className = "powerup powerup--star";
    starBtn.innerHTML =
      '<span class="powerup-icon" aria-hidden="true">⭐</span>' +
      '<span class="powerup-count">' +
      starBank() +
      "</span>";
    var canBuyTime =
      starBank() >= STAR_TIME_COST &&
      activeTask &&
      activeTask.timed &&
      state.timerId;
    if (!canBuyTime) starBtn.classList.add("is-empty");
    starBtn.setAttribute(
      "aria-label",
      t("buy_time") + " (" + STAR_TIME_COST + " ⭐)",
    );
    starBtn.title = t("buy_time");
    starBtn.addEventListener("click", buyTimeWithStars);
    els.powerups.appendChild(starBtn);
    SHOP_POWERUPS.forEach(function (pu) {
      if (pu.id === "shield" && !state.settings.setbacks) return;
      var count = inventoryCount(pu.id);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "powerup" + (count <= 0 ? " is-empty" : "");
      btn.setAttribute("data-powerup", pu.id);
      btn.innerHTML =
        '<span class="powerup-icon" aria-hidden="true">' +
        pu.icon +
        '</span><span class="powerup-count">' +
        count +
        "</span>";
      btn.setAttribute("aria-label", shopLabel(pu) + " (" + count + ")");
      btn.addEventListener("click", function () {
        usePowerup(pu.id);
      });
      els.powerups.appendChild(btn);
    });
  }

  function usePowerup(id) {
    // The tray is hidden in tables mode; power-ups never apply there.
    if (state.run && state.run.kind === "tables") return;
    if (inventoryCount(id) <= 0) {
      showToast(t("no_powerup"), "🛒");
      return;
    }
    var used = false;
    if (id === "joker") used = jokerSolve();
    else if (id === "fifty") used = removeTwoWrong();
    else if (id === "time") used = addBlitzTime();
    else if (id === "shield") used = armShield();
    if (used) {
      state.progress.inventory[id] -= 1;
      saveProfiles();
      renderPowerups();
    }
  }

  // Joker: instantly solve the current task. It keeps the journey moving but
  // does not award a first-try star (it counts as a helped solve).
  function jokerSolve() {
    if (!activeTask || state.awaitingNext) return false;
    stopTimer();
    if (els.choices) {
      els.choices.querySelectorAll(".choice").forEach(function (c) {
        if (parseInt(c.textContent, 10) === activeTask.answer) {
          c.classList.add("is-correct");
        }
        c.disabled = true;
      });
    }
    els.feedback.textContent = t("joker_used");
    els.feedback.className = "feedback is-correct";
    mascotSay(t("joker_used"), "🪄");
    beep(700, 160, "triangle");
    state.run.index++;
    moveWalker(state.run.index);
    activeTask = null;
    state.nextTaskId = window.setTimeout(nextStation, 750);
    return true;
  }

  // 50:50 helper: disable two of the wrong answers.
  function removeTwoWrong() {
    if (!activeTask || !els.choices) return false;
    var wrong = [];
    els.choices.querySelectorAll(".choice").forEach(function (c) {
      if (!c.disabled && parseInt(c.textContent, 10) !== activeTask.answer) {
        wrong.push(c);
      }
    });
    if (wrong.length < 2) return false;
    for (var i = wrong.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = wrong[i];
      wrong[i] = wrong[j];
      wrong[j] = tmp;
    }
    wrong[0].disabled = true;
    wrong[0].classList.add("is-faded");
    wrong[1].disabled = true;
    wrong[1].classList.add("is-faded");
    showToast(t("fifty_used"), "✂️");
    beep(520, 120, "sine");
    return true;
  }

  // Extra time: extend a running Blitz timer by five seconds.
  function addBlitzTime() {
    if (!activeTask || !activeTask.timed || !state.timerId) return false;
    state.timerDeadline += 5000;
    state.timerBudget = (state.timerBudget || 5) + 5;
    showToast(t("time_added"), "⏳");
    beep(600, 120, "sine");
    return true;
  }

  // Shield: arm protection that absorbs the next setback.
  function armShield() {
    if (!state.run || state.run.shieldArmed) return false;
    state.run.shieldArmed = true;
    showToast(t("shield_armed"), "🛡️");
    beep(560, 120, "sine");
    return true;
  }

  /* ---------------- Shop overlay ---------------- */
  function ensureShop() {
    if (els.shopOverlay) return;
    var ov = document.createElement("div");
    ov.id = "shop-overlay";
    ov.className = "overlay shop-overlay";
    ov.hidden = true;
    ov.innerHTML =
      '<div class="card shop-card">' +
      '<button class="btn btn--ghost shop-close" type="button" data-action="close-shop">✕</button>' +
      '<h2 class="shop-title"></h2>' +
      '<p class="shop-coins"></p>' +
      '<h3 class="shop-section-label shop-h-pu"></h3>' +
      '<div class="shop-list" id="shop-powerups"></div>' +
      '<h3 class="shop-section-label shop-h-buddy"></h3>' +
      '<div class="shop-grid" id="shop-buddies"></div>' +
      "</div>";
    document.body.appendChild(ov);
    els.shopOverlay = ov;
    els.shopPowerups = ov.querySelector("#shop-powerups");
    els.shopBuddies = ov.querySelector("#shop-buddies");
    ov.addEventListener("click", function (event) {
      if (event.target === ov) closeShop();
    });
  }
  function openShop() {
    ensureShop();
    renderShop();
    els.shopOverlay.hidden = false;
  }
  function closeShop() {
    if (els.shopOverlay) els.shopOverlay.hidden = true;
  }
  function renderShop() {
    var ov = els.shopOverlay;
    ov.querySelector(".shop-title").textContent = t("shop_title");
    ov.querySelector(".shop-coins").textContent = "🪙 " + state.progress.coins;
    ov.querySelector(".shop-h-pu").textContent = t("shop_powerups");
    ov.querySelector(".shop-h-buddy").textContent = t("shop_buddies");
    els.shopPowerups.innerHTML = "";
    SHOP_POWERUPS.forEach(function (pu) {
      // Without setbacks there is nothing for a shield to absorb.
      if (pu.id === "shield" && !state.settings.setbacks) return;
      var row = document.createElement("div");
      row.className = "shop-item";
      row.setAttribute("data-powerup", pu.id);
      row.innerHTML =
        '<span class="shop-item-icon" aria-hidden="true">' +
        pu.icon +
        '</span><span class="shop-item-text"><span class="shop-item-name"></span><span class="shop-item-desc"></span></span>' +
        '<button class="btn btn--primary shop-buy" type="button"></button>';
      row.querySelector(".shop-item-name").textContent =
        shopLabel(pu) + " (" + inventoryCount(pu.id) + ")";
      row.querySelector(".shop-item-desc").textContent = shopDesc(pu);
      var buy = row.querySelector(".shop-buy");
      buy.textContent = t("shop_buy") + " · " + pu.price + " 🪙";
      buy.disabled = state.progress.coins < pu.price;
      buy.addEventListener("click", function () {
        buyPowerup(pu);
      });
      els.shopPowerups.appendChild(row);
    });
    els.shopBuddies.innerHTML = "";
    SHOP_BUDDIES.forEach(function (b) {
      var owned =
        b.price === 0 || (state.progress.buddies || []).indexOf(b.id) !== -1;
      var equipped = state.progress.buddy === b.id;
      var card = document.createElement("button");
      card.type = "button";
      card.className = "buddy-card" + (equipped ? " is-equipped" : "");
      if (!owned && state.progress.coins < b.price) {
        card.classList.add("is-locked");
      }
      card.innerHTML =
        '<span class="buddy-emoji" aria-hidden="true">' +
        b.emoji +
        '</span><span class="buddy-name"></span><span class="buddy-action"></span>';
      card.querySelector(".buddy-name").textContent = shopLabel(b);
      var action = equipped
        ? t("shop_equipped")
        : owned
          ? t("shop_equip")
          : b.price + " 🪙";
      card.querySelector(".buddy-action").textContent = action;
      card.addEventListener("click", function () {
        buyOrEquipBuddy(b);
      });
      els.shopBuddies.appendChild(card);
    });
  }
  function buyPowerup(pu) {
    if (state.progress.coins < pu.price) {
      showToast(t("not_enough_coins"), "🪙");
      return;
    }
    state.progress.coins -= pu.price;
    if (!state.progress.inventory) state.progress.inventory = {};
    state.progress.inventory[pu.id] = inventoryCount(pu.id) + 1;
    saveProfiles();
    beep(720, 120, "triangle");
    refreshMenuStats();
    renderShop();
    renderPowerups();
  }
  function buyOrEquipBuddy(b) {
    var owned =
      b.price === 0 || (state.progress.buddies || []).indexOf(b.id) !== -1;
    if (!owned) {
      if (state.progress.coins < b.price) {
        showToast(t("not_enough_coins"), "🪙");
        return;
      }
      state.progress.coins -= b.price;
      if (!state.progress.buddies) state.progress.buddies = ["kid"];
      state.progress.buddies.push(b.id);
      beep(720, 120, "triangle");
    }
    state.progress.buddy = b.id;
    saveProfiles();
    applyBuddy();
    refreshMenuStats();
    renderShop();
  }
  // Apply the chosen travelling buddy to the map walker.
  function applyBuddy() {
    var id = state.progress.buddy || "kid";
    var found = SHOP_BUDDIES.filter(function (x) {
      return x.id === id;
    })[0];
    if (found && els.mapWalker) els.mapWalker.textContent = found.emoji;
  }

  /* ---------------- Navigation helpers ---------------- */
  // Stop timers and any pending task transition before leaving a round.
  function leaveRun() {
    stopTimer();
    clearStageTimer();
    state.pausedStage = null;
    window.clearTimeout(state.nextTaskId);
    activeTask = null;
    state.awaitingNext = false;
    state.run = null;
  }
  // Home depends on the profile: tables home, or the classic menu with the
  // profile's main mode preselected.
  function goHome() {
    leaveRun();
    refreshMenuStats();
    if (state.settings.mainMode === "tables") {
      renderHomeGreeting();
      renderHomeCharacters();
      showScreen("screen-tables-home");
      return;
    }
    selectModeCard(state.settings.mainMode);
    showScreen("screen-menu");
  }
  // One card per table: the character, filled by mastered facts, and "n/10".
  function renderHomeCharacters() {
    var box = els.homeCharacters;
    if (!box || !state.profile) return;
    box.innerHTML = "";
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", t("home_characters_label"));
    Characters.CHARACTERS.forEach(function (ch) {
      var fill = Tables.characterFill(state.profile.tables, ch.table);
      var card = document.createElement("button");
      card.type = "button";
      card.className = "char-card";
      card.setAttribute("data-table", ch.table);
      card.setAttribute("data-fill", fill);
      card.setAttribute(
        "aria-label",
        t("char_status", { name: ch.name, n: ch.table, fill: fill }),
      );
      card.innerHTML = Characters.characterSvg(ch.table, fill, "none");
      var name = document.createElement("span");
      name.className = "char-name";
      name.textContent = ch.name;
      var count = document.createElement("span");
      count.className = "char-count";
      count.textContent = fill + "/10";
      card.appendChild(name);
      card.appendChild(count);
      box.appendChild(card);
    });
  }
  // Tapping a character: the parrot tells how full it is.
  function wireHomeCharacters() {
    if (!els.homeCharacters) return;
    els.homeCharacters.addEventListener("click", function (event) {
      var card = event.target.closest(".char-card");
      if (!card || !state.profile) return;
      var table = Number(card.getAttribute("data-table"));
      showToast(
        t("char_status", {
          name: Characters.characterFor(table).name,
          n: table,
          fill: Tables.characterFill(state.profile.tables, table),
        }),
        "\uD83E\uDD9C",
      );
    });
  }
  function renderHomeGreeting() {
    els.homeGreeting.textContent = t("home_greeting", {
      name: state.profile ? state.profile.name : "",
    });
  }

  /* ---------------- Profiles ---------------- */
  function goToProfiles() {
    leaveRun();
    state.profile = null;
    state.settings = normalizeSettings();
    state.progress = defaultProgress();
    renderProfileGrid();
    showScreen("screen-profiles");
  }
  function renderProfileGrid() {
    els.profileGrid.innerHTML = "";
    state.store.profiles.forEach(function (profile) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "profile-btn";
      btn.setAttribute("data-profile-id", profile.id);
      var avatar = document.createElement("span");
      avatar.className = "profile-avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = profile.avatar;
      var name = document.createElement("span");
      name.className = "profile-name";
      name.textContent = profile.name;
      btn.appendChild(avatar);
      btn.appendChild(name);
      btn.addEventListener("click", function () {
        useProfile(profile.id);
      });
      els.profileGrid.appendChild(btn);
    });
    els.whoEmpty.hidden = state.store.profiles.length > 0;
  }
  function useProfile(id) {
    var profile = state.store.profiles.filter(function (p) {
      return p.id === id;
    })[0];
    if (!profile) return;
    state.profile = profile;
    state.settings = profile.settings;
    state.progress = profile.progress;
    state.store.lastId = id;
    saveProfiles();
    applyBuddy();
    refreshMenuStats();
    goHome();
  }

  /* ---------------- Mode + difficulty selection ---------------- */
  function selectModeCard(mode) {
    state.selectedMode = mode;
    document.querySelectorAll(".mode-card").forEach(function (c) {
      var selected = c.dataset.mode === mode;
      c.classList.toggle("is-selected", selected);
      c.setAttribute("aria-checked", selected ? "true" : "false");
    });
  }
  function wireModeSelection() {
    document.querySelectorAll(".mode-card").forEach(function (card) {
      card.addEventListener("click", function () {
        selectModeCard(card.dataset.mode);
      });
    });
    document.querySelectorAll(".chip[data-diff]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        state.selectedDiff = chip.dataset.diff;
        document.querySelectorAll(".chip[data-diff]").forEach(function (c) {
          var selected = c === chip;
          c.classList.toggle("is-selected", selected);
          c.setAttribute("aria-checked", selected ? "true" : "false");
        });
      });
    });
  }

  /* ---------------- Parents area ---------------- */
  // A grown-up gate guards the parents area; it opens only from who-plays.
  function openGate() {
    state.gate = parentChallenge();
    els.gateQuestion.textContent = state.gate.a + " × " + state.gate.b + " = ?";
    els.gateInput.value = "";
    els.gateFeedback.hidden = true;
    els.parentGate.hidden = false;
    els.gateInput.focus();
  }
  function closeGate() {
    els.parentGate.hidden = true;
    state.gate = null;
  }
  function checkGate() {
    if (!state.gate) return;
    if (parseInt(els.gateInput.value, 10) === state.gate.answer) {
      closeGate();
      goToParents();
      return;
    }
    state.gate = parentChallenge();
    els.gateQuestion.textContent = state.gate.a + " × " + state.gate.b + " = ?";
    els.gateFeedback.hidden = false;
    els.gateInput.value = "";
    els.gateInput.focus();
  }
  function goToParents() {
    state.editingId = "";
    renderParentProfiles();
    renderLanguageGrids();
    showScreen("screen-parents");
  }
  function renderParentProfiles() {
    els.parentProfiles.innerHTML = "";
    state.store.profiles.forEach(function (profile) {
      var row = document.createElement("li");
      row.className = "parent-profile";
      var avatar = document.createElement("span");
      avatar.className = "profile-avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = profile.avatar;
      var name = document.createElement("span");
      name.className = "parent-profile-name";
      name.textContent = profile.name;
      var edit = document.createElement("button");
      edit.type = "button";
      edit.className = "btn btn--secondary parent-edit";
      edit.setAttribute("data-edit-id", profile.id);
      edit.setAttribute("data-i18n", "btn_edit");
      edit.textContent = t("btn_edit");
      edit.addEventListener("click", function () {
        openEditor(profile.id);
      });
      row.appendChild(avatar);
      row.appendChild(name);
      row.appendChild(edit);
      els.parentProfiles.appendChild(row);
    });
  }
  function addProfile() {
    var fallback = t("profile_default_name", {
      n: state.store.profiles.length + 1,
    });
    var profile = createProfile(
      fallback,
      PROFILE_AVATARS[0],
      state.store.profiles.map(function (p) {
        return p.id;
      }),
      fallback,
    );
    state.store.profiles.push(profile);
    saveProfiles();
    openEditor(profile.id);
  }
  function editingProfile() {
    return state.store.profiles.filter(function (p) {
      return p.id === state.editingId;
    })[0];
  }
  function openEditor(id) {
    state.editingId = id;
    var profile = editingProfile();
    if (!profile) return;
    els.editName.value = profile.name;
    renderAvatarPicker(profile);
    syncToggles();
    showScreen("screen-profile-edit");
  }
  function renderAvatarPicker(profile) {
    els.editAvatars.innerHTML = "";
    PROFILE_AVATARS.forEach(function (emoji) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "avatar-btn";
      btn.setAttribute("data-avatar", emoji);
      var selected = emoji === profile.avatar;
      btn.classList.toggle("is-selected", selected);
      btn.setAttribute("aria-pressed", selected ? "true" : "false");
      btn.textContent = emoji;
      btn.addEventListener("click", function () {
        var current = editingProfile();
        if (!current) return;
        current.avatar = emoji;
        saveProfiles();
        renderAvatarPicker(current);
      });
      els.editAvatars.appendChild(btn);
    });
  }
  function deleteEditingProfile() {
    var profile = editingProfile();
    if (!profile) return;
    if (!window.confirm(t("delete_confirm", { name: profile.name }))) return;
    state.store.profiles = state.store.profiles.filter(function (p) {
      return p !== profile;
    });
    if (state.store.lastId === profile.id) state.store.lastId = "";
    saveProfiles();
    goToParents();
  }

  /* ---------------- Fact album (parents area) ---------------- */
  var ALBUM_STATES = ["new", "practicing", "almost", "mastered"];
  function albumCell(state, label, title) {
    var cell = document.createElement("div");
    cell.className = "album-cell";
    cell.setAttribute("data-state", state);
    cell.textContent = label;
    if (title) {
      cell.title = title;
      cell.setAttribute("aria-label", title);
    }
    return cell;
  }
  function albumHead(text) {
    var head = document.createElement("div");
    head.className = "album-head";
    head.textContent = text;
    return head;
  }
  function formatSeconds(ms) {
    var secs = Math.round(ms / 100) / 10;
    try {
      return secs.toLocaleString(state.lang, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
    } catch (error) {
      return secs.toFixed(1);
    }
  }
  // 11 x 11 grid: a corner, column headers 1-10, then each row's header and
  // its ten facts coloured by state; the summary counts the 55 facts.
  function renderAlbum() {
    var profile = editingProfile();
    if (!profile) return;
    var tables = profile.tables;
    els.albumTitle.textContent = t("album_title", { name: profile.name });
    var mastered = 0;
    var practicing = 0;
    Object.keys(tables.facts).forEach(function (key) {
      var factState = tables.facts[key].state;
      if (factState === "mastered") mastered++;
      else if (factState === "practicing") practicing++;
    });
    els.albumSummary.textContent = t("album_summary", {
      m: mastered,
      p: practicing,
    });
    els.albumSummary.setAttribute("data-mastered", String(mastered));
    els.albumSummary.setAttribute("data-practicing", String(practicing));
    els.albumGrid.innerHTML = "";
    els.albumGrid.appendChild(albumHead("×"));
    for (var n = 1; n <= 10; n++) els.albumGrid.appendChild(albumHead(n));
    Tables.albumCells(tables).forEach(function (item) {
      if (item.b === 1) els.albumGrid.appendChild(albumHead(item.a));
      var fact = tables.facts[item.key];
      var q = item.a + " × " + item.b;
      var cell = albumCell(
        item.state,
        q,
        t("album_cell_detail", {
          q: q,
          seen: fact.seen,
          secs: fact.seen ? formatSeconds(fact.avgMs) : "–",
        }),
      );
      cell.setAttribute("data-a", String(item.a));
      cell.setAttribute("data-b", String(item.b));
      els.albumGrid.appendChild(cell);
    });
    els.albumLegend.innerHTML = "";
    ALBUM_STATES.forEach(function (key) {
      var row = document.createElement("li");
      row.className = "album-legend-item";
      var swatch = albumCell(key, "");
      swatch.setAttribute("aria-hidden", "true");
      row.appendChild(swatch);
      var label = document.createElement("span");
      label.textContent = t("album_" + key);
      row.appendChild(label);
      els.albumLegend.appendChild(row);
    });
  }
  function openAlbum() {
    if (!editingProfile()) return;
    renderAlbum();
    showScreen("screen-album");
  }

  /* ---------------- Profile editor controls ---------------- */
  var SETTING_TOGGLES = [
    ["toggleSound", "sound"],
    ["toggleMusic", "music"],
    ["toggleTimer", "timer"],
    ["toggleBlitz", "blitz"],
    ["toggleQuick", "quick"],
    ["toggleChoices", "choices"],
    ["toggleSetbacks", "setbacks"],
  ];
  // Copy the edited profile's settings into the editor controls.
  function syncToggles() {
    var profile = editingProfile();
    if (!profile) return;
    SETTING_TOGGLES.forEach(function (pair) {
      els[pair[0]].checked = profile.settings[pair[1]];
    });
    els.editMainMode.value = profile.settings.mainMode;
    els.editStations.value = String(profile.settings.tableStations);
  }
  function buildEditorSelects() {
    MAIN_MODES.forEach(function (mode) {
      var option = document.createElement("option");
      var key = mode === "tables" ? "mode_tables" : "m_" + mode;
      option.value = mode;
      option.setAttribute("data-i18n", key);
      option.textContent = t(key);
      els.editMainMode.appendChild(option);
    });
    TABLE_STATION_OPTIONS.forEach(function (count) {
      var option = document.createElement("option");
      option.value = String(count);
      option.textContent = String(count);
      els.editStations.appendChild(option);
    });
  }
  // Every control writes straight into the edited profile and saves.
  function wireToggles() {
    function update(key, value) {
      var profile = editingProfile();
      if (!profile) return;
      profile.settings[key] = value;
      saveProfiles();
    }
    SETTING_TOGGLES.forEach(function (pair) {
      var input = els[pair[0]];
      input.addEventListener("change", function () {
        update(pair[1], input.checked);
      });
    });
    els.editMainMode.addEventListener("change", function () {
      update("mainMode", els.editMainMode.value);
    });
    els.editStations.addEventListener("change", function () {
      update("tableStations", parseInt(els.editStations.value, 10));
    });
    els.editName.addEventListener("blur", function () {
      var profile = editingProfile();
      if (!profile) return;
      profile.name = cleanProfileName(els.editName.value, profile.name);
      els.editName.value = profile.name;
      saveProfiles();
    });
    els.gateInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        checkGate();
      }
    });
  }

  // Reset the progress of the profile being edited (after confirmation).
  function resetProgress() {
    var profile = editingProfile();
    if (!profile) return;
    if (!window.confirm(t("reset_confirm"))) return;
    profile.progress = defaultProgress();
    profile.tables = Tables.normalizeTables();
    saveProfiles();
  }

  /* ---------------- Global action handling ---------------- */
  function handleAction(action) {
    switch (action) {
      case "go-modes":
        showScreen("screen-modes");
        break;
      case "go-menu":
        goHome();
        break;
      case "switch-player":
        goToProfiles();
        break;
      case "open-parents":
        openGate();
        break;
      case "gate-ok":
        checkGate();
        break;
      case "gate-cancel":
        closeGate();
        break;
      case "go-profiles":
        goToProfiles();
        break;
      case "back-parents":
        goToParents();
        break;
      case "add-profile":
        addProfile();
        break;
      case "delete-profile":
        deleteEditingProfile();
        break;
      case "open-album":
        openAlbum();
        break;
      case "back-edit":
        showScreen("screen-profile-edit");
        break;
      case "go-howto":
        showScreen("screen-howto");
        break;
      case "start-run":
        startRun();
        break;
      case "start-tables":
        startTablesRun();
        break;
      case "check":
        checkAnswer();
        break;
      case "pause":
        if (!els.pauseOverlay.hidden) break;
        state.pausedRemaining = state.timerId
          ? Math.max(0, (state.timerDeadline - Date.now()) / 1000)
          : 0;
        state.pausedAt = now();
        // Keep what is left of a pending hint/answer wait.
        state.pausedStage = state.stageTimerId
          ? {
              fn: state.stageFn,
              ms: Math.max(0, state.stageDeadline - Date.now()),
            }
          : null;
        clearStageTimer();
        window.clearTimeout(state.nextTaskId);
        stopTimer();
        els.pauseOverlay.hidden = false;
        break;
      case "resume":
        els.pauseOverlay.hidden = true;
        if (state.run) {
          state.run.taskStart += now() - state.pausedAt;
          if (activeTask) {
            restartTimer(true);
            if (state.pausedStage) {
              startStageTimer(state.pausedStage.ms, state.pausedStage.fn);
            }
          } else nextStation();
          state.pausedStage = null;
          renderPowerups();
        }
        break;
      case "quit":
        els.pauseOverlay.hidden = true;
        goHome();
        break;
      case "play-again":
        if (state.lastRunKind === "tables") startTablesRun();
        else startRun();
        break;
      case "reset":
        resetProgress();
        break;
      case "go-shop":
        openShop();
        break;
      case "close-shop":
        closeShop();
        break;
      default:
        break;
    }
  }

  function wireActions() {
    document.body.addEventListener("click", function (event) {
      var target = event.target.closest("[data-action]");
      if (!target) return;
      handleAction(target.getAttribute("data-action"));
    });

    // Chest can be opened by tap, click, Enter or Space.
    els.chest.addEventListener("click", openChest);
    els.chest.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openChest();
      }
    });

    // Physical keyboard support for the number pad.
    document.addEventListener("keydown", function (event) {
      if (
        !document.getElementById("screen-game").classList.contains("is-active")
      ) {
        return;
      }
      if (/^[0-9]$/.test(event.key)) {
        handleKey(event.key);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        handleKey("del");
      } else if (event.key === "Enter") {
        event.preventDefault();
        checkAnswer();
      } else if (event.key === "Escape") {
        handleAction("pause");
      }
    });
  }

  /* ---------------- Service worker registration ---------------- */
  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker
          .register("service-worker.js")
          .catch(function () {
            /* Offline support is optional; ignore registration errors. */
          });
      });
    }
  }

  /* ---------------- Boot ---------------- */
  function init() {
    buildNumpad();
    wireModeSelection();
    buildEditorSelects();
    wireToggles();
    wireActions();
    wireHomeCharacters();
    renderLanguageGrids();
    refreshMenuStats();
    applyBuddy();

    if (state.lang && I18N[state.lang]) {
      applyI18n();
      refreshDynamicText();
      goToProfiles();
    } else {
      state.lang = "es"; // default language
      applyI18n();
      refreshDynamicText();
      showScreen("screen-language");
    }

    registerServiceWorker();
  }

  init();
}

/* ================================================================== */
/* Bootstrap (browser) or export (Node test runner)                    */
/* ================================================================== */
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp);
  } else {
    startApp();
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    TABLE_STATION_OPTIONS: TABLE_STATION_OPTIONS,
    MAIN_MODES: MAIN_MODES,
    PROFILE_AVATARS: PROFILE_AVATARS,
    PROFILE_NAME_MAX: PROFILE_NAME_MAX,
    defaultProgress: defaultProgress,
    normalizeSettings: normalizeSettings,
    cleanProfileName: cleanProfileName,
    createProfile: createProfile,
    normalizeProfile: normalizeProfile,
    normalizeProfileStore: normalizeProfileStore,
    migrateLegacyStorage: migrateLegacyStorage,
    parentChallenge: parentChallenge,
    LANGUAGES: LANGUAGES,
    I18N: I18N,
    randInt: randInt,
    clamp: clamp,
    generateAddition: generateAddition,
    generateSubtraction: generateSubtraction,
    generateMultiplication: generateMultiplication,
    generateDivision: generateDivision,
    createRoundModes: createRoundModes,
    normalizeLearning: normalizeLearning,
    migrateLearningStart: migrateLearningStart,
    START_LEVEL: START_LEVEL,
    updateLearning: updateLearning,
    validateAnswer: validateAnswer,
    answerRange: answerRange,
    buildSolution: buildSolution,
    generateTask: generateTask,
    validateTask: validateTask,
    buildHint: buildHint,
    generateChoices: generateChoices,
    choiceCountForLevel: choiceCountForLevel,
    computeTimeBudget: computeTimeBudget,
    updateAvgMs: updateAvgMs,
    TREASURES: TREASURES,
    dailyTreasureIndex: dailyTreasureIndex,
    taskDifficultyScore: taskDifficultyScore,
    vibrationForTask: vibrationForTask,
  };
}
