// What the compression dialog offers: the six formats the engine converts fastest at, plus a
// custom level stepped with the pad so no invalid number can ever be typed or sent. Every level
// here is inside the engine's own ranges, checked again before the request leaves the app.

import { validLevel } from '../state/forge.js';

  // zstd 1-22, LZ4 0 or 3-12: the presets sit where the size gained per minute still makes sense.
  var PRESETS = [
    { mode: "zstd", level: 9, name: "balanced", recommended: true },
    { mode: "zstd", level: 5, name: "fast" },
    { mode: "zstd", level: 19, name: "max" },
    { mode: "lz4", level: 0, name: "fast" },
    { mode: "lz4", level: 9, name: "balanced" },
    { mode: "lz4", level: 12, name: "max" }
  ];

  // The packed game goes in a new folder beside the one it came from: the same drive (so the
  // space check means something) and never over the source itself.
  var outputFor = (folder) => `${folder}.packed`;

  // The drive a path sits on, for the free-space check: the console's data, or a plugged drive.
  var ROOT = /^\/(?:data|mnt\/(?:usb|ext)\d+)/;
  var rootOf = (path) => ROOT.exec(path)?.[0] ?? "";

  // One step with the pad. LZ4 has no 1 or 2, so those two are stepped over rather than offered.
  function stepLevel(mode, level, delta) {
    const next = level + delta;
    if (mode === "lz4") {
      if (next <= 0) return 0;
      if (next < 3) return delta > 0 ? 3 : 0;
      return Math.min(12, next);
    }
    return Math.max(1, Math.min(22, next));
  }

  function levelValid(mode, level) {
    return validLevel(mode, level);
  }

export { PRESETS, levelValid, outputFor, rootOf, stepLevel };
