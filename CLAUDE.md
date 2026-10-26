# Tablas del Tesoro

Fork de AllesSuper/math-treasure-quest (MIT), en español e inglés, para que una niña memorice las tablas de multiplicar.

- JavaScript puro, sin build. `npm test` y `npm run validate` antes de commitear; `npm run test:browser` para el flujo completo.
- Textos en `I18N` de `app.js` (`es` y `en`; `en` es el respaldo). Toda clave nueva va en ambos idiomas.
- Al cambiar archivos cacheados, subir `CACHE_VERSION` en `service-worker.js`.
- **Hallazgos y backlog: `docs/BACKLOG.md`.** Los hallazgos `por-analizar` no son trabajo aprobado: no los implementes sin que el usuario los analice y acepte. Al encontrar algo nuevo, añádelo allí.
- **Hoja de ruta y diseños en curso:** sección "Hoja de ruta" de `docs/BACKLOG.md` y `docs/superpowers/specs/`. Un diseño en estado BORRADOR no está aprobado: retoma la conversación desde su sección "Pendiente de decidir".

## Mapa de `app.js`

Son unas 4300 líneas. No lo leas entero: busca la función con grep y lee solo ese tramo con `offset`/`limit`. El orden, de arriba abajo:

1. **Textos:** `LANGUAGES`, `I18N` (`en`, `es`), `LEARNING_TEXT`, `BADGE_LABELS`.
2. **Lógica pura** (exportada para las pruebas). Al principio, los alias `Tables` (de `tables.js`) y `Characters` (de `characters.js`). Luego `randInt`, `clamp`, niveles `MIN_LEVEL`/`MAX_LEVEL`/`START_LEVEL`. Generadores: `generateAddition`, `generateSubtraction`, `generateMultiplication`, `generateDivision`, `createRoundModes`, `generateTask`. Validación y ayuda: `validateTask`, `buildHint`, `generateChoices`, `choiceCountForLevel`, `computeTimeBudget`, `answerRange`, `validateAnswer`. Nivel adaptativo: `updateAvgMs`, `normalizeLearning`, `migrateLearningStart`. Perfiles: `DEFAULT_SETTINGS`, `TABLE_STATION_OPTIONS`, `MAIN_MODES`, `PROFILE_AVATARS`, `isPlainObject`, `defaultProgress`, `defaultEquipped`, `normalizeCosmetics`, `normalizeSettings`, `cleanProfileName`, `nextProfileId`, `createProfile`, `normalizeProfile`, `normalizeProfileStore`, `migrateLegacyStorage`, `parentChallenge`. Después `updateLearning` y `buildSolution`.
3. **Catálogo:** `TREASURE_PALETTES`, `TREASURE_SHAPES`, `buildTreasures`/`TREASURES`, `dailyTreasureIndex`, `taskDifficultyScore`, `vibrationForTask`, `extraTimeForTask`, `SHOP_POWERUPS`, `SHOP_BUDDIES`, `SHOP_COSMETICS` (temas, accesorios y melodías), `VICTORY_MELODIES`.
4. **`startApp()`**, la interfaz (solo en el navegador), en este orden:
   - almacenamiento: `STORAGE_KEYS` (`ms_lang` y `ms_profiles`, que guarda todos los perfiles; `ms_settings` y `ms_progress` son las claves antiguas que migra `migrateLegacyStorage`), `storageGet`, `storageSet`, `saveProfiles`;
   - estado y textos: `state` (`state.profile` es el perfil activo; `state.settings` y `state.progress` apuntan a él), `t`, `applyI18n`, `showScreen`, `els`, `beep`;
   - menú e idioma: `refreshMenuStats`, `renderLanguageGrids`, `setLanguage`, `refreshDynamicText`;
   - teclado: `buildNumpad`, `handleKey`, `renderAnswer`;
   - ronda: `newRun`, `resetRunTimers`, `startRun`;
   - modo tablas: `startTablesRun`, `presentTables`, `nextStation` (elige entre `nextTablesStation` y `nextTask`), `nextTablesStation`, `startStageTimer`/`clearStageTimer`, `enterHintStage`, `enterAnswerStage`, `submitTablesAnswer`, `announceFillMilestones`;
   - ronda clásica: `grantDailyBonus`, `buildMap`, `moveWalker`, `updateMapProgressLabel`, `nextTask`, `setupAnswerMode`, `renderChoices`, `checkAnswer`, `submitAnswer`, `onCorrect`, `rewardCorrect`, `recordLearning`;
   - fallos: `onWrong`, `recordMiss`, `goBackOnMiss`, `showSolution`, `advanceAfterWrong`;
   - efectos: `mascotSay`, `showComboTag`, `floatCoins`, `showToast`, `haptic`;
   - cronómetro: `restartTimer`, `updateTimerRing`, `onTimeout`, `stopTimer`;
   - final de ronda: `awardBadge`, `evaluateBadges`, `finishRun`, `renderTablesSummary`, `renderReview`, `openChest`, `revealTreasure`;
   - música y presentación de tablas: `stopMelody`, `playMelody`, `playVictoryMelody`, `playTableIntro`, `showTableIntro`, `hideTableIntro`, `finishTableIntro`;
   - potenciadores y tienda: `renderPowerups`, `usePowerup`, `jokerSolve`, `removeTwoWrong`, `addBlitzTime`, `armShield`, `ensureShop`, `openShop`, `renderShop`, `buyPowerup`, `buyOrEquipBuddy`;
   - cosméticos y tesoros: `equipped`, `ownsCosmetic`, `renderCosmetics`, `buyOrEquipCosmetic`, `applyMapTheme`, `renderTreasures`, `openTreasures` (pantalla "Mis tesoros"), `applyBuddy`;
   - navegación e inicio: `leaveRun`, `goHome` (inicio de tablas o menú clásico según el perfil), `renderHomeCharacters`, `wireHomeCharacters`, `renderHomeGreeting`;
   - perfiles: `goToProfiles`, `renderProfileGrid`, `useProfile`, `selectModeCard`, `wireModeSelection`;
   - zona de padres: `openGate`, `closeGate`, `checkGate`, `goToParents`, `renderParentProfiles`, `addProfile`, `editingProfile`, `openEditor`, `renderAvatarPicker`, `deleteEditingProfile`;
   - álbum (zona de padres): `albumCell`, `albumHead`, `renderAlbum`, `openAlbum`;
   - ajustes del perfil: `syncToggles`, `buildEditorSelects`, `wireToggles`, `resetProgress`;
   - acciones y arranque: `handleAction` (un `switch` sobre `data-action`), `wireActions`, `registerServiceWorker`, `init`.
5. **Final del archivo:** arranque en el navegador y `module.exports` para Node.

Otros archivos: `index.html` (una `section` por pantalla, con id `screen-*`), `styles.css`, `service-worker.js` (`CACHE_VERSION`), `tables.js` (motor puro del modo tablas: registro por operación, dominio, repaso y composición de la ronda; global `TablesEngine`), `characters.js` (un personaje y una melodía por tabla; global `TableCharacters`) y `tests/*.test.js` (`browser.test.js` es Playwright).
