// What the store does with a finished game folder: ask, compress with the last format used, or
// leave it alone. The answer lives in settings.json beside the other choices, so the next
// download is packed the way the last one was. What then happens to the original is a setting of
// its own, laid out like the installed-PKG one: remove it (on by default), keep it, or be asked
// each time the question comes up (kept only while it is not the default, like keepPackages).

import { useEffect, useState } from 'react';
import { loadList, saveList } from './saved.js';
import { validLevel } from './forge.js';

  var SETTINGS = "settings.json";
  var ASKS = ["ask", "zstd", "lz4", "never"];
  var ORIGINAL = ["on", "off", "ask"];

  // What a stored answer means. Anything that is not one of the three falls back to the default,
  // except the plain tick an older build saved, where false was the answer that kept the folder.
  function normalizeOriginal(saved) {
    return ORIGINAL.includes(saved) ? saved : saved === false ? "off" : "on";
  }
  var savedAsk = loadList(SETTINGS, "settings").forgeAsk;
  var ask = ASKS.includes(savedAsk) ? savedAsk : "ask";
  var savedDelete = loadList(SETTINGS, "settings").forgeKeepOriginal;
  var original = normalizeOriginal(savedDelete);
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

  // The three answers Settings offers: remove the original after a verified pack, keep it, or
  // have the question asked each time the dialog comes up.
  var forgeOriginal = () => original;
  function setForgeOriginal(next) {
    if (!ORIGINAL.includes(next) || next === original) return;
    original = next;
    const { forgeKeepOriginal: _old, ...rest } = settings();
    write(next === "on" ? rest : { ...rest, forgeKeepOriginal: next });
  }

  // The tick the compression dialog opens with: on unless the player said keep it. "ask" has no
  // answer of its own yet, so the question comes up with the on-by-default tick it always had.
  var forgeDeleteOriginal = () => original !== "off";

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
    return { ask, original, remove: original !== "off", level };
  }

export { ASKS, ORIGINAL, forgeAsk, forgeDeleteOriginal, forgeLevel, forgeOriginal, normalizeOriginal, setForgeAsk, setForgeLevel, setForgeOriginal, useForgeState };
