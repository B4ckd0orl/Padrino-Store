// The compression engine as the app guarantees it: ask whether it is there, and when it is not,
// make sure the engine's own program is on the drive -- fetched from the update feed and matched
// against the SHA-256 that feed pins -- hand it to the payload loader on port 9021, and wait for
// port 8095 to answer. Every failure is a code the screens translate through forge.error.<code>;
// nothing here ever touches a game folder, and nothing runs that the feed did not pin.

  const FEED = "https://api.github.com/repos/B4ckd0orl/Padrino-Store/releases/latest";
  // The same JSON from the release, served from raw.githubusercontent: when api.github.com does
  // not answer from the console (DNS, rate limit, outage), the check still has somewhere to look.
  const FEED_MIRROR = "https://raw.githubusercontent.com/B4ckd0orl/Padrino-Store/main/update-feed.json";
  const PROGRAM = "dumpfolder.elf";
  const ARGS = "/data/dumpforge/args";
  // After the program is handed over, the engine binds its port as it starts: 0.5/1/2/4 s keeps
  // the wait inside ~10 s, and only the probes actually needed are made.
  const BACKOFF_MS = [500, 1000, 2000, 4000];

  function createAutoStart({
    engine,
    fs,
    downloads,
    http,
    platform,
    payloads,
    title = "PPSA99059",
    wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  }) {
    const directory = `${fs.dataDir}/padrino-store`;
    const program = `${directory}/${PROGRAM}`;
    const sidecar = `${program}.json`;
    let flight = null;

    // The feed list the app's own update reads: a local file naming a URL when the console has
    // one, then the release feed, then its mirror.
    function feeds() {
      const overrides = [`${directory}/update-feed`, `/data/ps5-react/${title}/padrino-store/update-feed`];
      const found = overrides.find((path) => {
        try {
          return fs.exists(path);
        } catch {
          return false;
        }
      });
      let first = FEED;
      if (found) {
        try {
          first = fs.readFile(found).trim() || FEED;
        } catch {
          first = FEED;
        }
      }
      return first === FEED_MIRROR ? [first] : [first, FEED_MIRROR];
    }

    // The program this feed pins: {url, size, sha256}, or null when no feed answers with one.
    async function pinned() {
      for (const url of feeds()) {
        try {
          const response = await http.request(url, {
            headers: { Accept: "application/vnd.github+json", "User-Agent": "PadrinoStore" },
            maxBytes: 1024 ** 2
          });
          if (!response.ok) continue;
          const release = await response.json();
          const asset = (release?.assets ?? []).find((item) => item.name === PROGRAM);
          const sha256 = /^sha256:([0-9a-f]{64})$/i.exec(asset?.digest ?? "")?.[1];
          if (asset && sha256) return { url: asset.browser_download_url, size: asset.size, sha256 };
        } catch {
          // The next feed gets its chance; a last failure with no program is reported below.
        }
      }
      return null;
    }

    // A program already verified against this feed's own digest. The sidecar is written only
    // after the download queue says the bytes match the feed, and it is the only local proof
    // available: the runtime has no hashing call, so a file whose sidecar is absent, belongs to
    // another digest, or no longer matches the file's own size is fetched again rather than run.
    function kept(sha256) {
      if (!fs.exists(program)) return false;
      let record = null;
      try {
        record = JSON.parse(fs.readFile(sidecar));
      } catch {
        return false;
      }
      if (record?.sha256 !== sha256) return false;
      try {
        return Number(fs.stat(program)?.size) === Number(record.size);
      } catch {
        return false;
      }
    }

    // The program, on the drive, accounted for by the feed. Codes: "feed" (no feed answers with
    // a pinned program), "integrity" (the bytes did not match the SHA-256), "download".
    async function ensureProgram() {
      const release = await pinned();
      if (!release) return "feed";
      if (kept(release.sha256)) return null;
      // Anything else on disk -- an older program or one this feed does not account for -- goes
      // before the new one arrives. Only this file ever goes; a game folder is never touched.
      try {
        if (fs.exists(program)) fs.remove(program);
      } catch (error) {
        console.log(`[forge] old engine program not removed: ${error.message}`);
      }
      try {
        if (fs.exists(sidecar)) fs.remove(sidecar);
      } catch {}
      try {
        fs.mkdir(directory, { recursive: true });
      } catch {}
      try {
        await downloads.enqueue({
          url: release.url,
          destination: program,
          sha256: release.sha256,
          expectedBytes: release.size,
          rejectHtml: true,
          unlimited: true
        }).done;
      } catch (failure) {
        const text = String(failure?.message ?? failure ?? "");
        return /sha-?256/i.test(text) ? "integrity" : "download";
      }
      // The sidecar goes down only once the queue says the bytes are the feed's own.
      try {
        const { size } = fs.stat(program);
        fs.writeFile(sidecar, JSON.stringify({ sha256: release.sha256, size }), { sync: true });
      } catch (error) {
        console.log(`[forge] engine program sidecar not written: ${error.message}`);
      }
      return null;
    }

    // The engine reads its arguments from this file when it is started without any: naming the
    // command keeps the port it listens on explicit. It defaults to the same command when the
    // file is not there, so a console that refuses this write still starts the engine.
    function writeArgs() {
      try {
        fs.mkdir("/data/dumpforge", { recursive: true });
        fs.writeFile(ARGS, "serve\n", { sync: true });
      } catch (error) {
        console.log(`[forge] engine args not written: ${error.message}`);
      }
    }

    async function run({ preparing } = {}) {
      const status = await engine.probe();
      if (status.state === "up") return null;
      if (status.state === "stopping") return "stopping";
      // Something else owns the port: never hand a program to a console already running one.
      if (status.state === "other") return "down";
      // The preview has no console to run a program on and no loader to hand one to.
      if (platform.OS !== "ps5") return "noPayload";
      if (typeof preparing === "function") preparing();
      const absent = await ensureProgram();
      if (absent) return absent;
      writeArgs();
      try {
        payloads.send({ program, request: "" });
      } catch (failure) {
        const text = String(failure?.message ?? failure ?? "");
        return /payload loader on port 9021|PS5 only/i.test(text) ? "noPayload" : "start";
      }
      // Handed over: now the engine gets its backoff window to bind port 8095, and only a probe
      // that says "up" lets a job be launched.
      for (const backoffMs of BACKOFF_MS) {
        await wait(backoffMs);
        const retry = await engine.probe();
        if (retry.state === "up") return null;
        if (retry.state === "stopping") return "stopping";
        if (retry.state === "other") return "down";
      }
      return "start";
    }

    // One flight at a time: two screens asking together start one engine, not two.
    function ensureEngine(options) {
      if (flight) return flight;
      flight = run(options).finally(() => {
        flight = null;
      });
      return flight;
    }

    return { ensureEngine };
  }

export { createAutoStart };
