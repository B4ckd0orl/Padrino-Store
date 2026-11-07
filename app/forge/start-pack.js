// Starting engine jobs: the pack dialog and the offer in the toast ask whether the compression
// engine is there and start it when it is not (auto-start, with the program the update feed
// pins), and the jobs a restart interrupted come back the same way (recovery). Starting a pack
// remembers the format and the answer about the original; it returns null on success, or the
// error code the screens translate.

import { Downloads, FileSystem, Http, Platform, Payloads } from '@ps5-react/core';
import { setForgeDeleteOriginal, setForgeLevel } from '../state/forge-ask.js';
import { forgeEngine } from '../state/forge-live.js';
import { createAutoStart } from './auto-start.js';
import { createRecovery } from './recovery.js';
import { outputFor } from './options.js';

  let starter;
  // The engine's own program, wired to the console's modules once: one flight of auto-start and
  // one set of files on disk however many screens ask at the same time.
  function autoStart() {
    return starter ?? (starter = createAutoStart({
      engine: forgeEngine(),
      fs: FileSystem,
      downloads: Downloads,
      http: Http,
      platform: Platform,
      payloads: Payloads
    }));
  }

  let recovery;
  function lostJobs() {
    return recovery ?? (recovery = createRecovery({ fs: FileSystem, engine: forgeEngine() }));
  }

  // Makes sure the engine runs: null when it does, or the code to show. `preparing` is called
  // once it is clear the engine has to be started, so a screen can say so while it happens.
  function ensureEngine(options) {
    return autoStart().ensureEngine(options);
  }

  // Resumes the jobs a restart interrupted: called after every poll that reaches the engine,
  // which is the first moment we know it is back. Resolves to {resumed, notices}.
  function recoverInterrupted() {
    return lostJobs().recover();
  }

  async function startPack({ folder, mode, level, deleteAfter = false, preparing }) {
    try {
      const code = await ensureEngine({ preparing });
      if (code) return code;
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

export { ensureEngine, packError, recoverInterrupted, startPack };
