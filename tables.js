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

  if (item.kind === "probe") {
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
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = TablesEngine;
}
