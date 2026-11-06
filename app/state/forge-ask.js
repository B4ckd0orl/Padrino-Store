// What the store does with a finished game folder: ask, compress with the last format used, or
// leave it alone. The answer lives in settings.json beside the other choices, so the next
// download is packed the way the last one was. The "remove the original" tick is its own
// preference: on unless the player turned it off (kept only while off, like keepPackages).

import { useEffect, useState } from 'react';
import { loadList, saveList } from './saved.js';
import { validLevel } from './forge.js';

  var SETTINGS = "settings.json";
  var ASKS = ["ask", "zstd", "lz4", "never"];
  var savedAsk = loadList(SETTINGS, "settings").forgeAsk;
  var ask = ASKS.includes(savedAsk) ? savedAsk : "ask";
  var savedDelete = loadList(SETTINGS, "settings").forgeKeepOriginal;
  var remove = savedDelete !== false;
  var savedLevel = loadList(SETTINGS, "settings").forgeLevel;
  var level = savedLevel && validLevel(savedLevel.mode, savedLevel.level)
    ? { mode: savedLevel.mode, level: savedLevel.level }
    : { mode: "zstd", level: 9 };
  var listeners = /* @__PURE__ */ new Set();

  function settings() {
    return loadList(SETTINGS, "settings");
  }
  function write(next) {
    saveList(SETTINGS, "settings", next);
    for (const listener of listeners) listener();
  }

  var forgeAsk = () => ask;
  function setForgeAsk(next) {
    if (!ASKS.includes(next) || next === ask) return;
    ask = next;
    const { forgeAsk: _old, ...rest } = settings();
    write(ask === "ask" ? rest : { ...rest, forgeAsk: ask });
  }

  // The tick in front of deleting the packed game's original: on unless turned off.
  var forgeDeleteOriginal = () => remove;
  function setForgeDeleteOriginal(on) {
    const next = on !== false;
    if (next === remove) return;
    remove = next;
    const { forgeKeepOriginal: _old, ...rest } = settings();
    write(remove ? rest : { ...rest, forgeKeepOriginal: false });
  }

  // The format and level last packed with, offered first next time.
  var forgeLevel = () => level;
  function setForgeLevel(mode, next) {
    if (!validLevel(mode, next)) return;
    if (level.mode === mode && level.level === next) return;
    level = { mode, level: next };
    const { forgeLevel: _old, ...rest } = settings();
    write({ ...rest, forgeLevel: level });
  }

  function useForgeState() {
    const [, tick] = (0, useState)(0);
    (0, useEffect)(() => {
      const listener = () => tick((n) => n + 1);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }, []);
    return { ask, remove, level };
  }

export { ASKS, forgeAsk, forgeDeleteOriginal, forgeLevel, setForgeAsk, setForgeDeleteOriginal, setForgeLevel, useForgeState };
