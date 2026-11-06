// The compression engine: a program the console runs on its own at 127.0.0.1:8095
// that packs a game folder into zstd or LZ4 chunks the runtime reads in place, and unpacks it
// back. The store only talks to it over HTTP: ask whether it runs, start one job, poll progress,
// remember what was started. No UI here -- screens wire these calls in a later phase.
//
// The engine's own level ranges are checked before any request leaves the app: zstd 1-22, LZ4 0
// (fast path) or 3-12 (high compression). Every failure carries an error.code the UI translates:
// "level", "downloads-active", "duplicate", "stopping", "body", "saturated", "reading", "busy",
// "timeout", "unreachable".

import { readJSON } from './read-json.js';

  const BASE = "http://127.0.0.1:8095";
  const SESSION_TIMEOUT_MS = 1500;
  const CALL_TIMEOUT_MS = 5e3;
  // What forge.json keeps: every running job plus the most recent finished ones, so neither the
  // file nor the heap grows without bound however many games are compressed over a year.
  const KEEP_FINISHED = 16;

  // A wait with a handle: the race cancels it when the answer wins, so a fast reply never leaves
  // a timer holding the process open.
  function timer(ms) {
    let handle;
    const promise = new Promise((resolve) => {
      handle = setTimeout(() => resolve(true), ms);
    });
    return { promise, cancel: () => clearTimeout(handle) };
  }

  // A signal in the shape the native Http accepts; ask() aborts the in-flight request with it when
  // the timeout wins, so a hung engine does not leave a socket behind either.
  function abortable() {
    const listeners = new Set();
    const signal = {
      aborted: false,
      addEventListener: (_type, fn) => listeners.add(fn),
      removeEventListener: (_type, fn) => listeners.delete(fn)
    };
    return {
      signal,
      abort: () => {
        signal.aborted = true;
        for (const fn of listeners) fn();
        listeners.clear();
      }
    };
  }

  function codedError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  // The engine's refusals, mapped to codes the UI can translate. The status decides the common
  // cases (409 stopping, 413 body too large, 429 saturated); a message that names the situation
  // ("2 games are being read") wins over the status it arrived with.
  function forgeError(status, message) {
    const text = String(message ?? "").trim();
    const error = new Error(text || `HTTP ${status}`);
    error.status = status;
    if (/being read|reading or writing/i.test(text)) error.code = "reading";
    else if (status === 413) error.code = "body";
    else if (status === 429) error.code = "saturated";
    else if (status === 409) error.code = "stopping";
    else if (/queued or running|already queued|\bbusy\b/i.test(text)) error.code = "busy";
    else error.code = "http";
    return error;
  }

  // The engine's own ranges: zstd 1-22 (above ~15 the job slows to a crawl for a sliver of extra
  // ratio), LZ4 0 for the fast path or 3-12 for high compression. Validated before any request.
  function validLevel(mode, level) {
    if (mode !== "zstd" && mode !== "lz4") return false;
    if (!Number.isInteger(level)) return false;
    if (mode === "zstd") return level >= 1 && level <= 22;
    return level === 0 || level >= 3 && level <= 12;
  }

  function levelMessage(mode) {
    if (mode === "zstd") return "zstd levels run from 1 to 22.";
    if (mode === "lz4") return "LZ4 levels are 0 or 3 to 12.";
    return `Unknown compression mode: ${mode}.`;
  }

  // The exact job shape the engine's own web UI sends: a folder beside its output, one codec, and
  // the source removal only when the player accepted it (the engine deletes the original only
  // after it has verified the packed result itself).
  function forgeRequest({ source, output, mode, level, deleteAfter = false, fullVerify = false }) {
    const request = {
      source,
      format: "folder",
      output,
      compression_threads: null,
      inner: null,
      remove_backport: false,
      full_verify: !!fullVerify,
      lz4: null
    };
    if (deleteAfter) request.delete_source = true;
    if (mode === "zstd") return { ...request, zstd_pack: true, zstd_level: level };
    return { ...request, lz4: "pack", lz4_level: level, lz4_runtime: "ng" };
  }

  // One engine job as the store sees it: {id, state, progress, done, result, output}. The engine
  // reports done: null while a job runs and {result: {Ok}|{Err}} once it settles.
  function normalizeJob(raw) {
    const done = raw?.done ?? null;
    const result = done?.result ?? null;
    return {
      id: raw?.id ?? null,
      state: done === null ? "running" : result && "Ok" in result ? "done" : "failed",
      progress: {
        stage: String(raw?.progress?.stage ?? ""),
        done: Number(raw?.progress?.done ?? 0),
        total: Number(raw?.progress?.total ?? 0)
      },
      done,
      result,
      output: String(raw?.request?.output ?? ""),
      source: String(raw?.request?.source ?? "")
    };
  }

  // The double gate in front of deleting an original: the player accepted it, the engine reported
  // the job done with Ok, and the packed output is on disk with its index files. A job still
  // running, a failed one, or an output that never appeared leaves the source untouched.
  function deletionGate({ accepted, job, indexes }) {
    if (!accepted) return false;
    if (!job || job.state !== "done") return false;
    if (!job.result || !("Ok" in job.result)) return false;
    return !!indexes;
  }

  function createForge({
    fs,
    http,
    power = { keepAwake() {} },
    stateDir,
    // The console's cores are shared: a download in flight keeps compression waiting.
    activeDownloads = () => false,
    now = Date.now,
    wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  }) {
    const directory = stateDir ?? `${fs.dataDir}/padrino-store`;
    const file = `${directory}/forge.json`;
    let records = load();
    let awake = false;
    // Whatever was still running when the app closed is written back as interrupted right away,
    // so the file on disk never claims more than the next poll can prove.
    if (records.some((job) => job.state === "interrupted")) save();

    function load() {
      const saved = readJSON(
        fs,
        file,
        null,
        (value) => value?.version === 1 && Array.isArray(value.jobs),
        (message) => console.log(`[forge] ${message}`)
      );
      if (!saved) return [];
      // A job that was running when the app closed comes back interrupted: the engine may have
      // finished it or gone down with it, and the next poll tells the two apart.
      return saved.jobs.filter((job) => job && typeof job.source === "string" && typeof job.output === "string").map((job) => ({
        ...job,
        state: job.state === "running" ? "interrupted" : job.state
      }));
    }

    function save() {
      try {
        fs.mkdir(directory, { recursive: true });
        fs.writeFile(`${file}.tmp`, JSON.stringify({ version: 1, jobs: records }), { sync: true });
        fs.rename(`${file}.tmp`, file);
      } catch (error) {
        console.log(`[forge] not saved: ${error.message}`);
      }
    }

    function setAwake(busy) {
      if (busy === awake) return;
      awake = busy;
      power.keepAwake(busy);
    }

    function trim() {
      const finished = records.filter((job) => job.state !== "running");
      if (finished.length <= KEEP_FINISHED) return;
      const drop = new Set(finished.slice(0, finished.length - KEEP_FINISHED));
      records = records.filter((job) => !drop.has(job));
    }

    // One bounded call to the engine. The timeout races the request and then aborts it, so both a
    // silent engine and a fast one leave nothing pending behind them.
    async function ask(route, { method = "GET", body = null, maxBytes = 1024 * 1024, timeoutMs = CALL_TIMEOUT_MS } = {}) {
      const { signal, abort } = abortable();
      const timeout = timer(timeoutMs);
      try {
        const request = http.request(`${BASE}/api/${route}`, {
          method,
          ...body === null ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
          maxBytes,
          signal
        }).then((response) => ({ response }), () => ({ failed: true }));
        const outcome = await Promise.race([request, timeout.promise.then(() => ({ timeout: true }))]);
        if (outcome.timeout) {
          abort();
          throw codedError("timeout", "The compression engine did not answer in time.");
        }
        if (outcome.failed) throw codedError("unreachable", "The compression engine is not responding.");
        const { response } = outcome;
        let data = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }
        if (response.status !== 200) throw forgeError(response.status, data?.error);
        return data;
      } finally {
        timeout.cancel();
      }
    }

    /**
     * Is the engine there? Resolves to {state, version} without ever throwing: "up", "stopping"
     * (it is shutting down), "other" (something else owns the port), or "down" with a reason
     * ("unreachable", "timeout", or "HTTP <status>").
     */
    async function probe({ timeoutMs = SESSION_TIMEOUT_MS } = {}) {
      try {
        const data = await ask("session", { timeoutMs, maxBytes: 64 * 1024 });
        const version = String(data?.version ?? "");
        if (data?.app !== "ps5-dump-forge") return { state: "other", version };
        if (data.stopping !== false) return { state: "stopping", version };
        return { state: "up", version };
      } catch (error) {
        return { state: "down", reason: error.status ? `HTTP ${error.status}` : error.code ?? "unreachable" };
      }
    }

    /**
     * Starts one pack job: {source, output, mode: "zstd" | "lz4", level, deleteAfter}. Refuses a
     * level outside the engine's ranges and a second job over a route one is already running,
     * both before anything goes out. Resolves to {id, request}; the record lands in forge.json.
     */
    async function startJob({ source, output, mode, level, deleteAfter = false, fullVerify = false }) {
      if (!validLevel(mode, level)) throw codedError("level", levelMessage(mode));
      if (activeDownloads()) throw codedError("downloads-active", "A download is running; compression waits for it to finish.");
      const open = records.find((job) => job.state === "running" && (job.source === source || job.output === output));
      if (open) throw codedError("duplicate", `A compression job is already running over ${open.source}.`);
      const request = forgeRequest({ source, output, mode, level, deleteAfter, fullVerify });
      const data = await ask("start_job", { method: "POST", body: { request }, maxBytes: 64 * 1024 });
      const id = data && typeof data === "object" ? data.id ?? null : data ?? null;
      records.push({
        id,
        source,
        output,
        mode,
        level,
        deleteAfter: !!deleteAfter,
        startedAt: now(),
        state: "running",
        result: null
      });
      trim();
      save();
      setAwake(true);
      return { id, request };
    }

    /**
     * The engine's jobs, normalized. Each poll also settles our own records: a job the engine no
     * longer knows becomes "interrupted", a finished one takes the engine's result, and the
     * console stays awake only while something is still running.
     */
    async function jobs() {
      const data = await ask("jobs", { maxBytes: 4 * 1024 * 1024 });
      const list = (Array.isArray(data?.jobs) ? data.jobs : []).map(normalizeJob);
      let changed = false;
      for (const record of records) {
        if (record.state !== "running" && record.state !== "interrupted") continue;
        const live = list.find((job) => job.id !== null && job.id === record.id) ?? list.find((job) => job.source === record.source && job.output === record.output);
        if (!live) {
          // The engine never removes a source before verifying its own output, so an unknown job
          // only costs the claim that it is running -- the files stay as they were.
          if (record.state === "running") {
            record.state = "interrupted";
            changed = true;
          }
        } else if (live.state === "running") {
          // The app closed and reopened while the engine kept packing: the job is running again.
          if (record.state !== "running") {
            record.state = "running";
            changed = true;
          }
        } else {
          record.state = live.state;
          record.result = live.result;
          record.finishedAt = now();
          changed = true;
        }
      }
      if (changed) save();
      setAwake(list.some((job) => job.state === "running") || records.some((job) => job.state === "running"));
      return list;
    }

    /**
     * Polls the engine every intervalMs (2-3 s) and hands the normalized list -- or the failure --
     * to listener. The returned function stops the loop; nothing accumulates between ticks.
     */
    function watch(listener, { intervalMs = 2500 } = {}) {
      let stopped = false;
      (async () => {
        while (!stopped) {
          let list = null;
          let failure = null;
          try {
            list = await jobs();
          } catch (error) {
            failure = error;
          }
          if (stopped) return;
          try {
            if (failure) listener(null, failure);
            else listener(list, null);
          } catch (error) {
            console.log(`[forge] watch listener: ${error.message}`);
          }
          if (!stopped) await wait(intervalMs);
        }
      })().catch(() => {});
      return () => {
        stopped = true;
      };
    }

    return { probe, startJob, jobs, watch, records: () => records.map((job) => ({ ...job })) };
  }

export { createForge, deletionGate, forgeRequest, normalizeJob, validLevel };
