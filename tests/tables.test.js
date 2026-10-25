"use strict";
const assert = require("node:assert/strict");
const T = require("../tables.js");
let checks = 0;
function check(value, message) {
  assert.ok(value, message);
  checks++;
}
function rec(t, key, outcome, day, kind = "practice", elapsedMs = 1000) {
  return T.recordTablesAnswer(t, { key, kind }, outcome, elapsedMs, day);
}

check(
  T.factKeys().length === 55 && new Set(T.factKeys()).size === 55,
  "55 unique facts",
);
check(
  T.factKey(9, 7) === "7-9" && T.factKey(7, 9) === "7-9",
  "7×9 and 9×7 are one fact",
);
const homes = {};
T.factKeys().forEach(
  (k) => (homes[T.homeTable(k)] = (homes[T.homeTable(k)] || 0) + 1),
);
assert.deepEqual(homes, {
  1: 10,
  2: 9,
  5: 8,
  10: 7,
  3: 6,
  4: 5,
  9: 4,
  6: 3,
  7: 2,
  8: 1,
});
check(
  T.homeTable("7-9") === 9 &&
    T.homeTable("2-7") === 2 &&
    T.homeTable("6-8") === 6,
  "home table",
);
assert.deepEqual(T.factTables("7-7"), [7]);
assert.deepEqual(T.factTables("1-7"), [1, 7]);
check(
  T.localDateKey(new Date(2026, 9, 25, 23, 30)) === "2026-10-25",
  "local date, not UTC",
);
check(
  T.addDays("2026-10-31", 1) === "2026-11-01" &&
    T.addDays("2026-12-31", 14) === "2027-01-14",
  "addDays",
);
const fresh = T.normalizeTables();
check(
  Object.values(fresh.facts).every(
    (f) => f.state === "new" && f.seen === 0 && !f.everMastered,
  ),
  "fresh facts",
);
check(
  Object.keys(fresh.probes).length === 10 && fresh.presented.length === 0,
  "fresh probes",
);
check(
  T.normalizeTables({ facts: { "7-9": { state: "weird", seen: -3 } } }).facts[
    "7-9"
  ].state === "new",
  "invalid fact recovers",
);
assert.deepEqual(T.normalizeTables(JSON.parse(JSON.stringify(fresh))), fresh);
check(
  T.classifyOutcome("ask", 2999) === "fast" &&
    T.classifyOutcome("ask", 3000) === "slow" &&
    T.classifyOutcome("hint", 100) === "hint" &&
    T.classifyOutcome("answer", 100) === "answer",
  "outcome thresholds",
);
// mastery: 3 fast on >= 2 different days
let t = fresh;
for (let i = 0; i < 3; i++) t = rec(t, "7-9", "fast", "2026-10-25");
check(
  t.facts["7-9"].state === "practicing" && t.facts["7-9"].fast === 3,
  "3 fast on one day is not mastery",
);
t = rec(t, "7-9", "fast", "2026-10-26");
const m = t.facts["7-9"];
check(
  m.state === "mastered" &&
    m.everMastered &&
    m.reviewStep === 0 &&
    m.nextReview === "2026-10-27",
  "mastered",
);
// slow keeps the count; hint/answer reset it
let u = rec(
  rec(
    rec(rec(fresh, "3-4", "fast", "2026-10-25"), "3-4", "slow", "2026-10-25"),
    "3-4",
    "fast",
    "2026-10-26",
  ),
  "3-4",
  "fast",
  "2026-10-26",
);
check(
  u.facts["3-4"].state === "mastered",
  "slow answers don't reset fast count",
);
u = rec(
  rec(rec(fresh, "3-4", "fast", "2026-10-25"), "3-4", "hint", "2026-10-25"),
  "3-4",
  "fast",
  "2026-10-26",
);
check(
  u.facts["3-4"].fast === 1 && u.facts["3-4"].fastDays.join() === "2026-10-26",
  "hint resets fast count",
);
// spaced review 1, 3, 7, 14, 14
t = rec(t, "7-9", "fast", "2026-10-26"); // same day, not due
check(
  t.facts["7-9"].nextReview === "2026-10-27",
  "not due: schedule unchanged",
);
for (const [day, next] of [
  ["2026-10-27", "2026-10-30"],
  ["2026-10-30", "2026-11-06"],
  ["2026-11-06", "2026-11-20"],
  ["2026-11-20", "2026-12-04"],
]) {
  t = rec(t, "7-9", "fast", day);
  check(t.facts["7-9"].nextReview === next, "review step -> " + next);
}
check(
  rec(t, "7-9", "slow", "2026-12-04").facts["7-9"].nextReview === "2026-12-18",
  "slow review keeps interval",
);
const failed = rec(t, "7-9", "hint", "2026-12-04").facts["7-9"];
check(
  failed.state === "practicing" &&
    failed.everMastered &&
    failed.nextReview === "" &&
    failed.fast === 0,
  "failed review demotes",
);
check(
  T.isDue(t.facts["7-9"], "2026-12-04") &&
    !T.isDue(t.facts["7-9"], "2026-12-03") &&
    !T.isDue(fresh.facts["7-9"], "2030-01-01"),
  "isDue",
);
// probes
let p = rec(fresh, "7-9", "hint", "2026-10-25", "probe");
check(p.probes["9"].fail === 1 && !p.probes["9"].introduce, "one failed probe");
p = rec(p, "6-9", "answer", "2026-10-25", "probe");
check(p.probes["9"].introduce, "two failed probes -> table to introduce");
check(
  rec(fresh, "7-9", "hint", "2026-10-25", "practice").probes["9"].fail === 0,
  "non-probe leaves probes alone",
);
check(
  rec(fresh, "2-5", "fast", "2026-10-25", "probe").probes["2"].fast === 1,
  "fast probe counted on home table",
);
const before = JSON.stringify(fresh);
rec(fresh, "7-9", "fast", "2026-10-25");
check(JSON.stringify(fresh) === before, "pure");
const avg = rec(
  rec(fresh, "2-2", "slow", "2026-10-25", "practice", 2000),
  "2-2",
  "slow",
  "2026-10-25",
  "practice",
  4000,
);
check(avg.facts["2-2"].avgMs === 2600, "moving average");

console.log(checks + " tables engine checks passed.");
