// Padrino Store — background music: "Morning Coffee" by HoliznaCC0 (CC0 1.0 Universal).
// Source: https://freemusicarchive.org/track/morning-coffee — public domain, no attribution required.
// Plays via <Video> (audio-only, repeat). Must stay mounted: unmounting closes the player.
// MODIFIED: the music is a setting, on unless the player turns it off in Settings — while it is
// off the player never mounts, which is exactly how the music stops.

import { useEffect, useState } from 'react';
import { jsx } from 'react/jsx-runtime';
import { Video } from '@ps5-react/core';
import { loadList, saveList } from '../state/saved.js';

  var BGM_SOURCE = "/app0/assets/bgm/morning-coffee.mp3";
  var BGM_VOLUME = 0.22;
  // Kept in settings.json beside the vibration: only "off" is written, so a fresh install plays
  // the music the way it always did. The choice takes effect at once, no restart.
  var SETTINGS = "settings.json";
  var bgmOn = loadList(SETTINGS, "settings").bgm !== false;
  var listeners = /* @__PURE__ */ new Set();
  function setBgm(on) {
    bgmOn = on;
    const { bgm, ...settings } = loadList(SETTINGS, "settings");
    saveList(SETTINGS, "settings", on ? settings : { ...settings, bgm: false });
    for (const listener of listeners) listener(on);
  }
  function useBgm() {
    const [on, setOn] = (0, useState)(bgmOn);
    (0, useEffect)(() => {
      listeners.add(setOn);
      return () => {
        listeners.delete(setOn);
      };
    }, []);
    return on;
  }
  function Bgm() {
    const on = useBgm();
    if (!on) return null;
    return /* @__PURE__ */ (0, jsx)(Video, {
      source: BGM_SOURCE,
      repeat: true,
      volume: BGM_VOLUME,
      muted: false,
      audio: true,
      style: { width: 1, height: 1, opacity: 0, position: "absolute", top: 0, left: 0 }
    });
  }

export { Bgm, setBgm, useBgm };
