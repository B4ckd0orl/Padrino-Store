#!/usr/bin/env node
// Imports game links (and brand-new titles) from a complementary catalogue feed.
// The feed ships encrypted (AES-256-GCM envelope, magic ORBITENC) as scraping
// resistance only; the distributed key is public in the upstream GPL source.
// This tool downloads the feed, unseals it, and merges useful sources into our data.
//
// Usage:
//   node tools/catalog-import.mjs               # dry run: report what would change
//   node tools/catalog-import.mjs --verify      # verify archive.org candidates (paced), no writes
//   node tools/catalog-import.mjs --apply       # verify any missing candidates, then write data
//   node tools/catalog-import.mjs --apply --skip-verify   # trust the feed's own archive.org checks
//   node tools/catalog-import.mjs --limit N     # verify/apply only the first N archive.org candidates (testing)
//
// Import policy:
//   - archive.org rows: imported only after OUR metadata+range check passes (their collections
//     are partially restricted; 401/403 items are skipped).
//   - vikingfile/akirabox rows: imported when the feed's own verification recorded HTTP 200
//     (those hosts cannot be probed with a plain HTTP request).
//   - URLs already present in our releases are skipped.
//   - New titles get a catalog entry (metadata from the feed's merged rows) + a releases file.

import { createDecipheriv, createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const RELEASES = join(ROOT, "app", "data", "releases");
const CATALOG = join(ROOT, "app", "data", "catalog.js");
const FEED_URL = "https://raw.githubusercontent.com/saawant12/orbit-store-ps5/main/catalogue-v7.enc";
const TMP = join(tmpdir(), "padrino-catalog");
const ENC_PATH = join(TMP, "catalogue.enc");
const CACHE_PATH = join(TMP, "verify-cache.json");
const REPORT_PATH = join(TMP, "import-report.json");

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const VERIFY = args.includes("--verify") || APPLY;
const SKIP_VERIFY = args.includes("--skip-verify");
const LIMIT = parseInt(args[args.indexOf("--limit") + 1]) || Infinity;
// Optional: decrypted releases envelope (from the upstream source bundle) — its rows
// carry the per-source `verification` block that the public feed omits. Merged by row id.
const RELEASES_ENC = args.includes("--releases") ? args[args.indexOf("--releases") + 1] : null;

// Upstream catalogue envelope key (scraping-resistance only, declared not a secret).
const FEED_KEY = Buffer.from([
  0x21, 0x43, 0x26, 0x3b, 0x71, 0x6b, 0x06, 0xec, 0x56, 0x5d, 0x04, 0x7a, 0x8c, 0x37, 0x0d, 0xa7,
  0xe5, 0xd9, 0x69, 0x09, 0x75, 0x74, 0x8e, 0x83, 0x6e, 0xd9, 0x2c, 0x66, 0x43, 0x41, 0xf6, 0xac,
]);
const HEADER = 24;
const TAG = 16;

function unseal(buf) {
  if (buf.subarray(0, 8).toString() !== "ORBITENC") throw new Error("Not a catalogue envelope");
  if (buf[10] !== 1) throw new Error(`Unexpected purpose ${buf[10]}`);
  const d = createDecipheriv("aes-256-gcm", FEED_KEY, buf.subarray(12, HEADER));
  d.setAAD(buf.subarray(0, HEADER));
  d.setAuthTag(buf.subarray(buf.length - TAG));
  return Buffer.concat([d.update(buf.subarray(HEADER, buf.length - TAG)), d.final()]);
}

async function loadCatalogue() {
  mkdirSync(TMP, { recursive: true });
  if (!existsSync(ENC_PATH)) {
    const res = await fetch(FEED_URL);
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
    writeFileSync(ENC_PATH, Buffer.from(await res.arrayBuffer()));
  }
  const feed = JSON.parse(unseal(readFileSync(ENC_PATH)).toString());
  if (RELEASES_ENC) {
    const rich = JSON.parse(readFileSync(RELEASES_ENC, "utf8"));
    const byId = new Map(rich.map((r) => [r.id, r]));
    let merged = 0;
    for (const row of feed.releases) {
      const full = byId.get(row.id);
      if (full?.verification) {
        row.verification = full.verification;
        merged++;
      }
    }
    console.log(`Merged verification blocks from releases envelope (${merged}/${feed.releases.length} rows)`);
  }
  return feed;
}

const norm = (u) => (u || "").replace(/\/+$/, "").toLowerCase();
const md5 = (s) => createHash("md5").update(s).digest("hex");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sourceId(url) {
  return `r${md5(url).slice(0, 12)}`;
}

const HOSTS = {
  archive: { match: (h) => h === "archive.org" || h.endsWith(".archive.org"), provider: "Archive.org", flow: "direct" },
  vikingfile: { match: (h) => h === "vikingfile.com" || h.endsWith(".vikingfile.com") || h === "vik1ngfile.site", provider: "VikingFile", flow: "vikingfile" },
  akirabox: { match: (h) => h === "akirabox.com" || h.endsWith(".akirabox.com") || h === "akirabox.to", provider: "AkiraBox", flow: "browser" },
};

function classify(url) {
  let host;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  for (const [key, spec] of Object.entries(HOSTS)) {
    if (spec.match(host)) return { key, provider: spec.provider, flow: spec.flow };
  }
  return null;
}

function mapFormat(row) {
  const ext = /(?:^|\.)([a-z0-9]+)$/i.exec(row.filename || "")?.[1]?.toLowerCase();
  const byExt = { ffpfsc: "ffpfsc", ffpfs: "ffpfs", ffpkg: "ffpkg", exfat: "exfat", pkg: "pkg", fpkg: "fpkg", zip: "zip", rar: "rar", "7z": "7z" };
  if (ext && byExt[ext]) return byExt[ext];
  const byFeed = { exfat: "exfat", ffpfsc: "ffpfsc", pkg: "pkg", fpkg: "fpkg" };
  const raw = (row.format || "").toLowerCase();
  if (byFeed[raw]) return byFeed[raw];
  if (raw === "game folder") return "zip";
  return "binary";
}

function toSource(row, platform, live) {
  const cls = classify(row.__direct ? row.verification.url : row.url);
  const format = mapFormat(row);
  const out = {
    id: sourceId(row.__direct ? row.verification.url : row.url),
    format,
    filename: row.filename || `${row.titleId}-${sourceId(row.url)}.${format}`,
    url: row.__direct ? row.verification.url : row.url,
  };
  if (row.__direct) {
    out.requiresBrowser = false;
  } else if (cls.key === "vikingfile") {
    out.browserUrl = row.url;
    out.requiresBrowser = true;
  } else if (cls.key === "akirabox") {
    out.requiresBrowser = true;
  } else {
    out.requiresBrowser = false;
  }
  out.sizeBytes = row.sizeBytes ?? null;
  out.version = row.version || "";
  out.category = "game";
  out.provider = cls.provider;
  out.source = "catalog-v7";
  out.flow = row.__direct ? "direct" : cls.flow;
  out.label = row.region || "";
  out.platform = platform;
  out.record = "catalog-v7";
  if (live) out.health = "ok";
  return out;
}

// --- archive.org verification (metadata + 16-byte range), paced and cached ---

function cacheLoad() {
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}
function cacheSave(cache) {
  writeFileSync(CACHE_PATH, JSON.stringify(cache));
}

async function archiveCandidate(row) {
  let identifier, filename;
  try {
    const u = new URL(row.url);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0] !== "download" || parts.length < 3) return { verdict: "dead", why: "not a download URL" };
    identifier = decodeURIComponent(parts[1]);
    filename = decodeURIComponent(parts.slice(2).join("/"));
  } catch {
    return { verdict: "dead", why: "bad URL" };
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`, {
        headers: { "User-Agent": "PadrinoStore-CatalogImport/1.0" },
        signal: AbortSignal.timeout(25000),
      });
      if (res.status === 429 || res.status === 503) {
        await sleep(60000 * (attempt + 1));
        continue;
      }
      if (res.status === 404) return { verdict: "dead", why: "item 404" };
      if (!res.ok) return { verdict: "unknown", why: `metadata HTTP ${res.status}` };
      const meta = await res.json();
      if (meta.error || !Array.isArray(meta.files)) return { verdict: "dead", why: meta.error || "no files" };
      const hit = meta.files.find((f) => f.name === filename || decodeURIComponent(f.name) === filename);
      if (!hit) return { verdict: "dead", why: "file not in item" };
      if (hit.private === "1" || meta.access === "restricted") return { verdict: "dead", why: "restricted" };
      break;
    } catch (e) {
      if (attempt === 2) return { verdict: "unknown", why: `metadata ${e.message}` };
      await sleep(5000);
    }
  }
  await sleep(4000);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(row.url, {
        headers: { Range: "bytes=0-15", "User-Agent": "PadrinoStore-CatalogImport/1.0" },
        redirect: "follow",
        signal: AbortSignal.timeout(30000),
      });
      if (res.status === 429 || res.status === 503) {
        await sleep(60000 * (attempt + 1));
        continue;
      }
      await res.arrayBuffer();
      if (res.status === 200 || res.status === 206) {
        const type = res.headers.get("content-type") || "";
        if (/text\/html/i.test(type)) return { verdict: "dead", why: "html response" };
        return { verdict: "live", why: `HTTP ${res.status}` };
      }
      return { verdict: "dead", why: `HTTP ${res.status}` };
    } catch (e) {
      if (attempt === 2) return { verdict: "unknown", why: `range ${e.message}` };
      await sleep(5000);
    }
  }
  return { verdict: "unknown", why: "range retries exhausted" };
}

// --- catalog.js surgery (new entries + provider/direct patches) ---

const escapeAscii = (s) => JSON.stringify(s).replace(/[\u007f-\uffff]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);

function newGameEntry(tid, game, rows, sources) {
  const platform = tid.startsWith("CUSA") ? "ps4" : "ps5";
  const providers = [...new Set(sources.map((s) => (s.provider === "Archive.org" ? "archive.org" : s.provider === "VikingFile" ? "vikingfile" : "akirabox")))].sort();
  const direct = sources.some((s) => s.flow === "direct");
  const genres = (game?.genre || "")
    .split("/")
    .map((g) => g.trim())
    .filter(Boolean);
  const year = game?.releaseDate ? parseInt(game.releaseDate.slice(0, 4), 10) : NaN;
  const maxBytes = Math.max(...rows.map((r) => r.sizeBytes || 0));
  const sizeGb = maxBytes > 0 ? Math.round((maxBytes / 1e9) * 1000) / 1000 : 0;
  const art = {};
  if (game?.cover) art.cover = game.cover;
  if (game?.hero) art.hero = game.hero;
  const entry = {
    id: tid,
    title: game?.title || rows[0]?.title || tid,
    platform,
    providers,
    direct,
    developer: "",
    publisher: game?.publisher || "",
    releaseDate: game?.releaseDate || "",
    genres,
    features: [],
    recommendations: 0,
    sizeGb,
    art,
  };
  if (!Number.isNaN(year)) entry.year = year;
  return entry;
}

function stringifyEntry(entry) {
  const parts = Object.entries(entry).map(([k, v]) => `${escapeAscii(k)}: ${stringifyValue(v)}`);
  return `{ ${parts.join(", ")} }`;
}
function stringifyValue(v) {
  if (Array.isArray(v)) return `[${v.map(stringifyValue).join(", ")}]`;
  if (v && typeof v === "object") return `{ ${Object.entries(v).map(([k, val]) => `${escapeAscii(k)}: ${stringifyValue(val)}`).join(", ")} }`;
  return escapeAscii(v);
}

function patchCatalogExisting(catText, tid, addProviders, makeDirect) {
  const twinsIdx = catText.indexOf("var twins");
  const closeIdx = catText.lastIndexOf("\n  ];", twinsIdx);
  const gamesHead = catText.slice(0, closeIdx);
  const idToken = `"id": "${tid}"`;
  const at = gamesHead.indexOf(idToken);
  if (at < 0) return { text: catText, patched: false };
  const lineStart = gamesHead.lastIndexOf("\n", at) + 1;
  let lineEnd = gamesHead.indexOf("\n", at);
  if (lineEnd < 0) lineEnd = closeIdx;
  let line = gamesHead.slice(lineStart, lineEnd);
  if (!line.startsWith(`    { "id": "${tid}"`)) return { text: catText, patched: false };
  let changed = false;
  const pm = line.match(/"providers": \[([^\]]*)\]/);
  if (pm) {
    const current = pm[1].trim() ? pm[1].split(",").map((s) => s.trim()) : [];
    const merged = [...current];
    for (const p of addProviders) {
      const q = `"${p}"`;
      if (!merged.includes(q)) {
        merged.push(q);
        changed = true;
      }
    }
    if (changed) line = line.replace(pm[0], `"providers": [${merged.join(", ")}]`);
  }
  if (makeDirect && /"direct": false/.test(line)) {
    line = line.replace(`"direct": false`, `"direct": true`);
    changed = true;
  }
  if (!changed) return { text: catText, patched: false };
  const newText = catText.slice(0, lineStart) + line + catText.slice(lineEnd);
  return { text: newText, patched: true };
}

function appendCatalogGames(catText, entries) {
  const twinsIdx = catText.indexOf("var twins");
  const closeIdx = catText.lastIndexOf("\n  ];", twinsIdx);
  let head = catText.slice(0, closeIdx);
  const tail = catText.slice(closeIdx);
  if (!head.trimEnd().endsWith(",")) head = head.trimEnd() + ",";
  const block = "\n" + entries.map((e) => "    " + stringifyEntry(e)).join(",\n");
  return head + block + tail;
}

// --- main ---

async function main() {
  console.log(`catalog-import: ${APPLY ? "APPLY" : VERIFY ? "verify" : "dry-run"}${SKIP_VERIFY ? " (skip verify)" : ""}${Number.isFinite(LIMIT) ? ` limit=${LIMIT}` : ""}`);
  const catalogue = await loadCatalogue();
  const rows = catalogue.releases;
  console.log(`Feed: revision ${catalogue.revision}, ${rows.length} release rows`);

  const ourFiles = readdirSync(RELEASES).filter((f) => f.endsWith(".json"));
  const ourIds = new Set(ourFiles.map((f) => f.replace(/\.json$/, "")));
  const ourUrls = new Set();
  const ourSourcesById = new Map();
  for (const f of ourFiles) {
    const id = f.replace(/\.json$/, "");
    const arr = JSON.parse(readFileSync(join(RELEASES, f), "utf8"));
    ourSourcesById.set(id, arr);
    for (const s of arr) if (s.url) ourUrls.add(norm(s.url));
  }
  const gamesById = new Map();
  for (const r of rows) {
    if (r.gameId && !gamesById.has(r.gameId)) gamesById.set(r.gameId, r);
  }

  const byTitle = new Map();
  let skippedDup = 0;
  for (const r of rows) {
    if (!r.url || !r.titleId) continue;
    if (ourUrls.has(norm(r.url))) {
      skippedDup++;
      continue;
    }
    const cls = classify(r.url);
    if (!cls) continue;
    if (!byTitle.has(r.titleId)) byTitle.set(r.titleId, []);
    byTitle.get(r.titleId).push(r);
  }
  console.log(`Candidates: ${[...byTitle.values()].reduce((n, a) => n + a.length, 0)} rows across ${byTitle.size} titles (skipped ${skippedDup} duplicate URLs)`);

  const cache = cacheLoad();
  const archiveRows = [];
  for (const [tid, list] of byTitle) {
    for (const r of list) {
      if (classify(r.url).key === "archive") archiveRows.push({ tid, row: r });
    }
  }
  const toVerify = archiveRows.filter(({ row }) => {
    const c = cache[norm(row.url)];
    return !c || c.verdict === "unknown";
  });
  console.log(`archive.org candidates: ${archiveRows.length} total, ${toVerify.length} unverified (cache: ${Object.keys(cache).length})`);
  if (VERIFY && !SKIP_VERIFY && toVerify.length) {
    const batch = Number.isFinite(LIMIT) ? toVerify.slice(0, LIMIT) : toVerify;
    let done = 0;
    const started = Date.now();
    for (const { row } of batch) {
      const verdict = await archiveCandidate(row);
      cache[norm(row.url)] = { ...verdict, at: new Date().toISOString() };
      cacheSave(cache);
      done++;
      if (done % 5 === 0 || done === batch.length) {
        const eta = Math.round(((Date.now() - started) / done) * (batch.length - done) / 60000);
        console.log(`  verified ${done}/${batch.length} (live=${Object.values(cache).filter((c) => c.verdict === "live").length} dead=${Object.values(cache).filter((c) => c.verdict === "dead").length} unknown=${Object.values(cache).filter((c) => c.verdict === "unknown").length}) eta≈${eta}m`);
      }
      await sleep(1500);
    }
  }

  const importsByTitle = new Map();
  const stats = { archiveLive: 0, archiveDead: 0, archiveUnknown: 0, vikingDirect: 0, viking: 0, vikingUnverified: 0, akira: 0 };
  const VIKING_DIRECT = /^https:\/\/(?:www\.)?(?:vikingfile\.com|vik1ngfile\.site)\/d\//i;
  for (const [tid, list] of byTitle) {
    const existing = ourSourcesById.get(tid);
    const liveCount = existing ? existing.filter((s) => !s.unavailableReason).length : 0;
    const allowUnverified = !existing || liveCount === 0;
    const accepted = [];
    const usedDirect = new Set();
    for (const r of list) {
      const cls = classify(r.url);
      if (cls.key === "archive") {
        if (SKIP_VERIFY) {
          if (r.verification?.httpStatus === 200) {
            accepted.push(r);
            stats.archiveLive++;
          } else {
            stats.archiveDead++;
          }
          continue;
        }
        const c = cache[norm(r.url)];
        if (c?.verdict === "live") {
          accepted.push(r);
          stats.archiveLive++;
        } else if (c?.verdict === "dead") stats.archiveDead++;
        else stats.archiveUnknown++;
      } else if (cls.key === "vikingfile") {
        const v = r.verification;
        if (v && [200, 206].includes(v.httpStatus) && v.url && VIKING_DIRECT.test(v.url)) {
          accepted.push({ ...r, __direct: true, filename: v.filename || r.filename, sizeBytes: v.sizeBytes ?? r.sizeBytes });
          usedDirect.add(norm(v.url));
          stats.vikingDirect++;
        } else if (v?.httpStatus) {
          if (!usedDirect.has(norm(v.url || ""))) {
            accepted.push(r);
            stats.viking++;
          }
        } else if (allowUnverified) {
          accepted.push(r);
          stats.vikingUnverified++;
        }
      } else if (cls.key === "akirabox") {
        if (r.verification?.httpStatus === 200) {
          accepted.push(r);
          stats.akira++;
        }
      }
    }
    if (accepted.length) importsByTitle.set(tid, accepted);
  }
  console.log(`Imports: ${importsByTitle.size} titles | archive live=${stats.archiveLive} dead=${stats.archiveDead} unknown=${stats.archiveUnknown}, viking direct=${stats.vikingDirect} page=${stats.viking} unverified=${stats.vikingUnverified}, akirabox=${stats.akira}`);

  const plan = { newSources: new Map(), newGames: [], patchedCatalog: [] };
  for (const [tid, list] of importsByTitle) {
    const platform = tid.startsWith("CUSA") ? "ps4" : "ps5";
    const live = list.some((r) => r.__direct || classify(r.url).key === "archive");
    const sources = list.map((r) => toSource(r, platform, live));
    const existing = ourSourcesById.get(tid);
    if (!existing) {
      const merged = gamesById.get(list[0].gameId);
      const entry = newGameEntry(tid, merged, list, sources);
      plan.newGames.push({ tid, entry, sources, rows: list });
    } else {
      plan.newSources.set(tid, sources);
    }
  }
  console.log(`Plan: ${[...plan.newSources.values()].reduce((n, a) => n + a.length, 0)} sources added to ${plan.newSources.size} existing games, ${plan.newGames.length} new games`);

  const report = {
    stats,
    existingGamesTouched: plan.newSources.size,
    sourcesAdded: [...plan.newSources.values()].reduce((n, a) => n + a.length, 0),
    newGames: plan.newGames.map((g) => ({ tid: g.tid, title: g.entry.title, platform: g.entry.platform, sources: g.sources.length })),
    skippedDup,
    applied: false,
  };

  if (!APPLY) {
    writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
    console.log(`Dry run. Report: ${REPORT_PATH}`);
    console.log("New games sample:", plan.newGames.slice(0, 10).map((g) => `${g.tid} ${g.entry.title} (${g.sources.length})`).join(" | "));
    return;
  }

  let filesWritten = 0;
  for (const [tid, sources] of plan.newSources) {
    const path = join(RELEASES, `${tid}.json`);
    const current = JSON.parse(readFileSync(path, "utf8"));
    const have = new Set(current.map((s) => norm(s.url)));
    const additions = sources.filter((s) => !have.has(norm(s.url)));
    if (!additions.length) continue;
    writeFileSync(path, JSON.stringify([...current, ...additions]));
    filesWritten++;
  }
  for (const g of plan.newGames) {
    writeFileSync(join(RELEASES, `${g.tid}.json`), JSON.stringify(g.sources));
    filesWritten++;
  }
  console.log(`Wrote ${filesWritten} release files`);

  let catText = readFileSync(CATALOG, "utf8");
  for (const [tid, sources] of plan.newSources) {
    const addProviders = [...new Set(sources.map((s) => (s.provider === "Archive.org" ? "archive.org" : s.provider === "VikingFile" ? "vikingfile" : "akirabox")))];
    const makeDirect = sources.some((s) => s.flow === "direct");
    const r = patchCatalogExisting(catText, tid, addProviders, makeDirect);
    catText = r.text;
    if (r.patched) plan.patchedCatalog.push(tid);
  }
  if (plan.newGames.length) catText = appendCatalogGames(catText, plan.newGames.map((g) => g.entry));
  writeFileSync(CATALOG, catText);
  console.log(`catalog.js: ${plan.patchedCatalog.length} entries patched, ${plan.newGames.length} games appended`);

  report.applied = true;
  report.patchedCatalog = plan.patchedCatalog.length;
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`Applied. Report: ${REPORT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
