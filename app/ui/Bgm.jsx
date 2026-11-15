// Padrino Store — background music: "First Light Particles" by Yoiyami (CC0 1.0 Universal).
// Source: https://opengameart.org/node/182244 — public domain, no attribution required.
// Plays via <Video> (audio-only, repeat). Must stay mounted: unmounting closes the player.

import { jsx } from 'react/jsx-runtime';
import { Video } from '@ps5-react/core';

  var BGM_SOURCE = "/app0/assets/bgm/first-light-particles.mp3";
  var BGM_VOLUME = 0.22;
  function Bgm() {
    return /* @__PURE__ */ (0, jsx)(Video, {
      source: BGM_SOURCE,
      repeat: true,
      volume: BGM_VOLUME,
      muted: false,
      audio: true,
      style: { width: 1, height: 1, opacity: 0, position: "absolute", top: 0, left: 0 }
    });
  }

export { Bgm };
