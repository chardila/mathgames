"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { chromium, firefox, webkit } = require("playwright");
const root = path.join(__dirname, "..");
let checks = 0;
function check(value, message) {
  assert.ok(value, message);
  checks++;
}
const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};
const server = http.createServer((request, response) => {
  const file = path.resolve(
    root,
    "." +
      new URL(request.url, "http://localhost").pathname.replace(
        /\/$/,
        "/index.html",
      ),
  );
  if (!file.startsWith(root + path.sep)) {
    response.writeHead(403).end();
    return;
  }
  fs.readFile(file, (error, data) => {
    response.writeHead(error ? 404 : 200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
    });
    response.end(error ? "Not found" : data);
  });
});

(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url =
    process.env.TEST_BASE_URL || "http://127.0.0.1:" + server.address().port;
  const engine = process.env.TEST_BROWSER || "chromium";
  const browser = await { chromium, firefox, webkit }[engine].launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1024, height: 768 },
      reducedMotion: "reduce",
      hasTouch: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const store = (p = page) =>
      p.evaluate(() => JSON.parse(localStorage.getItem("ms_profiles")));
    const saved = async (p = page) => {
      const s = await store(p);
      return s.profiles.find((profile) => profile.id === s.lastId).progress;
    };
    const pickProfile = (name, p = page) =>
      p
        .locator("#profile-grid .profile-btn")
        .filter({
          has: p.locator(".profile-name", {
            hasText: new RegExp("^" + name + "$"),
          }),
        })
        .click();
    const seedProfiles = async (profiles, lastId, p = page) => {
      await p.evaluate(
        (value) => localStorage.setItem("ms_profiles", JSON.stringify(value)),
        { version: 1, lastId, profiles },
      );
      await p.reload();
    };
    // Change settings of the lastId profile in storage, reload and pick it.
    const setProfileSettings = async (changes, p = page) => {
      const name = await p.evaluate((value) => {
        const s = JSON.parse(localStorage.getItem("ms_profiles"));
        const profile = s.profiles.find((item) => item.id === s.lastId);
        Object.assign(profile.settings, value);
        localStorage.setItem("ms_profiles", JSON.stringify(s));
        return profile.name;
      }, changes);
      await p.reload();
      await pickProfile(name, p);
    };
    // Answer the open parent gate with the product it asks for.
    const passGate = async (p = page) => {
      const [a, b] = (await p.locator("#gate-question").textContent())
        .match(/\d+/g)
        .map(Number);
      await p.locator("#gate-input").fill(String(a * b));
      await p.locator('[data-action="gate-ok"]').click();
    };
    const openParents = async (p = page) => {
      await p.locator('[data-action="open-parents"]').click();
      await passGate(p);
    };
    const editProfile = (name, p = page) =>
      p
        .locator("#parent-profiles .parent-profile")
        .filter({
          has: p.locator(".parent-profile-name", {
            hasText: new RegExp("^" + name + "$"),
          }),
        })
        .locator("[data-edit-id]")
        .click();
    const isActive = (selector, p = page) =>
      p.locator(selector).evaluate((el) => el.classList.contains("is-active"));
    // The visible button for an action on whichever screen is active.
    const activeAction = (action, p = page) =>
      p.locator('.screen.is-active [data-action="' + action + '"]');
    const noOverflow = (p = page) =>
      p.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      );
    await page.goto(url);
    await page
      .locator("#language-grid button")
      .filter({ hasText: "Español" })
      .click();
    await page.evaluate(() => {
      localStorage.removeItem("ms_profiles");
      localStorage.setItem(
        "ms_settings",
        JSON.stringify({
          sound: false,
          timer: false,
          quick: false,
          blitz: false,
          choices: true,
        }),
      );
      localStorage.setItem(
        "ms_progress",
        JSON.stringify({
          coins: 500,
          stars: 77,
          treasures: 3,
          badges: ["first_treasure"],
          collection: ["existing-treasure"],
          bestStreak: 6,
          avgMs: 9000,
          totalCorrect: 9,
          inventory: { joker: 2, fifty: 2, time: 2, shield: 2 },
          buddies: ["kid"],
          buddy: "kid",
          learning: {
            div: {
              level: 3,
              successes: 0,
              attempts: 20,
              correct: 15,
              avgMs: 7000,
            },
          },
          customFutureField: "keep",
        }),
      );
    });
    await page.reload();
    await page.clock.install();
    check(
      (await page.locator("#profile-grid .profile-btn").count()) === 1 &&
        (await page.locator("#profile-grid").textContent()).includes(
          "Jugador 1",
        ),
      "who plays lists migrated profile",
    );
    check(
      (
        await page.evaluate(() =>
          JSON.parse(localStorage.getItem("ms_progress")),
        )
      ).coins === 500,
      "legacy keys untouched",
    );
    await pickProfile("Jugador 1");
    check(
      (await page.locator("#menu-coins").textContent()) === "500",
      "old coins retained",
    );
    check(
      (await saved()).customFutureField === "keep",
      "unknown progress retained",
    );
    check((await saved()).learning.div.level === 3, "learning retained");
    // The classic blocks below play from the classic menu.
    await setProfileSettings({ mainMode: "mix" });
    check(
      (await saved()).learning.add.level === 1.5,
      "raised initial adaptive level",
    );
    check(
      (await page
        .locator('#screen-menu [data-action="go-settings"]')
        .count()) === 0 &&
        (await page.locator("#screen-modes .switch-row").count()) === 0,
      "no settings on child screens",
    );
    await page.locator('#screen-menu [data-action="switch-player"]').click();
    // gate: wrong answer keeps it closed
    await page.locator('[data-action="open-parents"]').click();
    await page.locator("#gate-input").fill("1");
    await page.locator('[data-action="gate-ok"]').click();
    check(
      (await page.locator("#parent-gate").isVisible()) &&
        (await page.locator("#gate-input").inputValue()) === "" &&
        !(await page
          .locator("#screen-parents")
          .evaluate((el) => el.classList.contains("is-active"))),
      "gate rejects wrong answer",
    );
    await passGate(); // -> #screen-parents active
    check(
      (await isActive("#screen-parents")) &&
        (await page.locator("#parent-gate").isHidden()),
      "gate opens parents area",
    );
    await editProfile("Jugador 1");
    check(
      !(await page.locator("#toggle-timer").isChecked()) &&
        !(await page.locator("#toggle-blitz").isChecked()),
      "optional timing",
    );
    await page.locator('[data-action="back-parents"]').click();
    check(await isActive("#screen-parents"), "back to parents without gate");
    await page
      .locator("#settings-language-grid button")
      .filter({ hasText: "English" })
      .click();
    check(
      (await page.locator("html").getAttribute("lang")) === "en",
      "language navigation",
    );
    await page
      .locator("#settings-language-grid button")
      .filter({ hasText: "Español" })
      .click();
    // add + rename + avatar
    await page.locator('[data-action="add-profile"]').click();
    await page.locator("#edit-name").fill("Ana");
    await page.locator("#edit-name").blur();
    await page.locator('#edit-avatars [data-avatar="🐼"]').click();
    await page
      .locator("#toggle-timer")
      .locator("xpath=ancestor::label")
      .click();
    const ana = (await store()).profiles.find((p) => p.name === "Ana");
    check(
      ana.avatar === "🐼" && ana.settings.timer === true,
      "editor saves to edited profile",
    );
    check(
      (await store()).profiles.find((p) => p.name === "Jugador 1").settings
        .timer === false,
      "other profile untouched",
    );
    await page.locator("#edit-stations").selectOption("20");
    await page.locator("#edit-main-mode").selectOption("mul");
    const anaEdited = (await store()).profiles.find((p) => p.name === "Ana");
    check(
      anaEdited.settings.tableStations === 20 &&
        anaEdited.settings.mainMode === "mul",
      "editor selects save",
    );
    await page.locator('[data-action="back-parents"]').click();
    await page.locator('#screen-parents [data-action="go-profiles"]').click();
    check(
      (await page.locator("#profile-grid .profile-btn").count()) === 2,
      "added profile listed in who plays",
    );
    await pickProfile("Jugador 1");
    await page.locator('#screen-menu [data-action="go-shop"]').click();
    const oldCoins = (await saved()).coins;
    await page
      .locator(".shop-item")
      .filter({ hasText: "Comodín" })
      .locator(".shop-buy")
      .click();
    check(
      (await saved()).coins < oldCoins && (await saved()).inventory.joker === 3,
      "shop purchase",
    );
    await page.locator(".buddy-card").filter({ hasText: "Zorro" }).click();
    check((await saved()).buddy === "fox", "buddy purchase and equip");
    await page.locator('[data-action="close-shop"]').click();

    async function start(mode, quick, diff = "adaptive", timer = false) {
      const s = await store();
      const active = s.profiles.find((p) => p.id === s.lastId).settings;
      if (active.quick !== quick || active.timer !== timer)
        await setProfileSettings({ quick, timer });
      if (
        await page
          .locator("#screen-summary")
          .evaluate((el) => el.classList.contains("is-active"))
      )
        await page.locator('#screen-summary [data-action="go-menu"]').click();
      await activeAction("go-modes").click();
      await page.locator('[data-mode="' + mode + '"]').click();
      await page.locator('[data-diff="' + diff + '"]').click();
      await page.locator('#screen-modes [data-action="start-run"]').click();
    }
    async function current() {
      const text = await page.locator("#game-question").textContent();
      const numbers = text.match(/\d+/g).map(Number);
      const type = text.includes("÷")
        ? "div"
        : text.includes("×")
          ? "mul"
          : text.includes("−")
            ? "sub"
            : "add";
      const answer =
        type === "div"
          ? numbers[0] / numbers[1]
          : type === "mul"
            ? numbers[0] * numbers[1]
            : type === "sub"
              ? numbers[0] - numbers[1]
              : numbers.reduce((sum, n) => sum + n, 0);
      return { type, numbers, answer, text };
    }
    async function solve() {
      const q = await current();
      await page
        .locator("#choices .choice")
        .filter({ hasText: new RegExp("^" + q.answer + "$") })
        .tap();
      await page.clock.runFor(800);
      return q;
    }
    async function quit() {
      await page.locator('[data-action="pause"]').click();
      await page.locator('[data-action="quit"]').click();
    }
    for (const [mode, quick] of [
      ["mix", false],
      ["mix", true],
      ["add", true],
      ["sub", true],
      ["mul", true],
      ["div", true],
    ]) {
      await start(mode, quick);
      check(
        !(await page.locator("#timer-ring").isVisible()) &&
          !(await page.locator("#game-timer-chip").isVisible()) &&
          !(await page.locator("#blitz-tag").isVisible()),
        "untimed task hides all timer UI",
      );
      const total = quick ? 10 : 25;
      check(
        (await page.locator("#map-progress").textContent()).includes(
          " de " + total,
        ),
        "round length",
      );
      const counts = { add: 0, sub: 0, mul: 0, div: 0 };
      for (let i = 0; i < total; i++) {
        const q = await solve();
        counts[q.type]++;
        if (i === 4)
          check(
            (await page.locator("#mascot-bubble").textContent()).includes("5"),
            "positive milestone",
          );
      }
      check(
        await page
          .locator("#screen-summary")
          .evaluate((el) => el.classList.contains("is-active")),
        "round completion",
      );
      check(
        (await page.locator("#sum-accuracy").textContent()) === "100%",
        "accuracy",
      );
      if (mode === "mix")
        check(
          Math.max(...Object.values(counts)) -
            Math.min(...Object.values(counts)) <=
            1,
          "mixed UI balance",
        );
      else check(counts[mode] === total, "individual mode");
      await page.locator("#chest").click();
      await page.clock.runFor(800);
      check(
        await page.locator("#treasure-reveal").isVisible(),
        "treasure reveal",
      );
    }
    check(
      (await saved()).collection.includes("existing-treasure"),
      "old treasure retained",
    );
    check(
      (await saved()).badges.includes("first_treasure"),
      "old badge retained",
    );
    await page.locator('#screen-summary [data-action="go-menu"]').click();
    for (const factor of [1, 10]) {
      await page.evaluate((value) => {
        window.originalTestRandom = Math.random;
        Math.random = () => (value === 1 ? 0 : 0.99999);
      }, factor);
      await start("mul", true, "adaptive");
      const initialProduct = await current();
      check(
        initialProduct.numbers.every((n) => n === factor) &&
          initialProduct.answer === factor * factor,
        "adaptive immediately permits " + factor + " × " + factor,
      );
      await page.evaluate(() => {
        Math.random = window.originalTestRandom;
        delete window.originalTestRandom;
      });
      await solve();
      await quit();
    }
    await setProfileSettings({ choices: false, setbacks: false });
    await start("mul", true);
    check(
      (await page.locator("#numpad .key").count()) === 12 &&
        !(await page.locator("#choices").isVisible()),
      "typing mode",
    );
    for (let i = 0; i < 10; i++) {
      // half with on-screen keys + Check, half with keyboard digits + Enter
      const q = await current();
      if (i % 2) {
        await page.keyboard.type(String(q.answer));
        await page.keyboard.press("Enter");
      } else {
        for (const d of String(q.answer))
          await page
            .locator("#numpad .key", { hasText: new RegExp("^" + d + "$") })
            .click();
        await page.locator('[data-action="check"]').click();
      }
      await page.clock.runFor(800);
    }
    check(
      (await page.locator("#sum-accuracy").textContent()) === "100%",
      "typed round completes",
    );
    // wrong typed answer at station 5 with setbacks off: stays on 5, continue -> 6
    await page.locator('#screen-summary [data-action="go-menu"]').click();
    await start("mul", true);
    for (let i = 0; i < 4; i++) {
      const q = await current();
      await page.keyboard.type(String(q.answer));
      await page.keyboard.press("Enter");
      await page.clock.runFor(800);
    }
    const miss = await current();
    await page.keyboard.type(String(miss.answer === 1 ? 2 : 1));
    await page.keyboard.press("Enter");
    check(
      (await page.locator("#map-progress").getAttribute("data-station")) ===
        "5" &&
        (await page.locator("#choices .choice").count()) === 1 &&
        (await page.locator(".choice--continue").isVisible()) &&
        !(await page.locator("#numpad-wrap").isVisible()),
      "no setback when off; continue button shown while typing",
    );
    await page.locator(".choice--continue").click();
    check(
      (await page.locator("#map-progress").getAttribute("data-station")) ===
        "6" &&
        !(await page.locator("#choices").isVisible()) &&
        (await page.locator("#numpad-wrap").isVisible()),
      "continue after typed miss",
    );
    check(
      (await page.locator('#powerups [data-powerup="joker"]').count()) === 1 &&
        (await page.locator('#powerups [data-powerup="shield"]').count()) === 0,
      "shield hidden in tray when setbacks off",
    );
    await quit();
    await page.locator('#screen-menu [data-action="go-shop"]').click();
    check(
      (await page.locator('.shop-item[data-powerup="joker"]').count()) === 1 &&
        (await page.locator('.shop-item[data-powerup="shield"]').count()) === 0,
      "shield hidden in shop when setbacks off",
    );
    await page.locator('[data-action="close-shop"]').click();
    await setProfileSettings({ setbacks: true });
    await page.locator('#screen-menu [data-action="go-shop"]').click();
    check(
      (await page.locator('.shop-item[data-powerup="shield"]').count()) === 1,
      "shield back in shop when setbacks on",
    );
    await page.locator('[data-action="close-shop"]').click();
    // the setback and shield checks below need answer buttons and setbacks on
    await setProfileSettings({ choices: true, setbacks: true });
    await start("div", false, "hard");
    for (let i = 0; i < 4; i++) await solve();
    const q = await current();
    await page
      .locator("#choices .choice")
      .filter({ hasNotText: new RegExp("^" + q.answer + "$") })
      .first()
      .click();
    check(
      (await page.locator("#map-progress").textContent()).includes(
        "Estación 2",
      ),
      "three-station setback",
    );
    check(
      (await page.locator("#hint").textContent()).includes(
        q.numbers[1] + " × " + q.answer + " = " + q.numbers[0],
      ),
      "inverse division solution",
    );
    const attempts = (await saved()).learning.div.attempts;
    await page.locator('[data-action="pause"]').click();
    await page.clock.runFor(40000);
    await page.locator('[data-action="resume"]').click();
    check(
      (await saved()).learning.div.attempts === attempts,
      "solution pause causes no duplicate failure",
    );
    await page.locator(".choice--continue").click();
    check(
      (await page.locator("#map-progress").textContent()).includes(
        "Estación 3",
      ),
      "continue after explanation",
    );
    for (let i = 0; i < 2; i++) await solve();
    await page.locator('.powerup[aria-label^="Escudo"]').click();
    const beforeShield = await page.locator("#map-progress").textContent();
    const shieldQ = await current();
    await page
      .locator("#choices .choice")
      .filter({ hasNotText: new RegExp("^" + shieldQ.answer + "$") })
      .first()
      .click();
    check(
      (await page.locator("#map-progress").textContent()) === beforeShield,
      "shield prevents setback",
    );
    await page.locator(".choice--continue").click();
    const beforeJoker = (await saved()).learning.div.attempts;
    await page.locator('.powerup[aria-label^="Comodín"]').click();
    await page.clock.runFor(800);
    check(
      (await saved()).learning.div.attempts === beforeJoker,
      "joker does not inflate learning",
    );
    await quit();
    for (const mode of ["add", "sub", "mul", "div", "mix"]) {
      await start(mode, true, "adaptive", true);
      await page.locator("#game-timer-chip").waitFor({ state: "visible" });
      await page.locator("#timer-ring").waitFor({ state: "visible" });
      check(
        (await page.locator("#game-timer-chip").isVisible()) &&
          (await page.locator("#timer-ring").isVisible()),
        "countdown visible in " +
          mode +
          ": " +
          (await page.evaluate(() =>
            JSON.stringify({
              chip: document.getElementById("game-timer-chip").outerHTML,
              ringHidden: document.getElementById("timer-ring").hidden,
              settings: (
                JSON.parse(localStorage.getItem("ms_profiles")) || {
                  profiles: [],
                }
              ).profiles.map((profile) => profile.settings),
            }),
          )),
      );
      const initial = Number(await page.locator("#game-timer").textContent());
      await page.clock.runFor(1100);
      const remaining = Number(await page.locator("#game-timer").textContent());
      check(
        remaining < initial &&
          remaining === Number(await page.locator("#timer-num").textContent()),
        "countdown ticks in " + mode,
      );
      await solve();
      check(
        await page.locator("#game-timer-chip").isVisible(),
        "countdown on next task in " + mode,
      );
      await quit();
    }
    await start("div", false, "hard", true);
    const divisionTime = Number(await page.locator("#timer-num").textContent());
    check(divisionTime >= 10 && divisionTime <= 30, "actual division timer");
    await quit();
    await start("mul", false, "hard", true);
    let initialTime = Number(await page.locator("#timer-num").textContent());
    check(initialTime >= 6 && initialTime <= 20, "actual multiplication timer");
    await page.locator('.powerup[aria-label^="50:50"]').click();
    check((await page.locator("#choices .is-faded").count()) === 2, "50:50");
    const starsBefore = (await saved()).stars;
    await page.locator(".powerup--star").click();
    await page.clock.runFor(100);
    check((await saved()).stars === starsBefore - 3, "star time price");
    check(
      Number(await page.locator("#timer-num").textContent()) ===
        initialTime + 10,
      "star extra time",
    );
    await page.locator('.powerup[aria-label^="Tiempo extra"]').click();
    await page.clock.runFor(100);
    check(
      Number(await page.locator("#timer-num").textContent()) ===
        initialTime + 15,
      "coin extra time",
    );
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.clock.runFor(5000);
    await page.locator('[data-action="resume"]').click();
    check(
      Number(await page.locator("#timer-num").textContent()) ===
        initialTime + 15,
      "purchased time survives pause",
    );
    await page.clock.runFor(40000);
    check(await page.locator("#hint").isVisible(), "timeout shows solution");
    await quit();
    // Cancel a pending task transition when navigating away immediately.
    await start("add", true);
    const transitionQ = await current();
    await page
      .locator("#choices .choice")
      .filter({ hasText: new RegExp("^" + transitionQ.answer + "$") })
      .press("Enter");
    await quit();
    await page.clock.runFor(1000);
    check(
      await page
        .locator("#screen-menu")
        .evaluate((el) => el.classList.contains("is-active")),
      "safe navigation during transition",
    );
    const learningBeforeReload = JSON.stringify((await saved()).learning);
    await page.reload();
    await pickProfile("Jugador 1");
    check(
      JSON.stringify((await saved()).learning) === learningBeforeReload,
      "persisted learning reload",
    );
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await pickProfile("Jugador 1");
    check(
      await page.evaluate(() => !!navigator.serviceWorker.controller),
      "service worker controls page",
    );
    await context.setOffline(true);
    await page.reload();
    await pickProfile("Jugador 1");
    await start("div", true, "easy", false);
    await solve();
    check(
      await page
        .locator("#screen-game")
        .evaluate((el) => el.classList.contains("is-active")),
      "offline game works",
    );
    fs.mkdirSync(path.join(root, ".cache"), { recursive: true });
    await page.screenshot({
      path: path.join(root, ".cache", "tablet-game.png"),
      fullPage: true,
    });
    await quit();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#screen-menu [data-action="go-modes"]').click();
    check(
      await page.locator('[data-mode="div"]').isVisible(),
      "division on mobile",
    );
    check(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      "no horizontal mobile overflow",
    );
    await page.screenshot({
      path: path.join(root, ".cache", "mobile-modes.png"),
      fullPage: true,
    });
    // delete every profile -> who-plays shows the empty hint and the parents button still works
    await page.locator('#screen-modes [data-action="go-menu"]').click();
    await page.locator('#screen-menu [data-action="switch-player"]').click();
    await page.locator('[data-action="open-parents"]').click();
    check(await noOverflow(), "no mobile overflow in parent gate");
    await passGate();
    check(await noOverflow(), "no mobile overflow in parents area");
    await page.screenshot({
      path: path.join(root, ".cache", "mobile-parents.png"),
      fullPage: true,
    });
    let deleteRounds = 0;
    while (
      (await page.locator("#parent-profiles [data-edit-id]").count()) > 0
    ) {
      await page.locator("#parent-profiles [data-edit-id]").first().click();
      if (deleteRounds++ === 0) {
        check(await noOverflow(), "no mobile overflow in profile editor");
        await page.screenshot({
          path: path.join(root, ".cache", "mobile-profile-edit.png"),
          fullPage: true,
        });
      }
      page.once("dialog", (dialog) => dialog.accept());
      await page.locator('[data-action="delete-profile"]').click();
    }
    const emptied = await store();
    check(
      emptied.profiles.length === 0 && emptied.lastId === "",
      "deleting profiles clears lastId",
    );
    await page.locator('#screen-parents [data-action="go-profiles"]').click();
    check(
      (await page.locator("#who-empty").isVisible()) &&
        (await page.locator('[data-action="open-parents"]').isVisible()),
      "empty who-plays usable",
    );

    // ---- tables mode ----
    {
      await page.setViewportSize({ width: 1024, height: 768 });
      await seedProfiles(
        [
          {
            id: "p1",
            name: "Ana",
            settings: {
              mainMode: "tables",
              setbacks: false,
              tableStations: 10,
              sound: false,
              timer: false,
            },
          },
        ],
        "p1",
      );
      await pickProfile("Ana");
      // Stop natural time flow: only runFor moves the clock from here on.
      await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
      // On-screen keys + Check.
      const typeAnswer = async (n) => {
        for (const d of String(n))
          await page
            .locator("#numpad .key", { hasText: new RegExp("^" + d + "$") })
            .click();
        await page.locator('[data-action="check"]').click();
      };
      // Physical keyboard + Enter.
      const pressAnswer = async (n) => {
        await page.keyboard.type(String(n));
        await page.keyboard.press("Enter");
      };
      const factOf = (q) =>
        Math.min(q.numbers[0], q.numbers[1]) +
        "-" +
        Math.max(q.numbers[0], q.numbers[1]);
      const fact = async (key) => {
        const s = await store();
        return s.profiles.find((p) => p.id === s.lastId).tables.facts[key];
      };
      const station = async () =>
        Number(
          await page.locator("#map-progress").getAttribute("data-station"),
        );
      const hintStage = () => page.locator("#hint").getAttribute("data-stage");
      check(
        (await isActive("#screen-tables-home")) &&
          (await page.locator("#home-greeting").textContent()).includes("Ana"),
        "tables home for tables profile",
      );
      await page.locator('[data-action="start-tables"]').click();
      check(
        (await page.locator("#numpad .key").count()) === 12 &&
          !(await page.locator("#choices").isVisible()) &&
          !(await page.locator("#powerups").isVisible()) &&
          !(await page.locator("#timer-ring").isVisible()),
        "typing, no tray, no timer",
      );
      check(
        (await page.locator("#map-progress").getAttribute("data-total")) ===
          "10" && (await station()) === 1,
        "profile station count",
      );
      // 1) fast answer is recorded as fast
      let q = await current();
      await pressAnswer(q.answer);
      await page.clock.runFor(800);
      check((await fact(factOf(q))).fast === 1, "fast answer recorded");
      // 2) silence: no hint before 5 s, hint at 5 s with a×b blocks
      q = await current();
      await page.clock.runFor(4900);
      check(!(await page.locator("#hint").isVisible()), "no hint before 5 s");
      await page.clock.runFor(200);
      check(
        (await page.locator("#hint").isVisible()) &&
          (await hintStage()) === "hint" &&
          (await page.locator("#hint .block").count()) === q.answer,
        "hint blocks at 5 s",
      );
      // pausing during the 10 s wait freezes it
      await page.clock.runFor(4000);
      await page.locator('[data-action="pause"]').click();
      await page.clock.runFor(20000);
      await page.locator('[data-action="resume"]').click();
      check(
        (await hintStage()) === "hint" &&
          (await page.locator("#hint .hint-answer").count()) === 0,
        "pause freezes answer wait",
      );
      // 3) answer shown 10 s after the hint; a wrong entry there costs nothing;
      // then the fact returns 3-4 stations later
      await page.clock.runFor(6100);
      check(
        (await hintStage()) === "answer" &&
          (await page.locator("#hint .hint-answer").textContent()).includes(
            String(q.answer),
          ),
        "answer after +10 s",
      );
      const stationBefore = await station();
      await pressAnswer(q.answer === 1 ? 2 : 1);
      check(
        (await station()) === stationBefore &&
          (await page.locator("#game-question").textContent()) === q.text &&
          (await hintStage()) === "answer",
        "wrong in answer stage: same station",
      );
      await pressAnswer(q.answer);
      await page.clock.runFor(800);
      check(
        (await fact(factOf(q))).fast === 0,
        "needed answer resets fast count",
      );
      const upcoming = [];
      for (let i = 0; i < 4; i++) {
        const n = await current();
        upcoming.push(factOf(n));
        await pressAnswer(n.answer);
        await page.clock.runFor(800);
      }
      check(
        upcoming.slice(2).includes(factOf(q)),
        "missed fact returns 3-4 stations later",
      );
      // 4) wrong before the hint -> hint at once; no auto-submit
      q = await current();
      await pressAnswer(q.answer === 1 ? 2 : 1);
      check(
        (await page.locator("#hint").isVisible()) &&
          (await hintStage()) === "hint",
        "wrong answer shows hint immediately",
      );
      for (const d of String(q.answer))
        await page
          .locator("#numpad .key", { hasText: new RegExp("^" + d + "$") })
          .click();
      await page.clock.runFor(3000);
      check((await current()).text === q.text, "no auto-submit");
      await page.locator('[data-action="check"]').click();
      await page.clock.runFor(800);
      // 5) pause freezes the 5 s wait and is not counted as slowness
      q = await current();
      await page.clock.runFor(1000);
      await page.locator('[data-action="pause"]').click();
      await page.clock.runFor(20000);
      await page.locator('[data-action="resume"]').click();
      check(
        !(await page.locator("#hint").isVisible()),
        "pause freezes hint wait",
      );
      const fastBefore = (await fact(factOf(q))).fast;
      await pressAnswer(q.answer);
      await page.clock.runFor(800);
      check(
        (await fact(factOf(q))).fast === fastBefore + 1,
        "paused time not counted",
      );
      // 5b) pausing during the 750 ms transition resumes into the tables round
      const stationAtPause = await station();
      q = await current();
      await pressAnswer(q.answer);
      await page.locator('[data-action="pause"]').click();
      await page.clock.runFor(2000);
      await page.locator('[data-action="resume"]').click();
      await page.clock.runFor(100);
      check(
        (await page.locator("#game-question").textContent()).includes("×") &&
          (await page.locator("#numpad .key").count()) === 12 &&
          (await station()) === stationAtPause + 1 &&
          (await hintStage()) === "ask",
        "resume after transition stays in tables mode",
      );
      // 6) quitting during a wait leaves no timer behind
      await page.clock.runFor(1000);
      await quit();
      check(await isActive("#screen-tables-home"), "quit goes to tables home");
      await page.locator('[data-action="start-tables"]').click();
      await page.clock.runFor(4500);
      check(
        !(await page.locator("#hint").isVisible()) &&
          (await hintStage()) === "ask",
        "no stray timers after quit",
      );
      await quit();
      // 7) a full round: never moves back, summary shows progress not accuracy
      await page.locator('[data-action="start-tables"]').click();
      let lastStation = 0;
      let neverBack = true;
      for (let i = 0; i < 40 && (await isActive("#screen-game")); i++) {
        const s = await station();
        if (s < lastStation) neverBack = false;
        lastStation = s;
        const n = await current();
        if (i % 4 === 1) await page.clock.runFor(5100);
        if (i % 2) await pressAnswer(n.answer);
        else await typeAnswer(n.answer);
        await page.clock.runFor(800);
      }
      check(
        neverBack && lastStation === 10 && (await isActive("#screen-summary")),
        "tables round completes without moving back",
      );
      check(
        (await page.locator("#sum-accuracy-lbl").getAttribute("data-i18n")) ===
          "lbl_mastered_today" &&
          /^\d+$/.test(await page.locator("#sum-accuracy").textContent()) &&
          !(await page.locator("#review-box").isVisible()) &&
          (await page.locator("#sum-progress-line").isVisible()),
        "tables summary",
      );
      // 8) phone width, with the hint blocks on screen
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator('[data-action="play-again"]').click();
      check(
        (await isActive("#screen-game")) &&
          (await page.locator("#numpad .key").count()) === 12 &&
          (await noOverflow()),
        "tables game fits 390 px",
      );
      await page.clock.runFor(5100);
      check(
        (await page.locator("#hint .block").count()) > 0 &&
          (await noOverflow()),
        "hint blocks fit 390 px",
      );
      await page.screenshot({
        path: path.join(root, ".cache", "mobile-tables.png"),
        fullPage: true,
      });
      await quit();
      // 9) worst-case hint (10 × 10 = 100 blocks) still fits a 390 × 844 phone:
      // every fact mastered (review far off) except 10-10, which is practicing.
      const facts = {};
      for (let a = 1; a <= 10; a++)
        for (let b = a; b <= 10; b++)
          facts[a + "-" + b] = {
            state: "mastered",
            seen: 5,
            fast: 3,
            lastSeen: "2026-01-01",
            reviewStep: 3,
            nextReview: "2999-01-01",
          };
      facts["10-10"] = { state: "practicing", seen: 1, lastSeen: "2026-01-01" };
      await seedProfiles(
        [
          {
            id: "p1",
            name: "Ana",
            settings: {
              mainMode: "tables",
              setbacks: false,
              tableStations: 10,
              sound: false,
              timer: false,
            },
            tables: { facts },
          },
        ],
        "p1",
      );
      await pickProfile("Ana");
      await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
      await page.locator('[data-action="start-tables"]').click();
      for (let i = 0; i < 10 && (await current()).answer !== 100; i++) {
        await pressAnswer((await current()).answer);
        await page.clock.runFor(800);
      }
      const fitsViewport = () =>
        page.evaluate(() =>
          ["#numpad", '[data-action="check"]', "#hint"].every((sel) => {
            const r = document.querySelector(sel).getBoundingClientRect();
            return (
              r.bottom <= window.innerHeight && r.right <= window.innerWidth
            );
          }),
        );
      check((await current()).answer === 100, "worst-case fact reached");
      await page.clock.runFor(5100);
      check(
        (await page.locator("#hint .block").count()) === 100 &&
          (await noOverflow()) &&
          (await fitsViewport()),
        "10 × 10 hint fits 390 × 844 without scrolling",
      );
      await page.clock.runFor(10000);
      check(
        (await hintStage()) === "answer" &&
          (await noOverflow()) &&
          (await fitsViewport()),
        "answer stage fits 390 × 844 without scrolling",
      );
      await pressAnswer(1);
      check(
        (await page.locator("#feedback").textContent()) !== "" &&
          (await noOverflow()) &&
          (await fitsViewport()),
        "wrong entry feedback still fits 390 × 844",
      );
      await page.screenshot({
        path: path.join(root, ".cache", "mobile-tables-hint.png"),
      });
      await quit();
      await page.clock.resume();
    }
    // switching player during a pending transition writes nothing into the next profile
    await seedProfiles(
      [
        { id: "p1", name: "A", progress: { coins: 10 } },
        { id: "p2", name: "B", progress: { coins: 99 } },
      ],
      "p1",
    );
    await pickProfile("A");
    await start("add", true);
    const pending = await current();
    await page
      .locator("#choices .choice")
      .filter({ hasText: new RegExp("^" + pending.answer + "$") })
      .click();
    await quit();
    await activeAction("switch-player").click();
    await pickProfile("B");
    const bBefore = JSON.stringify(
      (await store()).profiles.find((p) => p.name === "B").progress,
    );
    await page.clock.runFor(1000);
    check(
      JSON.stringify(
        (await store()).profiles.find((p) => p.name === "B").progress,
      ) === bBefore &&
        !(await page
          .locator("#screen-game")
          .evaluate((el) => el.classList.contains("is-active"))),
      "no cross-profile writes after switch",
    );
    check(errors.length === 0, "no browser errors: " + errors.join("; "));
    await context.close();
    // Fresh installation uses untimed practice by default.
    const fresh = await browser.newContext();
    const freshPage = await fresh.newPage();
    await freshPage.goto(url);
    await freshPage
      .locator("#language-grid button")
      .filter({ hasText: "Español" })
      .click();
    await openParents(freshPage);
    await editProfile("Jugador 1", freshPage);
    check(
      !(await freshPage.locator("#toggle-timer").isChecked()) &&
        !(await freshPage.locator("#toggle-blitz").isChecked()),
      "new installation defaults",
    );
    await freshPage.evaluate(() => {
      localStorage.setItem(
        "ms_settings",
        JSON.stringify({ timer: true, blitz: true, sound: false }),
      );
      localStorage.setItem("ms_progress", "{broken");
      localStorage.removeItem("ms_profiles");
    });
    await freshPage.reload();
    await pickProfile("Jugador 1", freshPage);
    await activeAction("switch-player", freshPage).click();
    await openParents(freshPage);
    await editProfile("Jugador 1", freshPage);
    check(
      (await freshPage.locator("#toggle-timer").isChecked()) &&
        (await freshPage.locator("#toggle-blitz").isChecked()),
      "existing timer preferences retained",
    );
    check(
      (await freshPage.locator("#menu-coins").textContent()) === "0",
      "corrupt storage recovers",
    );
    freshPage.once("dialog", (dialog) => dialog.accept());
    await freshPage.locator('[data-action="reset"]').click();
    const reset = await saved(freshPage);
    check(
      reset.coins === 0 &&
        reset.stars === 0 &&
        Object.values(reset.learning).every((r) => r.level === 1.5),
      "explicit reset clears learning and rewards",
    );
    // Two seeded profiles: A (coins 10), B (coins 99)
    await seedProfiles(
      [
        { id: "p1", name: "A", progress: { coins: 10 } },
        { id: "p2", name: "B", progress: { coins: 99 } },
      ],
      "p1",
      freshPage,
    );
    await pickProfile("A", freshPage);
    check(
      (await freshPage.locator("#menu-coins").textContent()) === "10",
      "profile A coins",
    );
    await activeAction("switch-player", freshPage).click();
    check(
      (await freshPage.locator("#profile-grid .profile-btn").count()) === 2,
      "switch player shows who plays",
    );
    await pickProfile("B", freshPage);
    check(
      (await freshPage.locator("#menu-coins").textContent()) === "99",
      "profile B coins",
    );
    // buy a joker as B -> A still has 10 coins in the store
    await activeAction("go-shop", freshPage).click();
    await freshPage
      .locator('.shop-item[data-powerup="joker"] .shop-buy')
      .click();
    await freshPage.locator('[data-action="close-shop"]').click();
    check(
      (await store(freshPage)).profiles.find((p) => p.name === "B").progress
        .coins === 89 &&
        (await store(freshPage)).profiles.find((p) => p.name === "B").progress
          .inventory.joker === 1 &&
        (await store(freshPage)).profiles.find((p) => p.name === "A").progress
          .coins === 10,
      "profiles isolated",
    );
    await seedProfiles([], "", freshPage);
    check(
      (await freshPage.locator("#profile-grid .profile-btn").count()) === 0 &&
        (await freshPage.locator("#who-empty").isVisible()),
      "who-empty shown without profiles",
    );
    // ms_profiles = "{broken" and no legacy keys -> one "Jugador 1" with 0 coins
    await freshPage.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("ms_lang", '"es"');
      localStorage.setItem("ms_profiles", "{broken");
    });
    await freshPage.reload();
    check(
      (await freshPage.locator("#profile-grid .profile-btn").count()) === 1 &&
        (await store(freshPage)).profiles[0].name === "Jugador 1" &&
        (await store(freshPage)).profiles[0].progress.coins === 0,
      "corrupt profile store recovers",
    );
    check(
      await freshPage.locator("#who-empty").isHidden(),
      "who-empty hidden with profiles",
    );
    await fresh.close();
    const privateContext = await browser.newContext();
    await privateContext.addInitScript(() => {
      Storage.prototype.getItem = () => {
        throw Error("storage unavailable");
      };
      Storage.prototype.setItem = () => {
        throw Error("storage unavailable");
      };
    });
    const privatePage = await privateContext.newPage();
    await privatePage.goto(url);
    await privatePage
      .locator("#language-grid button")
      .filter({ hasText: "Español" })
      .click();
    await pickProfile("Jugador 1", privatePage);
    await activeAction("go-modes", privatePage).click();
    await privatePage
      .locator('#screen-modes [data-action="start-run"]')
      .click();
    check(
      (await privatePage.locator("#choices .choice").count()) >= 4,
      "game without storage",
    );
    await privateContext.close();
    console.log(
      checks +
        " browser checks passed in " +
        engine +
        (process.env.BROWSER_CHANNEL
          ? " (" + process.env.BROWSER_CHANNEL + ")"
          : "") +
        " " +
        browser.version() +
        ": rounds, learning, rewards, shop, navigation, pause, timeout, offline and mobile.",
    );
  } finally {
    await browser.close();
  }
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => server.close());
