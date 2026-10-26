"use strict";
const assert = require("node:assert/strict");
const C = require("../characters.js");
let checks = 0;
function check(value, message) {
  assert.ok(value, message);
  checks++;
}

check(
  C.CHARACTERS.length === 10 && C.CHARACTERS.every((c, i) => c.table === i + 1),
  "one character per table 1-10",
);
check(
  new Set(C.CHARACTERS.map((c) => c.name)).size === 10 &&
    new Set(C.CHARACTERS.map((c) => c.color)).size === 10,
  "unique names and colours",
);
const numberWords = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
];
check(
  C.CHARACTERS.every((c) => !numberWords.includes(c.name.toLowerCase())),
  "own names, not number names",
);
check(
  new Set(C.CHARACTERS.map((c) => JSON.stringify(c.melody))).size === 10 &&
    C.CHARACTERS.every(
      (c) =>
        c.melody.length >= 3 &&
        c.melody.length <= 6 &&
        c.melody.every(
          ([f, ms]) => f >= 200 && f <= 1200 && ms >= 80 && ms <= 400,
        ),
    ),
  "own short melodies",
);
const svg = C.characterSvg(7, 4, "none");
const count = (s, needle) => s.split(needle).length - 1;
check(
  svg.startsWith("<svg") &&
    svg.includes('aria-hidden="true"') &&
    count(svg, "cb cb--empty") === 7 &&
    count(svg, "cb cb--fill") === 7 &&
    svg.includes('data-fill="4"') &&
    !svg.includes("acc-"),
  "character svg",
);
check(
  C.characterSvg(3, 99).includes('data-fill="10"') &&
    C.characterSvg(3, -1).includes('data-fill="0"'),
  "fill clamped",
);
check(
  C.characterSvg(1, 0, "crown").includes('class="acc acc-crown"') &&
    !C.characterSvg(1, 0, "cape").includes("acc-"),
  "accessories",
);
// Every table draws its own number of blocks; each SVG clips with its own id.
check(
  C.CHARACTERS.every((c) => {
    const s = C.characterSvg(c.table, 5, "none");
    return (
      count(s, "cb cb--empty") === c.table &&
      count(s, "cb cb--fill") === c.table
    );
  }),
  "blocks per table",
);
const ids = [C.characterSvg(2, 3), C.characterSvg(2, 3)].map(
  (s) => s.match(/clipPath id="([^"]+)"/)[1],
);
check(ids[0] !== ids[1], "unique clip ids");
check(
  C.ACCESSORIES.every(
    (a) =>
      a === "none" ||
      C.characterSvg(5, 5, a).includes('class="acc acc-' + a + '"'),
  ),
  "every accessory draws",
);
// Introduction song: 7, 14 ... 70 on a rising scale; the last note is longer.
const intro = C.introSequence(7);
check(
  intro.length === 10 &&
    intro.map((s) => s.value).join() === "7,14,21,28,35,42,49,56,63,70",
  "intro values",
);
check(
  intro[0].freq === 262 &&
    intro.every((s, i) => i === 0 || s.freq > intro[i - 1].freq),
  "intro pitch rises",
);
check(
  intro.slice(0, 9).every((s) => s.ms === 420) && intro[9].ms === 700,
  "intro note lengths",
);

console.log(checks + " character checks passed.");
