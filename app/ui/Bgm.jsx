// Padrino Store — background music: "Morning Coffee" by HoliznaCC0 (CC0 1.0 Universal).
// Source: https://freemusicarchive.org/track/morning-coffee — public domain, no attribution required.
// Plays via <Video> (audio-only, repeat). Must stay mounted: unmounting closes the player.

import { jsx } from 'react/jsx-runtime';
import { Video } from '@ps5-react/core';

  var BGM_SOURCE = "/app0/assets/bgm/morning-coffee.mp3";
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
