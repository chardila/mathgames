/*
 * Tablas del Tesoro - characters.js
 * One character per multiplication table. Each one is drawn as a stack of
 * `table` blocks (the visible quantity) that fills with colour from the bottom
 * as the facts of its table are mastered. Pure: no DOM, no storage.
 */
"use strict";

// Names are the same in every language; melodies are [frequency Hz, ms].
var CHARACTERS = [
  {
    table: 1,
    name: "Pipo",
    color: "#ff6b6b",
    dark: "#b02a37",
    melody: [
      [523, 140],
      [659, 140],
      [784, 220],
    ],
  },
  {
    table: 2,
    name: "Duna",
    color: "#ff922b",
    dark: "#a8501a",
    melody: [
      [392, 160],
      [440, 160],
      [523, 160],
      [440, 240],
    ],
  },
  {
    table: 3,
    name: "Tico",
    color: "#51cf66",
    dark: "#2b7a3b",
    melody: [
      [659, 120],
      [587, 120],
      [659, 120],
      [880, 260],
    ],
  },
  {
    table: 4,
    name: "Lola",
    color: "#f06595",
    dark: "#a61e4d",
    melody: [
      [784, 180],
      [659, 180],
      [523, 180],
      [659, 180],
      [784, 300],
    ],
  },
  {
    table: 5,
    name: "Max",
    color: "#4c6ef5",
    dark: "#2b3f9e",
    melody: [
      [330, 200],
      [392, 200],
      [494, 200],
      [659, 320],
    ],
  },
  {
    table: 6,
    name: "Kiko",
    color: "#20c997",
    dark: "#0b7259",
    melody: [
      [587, 100],
      [740, 100],
      [880, 100],
      [740, 100],
      [988, 240],
    ],
  },
  {
    table: 7,
    name: "Nube",
    color: "#74c0fc",
    dark: "#1c6ea4",
    melody: [
      [880, 260],
      [784, 260],
      [698, 260],
      [784, 380],
    ],
  },
  {
    table: 8,
    name: "Rayo",
    color: "#fcc419",
    dark: "#9c6f00",
    melody: [
      [1047, 90],
      [784, 90],
      [1047, 90],
      [784, 90],
      [1175, 200],
    ],
  },
  {
    table: 9,
    name: "Mora",
    color: "#845ef7",
    dark: "#4b2bab",
    melody: [
      [440, 220],
      [523, 220],
      [622, 220],
      [523, 160],
      [440, 320],
    ],
  },
  {
    table: 10,
    name: "Bruno",
    color: "#a47148",
    dark: "#5e3b1e",
    melody: [
      [262, 240],
      [330, 240],
      [392, 240],
      [523, 240],
      [392, 160],
      [523, 360],
    ],
  },
];

var ACCESSORIES = ["none", "hat", "glasses", "scarf", "crown"];

// Geometry (SVG units): blocks of 16 with a gap of 2, up to 5 rows.
var BLOCK = 16;
var STEP = 18;
var VIEW_W = 40;
var VIEW_H = 110;
var BOTTOM = 108;
var EMPTY_FILL = "#dfe3e8";
var EMPTY_STROKE = "#b8c0ca";

// Each SVG gets its own clipPath id (ids are document-wide).
var clipSeq = 0;

function clampFill(fill) {
  var n = typeof fill === "number" && isFinite(fill) ? Math.round(fill) : 0;
  return Math.max(0, Math.min(10, n));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function characterFor(table) {
  for (var i = 0; i < CHARACTERS.length; i++) {
    if (CHARACTERS[i].table === table) return CHARACTERS[i];
  }
  return CHARACTERS[0];
}

// Block heights per column: one column for 1-5, two for 6-10.
function columnsFor(table) {
  return table <= 5 ? [table] : [Math.ceil(table / 2), Math.floor(table / 2)];
}

function blocksSvg(cols, x0, cls, fill, stroke) {
  var out = "";
  for (var c = 0; c < cols.length; c++) {
    for (var k = 0; k < cols[c]; k++) {
      out +=
        '<rect class="' +
        cls +
        '" x="' +
        (x0 + c * STEP) +
        '" y="' +
        (BOTTOM - BLOCK - k * STEP) +
        '" width="' +
        BLOCK +
        '" height="' +
        BLOCK +
        '" rx="3" fill="' +
        fill +
        '" stroke="' +
        stroke +
        '" stroke-width="1.5"/>';
    }
  }
  return out;
}

function accessorySvg(id, face) {
  var cx = face.cx;
  var top = face.top;
  var inner = "";
  if (id === "hat") {
    inner =
      '<rect x="' +
      (cx - 9) +
      '" y="' +
      (top - 3) +
      '" width="18" height="3" rx="1" fill="#343a40"/>' +
      '<rect x="' +
      (cx - 6) +
      '" y="' +
      (top - 13) +
      '" width="12" height="11" rx="2" fill="#343a40"/>' +
      '<rect x="' +
      (cx - 6) +
      '" y="' +
      (top - 6) +
      '" width="12" height="2" fill="#e03131"/>';
  } else if (id === "crown") {
    inner =
      '<polygon points="' +
      [
        [cx - 8, top - 1],
        [cx - 8, top - 11],
        [cx - 4, top - 6],
        [cx, top - 13],
        [cx + 4, top - 6],
        [cx + 8, top - 11],
        [cx + 8, top - 1],
      ].join(" ") +
      '" fill="#ffd43b" stroke="#b08900" stroke-width="1" stroke-linejoin="round"/>';
  } else if (id === "glasses") {
    inner =
      '<circle cx="' +
      face.eyeL +
      '" cy="' +
      face.eyeY +
      '" r="3.2" fill="none" stroke="#212529" stroke-width="1.2"/>' +
      '<circle cx="' +
      face.eyeR +
      '" cy="' +
      face.eyeY +
      '" r="3.2" fill="none" stroke="#212529" stroke-width="1.2"/>' +
      '<line x1="' +
      (face.eyeL + 3.2) +
      '" y1="' +
      face.eyeY +
      '" x2="' +
      (face.eyeR - 3.2) +
      '" y2="' +
      face.eyeY +
      '" stroke="#212529" stroke-width="1.2"/>';
  } else if (id === "scarf") {
    inner =
      '<rect x="' +
      (face.left - 1) +
      '" y="' +
      (top + BLOCK - 3) +
      '" width="' +
      (face.width + 2) +
      '" height="4" rx="2" fill="#e03131"/>' +
      '<rect x="' +
      (face.left + face.width - 6) +
      '" y="' +
      (top + BLOCK) +
      '" width="4" height="8" rx="1.5" fill="#c92a2a"/>';
  }
  return '<g class="acc acc-' + id + '">' + inner + "</g>";
}

// SVG for the character of `table` with `fill` of its 10 facts mastered.
function characterSvg(table, fill, accessory) {
  var ch = characterFor(table);
  var n = ch.table;
  var f = clampFill(fill);
  var acc = ACCESSORIES.indexOf(accessory) > 0 ? accessory : "none";
  var cols = columnsFor(n);
  var width = cols.length * STEP - 2;
  var x0 = (VIEW_W - width) / 2;
  var rows = cols[0];
  var bodyTop = BOTTOM - BLOCK - (rows - 1) * STEP;
  var bodyH = BOTTOM - bodyTop;
  var fillH = round2((bodyH * f) / 10);
  var id = "chclip-" + ++clipSeq;

  // The face sits on the top block; on two equal columns it spans both.
  var wide = cols.length === 2 && cols[0] === cols[1];
  var face = {
    top: bodyTop,
    left: x0,
    width: wide ? width : BLOCK,
    cx: wide ? x0 + width / 2 : x0 + BLOCK / 2,
    eyeY: bodyTop + 6,
  };
  var spread = wide ? 5 : 3;
  face.eyeL = face.cx - spread;
  face.eyeR = face.cx + spread;
  var mouth = wide ? 4 : 3.5;

  return (
    '<svg class="char-svg" viewBox="0 0 ' +
    VIEW_W +
    " " +
    VIEW_H +
    '" aria-hidden="true" focusable="false" data-table="' +
    n +
    '" data-fill="' +
    f +
    '">' +
    '<defs><clipPath id="' +
    id +
    '"><rect data-fill="' +
    f +
    '" x="0" y="' +
    round2(BOTTOM - fillH) +
    '" width="' +
    VIEW_W +
    '" height="' +
    fillH +
    '"/></clipPath></defs>' +
    '<g class="char-empty">' +
    blocksSvg(cols, x0, "cb cb--empty", EMPTY_FILL, EMPTY_STROKE) +
    "</g>" +
    '<g class="char-fill" clip-path="url(#' +
    id +
    ')">' +
    blocksSvg(cols, x0, "cb cb--fill", ch.color, ch.dark) +
    "</g>" +
    '<g class="char-face" fill="#212529">' +
    '<circle cx="' +
    face.eyeL +
    '" cy="' +
    face.eyeY +
    '" r="1.7"/>' +
    '<circle cx="' +
    face.eyeR +
    '" cy="' +
    face.eyeY +
    '" r="1.7"/>' +
    '<path d="M' +
    (face.cx - mouth) +
    " " +
    (bodyTop + 10) +
    " Q" +
    face.cx +
    " " +
    (bodyTop + 14) +
    " " +
    (face.cx + mouth) +
    " " +
    (bodyTop + 10) +
    '" fill="none" stroke="#212529" stroke-width="1.4" stroke-linecap="round"/>' +
    "</g>" +
    (acc === "none" ? "" : accessorySvg(acc, face)) +
    "</svg>"
  );
}

var TableCharacters = {
  CHARACTERS: CHARACTERS,
  ACCESSORIES: ACCESSORIES,
  characterFor: characterFor,
  characterSvg: characterSvg,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = TableCharacters;
}
