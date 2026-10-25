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

// ---- Round composition, probing and retries ----

// Seeded random makes a failure reproducible.
let seed = 25102026;
Math.random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const octDay = () =>
  "2026-10-" + String(1 + Math.floor(Math.random() * 31)).padStart(2, "0");

// Any plausible saved state: random fact states, dates and probe counters.
function randomTables() {
  const raw = { facts: {}, probes: {} };
  for (const key of T.factKeys()) {
    const state = pick(["new", "new", "practicing", "mastered"]);
    raw.facts[key] =
      state === "new"
        ? {}
        : {
            state,
            seen: 1 + Math.floor(Math.random() * 8),
            fast: Math.floor(Math.random() * 4),
            lastSeen: octDay(),
            nextReview: pick([octDay(), "2026-11-01", "2026-11-15"]),
          };
  }
  for (const table of T.TABLE_ORDER) {
    raw.probes[table] = {
      fast: Math.floor(Math.random() * 3),
      fail: Math.floor(Math.random() * 3),
      introduce: Math.random() < 0.3,
    };
  }
  return T.normalizeTables(raw);
}

// Build tables with facts in the given states (today is 2026-11-01).
//   mastered: "table1"  the 10 facts of home table 1, mastered, not due
//   masteredCount: N    the first N facts mastered, not due
//   allMastered: true   every fact mastered (allDue: true -> all due)
//   dueMastered: ["1-2@2026-10-01"]  mastered with that review date
//   practicing: N | [keys]  the first N still-new facts, or those keys
//   introduce: [tables]; probes: { table: { fast, fail } }
function stateWith(spec) {
  const raw = { facts: {}, probes: {} };
  const keys = T.factKeys();
  const master = (key, nextReview) =>
    (raw.facts[key] = {
      state: "mastered",
      seen: 4,
      fast: 3,
      fastDays: ["2026-10-19", "2026-10-20"],
      lastSeen: "2026-10-20",
      everMastered: true,
      nextReview,
    });
  if (spec.mastered === "table1")
    keys
      .filter((k) => T.homeTable(k) === 1)
      .forEach((k) => master(k, "2026-11-20"));
  if (spec.masteredCount)
    keys.slice(0, spec.masteredCount).forEach((k) => master(k, "2026-11-20"));
  if (spec.allMastered)
    keys.forEach((k, i) =>
      master(
        k,
        spec.allDue
          ? "2026-10-" + String(1 + (i % 30)).padStart(2, "0")
          : "2026-11-20",
      ),
    );
  (spec.dueMastered || []).forEach((entry) => {
    const [key, date] = entry.split("@");
    master(key, date);
  });
  const practicing = Array.isArray(spec.practicing)
    ? spec.practicing
    : keys.filter((k) => !raw.facts[k]).slice(0, spec.practicing || 0);
  practicing.forEach(
    (k) =>
      (raw.facts[k] = {
        state: "practicing",
        seen: 2,
        fast: 1,
        fastDays: ["2026-10-30"],
        lastSeen: "2026-10-30",
      }),
  );
  (spec.introduce || []).forEach((t) => (raw.probes[t] = { introduce: true }));
  Object.entries(spec.probes || {}).forEach(
    ([t, p]) => (raw.probes[t] = Object.assign({}, raw.probes[t], p)),
  );
  return T.normalizeTables(raw);
}

const valid = (r, total) =>
  r.length === total &&
  r.every(
    (it, i) =>
      T.factKey(it.a, it.b) === it.key &&
      ["review", "new", "probe", "practice", "known"].includes(it.kind) &&
      (i === 0 || r[i - 1].key !== it.key),
  );
// random states x totals
for (let n = 0; n < 300; n++)
  for (const total of [10, 15, 20, 25])
    check(
      valid(T.buildTablesRound(randomTables(), "2026-11-01", total), total),
      "valid round",
    );
// the input is never mutated
const pureIn = randomTables();
const pureBefore = JSON.stringify(pureIn);
T.buildTablesRound(pureIn, "2026-11-01", 15);
check(JSON.stringify(pureIn) === pureBefore, "buildTablesRound is pure");
// cold start
const cold = T.buildTablesRound(T.normalizeTables(), "2026-11-01", 15);
check(
  cold.every((it) => it.kind === "probe") &&
    new Set(cold.map((i) => i.key)).size === 15,
  "cold start: 15 distinct probes",
);
assert.deepEqual(
  new Set(cold.map((i) => i.key)),
  new Set(T.factKeys().slice(0, 15)),
);
// introductions: table 2 to introduce, nothing practicing
const intro = T.buildTablesRound(
  stateWith({ mastered: "table1", introduce: [2] }),
  "2026-11-01",
  15,
);
const news = intro.filter((i) => i.kind === "new");
check(
  news.length === 6 &&
    ["2-2", "2-3"].every((k) => news.filter((i) => i.key === k).length === 3),
  "2 new facts × 3",
);
for (const k of ["2-2", "2-3"]) {
  const pos = intro
    .map((it, i) => (it.key === k ? i : -1))
    .filter((i) => i >= 0);
  check(pos[1] - pos[0] >= 2 && pos[2] - pos[1] >= 2, "new fact copies spaced");
}
check(
  intro.every((it) => it.kind !== "probe" || T.homeTable(it.key) !== 2),
  "introduced tables are not probed",
);
check(
  T.buildTablesRound(
    stateWith({ practicing: 10, introduce: [2] }),
    "2026-11-01",
    15,
  ).every((i) => i.kind !== "new"),
  "too many practicing -> no new",
);
// reviews capped at 3, oldest first
const rv = T.buildTablesRound(
  stateWith({
    dueMastered: [
      "1-2@2026-10-01",
      "1-3@2026-10-02",
      "1-4@2026-10-03",
      "1-5@2026-10-04",
      "1-6@2026-10-05",
    ],
  }),
  "2026-11-01",
  15,
);
assert.deepEqual(
  rv
    .filter((i) => i.kind === "review")
    .map((i) => i.key)
    .sort(),
  ["1-2", "1-3", "1-4"],
);
// fast table probed first
const pri = T.buildTablesRound(
  stateWith({ mastered: "table1", probes: { 5: { fast: 2, fail: 0 } } }),
  "2026-11-01",
  15,
);
check(
  pri.filter((i) => i.kind === "probe").length > 0 &&
    pri
      .filter((i) => i.kind === "probe")
      .every((i) => T.homeTable(i.key) === 5),
  "fast table probed first",
);
// probes stay "a few" once known facts exist (~90 % rule)
const few = T.buildTablesRound(
  stateWith({ masteredCount: 20, practicing: 2 }),
  "2026-11-01",
  15,
);
check(
  few.filter((i) => i.kind === "probe").length <= T.MAX_PROBES_PER_ROUND,
  "probes capped when known facts exist",
);
// everything "to introduce", nothing seen: still a full valid round
check(
  valid(
    T.buildTablesRound(
      stateWith({ introduce: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }),
      "2026-11-01",
      15,
    ),
    15,
  ),
  "degenerate state still fills the round",
);
// brother: everything mastered, nothing due / everything due
check(
  valid(
    T.buildTablesRound(stateWith({ allMastered: true }), "2026-11-01", 15),
    15,
  ),
  "all mastered round",
);
check(
  T.buildTablesRound(
    stateWith({ allMastered: true, allDue: true }),
    "2026-11-01",
    15,
  ).filter((i) => i.kind === "review").length === 3,
  "all due -> 3 reviews + known",
);
// orientation
const seenOrient = new Set();
for (let n = 0; n < 300; n++)
  T.buildTablesRound(stateWith({ practicing: ["7-9"] }), "2026-11-01", 15)
    .filter((i) => i.key === "7-9")
    .forEach((i) => seenOrient.add(i.a + "x" + i.b));
check(seenOrient.has("7x9") && seenOrient.has("9x7"), "asked both ways");
// retries
const r = T.factKeys()
  .slice(0, 15)
  .map((key) => ({
    key,
    a: +key.split("-")[0],
    b: +key.split("-")[1],
    kind: "practice",
  }));
const r2 = T.scheduleRetry(r, 2);
check(
  r2.length === 15 &&
    r2[5].key === r[2].key &&
    r2[5].retry &&
    r2[6] === r[5] &&
    r.length === 15 &&
    !r[5].retry,
  "retry 3 later",
);
const clash = r.slice();
clash[4] = r[2];
check(
  T.scheduleRetry(clash, 2)[6].key === r[2].key,
  "retry 4 later when 3 would sit next to itself",
);
check(
  T.scheduleRetry(r, 12)[14].key === r[12].key,
  "late retry clamps to last station",
);
assert.deepEqual(T.scheduleRetry(r, 14), r);
const noRepeats = (list, total) =>
  list.length === total &&
  list.every((it, i) => i === 0 || list[i - 1].key !== it.key);
// a missed copy of a new fact never lands next to its next copy
for (let n = 0; n < 100; n++) {
  const round = T.buildTablesRound(
    stateWith({ mastered: "table1", introduce: [2] }),
    "2026-11-01",
    15,
  );
  round.forEach((it, i) => {
    if (it.kind === "new")
      check(noRepeats(T.scheduleRetry(round, i), 15), "retry on a new copy");
  });
}
// second-to-last station: no clean slot left, round unchanged
assert.deepEqual(T.scheduleRetry(r, 13), r);
// property: every index, and chained retries, keep the round clean
for (let n = 0; n < 300; n++) {
  const round = T.buildTablesRound(randomTables(), "2026-11-01", 15);
  const before = JSON.stringify(round);
  for (let i = 0; i < 15; i++)
    check(noRepeats(T.scheduleRetry(round, i), 15), "retry at any index");
  let chained = round;
  for (let i = 0; i < 15; i++)
    if (Math.random() < 0.5) {
      chained = T.scheduleRetry(chained, i);
      check(noRepeats(chained, 15), "chained retries");
    }
  check(JSON.stringify(round) === before, "scheduleRetry is pure");
}
// extending a round: the seam never repeats the same operation
{
  const head = r.slice(0, 5);
  const more = [r[4], r[5], r[6], r[7], r[8]];
  const headBefore = JSON.stringify(head);
  const moreBefore = JSON.stringify(more);
  const joined = T.appendRound(head, more);
  check(
    joined.length === 10 &&
      joined[5].key !== r[4].key &&
      noRepeats(joined, 10) &&
      joined.slice(5).filter((it) => it.key === r[4].key).length === 1,
    "seam clash is swapped away",
  );
  check(
    JSON.stringify(head) === headBefore && JSON.stringify(more) === moreBefore,
    "appendRound is pure",
  );
  assert.deepEqual(T.appendRound([], more), more);
  // no single swap helps: the whole chunk is reordered
  const hard = T.appendRound([r[0]], [r[0], r[1], r[0], r[2], r[1]]);
  assert.deepEqual(
    hard.map((it) => it.key),
    [r[0], r[1], r[0], r[2], r[0], r[1]].map((it) => it.key),
  );
  assert.deepEqual(
    T.appendRound(r.slice(0, 3), more),
    r.slice(0, 3).concat(more),
  );
  // a clean order exists: some permutation with no equal neighbours,
  // starting with a key other than `last`
  const canSeparate = (last, chunk) => {
    const permute = (rest, prev) =>
      rest.length === 0 ||
      rest.some(
        (it, i) =>
          it.key !== prev &&
          permute(rest.slice(0, i).concat(rest.slice(i + 1)), it.key),
      );
    return permute(chunk, last);
  };
  for (let n = 0; n < 300; n++) {
    const tables = randomTables();
    let round = T.buildTablesRound(tables, "2026-11-01", 5);
    for (let k = 0; k < 4; k++) {
      const chunk = T.buildTablesRound(tables, "2026-11-01", 5);
      // force a clash on half the seams
      if (n % 2) chunk[0] = { ...round[round.length - 1] };
      const next = T.appendRound(round, chunk);
      check(next.length === round.length + 5, "appendRound adds 5");
      if (canSeparate(round[round.length - 1].key, chunk)) {
        check(
          next[round.length].key !== round[round.length - 1].key,
          "no repeat at the seam",
        );
        if (noRepeats(chunk, 5))
          check(
            noRepeats(next.slice(round.length), 5),
            "a clean chunk stays clean",
          );
      }
      round = next;
    }
  }
}
// presentation
const tp = T.tablesToPresent(intro, stateWith({ introduce: [2] }));
assert.deepEqual(tp, [2]);
assert.deepEqual(
  T.tablesToPresent(intro, T.markPresented(stateWith({ introduce: [2] }), 2)),
  [],
);

// tricks, album, fill (Task 7)
{
  function masterFacts(tables, keys) {
    let t = tables;
    keys.forEach((k) => {
      t = rec(t, k, "fast", "2026-11-01");
      t = rec(t, k, "fast", "2026-11-01");
      t = rec(t, k, "fast", "2026-11-02");
    });
    return t;
  }
  let someTables = masterFacts(T.normalizeTables(), ["7-9"]);
  someTables = rec(someTables, "3-4", "fast", "2026-11-01");
  someTables = rec(someTables, "2-2", "slow", "2026-11-01");
  assert.deepEqual(T.tablesTrick(7, 9), {
    key: "trick_9",
    vars: { n: 7, tens: 70 },
  }); // spec example "7 × 10 = 70, menos 7"
  assert.deepEqual(T.tablesTrick(9, 7), T.tablesTrick(7, 9));
  assert.deepEqual(T.tablesTrick(2, 9), {
    key: "trick_9",
    vars: { n: 2, tens: 20 },
  });
  assert.deepEqual(T.tablesTrick(1, 1), { key: "trick_1", vars: { n: 1 } });
  assert.deepEqual(T.tablesTrick(10, 10), { key: "trick_10", vars: { n: 10 } });
  assert.deepEqual(T.tablesTrick(7, 8), {
    key: "trick_split",
    vars: { a: 7, five: 35, rest: 3 },
  });
  assert.deepEqual(T.tablesTrick(8, 7), {
    key: "trick_split",
    vars: { a: 8, five: 40, rest: 2 },
  });
  assert.deepEqual(T.tablesTrick(6, 6), {
    key: "trick_split",
    vars: { a: 6, five: 30, rest: 1 },
  });
  const app = require("../app.js");
  for (let a = 1; a <= 10; a++)
    for (let b = 1; b <= 10; b++) {
      const tr = T.tablesTrick(a, b);
      check(
        ["es", "en"].every((l) => typeof app.I18N[l][tr.key] === "string") &&
          Object.values(tr.vars).every(Number.isFinite),
        "trick text exists in es and en",
      );
      // ×1 inherently names the answer; every other trick leaves the last step to the child
      check(
        tr.key === "trick_1" ||
          Object.values(tr.vars).every((v) => v !== a * b),
        "trick does not give the answer",
      );
    }
  const cells = T.albumCells(someTables); // 7-9 mastered, 3-4 practicing fast 1, 2-2 practicing fast 0
  check(
    cells.length === 100 &&
      cells[0].a === 1 &&
      cells[0].b === 1 &&
      cells[99].a === 10,
    "100 cells row-major",
  );
  const cell = (a, b) => cells[(a - 1) * 10 + (b - 1)];
  check(
    cell(7, 9).state === "mastered" && cell(9, 7).state === "mastered",
    "both cells of one fact",
  );
  check(
    cell(3, 4).state === "almost" &&
      cell(2, 2).state === "practicing" &&
      cell(5, 5).state === "new",
    "album states",
  );
  // fill: 7-7 counts once for table 7; 1-7 counts for 1 and 7; never decreases
  let f = masterFacts(T.normalizeTables(), ["7-7", "1-7"]);
  check(
    T.characterFill(f, 7) === 2 && T.characterFill(f, 1) === 1,
    "fill counts",
  );
  f = rec(f, "1-7", "hint", "2026-11-02");
  check(T.characterFill(f, 7) === 2, "fill never drops");
  check(
    T.fillMilestone(0, 1) === "first" &&
      T.fillMilestone(4, 5) === "half" &&
      T.fillMilestone(7, 9) === "almost" &&
      T.fillMilestone(9, 10) === "full" &&
      T.fillMilestone(5, 5) === null &&
      T.fillMilestone(2, 3) === null,
    "milestones",
  );
  assert.deepEqual(T.newlyMastered(T.normalizeTables(), f).sort(), ["7-7"]);
}

console.log(checks + " tables engine checks passed.");
