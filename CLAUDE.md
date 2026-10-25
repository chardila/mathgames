# Tablas del Tesoro

Fork de AllesSuper/math-treasure-quest (MIT), en español e inglés, para que una niña memorice las tablas de multiplicar.

- JavaScript puro, sin build. `npm test` y `npm run validate` antes de commitear; `npm run test:browser` para el flujo completo.
- Textos en `I18N` de `app.js` (`es` y `en`; `en` es el respaldo). Toda clave nueva va en ambos idiomas.
- Al cambiar archivos cacheados, subir `CACHE_VERSION` en `service-worker.js`.
- **Hallazgos y backlog: `docs/BACKLOG.md`.** Los hallazgos `por-analizar` no son trabajo aprobado: no los implementes sin que el usuario los analice y acepte. Al encontrar algo nuevo, añádelo allí.
- **Hoja de ruta y diseños en curso:** sección "Hoja de ruta" de `docs/BACKLOG.md` y `docs/superpowers/specs/`. Un diseño en estado BORRADOR no está aprobado: retoma la conversación desde su sección "Pendiente de decidir".

## Mapa de `app.js`

Son unas 2800 líneas. No lo leas entero: busca la función con grep y lee solo ese tramo con `offset`/`limit`. El orden, de arriba abajo:

1. **Textos:** `LANGUAGES`, `I18N` (`en`, `es`), `LEARNING_TEXT`, `BADGE_LABELS`.
2. **Lógica pura** (exportada para las pruebas): `randInt`, `clamp`, niveles `MIN_LEVEL`/`MAX_LEVEL`/`START_LEVEL`. Generadores: `generateAddition`, `generateSubtraction`, `generateMultiplication`, `generateDivision`, `createRoundModes`, `generateTask`. Validación y ayuda: `validateTask`, `buildHint`, `generateChoices`, `choiceCountForLevel`, `computeTimeBudget`, `answerRange`, `validateAnswer`, `buildSolution`. Nivel adaptativo: `updateAvgMs`, `normalizeLearning`, `migrateLearningStart`, `updateLearning`.
3. **Catálogo:** `TREASURE_PALETTES`, `TREASURE_SHAPES`, `buildTreasures`/`TREASURES`, `dailyTreasureIndex`, `taskDifficultyScore`, `vibrationForTask`, `extraTimeForTask`, `SHOP_POWERUPS`, `SHOP_BUDDIES`.
4. **`startApp()`**, la interfaz (solo en el navegador), en este orden:
   - almacenamiento: `STORAGE_KEYS` (`ms_lang`, `ms_settings`, `ms_progress`), `storageGet`, `storageSet`;
   - estado y textos: `state`, `t`, `applyI18n`, `showScreen`, `els`, `beep`;
   - menú e idioma: `refreshMenuStats`, `renderLanguageGrids`, `setLanguage`, `refreshDynamicText`;
   - teclado: `buildNumpad`, `handleKey`, `renderAnswer`;
   - ronda: `startRun`, `grantDailyBonus`, `buildMap`, `moveWalker`, `nextTask`, `setupAnswerMode`, `renderChoices`, `checkAnswer`, `submitAnswer`, `onCorrect`, `recordLearning`;
   - fallos: `onWrong`, `recordMiss`, `goBackOnMiss`, `showSolution`, `advanceAfterWrong`;
   - efectos: `mascotSay`, `showComboTag`, `floatCoins`, `showToast`, `haptic`;
   - cronómetro: `restartTimer`, `updateTimerRing`, `onTimeout`, `stopTimer`;
   - final de ronda: `awardBadge`, `evaluateBadges`, `finishRun`, `renderReview`, `openChest`, `revealTreasure`, `playVictoryMelody`;
   - potenciadores y tienda: `renderPowerups`, `usePowerup`, `jokerSolve`, `removeTwoWrong`, `addBlitzTime`, `armShield`, `ensureShop`, `openShop`, `renderShop`, `buyPowerup`, `buyOrEquipBuddy`, `applyBuddy`;
   - navegación y ajustes: `goToMenu`, `wireModeSelection`, `syncToggles`, `persistSettings`, `wireToggles`, `resetProgress`;
   - acciones y arranque: `handleAction` (un `switch` sobre `data-action`), `wireActions`, `registerServiceWorker`, `init`.
5. **Final del archivo:** arranque en el navegador y `module.exports` para Node.

Otros archivos: `index.html` (una `section` por pantalla, con id `screen-*`), `styles.css`, `service-worker.js` (`CACHE_VERSION`) y `tests/*.test.js` (`browser.test.js` es Playwright). El plan de perfiles añade `tables.js` (motor de tablas) y `characters.js` (personajes y melodías).
