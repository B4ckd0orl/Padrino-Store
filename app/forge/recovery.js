// A job the engine lost -- the app closed, the console relaunched -- comes back from forge.json
// as "interrupted" once a poll proves the engine no longer knows it. What may be done about it
// here: ask the engine to run it again, but only when the files are in the shape a fresh start
// expects. For a pack that means the source folder still there, and its output either gone or
// partial (and only that output folder is cleared, never the source's); an output that already
// carries its pack index is a finished result and stays; for an unpack, which writes back into
// its own folder, nothing is ever cleared. A source is never removed here, by anything.

import { packedFormat } from './detect.js';

  // A refusal that passes on its own: the record stays untried so the next poll may try again.
  // The last three are the engine going away or shutting down between two polls.
  const TRANSIENT = new Set([
    "downloads-active", "duplicate", "busy", "saturated", "reading",
    "unreachable", "timeout", "stopping"
  ]);

  function createRecovery({ fs, engine }) {
    // One attempt per route per session, so a poll every few seconds cannot start the same job
    // twice; a transient refusal above is put back for the next poll to pick up.
    const tried = new Set();

    function keyOf(record) {
      return `${record.action}:${record.source}:${record.output}`;
    }

    async function resume(record) {
      if (record.action === "pack") {
        // What sits in the engine's own output folder is a partial result of this very job:
        // only that folder goes, and only before the job starts over it.
        if (record.output && record.output !== record.source && fs.exists(record.output)) {
          await fs.removeAsync(record.output);
        }
        return engine.startJob({
          source: record.source,
          output: record.output,
          mode: record.mode,
          level: record.level,
          deleteAfter: !!record.deleteAfter
        });
      }
      // An unpack writes back into the folder it reads: there is nothing to clear, ever.
      return engine.unpackJob({ source: record.source, output: record.output, mode: record.mode });
    }

    /**
     * Resumes what can be resumed. Resolves to {resumed, notices} with the records involved:
     * a record without its source, an output that could not be cleared, or an engine refusal
     * lands in notices for the screen to show as forge.auto.interrupted -- the source files
     * themselves are never touched either way.
     */
    async function recover() {
      const resumed = [];
      const notices = [];
      for (const record of engine.records()) {
        if (record.state !== "interrupted") continue;
        if (record.action !== "pack" && record.action !== "unpack") continue;
        const key = keyOf(record);
        if (tried.has(key)) continue;
        if (!record.source || !record.output || !fs.exists(record.source)) {
          tried.add(key);
          notices.push(record);
          continue;
        }
        // An output that already carries its pack index is a finished result, not a partial one
        // of this job: it stays on disk, the job is not run over it, and the screen is told.
        if (record.action === "pack" && record.output !== record.source && fs.exists(record.output) && packedFormat(fs, record.output)) {
          tried.add(key);
          notices.push(record);
          continue;
        }
        try {
          await resume(record);
          tried.add(key);
          resumed.push(record);
        } catch (failure) {
          const code = String(failure?.code ?? "");
          if (!TRANSIENT.has(code)) tried.add(key);
          notices.push(record);
        }
      }
      return { resumed, notices };
    }

    return { recover };
  }

export { createRecovery };
