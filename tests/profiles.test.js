"use strict";
const assert = require("node:assert/strict");
const app = require("../app.js");
let checks = 0;
function check(value, message) {
  assert.ok(value, message);
  checks++;
}
// normalizeSettings
assert.deepEqual(app.normalizeSettings({}), app.DEFAULT_SETTINGS);
const s = app.normalizeSettings({
  tableStations: 13,
  mainMode: "x",
  timer: "yes",
  quick: true,
  extra: 1,
});
check(
  s.tableStations === 15 &&
    s.mainMode === "tables" &&
    s.timer === false &&
    s.quick === true,
  "settings coerced",
);
check(
  app.normalizeSettings({ tableStations: 25, mainMode: "div" })
    .tableStations === 25,
  "valid stations kept",
);
// defaultProgress
const p1 = app.defaultProgress(),
  p2 = app.defaultProgress();
check(p1 !== p2 && p1.learning !== p2.learning, "fresh objects");
check(
  p1.coins === 0 &&
    p1.buddies[0] === "kid" &&
    p1.learningStartVersion === 1 &&
    Object.values(p1.learning).every((r) => r.level === 1.5),
  "default progress",
);
// createProfile / cleanProfileName
const ana = app.createProfile("  Ana  ", "🐼", ["p1", "p2"], "Jugador");
check(
  ana.name === "Ana" && ana.avatar === "🐼" && !["p1", "p2"].includes(ana.id),
  "create profile",
);
assert.deepEqual(ana.settings, app.DEFAULT_SETTINGS);
check(app.cleanProfileName("x".repeat(40), "J").length === 20, "name max 20");
check(
  app.cleanProfileName("   ", "Jugador 2") === "Jugador 2",
  "empty name fallback",
);
check(
  app.createProfile("A", "🚀", [], "J").avatar === app.PROFILE_AVATARS[0],
  "unknown avatar -> first",
);
// normalizeProfile
check(
  app.normalizeProfile(null) === null &&
    app.normalizeProfile({ name: "x" }) === null,
  "invalid profile",
);
const np = app.normalizeProfile({
  id: "p7",
  name: "",
  progress: { coins: 5, customFutureField: "keep" },
});
check(
  np.progress.coins === 5 &&
    np.progress.customFutureField === "keep" &&
    np.progress.learning.add.level === 1.5,
  "progress kept + learning normalized",
);
check(np.name.length > 0, "nameless profile gets a name");
// normalizeProfileStore
assert.deepEqual(app.normalizeProfileStore("garbage"), {
  version: 1,
  lastId: "",
  profiles: [],
});
const st = app.normalizeProfileStore({
  lastId: "p9",
  profiles: [{ id: "p1", name: "A" }, { id: "p1", name: "B" }, 3],
});
check(
  st.profiles.length === 1 && st.profiles[0].name === "A" && st.lastId === "",
  "dedupe, drop invalid, reset unknown lastId",
);
// migrateLegacyStorage
const legacyProgress = {
  coins: 500,
  learning: { div: { level: 3 } },
  customFutureField: "keep",
};
const legacySettings = { timer: true, sound: false, quick: true };
const frozen = JSON.stringify([legacyProgress, legacySettings]);
const m = app.migrateLegacyStorage(
  null,
  legacyProgress,
  legacySettings,
  "Jugador 1",
);
check(
  m.profiles.length === 1 &&
    m.profiles[0].name === "Jugador 1" &&
    m.lastId === m.profiles[0].id,
  "one migrated profile",
);
const mp = m.profiles[0];
check(
  mp.progress.coins === 500 &&
    mp.progress.learning.div.level === 3 &&
    mp.progress.learning.add.level === 1.5 &&
    mp.progress.customFutureField === "keep",
  "legacy progress migrated",
);
check(
  mp.settings.timer === true &&
    mp.settings.sound === false &&
    mp.settings.quick === true &&
    mp.settings.setbacks === false &&
    mp.settings.mainMode === "tables" &&
    mp.settings.tableStations === 15,
  "legacy settings migrated",
);
check(
  JSON.stringify([legacyProgress, legacySettings]) === frozen,
  "legacy inputs not mutated",
);
assert.deepEqual(
  app.migrateLegacyStorage(m, { coins: 1 }, null, "X"),
  app.normalizeProfileStore(m),
); // idempotent
const empty = app.migrateLegacyStorage(null, null, null, "Jugador 1");
check(
  empty.profiles.length === 1 && empty.profiles[0].progress.coins === 0,
  "fresh install default profile",
);
check(
  app.migrateLegacyStorage(null, 42, [], "J").profiles[0].progress.coins === 0,
  "non-object legacy ignored",
);
check(
  app.migrateLegacyStorage(
    { version: 1, lastId: "", profiles: [] },
    legacyProgress,
    null,
    "J",
  ).profiles.length === 0,
  "an existing empty store stays empty (all profiles deleted)",
);
// parentChallenge
for (let i = 0; i < 1000; i++) {
  const c = app.parentChallenge();
  check(
    c.a >= 12 && c.a <= 19 && c.b >= 12 && c.b <= 19 && c.answer === c.a * c.b,
    "parent challenge range",
  );
}
console.log(
  checks + " profile model, migration and parent challenge checks passed.",
);
