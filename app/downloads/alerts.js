// ../pub-game-store/native/downloads/alerts.js
// reconstructed from the esbuild bundle in eboot.bin

import { explainError } from './errors.js';
import { t } from '../i18n/core.js';
import { COMPLETE } from '../state/download-queue.js';
import { FileSystem } from '@ps5-react/core';
import { compressibleFolder } from './forge-eligible.js';

  function alertsBetween(previous, jobs, fs = FileSystem) {
    const before = new Map(previous.map((job2) => [job2.id, job2.state]));
    const alerts = [];
    for (const job2 of jobs) {
      const was = before.get(job2.id);
      if (was === void 0 || was === job2.state) continue;
      if (COMPLETE.includes(job2.state) && !COMPLETE.includes(was)) {
        alerts.push({ kind: "complete", title: job2.title, gameId: job2.gameId, message: t("downloads.notice.complete"), folder: compressibleFolder(job2, fs) });
      } else if (job2.state === "extracted" && was !== "extracted" && COMPLETE.includes(was)) {
        // An extraction that lands while the job already counted as complete in another state
        // (restored as "downloaded", or published straight to "extracted") is the moment the
        // folder to compress exists: without this offer the player would never be asked.
        alerts.push({ kind: "complete", title: job2.title, gameId: job2.gameId, message: t("downloads.notice.complete"), folder: compressibleFolder(job2, fs) });
      } else if (job2.state === "failed") {
        alerts.push({ kind: "failed", title: job2.title, gameId: job2.gameId, message: explainError(job2.error, Boolean(job2.release.parts)).title });
      }
    }
    return alerts;
  }

export { alertsBetween };
