// Starting one pack job, shared by the dialog after a download and by the offer in the toast:
// ask the engine whether it is there, start the job over the folder, remember the format and the
// answer about the original. Returns null on success, or the error code the screens translate.

import { setForgeDeleteOriginal, setForgeLevel } from '../state/forge-ask.js';
import { forgeEngine } from '../state/forge-live.js';
import { outputFor } from './options.js';

  async function startPack({ folder, mode, level, deleteAfter = false }) {
    try {
      const status = await forgeEngine().probe();
      if (status.state !== "up") {
        if (status.state === "stopping") return "stopping";
        return /^(?:timeout|unreachable)$/.test(status.reason ?? "") ? status.reason : "down";
      }
      await forgeEngine().startJob({ source: folder, output: outputFor(folder), mode, level, deleteAfter });
      setForgeLevel(mode, level);
      setForgeDeleteOriginal(deleteAfter);
      return null;
    } catch (failure) {
      const code = failure?.code ?? failure?.message ?? "unknown";
      return code === "downloads-active" ? "downloads" : code;
    }
  }

  // The code as the player reads it; anything the app has no words for says so plainly.
  function packError(t2, code) {
    const key = `forge.error.${code}`;
    const text = t2(key);
    return text === key ? t2("forge.error.unknown") : text;
  }

export { packError, startPack };
