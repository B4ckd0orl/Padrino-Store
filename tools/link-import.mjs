// Imports catalog data from an external feed directory (a set of JSON files describing
// games, release links and page texts):
//   node tools/link-import.mjs --feed <dir>            # dry run: report what would change
//   node tools/link-import.mjs --feed <dir> --apply    # verify every candidate link, then write
//
// What one run does (every section is additive; nothing the repo already has is removed):
//   1. New titles: feed ids we lack, matched by title. A title we already list under another id
//      enters as a twin edition of it (same work, its own platform); a title we don't have enters
//      as a game. Ids whose only links are dead are skipped and reported.
//   2. Mirror links: feed urls absent from our release files, added to the games that have them.
//   3. Format corrections: a row we store as "binary" whose url the feed knows as an image format
//      (exfat/ffpfsc/ffpfs/ffpkg) gets that format, so the download flow treats it as an image.
//      Rows whose path or label already resolve a format, or whose label claims a package, stay.
//   4. Page texts: a game with an empty or missing page takes the feed's description.
//
// Every written link is verified first with --apply (HEAD for normal hosts, archive.org's
// metadata for its items); a url that does not answer 200/206 is not imported.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const RELEASES = join(ROOT, "app", "data", "releases");
const CATALOG = join(ROOT, "app", "data", "catalog.js");
const PAGES = join(ROOT, "app", "data", "pages");
const REPORT = join(tmpdir(), "link-import-report.json");

const args = process.argv.slice(2);
const FEED = args.includes("--feed") ? args[args.indexOf("--feed") + 1] : null;
const APPLY = args.includes("--apply");
if (!FEED) {
  console.error("usage: node tools/link-import.mjs --feed <dir> [--apply]");
  process.exit(1);
}

const ADDED = "2026-11-20"; // the date a game imported today joins "recently added" with
const DEAD_COLLECTION = "ps4-fpkg-collection"; // known dead collection: never imported

// --- feed ---

function readJson(name, optional = false) {
  try {
    return JSON.parse(readFileSync(join(FEED, name), "utf8"));
  } catch (error) {
    if (optional && !existsSync(join(FEED, name))) return null;
    throw new Error(`${name}: ${error.message}`);
  }
}

const metaByTitleId = new Map(); // per id: title/genre/publisher/dates/art the entries are built from
const rows = []; // unified release rows: {titleId, url, format, filename, ...}
const gamesText = new Map(); // page descriptions: titleId -> description, and title -> description

function rememberMeta(id, meta) {
  if (!id) return;
  const have = metaByTitleId.get(id) ?? {};
  for (const [key, value] of Object.entries(meta)) if (value !== undefined && value !== null && !(value in have)) have[key] = value;
  metaByTitleId.set(id, have);
}

for (const name of ["cat-catalog.json", "cat-catalogue-v2.json", "cat-catalogue-ps4.json", "cat-releases.json"]) {
  const data = readJson(name, true);
  if (!data) continue;
  const list = Array.isArray(data) ? data : data.releases;
  if (!Array.isArray(list)) continue;
  for (const row of list) {
    if (!row || typeof row.url !== "string") continue;
    rows.push(row);
    rememberMeta(row.titleId, {
      title: row.title, genre: row.genre, publisher: row.publisher, releaseDate: row.releaseDate,
      cover: row.cover, hero: row.hero, coverFallback: row.coverFallback, description: row.description,
    });
  }
}

const live = readJson("LIVE-catalog.json", true);
for (const game of live?.games ?? []) {
  rememberMeta(game.id, { title: game.title, cover: game.art?.cover, hero: game.art?.hero });
  for (const row of game.releases ?? []) {
    if (!row || typeof row.url !== "string") continue;
    rows.push({ ...row, titleId: game.id, title: game.title });
  }
}

const pagesText = readJson("cat-games.json", true);
for (const entry of Array.isArray(pagesText) ? pagesText : []) {
  const id = entry?.metadata?.titleId;
  if (id && entry.description) gamesText.set(id, entry.description);
}

// --- our data ---

const { games: ourGames, twins: ourTwins } = await import(new URL("../app/data/catalog.js", import.meta.url));
const entries = [...ourGames, ...ourTwins];
const byId = new Map(entries.map((game) => [String(game.id).toUpperCase(), game]));
const normTitle = (text) =>
  String(text ?? "").toLowerCase().replace(/[^\x20-\x7e]/g, " ").replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(ps4|ps5)\b/g, " ").replace(/\s+/g, " ").trim();
// "same product" for two normalized titles: equal, or one of them adds only edition words
// (remastered, deluxe, ...). A number added is another product ("PaRappa" vs "PaRappa 2",
// "NASCAR 21"), and so is any other extra word ("Green Hell" vs "Green Hell VR"): those enter
// as their own games instead of joining the similar one.
const EDITION_WORDS = new Set(["remastered", "remaster", "deluxe", "premium", "edition", "definitive", "ultimate", "goty"]);
function sameProduct(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const A = a.split(" "), B = b.split(" ");
  for (const [short, long] of [[A, B], [B, A]]) {
    if (!short.length || !long.length) continue;
    let index = 0;
    for (const word of long) if (word === short[index]) index++;
    if (index < short.length) continue;
    const rest = [...long];
    for (const word of short) { const at = rest.indexOf(word); if (at >= 0) rest.splice(at, 1); }
    if (!rest.length) continue;
    if (rest.some((word) => /\d/.test(word))) continue;
    if (rest.every((word) => EDITION_WORDS.has(word))) return true;
  }
  return false;
}

const ourFiles = new Set(readdirSync(RELEASES).filter((name) => name.endsWith(".json")));
const ourRows = new Map(); // id -> rows on disk
const ourUrls = new Set(); // every url we already list, normalized
const norm = (url) => String(url ?? "").replace(/\/+$/, "").toLowerCase();
const host = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } };
const md5 = (value) => createHash("md5").update(value).digest("hex");
const sourceId = (url) => `r${md5(url).slice(0, 12)}`;
for (const name of ourFiles) {
  const id = name.slice(0, -5).toUpperCase();
  let list = [];
  try { list = JSON.parse(readFileSync(join(RELEASES, name), "utf8")); } catch { continue; }
  if (!Array.isArray(list)) continue;
  ourRows.set(id, list);
  for (const row of list) if (row?.url) ourUrls.add(norm(row.url));
}

// --- feed row -> our release row ---

const HOSTS = {
  "vikingfile.com": { provider: "VikingFile", flow: "vikingfile", browser: true },
  "vik1ngfile.site": { provider: "VikingFile", flow: "vikingfile", browser: true },
  "akirabox.com": { provider: "AkiraBox", flow: "akirabox", browser: true },
  "akirabox.to": { provider: "AkiraBox", flow: "akirabox", browser: true },
  "datanodes.to": { provider: "DataNodes", flow: "datanodes", browser: true },
  "datanodes.co": { provider: "DataNodes", flow: "datanodes", browser: true },
  "filekeeper.net": { provider: "filekeeper.net", flow: "browser", browser: true },
  "datavaults.co": { provider: "datavaults.co", flow: "browser", browser: true },
  "rootz.so": { provider: "Rootz", flow: "browser", browser: false },
  "archive.org": { provider: "archive.org", flow: "direct", browser: false },
};

const classify = (url) => {
  const name = host(url);
  if (name === "archive.org" || name.endsWith(".archive.org")) return { provider: "archive.org", flow: "direct", browser: false };
  return HOSTS[name] ?? { provider: name, flow: "browser", browser: true };
};

// The filter's provider tokens are short names ("filekeeper", "rootz.so"): the display provider
// of a row drops its generic suffix so one host is one option in the provider filter.
const providerToken = (provider) => String(provider).toLowerCase().replace(/\.(com|to|net|co)$/, "");

const FORMAT_BY_EXT = { ffpfsc: "ffpfsc", ffpfs: "ffpfs", ffpkg: "ffpkg", exfat: "exfat", pkg: "pkg", fpkg: "fpkg", zip: "zip", rar: "rar", "7z": "7z", lz4: "lz4" };
const mapFormat = (row) => {
  const ext = /(?:^|\.)([a-z0-9]+)$/i.exec(row.filename ?? "")?.[1]?.toLowerCase();
  if (ext && FORMAT_BY_EXT[ext]) return FORMAT_BY_EXT[ext];
  const byFeed = { exfat: "exfat", ffpfsc: "ffpfsc", ffpfs: "ffpfs", ffpkg: "ffpkg", pkg: "pkg", fpkg: "fpkg" };
  const raw = String(row.format ?? "").toLowerCase();
  if (byFeed[raw]) return byFeed[raw];
  if (raw === "game folder") return "zip";
  return "binary";
};

function toSource(row, platform) {
  const cls = classify(row.url);
  const format = mapFormat(row);
  const id = sourceId(row.url);
  // The repo keeps every row's file extension equal to its format (the releases validator checks
  // it): a name with another extension, or none, is rewritten to end in "." + format.
  let base = String(row.filename ?? "").trim() || `${row.titleId ?? platform}-${id}`;
  const dot = base.lastIndexOf(".");
  if (dot > 0 && FORMAT_BY_EXT[base.slice(dot + 1).toLowerCase()] === format) base = base.slice(0, dot);
  else if (dot > 0) base = base.slice(0, dot);
  let filename = `${base}.${format}`;
  if (filename.length > 220) filename = `${base.slice(0, 220 - format.length - 1)}.${format}`;
  const out = {
    id,
    format,
    filename,
    url: row.url,
  };
  if (cls.browser) {
    out.requiresBrowser = true;
    out.browserUrl = row.url;
  } else {
    out.requiresBrowser = false;
  }
  out.sizeBytes = Number.isFinite(row.sizeBytes) ? row.sizeBytes : null;
  out.version = row.version ?? "";
  out.category = "game";
  out.provider = cls.provider;
  out.source = "link-import";
  out.flow = cls.flow;
  out.label = String(row.label ?? "");
  out.platform = platform;
  out.record = "link-import";
  out.health = "ok";
  return out;
}

const platformOf = (id) => (String(id).toUpperCase().startsWith("CUSA") ? "ps4" : "ps5");

// --- candidate rows (skip urls we have, and the known dead collection) ---

const rowsById = new Map();
let skippedDup = 0, skippedDead = 0;
for (const row of rows) {
  const id = String(row.titleId ?? "").toUpperCase();
  if (!id || typeof row.url !== "string") continue;
  if (row.url.includes(DEAD_COLLECTION)) { skippedDead++; continue; }
  if (ourUrls.has(norm(row.url))) { skippedDup++; continue; }
  if (!/^https?:\/\//i.test(row.url)) continue;
  if (!rowsById.has(id)) rowsById.set(id, new Map());
  const perUrl = rowsById.get(id);
  if (!perUrl.has(norm(row.url))) perUrl.set(norm(row.url), row);
}

// Feed ids we lack, matched by product instead of by exact title:
//   - the title is already here on this platform under another id -> its rows join that game
//   - the title is here on the other platform -> a twin edition of it
//   - the title is new here -> a new game
// A duplicate of an id already planned joins that id too, so one product is never two cards.
const missing = [...rowsById.keys()].filter((id) => !byId.has(id) && !ourFiles.has(`${id}.json`));
const pickTarget = (list, key) =>
  [...list].sort((a, b) =>
    Number(normTitle(b.title) === key) - Number(normTitle(a.title) === key) ||
    entries.indexOf(a) - entries.indexOf(b) ||
    Number(typeof b.work === "number") - Number(typeof a.work === "number"))[0];
const plan = { games: [], twins: [], redirects: [] };
const redirectInto = new Map(); // feed id -> the game whose rows take its links
const planned = []; // the new games chosen so far, joinable by ids that arrive later
for (const id of missing.sort()) {
  const list = [...rowsById.get(id).values()];
  const title = metaByTitleId.get(id)?.title ?? list[0]?.title ?? id;
  const key = normTitle(title);
  const platform = platformOf(id);
  const near = entries.filter((game) => sameProduct(key, normTitle(game.title)));
  const here = near.filter((game) => game.platform === platform);
  if (here.length) {
    const target = pickTarget(here, key);
    redirectInto.set(id, target.id);
    plan.redirects.push({ id, title, into: target.id, rows: list.length, why: "already listed here on " + platform });
    continue;
  }
  const joinFeed = planned.filter((game) => sameProduct(key, game.key));
  const joinHere = joinFeed.filter((game) => game.platform === platform);
  if (joinHere.length) {
    const target = joinHere[0];
    for (const row of list) if (!target.list.some((kept) => norm(kept.url) === norm(row.url))) target.list.push(row);
    plan.redirects.push({ id, title, into: target.id, rows: list.length, why: `feed duplicate of ${target.id}` });
    continue;
  }
  const twin = joinFeed[0] ?? (near.length ? pickTarget(near, key) : null);
  if (twin) plan.twins.push({ id, title, key, match: twin, list });
  else {
    const item = { id, title, key, platform, list };
    plan.games.push(item);
    planned.push(item);
  }
}

// Mirror rows for the games we do have, including a redirected id's rows (under its target).
const mirrors = new Map(); // id -> rows
for (const [id, perUrl] of rowsById) {
  const target = redirectInto.get(id) ?? id;
  if (!byId.has(target)) continue;
  const kept = mirrors.get(target) ?? [];
  for (const row of perUrl.values()) {
    if (ourRows.get(target)?.some((own) => norm(own.url) === norm(row.url))) continue;
    if (kept.some((have) => norm(have.url) === norm(row.url))) continue;
    kept.push(row);
  }
  if (kept.length) mirrors.set(target, kept);
}
const mirrorRows = [...mirrors.values()].reduce((sum, list) => sum + list.length, 0);

// The feed's format per url, for the binary -> image correction.
const imageFormatByUrl = new Map();
const IMAGE_FORMATS = new Set(["exfat", "ffpfsc", "ffpfs", "ffpkg"]);
for (const row of rows) {
  if (typeof row.url !== "string") continue;
  const format = String(row.format ?? "").toLowerCase();
  if (IMAGE_FORMATS.has(format) && !imageFormatByUrl.has(norm(row.url))) imageFormatByUrl.set(norm(row.url), format);
}

const FMT_RE = /^(?:ffpfsc|ffpfs|ffpkg|exfat|pkg|fpkg|lz4|zip|rar|7z|tar|tgz)$/i;
const pathFormat = (value) => {
  let path;
  try { path = new URL(value).pathname; } catch { return null; }
  const parts = path.split("/").filter(Boolean);
  for (let index = parts.length - 1; index >= 0; index--) {
    let name = parts[index];
    try { name = decodeURIComponent(name); } catch { /* keep raw */ }
    const ext = /\.([a-z0-9]{1,10})$/i.exec(name)?.[1];
    if (ext && FMT_RE.test(ext)) return ext.toLowerCase();
  }
  return null;
};
const labelFormat = (label) => {
  const text = String(label ?? "");
  const exotic = /\b(ffpfs|ffpkg|exfat|lz4)\b/i.exec(text);
  if (exotic) return exotic[1].toLowerCase();
  return /\.(zip|rar|7z|pkg|tar|tgg|tgz)\b/i.exec(text)?.[1]?.toLowerCase() ?? null;
};
const relabels = []; // {id, url, to, row}: row is the exact object to rewrite — a file can hold
// the same url twice, so looking the row up by url later would mutate the other copy instead.
for (const [id, list] of ourRows) {
  for (const row of list) {
    if (String(row?.format ?? "").toLowerCase() !== "binary" || !row.url) continue;
    if (pathFormat(row.url) || labelFormat(row.label)) continue;
    if (/\bf?pkg\b/i.test(row.label ?? "")) continue;
    const to = imageFormatByUrl.get(norm(row.url));
    if (to) relabels.push({ id, url: row.url, to, row });
  }
}

// --- page texts ---

const normPages = new Map(); // normalized title -> description (titleId missing in pagesText)
for (const [index, entry] of (Array.isArray(pagesText) ? pagesText : []).entries()) {
  if (entry?.description && !entry?.metadata?.titleId && normTitle(entry.title)) normPages.set(normTitle(entry.title), entry.description);
}
const descriptionFor = (game) => gamesText.get(String(game.id).toUpperCase()) ?? normPages.get(normTitle(game.title)) ?? null;
const pagePath = (id) => join(PAGES, `${encodeURIComponent(id)}.json`);
const pageHasContent = (page) =>
  Boolean(page && ((Array.isArray(page.about) && page.about.some((text) => text?.trim())) ||
    (Array.isArray(page.shots) && page.shots.length) || String(page.summary ?? "").trim()));
// One node per paragraph: the engine takes a text whole up to 255 bytes, so a long description
// is split at sentence boundaries into paragraphs that fit.
function paragraphs(description) {
  const out = [];
  for (const sentence of String(description).split(/(?<=[.!?])\s+/)) {
    const words = sentence.split(/\s+/).filter(Boolean);
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (Buffer.byteLength(next, "utf8") > 240) {
        if (current) out.push(current);
        current = word;
      } else current = next;
    }
    if (current) out.push(current);
  }
  return out.filter((text) => text.trim());
}
const pagePlan = [];
for (const game of entries) {
  let current = null;
  try { current = JSON.parse(readFileSync(pagePath(game.id), "utf8")); } catch { current = null; }
  if (pageHasContent(current)) continue;
  const description = descriptionFor(game);
  if (!description) continue;
  pagePlan.push({ id: game.id, title: game.title, about: paragraphs(description) });
}

// --- verification ---

const archiveTarget = (url) => {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    if (parts[0] !== "download" || parts.length < 3) return null;
    return { item: decodeURIComponent(parts[1]), file: decodeURIComponent(parts.slice(2).join("/")) };
  } catch { return null; }
};

async function verify(url) {
  const target = archiveTarget(url);
  if (target) {
    try {
      const response = await fetch(`https://archive.org/metadata/${encodeURIComponent(target.item)}`, {
        headers: { "User-Agent": "PadrinoStore-LinkImport/1.0" },
        signal: AbortSignal.timeout(25000),
      });
      if (response.status === 404) return false;
      if (!response.ok) return null; // unknown: rate limited or transient
      const meta = await response.json();
      if (meta.error || !Array.isArray(meta.files)) return false;
      const hit = meta.files.find((file) => file.name === target.file || decodeURIComponent(file.name) === target.file);
      if (!hit) return false;
      if (hit.private === "1" || meta.access === "restricted") return false;
      return true;
    } catch { return null; }
  }
  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "PadrinoStore-LinkImport/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });
    if (response.status === 200 || response.status === 206) return true;
    if (response.status === 405) { // some hosts reject HEAD: ask for the first bytes instead
      const ranged = await fetch(url, { headers: { Range: "bytes=0-15", "User-Agent": "PadrinoStore-LinkImport/1.0" }, signal: AbortSignal.timeout(20000) });
      await ranged.arrayBuffer();
      return ranged.status === 200 || ranged.status === 206;
    }
    return false;
  } catch { return null; }
}

async function pool(items, worker, size = 6) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

// Only urls that answer 200/206 are imported: a dead one is dropped, an unknown one (timeout,
// rate limit) is skipped too and counted in the report, so a title never enters with a link that
// cannot open.
async function liveOnly(list) {
  const verdicts = await pool(list, (row) => verify(row.url));
  return {
    alive: list.filter((_, index) => verdicts[index] === true),
    unknown: list.filter((_, index) => verdicts[index] === null).length,
  };
}

// --- catalog.js surgery (same shape the catalog keeps: one entry per line) ---

const escapeAscii = (text) => JSON.stringify(text).replace(/[\u007f-\uffff]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
function stringifyValue(value) {
  if (Array.isArray(value)) return `[${value.map(stringifyValue).join(", ")}]`;
  if (value && typeof value === "object") return `{ ${Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => `${escapeAscii(key)}: ${stringifyValue(item)}`).join(", ")} }`;
  return escapeAscii(value);
}
const stringifyEntry = (entry) =>
  `{ ${Object.entries(entry).filter(([, value]) => value !== undefined).map(([key, value]) => `${escapeAscii(key)}: ${stringifyValue(value)}`).join(", ")} }`;

function patchEntryLine(catText, id, mutate) {
  const idToken = `"id": "${id}"`;
  const at = catText.indexOf(idToken);
  if (at < 0) return { text: catText, patched: false };
  const lineStart = catText.lastIndexOf("\n", at) + 1;
  let lineEnd = catText.indexOf("\n", at);
  if (lineEnd < 0) lineEnd = catText.length;
  const line = catText.slice(lineStart, lineEnd);
  if (!line.startsWith(`    { "id": "${id}"`)) return { text: catText, patched: false };
  const next = mutate(line);
  // A mutate that returns null means "nothing to change": the line stays as it is. (Writing it
  // anyway would splice the literal text "null" over the entry.)
  if (next == null || next === line) return { text: catText, patched: false };
  return { text: catText.slice(0, lineStart) + next + catText.slice(lineEnd), patched: true };
}

function patchProviders(catText, id, tokens, direct) {
  return patchEntryLine(catText, id, (line) => {
    let changed = false;
    const providers = line.match(/"providers": \[([^\]]*)\]/);
    if (providers && tokens.length) {
      const current = providers[1].trim() ? providers[1].split(",").map((part) => part.trim()) : [];
      const merged = [...current];
      for (const token of tokens) {
        const quoted = `"${token}"`;
        if (!merged.includes(quoted)) { merged.push(quoted); changed = true; }
      }
      if (changed) line = line.replace(providers[0], `"providers": [${merged.join(", ")}]`);
    }
    if (direct && /"direct": false/.test(line)) {
      line = line.replace(`"direct": false`, `"direct": true`);
      changed = true;
    }
    return changed ? line : null;
  });
}

// An entry whose line carries no "work" cannot join the matched edition's group (editionsOf only
// groups by work): the pair then gets a fresh work number, and the matched line receives it too.
// A line that already carries one reports it (existing) so the twin can join that group instead.
function giveWork(catText, id, work) {
  let existing = null;
  const result = patchEntryLine(catText, id, (line) => {
    if (/"work":/.test(line)) {
      const found = /"work": (\d+)/.exec(line);
      existing = found ? Number(found[1]) : null;
      return null;
    }
    const close = line.lastIndexOf("}");
    if (close < 0) return null;
    const before = line.slice(0, close).replace(/\s*$/, "");
    const suffix = line.slice(close);
    if (before.endsWith("{")) return null;
    return `${before}, "work": ${work} ${suffix}`;
  });
  return { ...result, existing };
}

function appendEntries(catText, block, entriesToAdd) {
  const twinsAt = catText.indexOf("var twins");
  const anchor = block === "twins" ? catText.lastIndexOf("\n  ];") : catText.lastIndexOf("\n  ];", twinsAt);
  let head = catText.slice(0, anchor);
  const tail = catText.slice(anchor);
  if (!head.trimEnd().endsWith(",")) head = head.trimEnd() + ",";
  const lines = entriesToAdd.map((entry) => "    " + stringifyEntry(entry));
  return head + "\n" + lines.join(",\n") + tail;
}

// --- build the entries ---

function buildGameEntry(item, aliveRows) {
  const meta = metaByTitleId.get(item.id) ?? {};
  const sources = aliveRows.map((row) => toSource(row, platformOf(item.id)));
  const title = meta.title ?? item.title;
  const genres = String(meta.genre ?? "").split("/").map((genre) => genre.trim()).filter(Boolean);
  const year = meta.releaseDate ? parseInt(String(meta.releaseDate).slice(0, 4), 10) : NaN;
  const maxBytes = Math.max(0, ...aliveRows.map((row) => Number(row.sizeBytes) || 0));
  const art = {};
  if (meta.cover) art.cover = meta.cover;
  if (meta.coverFallback && meta.cover) art.coverFallbacks = [meta.coverFallback];
  if (meta.hero) art.hero = meta.hero;
  const entry = {
    id: item.id,
    title: title ?? item.id,
    platform: platformOf(item.id),
    providers: [...new Set(sources.map((row) => providerToken(row.provider)))].sort(),
    direct: sources.some((row) => row.flow === "direct"),
    developer: "",
    publisher: String(meta.publisher ?? ""),
    releaseDate: String(meta.releaseDate ?? "").slice(0, 10),
    genres,
    features: [],
    recommendations: 0,
    art,
    added: ADDED,
    source: "link-import",
  };
  if (!Number.isNaN(year)) entry.year = year;
  if (maxBytes > 0) entry.sizeGb = Math.round((maxBytes / 1e9) * 1000) / 1000;
  return { entry, sources };
}

function buildTwinEntry(item, aliveRows, matchEntry) {
  const platform = platformOf(item.id);
  const sources = aliveRows.map((row) => toSource(row, platform));
  const meta = metaByTitleId.get(item.id) ?? {};
  const entry = {
    ...matchEntry,
    id: item.id,
    platform,
    providers: [...new Set(sources.map((row) => providerToken(row.provider)))].sort(),
    direct: sources.some((row) => row.flow === "direct"),
    added: ADDED,
    source: "link-import",
  };
  if (typeof matchEntry.work === "number") entry.work = matchEntry.work;
  else delete entry.work;
  const art = { ...(matchEntry.art ?? {}) };
  if (meta.cover) art.cover = meta.cover;
  if (meta.hero && !art.hero) art.hero = meta.hero;
  if (!art.cover && meta.coverFallback) art.coverFallbacks = [meta.coverFallback];
  entry.art = art;
  return { entry, sources };
}

// --- main ---

async function main() {
  console.log(`link-import: ${APPLY ? "APPLY" : "dry-run"} | feed: ${FEED}`);
  console.log(`feed rows: ${rows.length} | ids: ${rowsById.size} | skipped duplicates: ${skippedDup} | skipped dead collection: ${skippedDead}`);
  console.log(`plan: ${plan.games.length} new games, ${plan.twins.length} twin editions, ${plan.redirects.length} ids whose rows join another game, ${mirrors.size} games with mirror rows (${mirrorRows} rows), ${relabels.length} format corrections, ${pagePlan.length} page texts`);

  const report = {
    mode: APPLY ? "apply" : "dry-run",
    feed: FEED,
    counts: {
      rows: rows.length, newGames: plan.games.length, twins: plan.twins.length, redirects: plan.redirects.length,
      mirrorGames: mirrors.size, mirrorRows, relabels: relabels.length, pages: pagePlan.length,
      skippedDuplicates: skippedDup, skippedDeadCollection: skippedDead,
    },
    newGames: plan.games.map((item) => ({ id: item.id, title: item.title, rows: item.list.length })),
    twins: plan.twins.map((item) => ({ id: item.id, title: item.title, like: item.match.id, platform: platformOf(item.id), rows: item.list.length })),
    redirects: plan.redirects,
    pages: pagePlan.map((page) => `${page.id} | ${page.title}`),
    mirrors: [...mirrors.entries()].map(([id, list]) => ({ id, rows: list.map((row) => `${row.url} | ${row.title ?? ""}`) })),
    applied: false,
  };

  if (!APPLY) {
    writeFileSync(REPORT, JSON.stringify(report, null, 1));
    console.log(`Dry run. Report: ${REPORT}`);
    return;
  }

  // 1. Every candidate link is verified before anything is written.
  const verified = new Map(); // id -> alive rows
  let unknownTotal = 0;
  const wanted = [
    ...plan.games.map((item) => ({ id: item.id, list: item.list })),
    ...plan.twins.map((item) => ({ id: item.id, list: item.list })),
    ...[...mirrors.entries()].map(([id, list]) => ({ id, list })),
  ];
  let done = 0;
  for (const group of wanted) {
    const { alive, unknown } = await liveOnly(group.list);
    unknownTotal += unknown;
    verified.set(group.id, alive);
    done += group.list.length;
    if (done % 40 === 0) console.log(`  verified ${done} urls (kept so far: ${[...verified.values()].reduce((sum, list) => sum + list.length, 0)})`);
  }
  console.log(`verified ${done} urls | unknown skipped: ${unknownTotal}`);

  const newGames = [];
  const twinsToAdd = [];
  const dropped = [];
  const notes = [];
  const builtByPlanId = new Map(); // a planned game's entry: a later twin may join it
  for (const item of plan.games) {
    const alive = verified.get(item.id) ?? [];
    if (!alive.length) { dropped.push(`${item.id} | ${item.title} | no live link`); continue; }
    const built = { item, ...buildGameEntry(item, alive) };
    newGames.push(built);
    builtByPlanId.set(item.id, built.entry);
  }
  for (const item of plan.twins) {
    const alive = verified.get(item.id) ?? [];
    if (!alive.length) { dropped.push(`${item.id} | ${item.title} | no live link`); continue; }
    const plannedMatch = Boolean(item.match.list); // a planned game carries its feed rows; our entries never do
    const matchEntry = plannedMatch ? builtByPlanId.get(item.match.id) : item.match;
    if (plannedMatch && !matchEntry) {
      // The game it was to join kept no live link either: this id's own links stand as their own
      // game, so a working id is not lost to a dead twin target.
      const built = { item, ...buildGameEntry(item, alive) };
      newGames.push(built);
      builtByPlanId.set(item.id, built.entry);
      notes.push(`${item.id} | ${item.title} | join target ${item.match.id} had no live link: kept as its own game`);
      continue;
    }
    twinsToAdd.push({ item, ...buildTwinEntry(item, alive, matchEntry), matchEntry, plannedMatch });
  }
  const mirrorAdditions = [...mirrors.entries()]
    .map(([id, list]) => ({ id, alive: verified.get(id) ?? [] }))
    .filter((group) => group.alive.length);

  // 2. Format corrections first: they rewrite the rows as they are now. The file extension follows
  //    the format (the releases validator checks extension === format), so ".binary" becomes the
  //    image extension the feed knows the url by.
  const touchedRelabel = new Set();
  for (const relabel of relabels) {
    const list = ourRows.get(relabel.id);
    // The row object itself, never a lookup by url: the same url twice in one file would make a
    // search rewrite the other copy (once already correct, so nothing at all would change).
    const row = relabel.row;
    if (!list || !list.includes(row)) continue;
    row.format = relabel.to;
    const name = String(row.filename ?? "");
    const lower = name.toLowerCase();
    if (lower.endsWith(".binary")) row.filename = `${name.slice(0, -7)}.${relabel.to}`;
    else if (lower === "binary") row.filename = `${relabel.id}.${relabel.to}`;
    else if (name && !lower.endsWith(`.${relabel.to}`)) {
      const dot = name.lastIndexOf(".");
      row.filename = `${dot > 0 ? name.slice(0, dot) : name}.${relabel.to}`;
    }
    touchedRelabel.add(relabel.id);
  }
  for (const id of touchedRelabel) writeFileSync(join(RELEASES, `${id}.json`), JSON.stringify(ourRows.get(id)));

  // 3. Mirror rows appended to the games that have them (existing rows untouched).
  const providerPatches = [];
  let rowsWritten = 0;
  for (const group of mirrorAdditions) {
    const have = new Set((ourRows.get(group.id) ?? []).map((row) => norm(row.url)));
    const game = byId.get(group.id);
    const platform = game?.platform ?? platformOf(group.id);
    const additions = group.alive.map((row) => toSource(row, platform)).filter((row) => !have.has(norm(row.url)));
    if (!additions.length) continue;
    const list = [...(ourRows.get(group.id) ?? []), ...additions];
    ourRows.set(group.id, list);
    writeFileSync(join(RELEASES, `${group.id}.json`), JSON.stringify(list));
    rowsWritten += additions.length;
    // The provider filter walks an entry's providers: only an entry that keeps one lists gains
    // one (an entry with none is the pattern whose sources are its release file alone).
    if (game && Array.isArray(game.providers) && game.providers.length) {
      providerPatches.push({
        id: group.id,
        tokens: [...new Set(additions.map((row) => providerToken(row.provider)))].filter((token) => !game.providers.includes(token)),
        direct: additions.some((row) => row.flow === "direct"),
      });
    }
  }

  // 4. New games and twin editions: release files, then their catalog lines.
  for (const added of [...newGames, ...twinsToAdd]) {
    writeFileSync(join(RELEASES, `${added.item.id}.json`), JSON.stringify(added.sources));
    ourRows.set(added.item.id, added.sources);
  }

  // 5. Page texts for pages with nothing in them.
  let pagesWritten = 0;
  for (const page of pagePlan) {
    const path = pagePath(page.id);
    let current = null;
    try { current = JSON.parse(readFileSync(path, "utf8")); } catch { current = null; }
    if (pageHasContent(current)) continue;
    const value = { about: page.about, shots: current?.shots ?? [], summary: current?.summary ?? "" };
    writeFileSync(path, JSON.stringify(value));
    pagesWritten++;
  }

  // 6. catalog.js in one pass: providers for mirrored games, work for the matched editions of a
  //    twin pair that had none, then the new lines in their blocks.
  let catText = readFileSync(CATALOG, "utf8");
  let patched = 0;
  for (const patch of providerPatches) {
    const result = patchProviders(catText, patch.id, patch.tokens, patch.direct);
    catText = result.text;
    if (result.patched) patched++;
  }
  let worksGiven = 0;
  const usedWork = new Set(entries.map((game) => game.work).filter((work) => typeof work === "number"));
  let nextWork = Math.max(0, ...usedWork) + 1;
  for (const added of twinsToAdd) {
    if (typeof added.entry.work === "number") continue;
    if (added.plannedMatch) {
      // Both lines are appended in this run: the pair takes one fresh group number in memory,
      // no line to patch (the target line does not exist in the file yet).
      const work = nextWork++;
      added.entry.work = work;
      added.matchEntry.work = work;
      worksGiven++;
      continue;
    }
    const result = giveWork(catText, added.item.match.id, nextWork);
    if (result.existing != null) {
      // The matched line already carries a group number: the twin joins it (a fresh one would
      // leave the pair ungrouped).
      added.entry.work = result.existing;
      worksGiven++;
    } else if (result.patched) {
      catText = result.text;
      added.entry.work = nextWork;
      worksGiven++;
      nextWork++;
    }
  }
  const gamesWritten = newGames.map((added) => added.entry);
  const twinsWritten = twinsToAdd.map((added) => added.entry);
  if (gamesWritten.length) catText = appendEntries(catText, "games", gamesWritten);
  if (twinsWritten.length) catText = appendEntries(catText, "twins", twinsWritten);
  writeFileSync(CATALOG, catText);

  report.applied = true;
  report.dropped = dropped;
  report.notes = notes;
  report.result = {
    newGames: newGames.length, twins: twinsWritten.length, mirrorRows: rowsWritten,
    mirrorGames: mirrorAdditions.length, providerPatches: patched, workAssigned: worksGiven,
    relabelFiles: touchedRelabel.size, pages: pagesWritten, verifiedUnknown: unknownTotal,
  };
  writeFileSync(REPORT, JSON.stringify(report, null, 1));
  console.log(`Applied: ${JSON.stringify(report.result)}`);
  if (dropped.length) console.log(`Dropped without live links:\n${dropped.join("\n")}`);
  console.log(`Report: ${REPORT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
