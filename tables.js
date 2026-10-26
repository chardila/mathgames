/*
 * Tablas del Tesoro - tables.js
 * Pure learning engine for the tables mode: per-fact registry, mastery and
 * spaced review. No Date, no localStorage: callers pass `today` ("YYYY-MM-DD",
 * local date) and `elapsedMs`. Functions never mutate their inputs.
 */
"use strict";

// Order in which the tables are introduced.
var TABLE_ORDER = [1, 2, 5, 10, 3, 4, 9, 6, 7, 8];
var FAST_MS = 3000;
var HINT_DELAY_MS = 5000;
var ANSWER_DELAY_MS = 10000;
var REVIEW_INTERVALS = [1, 3, 7, 14];
var PROBE_FAILS_TO_INTRODUCE = 2;
var PROBE_FASTS_TO_PRIORITIZE = 2;

var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
var FACT_STATES = ["new", "practicing", "mastered"];

// "7-9" for 7x9 and 9x7: smaller factor first.
function factKey(a, b) {
  return Math.min(a, b) + "-" + Math.max(a, b);
}

function parseKey(key) {
  var parts = String(key).split("-");
  return [Number(parts[0]), Number(parts[1])];
}

// The 55 facts in introduction order: for each table, the facts whose home
// table it is, by the other factor ascending.
function factKeys() {
  var keys = [];
  for (var i = 0; i < TABLE_ORDER.length; i++) {
    for (var n = 1; n <= 10; n++) {
      if (TABLE_ORDER.indexOf(n) >= i) keys.push(factKey(TABLE_ORDER[i], n));
    }
  }
  return keys;
}

// Of the two factors, the one that appears first in TABLE_ORDER.
function homeTable(key) {
  var f = parseKey(key);
  return TABLE_ORDER.indexOf(f[0]) <= TABLE_ORDER.indexOf(f[1]) ? f[0] : f[1];
}

// The tables a fact belongs to.
function factTables(key) {
  var f = parseKey(key);
  return f[0] === f[1] ? [f[0]] : [f[0], f[1]];
}

function pad2(n) {
  return (n < 10 ? "0" : "") + n;
}

// Local calendar date, not UTC.
function localDateKey(date) {
  return (
    date.getFullYear() +
    "-" +
    pad2(date.getMonth() + 1) +
    "-" +
    pad2(date.getDate())
  );
}

function addDays(dateKey, n) {
  var p = dateKey.split("-");
  return localDateKey(
    new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]) + n),
  );
}

function nonNegInt(value) {
  return typeof value === "number" && isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

function dateOrEmpty(value) {
  return typeof value === "string" && DATE_RE.test(value) ? value : "";
}

function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function defaultFact() {
  return {
    state: "new",
    seen: 0,
    fast: 0,
    fastDays: [],
    lastSeen: "",
    avgMs: 0,
    everMastered: false,
    reviewStep: 0,
    nextReview: "",
  };
}

function normalizeFact(saved) {
  var fact = defaultFact();
  if (!isObject(saved)) return fact;
  if (FACT_STATES.indexOf(saved.state) !== -1) fact.state = saved.state;
  fact.seen = nonNegInt(saved.seen);
  fact.fast = nonNegInt(saved.fast);
  var days = [];
  if (Array.isArray(saved.fastDays)) {
    for (var i = 0; i < saved.fastDays.length; i++) {
      var d = dateOrEmpty(saved.fastDays[i]);
      if (d && days.indexOf(d) === -1) days.push(d);
    }
  }
  fact.fastDays = days.slice(-3);
  fact.lastSeen = dateOrEmpty(saved.lastSeen);
  fact.avgMs = nonNegInt(saved.avgMs);
  fact.everMastered = saved.everMastered === true;
  fact.reviewStep = Math.min(nonNegInt(saved.reviewStep), 3);
  fact.nextReview = dateOrEmpty(saved.nextReview);
  if (fact.state === "mastered") {
    fact.everMastered = true;
    // A mastered fact without a review date cannot be scheduled.
    if (!fact.nextReview) fact.state = "practicing";
  }
  return fact;
}

function normalizeProbe(saved) {
  var probe = { fast: 0, fail: 0, introduce: false };
  if (!isObject(saved)) return probe;
  probe.fast = nonNegInt(saved.fast);
  probe.fail = nonNegInt(saved.fail);
  probe.introduce = saved.introduce === true;
  return probe;
}

// Repair saved tables-mode data into the canonical shape.
function normalizeTables(saved) {
  var src = isObject(saved) ? saved : {};
  var savedFacts = isObject(src.facts) ? src.facts : {};
  var savedProbes = isObject(src.probes) ? src.probes : {};
  var tables = { facts: {}, probes: {}, presented: [] };
  var keys = factKeys();
  for (var i = 0; i < keys.length; i++) {
    tables.facts[keys[i]] = normalizeFact(savedFacts[keys[i]]);
  }
  for (var j = 0; j < TABLE_ORDER.length; j++) {
    var table = TABLE_ORDER[j];
    tables.probes[table] = normalizeProbe(savedProbes[table]);
  }
  if (Array.isArray(src.presented)) {
    for (var k = 0; k < src.presented.length; k++) {
      var n = src.presented[k];
      if (TABLE_ORDER.indexOf(n) !== -1 && tables.presented.indexOf(n) === -1) {
        tables.presented.push(n);
      }
    }
  }
  return tables;
}

// stage: "ask" | "hint" | "answer" (how far the help went before answering).
function classifyOutcome(stage, elapsedMs) {
  if (stage === "answer") return "answer";
  if (stage === "hint") return "hint";
  return elapsedMs < FAST_MS ? "fast" : "slow";
}

// A mastered fact whose review date has come.
function isDue(fact, today) {
  return (
    fact.state === "mastered" && !!fact.nextReview && fact.nextReview <= today
  );
}

// Record one answer; returns new tables.
function recordTablesAnswer(tables, item, outcome, elapsedMs, today) {
  var next = JSON.parse(JSON.stringify(tables));
  var fact = next.facts[item.key];
  var due = isDue(fact, today);
  var wasMastered = fact.state === "mastered";

  fact.avgMs =
    fact.seen === 0
      ? elapsedMs
      : Math.round(fact.avgMs * 0.7 + elapsedMs * 0.3);
  fact.seen++;
  fact.lastSeen = today;
  if (fact.state === "new") fact.state = "practicing";

  if (outcome === "fast") {
    fact.fast++;
    if (fact.fastDays.indexOf(today) === -1) fact.fastDays.push(today);
    fact.fastDays = fact.fastDays.slice(-3);
    if (!wasMastered && fact.fast >= 3 && fact.fastDays.length >= 2) {
      fact.state = "mastered";
      fact.everMastered = true;
      fact.reviewStep = 0;
      fact.nextReview = addDays(today, REVIEW_INTERVALS[0]);
    } else if (due) {
      fact.reviewStep = Math.min(fact.reviewStep + 1, 3);
      fact.nextReview = addDays(today, REVIEW_INTERVALS[fact.reviewStep]);
    }
  } else if (outcome === "slow") {
    if (due)
      fact.nextReview = addDays(today, REVIEW_INTERVALS[fact.reviewStep]);
  } else {
    // "hint" or "answer"
    fact.fast = 0;
    fact.fastDays = [];
    if (wasMastered) {
      fact.state = "practicing";
      fact.reviewStep = 0;
      fact.nextReview = "";
    }
  }

  // A retry repeats the same fact: it is not a second probe of its table.
  if (item.kind === "probe" && !item.retry) {
    var probe = next.probes[homeTable(item.key)];
    if (outcome === "fast") {
      probe.fast++;
    } else if (outcome === "hint" || outcome === "answer") {
      probe.fail++;
      if (probe.fail >= PROBE_FAILS_TO_INTRODUCE) probe.introduce = true;
    }
  }
  return next;
}

// ---- Round composition ----

var NEW_PER_ROUND = 2;
var NEW_REPEATS = 3;
var NEW_SPACING = 3;
var MAX_PROBES_PER_ROUND = 3;
var MAX_PRACTICING_FOR_NEW = 10;
var PRACTICE_MAX_REPEATS = 2;

function isUnseen(fact) {
  return fact.seen === 0 && fact.state === "new";
}

// Sort keys by `compare`, ties by introduction order (stable, no mutation).
function sortKeys(keys, compare) {
  var order = factKeys();
  return keys.slice().sort(function (x, y) {
    return compare(x, y) || order.indexOf(x) - order.indexOf(y);
  });
}

function byString(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

// Unseen facts of tables not to introduce: "fast" tables first, then the rest,
// each in introduction order.
function probeOrder(tables) {
  var fastTables = [];
  var otherTables = [];
  for (var i = 0; i < TABLE_ORDER.length; i++) {
    var t = TABLE_ORDER[i];
    var probe = tables.probes[t];
    if (probe.introduce) continue;
    if (probe.fast >= PROBE_FASTS_TO_PRIORITIZE && probe.fail === 0) {
      fastTables.push(t);
    } else {
      otherTables.push(t);
    }
  }
  var ordered = fastTables.concat(otherTables);
  var keys = factKeys();
  var out = [];
  for (var j = 0; j < ordered.length; j++) {
    for (var k = 0; k < keys.length; k++) {
      if (
        homeTable(keys[k]) === ordered[j] &&
        isUnseen(tables.facts[keys[k]])
      ) {
        out.push(keys[k]);
      }
    }
  }
  return out;
}

function makeItem(key, kind) {
  var f = parseKey(key);
  // Ask both ways round.
  var flip = f[0] !== f[1] && Math.random() < 0.5;
  return { key: key, a: flip ? f[1] : f[0], b: flip ? f[0] : f[1], kind: kind };
}

function shuffle(list) {
  var out = list.slice();
  for (var i = out.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

function sameKeyAt(r, i, j) {
  return i >= 0 && j < r.length && r[i].key === r[j].key;
}

// Would swapping i and j leave no equal neighbours around both positions?
function swapIsClean(r, i, j) {
  var s = r.slice();
  var tmp = s[i];
  s[i] = s[j];
  s[j] = tmp;
  return (
    !sameKeyAt(s, i - 1, i) &&
    !sameKeyAt(s, i, i + 1) &&
    !sameKeyAt(s, j - 1, j) &&
    !sameKeyAt(s, j, j + 1)
  );
}

// Break up equal neighbours: swap the second with the first later item that
// creates no new pair (or, failing that, an earlier one).
function separateRepeats(round) {
  var r = round.slice();
  for (var i = 1; i < r.length; i++) {
    if (r[i].key !== r[i - 1].key) continue;
    var target = -1;
    for (var j = i + 1; j < r.length && target < 0; j++) {
      if (swapIsClean(r, i, j)) target = j;
    }
    for (var k = 0; k < i - 1 && target < 0; k++) {
      if (swapIsClean(r, i, k)) target = k;
    }
    if (target >= 0) {
      var tmp = r[i];
      r[i] = r[target];
      r[target] = tmp;
    }
  }
  return r;
}

// Build a round of exactly `total` items { key, a, b, kind }.
function buildTablesRound(tables, today, total) {
  var keys = factKeys();
  var facts = tables.facts;
  var count = {};
  var newKeys = [];
  var rest = [];

  function used() {
    return newKeys.length * NEW_REPEATS + rest.length;
  }
  function room() {
    return total - used();
  }
  function add(key, kind) {
    rest.push(makeItem(key, kind));
    count[key] = (count[key] || 0) + 1;
  }

  // 1. Reviews: due mastered facts, oldest review date first.
  var due = sortKeys(
    keys.filter(function (k) {
      return isDue(facts[k], today);
    }),
    function (x, y) {
      return byString(facts[x].nextReview, facts[y].nextReview);
    },
  );
  for (
    var i = 0;
    i < due.length && i < Math.floor(total / 5) && room() > 0;
    i++
  ) {
    add(due[i], "review");
  }

  // 2. New facts from tables to introduce, while not too much is practicing.
  var practicing = keys.filter(function (k) {
    return facts[k].state === "practicing";
  });
  if (practicing.length < MAX_PRACTICING_FOR_NEW) {
    for (var n = 0; n < keys.length; n++) {
      if (newKeys.length >= NEW_PER_ROUND || room() < NEW_REPEATS) break;
      var nk = keys[n];
      if (isUnseen(facts[nk]) && tables.probes[homeTable(nk)].introduce) {
        newKeys.push(nk);
        count[nk] = NEW_REPEATS;
      }
    }
  }

  // 3. Probes: a few unseen facts of tables not yet to introduce.
  var probes = probeOrder(tables);
  var probeAt = 0;
  for (
    var p = 0;
    p < MAX_PROBES_PER_ROUND && probeAt < probes.length && room() > 0;
    p++
  ) {
    add(probes[probeAt++], "probe");
  }

  // 4a. Practicing facts: fewest fast first, then least recently seen.
  var practiceOrder = sortKeys(practicing, function (x, y) {
    return (
      facts[x].fast - facts[y].fast ||
      byString(facts[x].lastSeen, facts[y].lastSeen)
    );
  });
  for (var pass = 0; pass < PRACTICE_MAX_REPEATS; pass++) {
    for (var a = 0; a < practiceOrder.length && room() > 0; a++) {
      if ((count[practiceOrder[a]] || 0) < PRACTICE_MAX_REPEATS) {
        add(practiceOrder[a], "practice");
      }
    }
  }

  // 4b. Mastered facts not in the round yet, least recently seen first.
  var byLastSeen = function (x, y) {
    return byString(facts[x].lastSeen, facts[y].lastSeen);
  };
  var known = sortKeys(
    keys.filter(function (k) {
      return facts[k].state === "mastered" && !count[k];
    }),
    byLastSeen,
  );
  for (var b = 0; b < known.length && room() > 0; b++) add(known[b], "known");

  // 4c. More probes: they only fill the round when nothing known is left.
  while (probeAt < probes.length && room() > 0) add(probes[probeAt++], "probe");

  // 4d. Least recently seen facts, whatever their state. This and the safety
  // net may exceed the repeat caps, only in degenerate or very long rounds.
  var seen = sortKeys(
    keys.filter(function (k) {
      return !isUnseen(facts[k]);
    }),
    byLastSeen,
  );
  for (var s = 0; s < seen.length && room() > 0; s++) {
    add(seen[s], facts[seen[s]].state === "mastered" ? "known" : "practice");
  }

  // 4e. Unseen facts not in the round, one copy each.
  for (var e = 0; e < keys.length && room() > 0; e++) {
    if (isUnseen(facts[keys[e]]) && !count[keys[e]]) add(keys[e], "new");
  }

  // Safety net for very long rounds: cycle through every fact.
  for (var c = 0; room() > 0; c = (c + 1) % keys.length) {
    add(keys[c], isUnseen(facts[keys[c]]) ? "new" : "practice");
  }

  // 5. Placement: new copies spaced out, the rest shuffled into the gaps.
  var round = [];
  for (var z = 0; z < total; z++) round.push(null);
  for (var j = 0; j < newKeys.length; j++) {
    for (var k = 0; k < NEW_REPEATS; k++) {
      var pos = j + 1 + k * NEW_SPACING;
      while (pos < total && round[pos]) pos++;
      if (pos >= total) {
        pos = 0;
        while (round[pos]) pos++;
      }
      round[pos] = makeItem(newKeys[j], "new");
    }
  }
  var shuffled = shuffle(rest);
  for (var g = 0, h = 0; g < total; g++) {
    if (!round[g]) round[g] = shuffled[h++];
  }
  return separateRepeats(round);
}

// Put a copy of a missed item back 3 (or 4) stations later; same length.
function scheduleRetry(round, index) {
  var total = round.length;
  if (index >= total - 1) return round.slice();
  var copy = {};
  for (var prop in round[index]) {
    if (Object.prototype.hasOwnProperty.call(round[index], prop)) {
      copy[prop] = round[index][prop];
    }
  }
  copy.retry = true;
  // Clean: neither neighbour that survives the trim has the same key.
  // (Inserting only splits a pair, so it never joins two other equal keys.)
  function isClean(pos) {
    return (
      round[pos - 1].key !== copy.key &&
      (pos + 1 >= total || round[pos].key !== copy.key)
    );
  }
  // Try 3 later, 4 later, then further on, then 2 later.
  var tries = [index + 3, index + 4];
  for (var p = index + 5; p <= total - 1; p++) tries.push(p);
  tries.push(index + 2);
  for (var i = 0; i < tries.length; i++) {
    var at = tries[i];
    if (at <= total - 1 && isClean(at)) {
      var next = round.slice();
      next.splice(at, 0, copy);
      return next.slice(0, total);
    }
  }
  // No clean slot left: no retry in this round.
  return round.slice();
}

// Order `chunk` so it starts with a key other than `prev` and has no equal
// neighbours: always take the most repeated key left (first seen on ties).
function separatedOrder(chunk, prev) {
  var left = chunk.slice();
  var out = [];
  while (left.length) {
    var count = {};
    left.forEach(function (it) {
      count[it.key] = (count[it.key] || 0) + 1;
    });
    var pick = -1;
    for (var i = 0; i < left.length; i++) {
      if (left[i].key === prev) continue;
      if (pick < 0 || count[left[i].key] > count[left[pick].key]) pick = i;
    }
    if (pick < 0) return null;
    prev = left[pick].key;
    out.push(left.splice(pick, 1)[0]);
  }
  return out;
}

// Append a chunk to a round (a setback ran it out) without the same
// operation twice in a row at the seam.
function appendRound(round, chunk) {
  var out = round.concat(chunk);
  var at = round.length;
  if (at === 0 || chunk.length === 0) return out;
  if (out[at].key !== out[at - 1].key) return out;
  // First try one swap inside the chunk; else reorder the whole chunk.
  for (var j = at + 1; j < out.length; j++) {
    if (swapIsClean(out, at, j)) {
      var tmp = out[at];
      out[at] = out[j];
      out[j] = tmp;
      return out;
    }
  }
  var ordered = separatedOrder(chunk, out[at - 1].key);
  return ordered ? round.concat(ordered) : out;
}

// Home tables of the round's new facts not presented yet, in TABLE_ORDER.
function tablesToPresent(round, tables) {
  var out = [];
  for (var i = 0; i < TABLE_ORDER.length; i++) {
    var t = TABLE_ORDER[i];
    if (tables.presented.indexOf(t) !== -1) continue;
    for (var j = 0; j < round.length; j++) {
      if (round[j].kind === "new" && homeTable(round[j].key) === t) {
        out.push(t);
        break;
      }
    }
  }
  return out;
}

function markPresented(tables, table) {
  var next = JSON.parse(JSON.stringify(tables));
  if (
    TABLE_ORDER.indexOf(table) !== -1 &&
    next.presented.indexOf(table) === -1
  ) {
    next.presented.push(table);
  }
  return next;
}

// ---- Hint tricks, album and character fill ----

var TRICK_ORDER = [1, 10, 9, 2, 5, 4, 3];

// Hint for a x b: names a method, never the result.
function tablesTrick(a, b) {
  for (var i = 0; i < TRICK_ORDER.length; i++) {
    var p = TRICK_ORDER[i];
    if (a !== p && b !== p) continue;
    var n = a === p ? b : a;
    switch (p) {
      case 1:
        return { key: "trick_1", vars: { n: n } };
      case 10:
        return { key: "trick_10", vars: { n: n } };
      case 9:
        return { key: "trick_9", vars: { n: n, tens: n * 10 } };
      case 2:
        return { key: "trick_2", vars: { n: n } };
      case 5:
        return { key: "trick_5", vars: { n: n, tens: n * 10 } };
      case 4:
        return { key: "trick_4", vars: { n: n, double: n * 2 } };
      default:
        return { key: "trick_3", vars: { n: n, double: n * 2 } };
    }
  }
  return { key: "trick_split", vars: { a: a, five: a * 5, rest: b - 5 } };
}

// 100 cells, row-major (a 1..10, b 1..10), for the parents' album.
function albumCells(tables) {
  var cells = [];
  for (var a = 1; a <= 10; a++) {
    for (var b = 1; b <= 10; b++) {
      var key = factKey(a, b);
      var fact = tables.facts[key];
      var state = "new";
      if (fact.state === "mastered") state = "mastered";
      else if (fact.state === "practicing")
        state = fact.fast >= 1 ? "almost" : "practicing";
      cells.push({ a: a, b: b, key: key, state: state });
    }
  }
  return cells;
}

// How many of the 10 facts with this factor were ever mastered (0..10).
function characterFill(tables, table) {
  var count = 0;
  for (var n = 1; n <= 10; n++) {
    if (tables.facts[factKey(table, n)].everMastered) count++;
  }
  return count;
}

var FILL_MILESTONES = [
  [1, "first"],
  [5, "half"],
  [8, "almost"],
  [10, "full"],
];

// Highest milestone crossed going from `before` to `after`.
function fillMilestone(before, after) {
  var found = null;
  for (var i = 0; i < FILL_MILESTONES.length; i++) {
    var m = FILL_MILESTONES[i];
    if (before < m[0] && m[0] <= after) found = m[1];
  }
  return found;
}

// Keys mastered in `after` that were not in `before`.
function newlyMastered(before, after) {
  return factKeys().filter(function (k) {
    return (
      after.facts[k].state === "mastered" &&
      before.facts[k].state !== "mastered"
    );
  });
}

var TablesEngine = {
  TABLE_ORDER: TABLE_ORDER,
  FAST_MS: FAST_MS,
  HINT_DELAY_MS: HINT_DELAY_MS,
  ANSWER_DELAY_MS: ANSWER_DELAY_MS,
  REVIEW_INTERVALS: REVIEW_INTERVALS,
  PROBE_FAILS_TO_INTRODUCE: PROBE_FAILS_TO_INTRODUCE,
  PROBE_FASTS_TO_PRIORITIZE: PROBE_FASTS_TO_PRIORITIZE,
  factKey: factKey,
  factKeys: factKeys,
  parseKey: parseKey,
  homeTable: homeTable,
  factTables: factTables,
  localDateKey: localDateKey,
  addDays: addDays,
  normalizeTables: normalizeTables,
  classifyOutcome: classifyOutcome,
  isDue: isDue,
  recordTablesAnswer: recordTablesAnswer,
  NEW_PER_ROUND: NEW_PER_ROUND,
  NEW_REPEATS: NEW_REPEATS,
  NEW_SPACING: NEW_SPACING,
  MAX_PROBES_PER_ROUND: MAX_PROBES_PER_ROUND,
  MAX_PRACTICING_FOR_NEW: MAX_PRACTICING_FOR_NEW,
  PRACTICE_MAX_REPEATS: PRACTICE_MAX_REPEATS,
  buildTablesRound: buildTablesRound,
  scheduleRetry: scheduleRetry,
  appendRound: appendRound,
  tablesToPresent: tablesToPresent,
  markPresented: markPresented,
  tablesTrick: tablesTrick,
  albumCells: albumCells,
  characterFill: characterFill,
  FILL_MILESTONES: FILL_MILESTONES,
  fillMilestone: fillMilestone,
  newlyMastered: newlyMastered,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = TablesEngine;
}
