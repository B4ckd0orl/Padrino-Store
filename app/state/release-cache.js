// ../pub-game-store/native/state/release-cache.js
// reconstructed from the esbuild bundle in eboot.bin

import { releaseSets } from './release-sets.js';

  var KEPT2 = 6;
  function createReleaseCache(read) {
    const games2 = /* @__PURE__ */ new Map();
    return (file) => {
      if (!/^data\/releases\/[a-z0-9%_-]+\.json$/i.test(file)) throw new Error("Invalid release data path.");
      let releases = games2.get(file);
      if (!releases) {
        const parsed = JSON.parse(read(file));
        if (!Array.isArray(parsed)) throw new Error("Invalid release data; rebuild the catalog.");
        // Each source carries its game's title ID (CUSA for PS4, PPSA for PS5): the firmware limit on
        // fake PKGs is the PS5's alone, and a source never says which console it is for.
        const titleId = /([a-z0-9]+)\.json$/i.exec(file)[1].toUpperCase();
        releases = releaseSets(parsed.map((release) => ({ ...release, titleId })));
        if (games2.size === KEPT2) games2.delete(games2.keys().next().value);
      }
      games2.delete(file);
      games2.set(file, releases);
      return releases;
    };
  }

export { createReleaseCache };
