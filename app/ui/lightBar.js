// ../pub-game-store/native/ui/lightBar.js
// reconstructed from the esbuild bundle in eboot.bin
// MODIFIED: the cover light is a setting, on unless the player turns it off in Settings — off,
// the bar goes dark instead of following the covers, and comes back the moment it is turned on.

import { useEffect, useState } from 'react';
import { loadList, saveList } from '../state/saved.js';
import { Controller, Image } from '@ps5-react/core';

  var NEUTRAL = "#ffffff";
  var OFF = "#000000";
  var colors2 = /* @__PURE__ */ new Map();
  var owner = null;
  var lastLight = null;
  var resetting = null;
  var RESET_DELAY_MS = 250;
  var LIGHT_DELAY_MS = 150;
  var lighting = null;
  var SETTINGS = "settings.json";
  // Kept in settings.json beside the vibration: only "off" is written, so a fresh install lights
  // the bar the way it always did. The choice takes effect at once, no restart.
  var lightBarOn = loadList(SETTINGS, "settings").lightBar !== false;
  var listeners = /* @__PURE__ */ new Set();
  var colorOf = (uri) => {
    if (!colors2.has(uri)) colors2.set(uri, Image.getColor(uri).catch(() => null));
    return colors2.get(uri);
  };
  function lightGame(key, game) {
    owner = key;
    lastLight = { key, game };
    clearTimeout(resetting);
    clearTimeout(lighting);
    if (!lightBarOn) {
      Controller.setLightBar(OFF);
      return;
    }
    if (!game.art.cover) {
      Controller.setLightBar(NEUTRAL);
      return;
    }
    lighting = setTimeout(() => void colorOf(game.art.cover).then((color) => {
      // The setting can be switched off while the color is still being read: without this check
      // the answer would light the bar again after setLightBarEnabled turned it dark.
      if (owner !== key || !lightBarOn) return;
      Controller.setLightBar(color ?? NEUTRAL);
    }), LIGHT_DELAY_MS);
  }
  function unlight(key) {
    if (owner !== key) return;
    owner = null;
    lastLight = null;
    clearTimeout(resetting);
    resetting = setTimeout(() => {
      if (owner === null) {
        if (lightBarOn) Controller.resetLightBar();
        else Controller.setLightBar(OFF);
      }
    }, RESET_DELAY_MS);
  }
  function setLightBarEnabled(on) {
    lightBarOn = on;
    const { lightBar, ...settings } = loadList(SETTINGS, "settings");
    saveList(SETTINGS, "settings", on ? settings : { ...settings, lightBar: false });
    for (const listener of listeners) listener(on);
    clearTimeout(resetting);
    clearTimeout(lighting);
    if (!on) {
      Controller.setLightBar(OFF);
      return;
    }
    // Back on: the card still under the cursor is lit again at once, or the bar returns to what
    // the system itself would show.
    if (owner && lastLight) lightGame(lastLight.key, lastLight.game);
    else Controller.resetLightBar();
  }
  function useLightBarEnabled() {
    const [on, setOn] = (0, useState)(lightBarOn);
    (0, useEffect)(() => {
      listeners.add(setOn);
      return () => {
        listeners.delete(setOn);
      };
    }, []);
    return on;
  }

export { lightGame, setLightBarEnabled, unlight, useLightBarEnabled };
