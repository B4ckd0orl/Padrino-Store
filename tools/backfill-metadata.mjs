#!/usr/bin/env node
// Fills EMPTY catalog metadata from public, keyless sources.
//
// Missing fields in this catalog are real gaps: an empty art.cover renders the
// gray title card, an absent year drops the game out of the year facet, and an
// empty genres array drops it out of the genre facet and the popular rail.
//
// Sources (none needs a credential):
//   - A decoded copy of the local store feed (offline, matched on our own
//     title-id, so no fuzzy logic and no request at all)
//   - PlayStation Store search + product APIs (chihiro, undocumented but public)
//   - Steam Store appdetails (public)
//
// Usage:
//   node tools/backfill-metadata.mjs            # dry run: report what would change
//   node tools/backfill-metadata.mjs --apply    # write app/data/catalog.js
//   node tools/backfill-metadata.mjs --limit N  # only the first N candidates (testing)
//
// Policy:
//   - Only fields that are EMPTY are written. Existing values are never replaced:
//     a store release_date belongs to that listing and often differs from ours on
//     re-releases (Ikaruga, Rogue Galaxy), so an overwrite would corrupt data.
//   - A store row is accepted only on an exact title-id or exact normalized-title
//     match. The store's CUSA is frequently NOT ours (Matterfall: store CUSA07765,
//     catalog CUSA07890), so id alone is not enough and a fuzzy name is never enough.
//   - Store genres pass through GENRES; unmapped values are dropped rather than
//     written, because the catalog facet vocabulary is closed (state/catalog.js
//     SYNONYMS runs over every value at load).
//   - Covers: the store's square tile (image type 10, 1024x1024) or Steam's
//     library_600x900. Both shapes already exist in the catalog.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const CATALOG = join(ROOT, "app", "data", "catalog.js");
const TMP = join(tmpdir(), "padrino-catalog");
const REPORT_PATH = join(TMP, "backfill-report.json");
const CACHE_PATH = join(TMP, "backfill-cache.json");
// Decoded copy of the local store feed. Optional: without it the run just uses
// the network sources. Rows are keyed by the same title-id the catalog uses.
const FEED_PATH = join(tmpdir(), "opencode", "feed.json");

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const LIMIT = parseInt(args[args.indexOf("--limit") + 1], 10) || Infinity;

// Store/Steam genre -> an existing catalog value. Keys are normalized the same
// way normalizeGenre() normalizes the incoming strings.
const GENRES = {
  action: "Action",
  adventure: "Adventure",
  arcade: "Arcade",
  board_game: "Board Game",
  brain_training: "Brain Training",
  casual: "Casual",
  educational: "Educational",
  family: "Family",
  fighting: "Fighting",
  fps: "FPS",
  horror: "Horror",
  indie: "Indie",
  metroidvania: "Metroidvania",
  music: "Music/Rhythm",
  music_rhythm: "Music/Rhythm",
  open_world: "Open World",
  party: "Party",
  platformer: "Platformer",
  puzzle: "Puzzle",
  quiz: "Quiz",
  racing: "Racing",
  retro: "Retro",
  roguelike: "Roguelike",
  role_playing_games: "RPG",
  role_playing_game: "RPG",
  role_playing: "RPG",
  role_playing_game_rpg: "RPG",
  rpg: "RPG",
  run_and_gun: "Run and Gun",
  shooter: "Shooter",
  simulation: "Simulation",
  simulator: "Simulation",
  sport: "Sport",
  sports: "Sport",
  strategy: "Strategy",
  survival: "Survival",
  tactical: "Tactical",
  turn_based: "Turn-Based",
  visual_novel: "Visual Novel",
  massively_multiplayer: "Multiplayer",
  multiplayer: "Multiplayer",
  dungeon_crawler: "Dungeon Crawler",
  driving_racing: "Racing",
  beat_em_up: "Beat 'em Up",
  sci_fi: "Sci-Fi"
};

const PS_TUMBLER = (region, query) =>
  `https://store.playstation.com/store/api/chihiro/00_09_000/tumbler/${region}/18/${encodeURIComponent(query)}`;

const STEAM_SEARCH = (query) =>
  `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&cc=us&l=en`;
const STEAM_APP = (appid) => `https://store.steampowered.com/api/appdetails?appids=${appid}&l=en`;

async function http(url, options = {}, timeout = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json, */*", ...(options.headers || {}) },
      ...options
    });
    return { status: response.status, response };
  } catch (error) {
    return { status: 0, error };
  } finally {
    clearTimeout(timer);
  }
}

async function getJson(url) {
  const { status, response } = await http(url);
  if (status !== 200 || !response) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function pool(items, size, task) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(size, items.length)) }, async () => {
      while (next < items.length) {
        const index = next++;
        out[index] = await task(items[index], index);
      }
    })
  );
  return out;
}

const normalizeTitle = (value) =>
  String(value || "")
    .toLowerCase()
    // Store names mix Cyrillic look-alikes into Latin titles (S.T.A.L.K.E.R.'s
    // "Enhanced"); fold them so an otherwise identical title still matches.
    .replace(/[сеоархуіѕԁɡ]/g, (letter) => CONFUSABLES[letter] || letter)
    .replace(/[®™•·]/g, "")
    .replace(/\b(ps4|ps5|demo|deluxe edition|standard edition|ultimate edition|dx)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "")
    .trim();

const CONFUSABLES = { с: "c", е: "e", о: "o", а: "a", р: "p", х: "x", у: "y", і: "i", ѕ: "s", ԁ: "d", ɡ: "g" };

// A title-id hit alone is not enough: the store reused our PPSA id for a
// neighbouring product (PPSA06092 -> "EA SPORTS WRC 24", PPSA27581 -> "Hellblade").
// Accept an id match when the two titles agree, one is a meaningful prefix of
// the other, or one title's words are all present in the other's - listing titles
// drift by rename and numbering ("SNK Collection" vs "SNK 40th ANNIVERSARY
// COLLECTION", "For The King 2" vs "For the King II") while the id stays ours.
function compatible(a, b) {
  const left = normalizeTitle(a);
  const right = normalizeTitle(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const shorter = Math.min(left.length, right.length);
  if (shorter >= 6 && (left.startsWith(right) || right.startsWith(left))) return true;
  const leftWords = new Set(titleWords(a));
  const rightWords = new Set(titleWords(b));
  const [small, big] = leftWords.size <= rightWords.size ? [leftWords, rightWords] : [rightWords, leftWords];
  if (![...small].every((word) => big.has(word))) return false;
  // A lone word has to be distinctive enough that it cannot swallow another game.
  if (small.size === 1) return [...small][0].length >= 4;
  return shorter >= 6;
}

const ROMAN = { ii: "2", iii: "3", iv: "4", v: "5", vi: "6", vii: "7", viii: "8", ix: "9", x: "10", xi: "11", xii: "12" };

function titleWords(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[®™•·]/g, " ")
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((word) => (ROMAN[word] ? ROMAN[word] : word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word));
}

const normalizeGenre = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

function mapGenres(values) {
  const out = [];
  const dropped = [];
  for (const value of values || []) {
    const key = normalizeGenre(value);
    const mapped = GENRES[key];
    if (mapped) {
      if (!out.includes(mapped)) out.push(mapped);
    } else if (!dropped.includes(value)) {
      dropped.push(value);
    }
  }
  return { genres: out, dropped };
}

// --- catalog.js is one game per line, so patches are targeted text edits. ---
// Re-serializing the whole entry would re-encode non-ASCII titles and churn the
// 4 MB file; a failed or ambiguous edit skips the game instead of guessing.

function replaceOnce(line, find, replacement) {
  const hits = line.split(find).length - 1;
  if (hits !== 1) throw new Error(`expected 1 occurrence of ${find.slice(0, 40)}, found ${hits}`);
  return line.replace(find, replacement);
}

function patchLine(line, patch) {
  let out = line;

  if (patch.cover) {
    const value = JSON.stringify(patch.cover);
    if (out.includes('"art": { "cover": null')) {
      out = replaceOnce(out, '"art": { "cover": null', `"art": { "cover": ${value}`);
    } else if (!/"art": \{ "cover":/.test(out) && out.includes('"art": { ')) {
      out = replaceOnce(out, '"art": { ', `"art": { "cover": ${value}, `);
    } else {
      throw new Error("art has no patchable slot");
    }
  }

  if (patch.date) {
    if (out.includes('"releaseDate": ""')) {
      let to = `"releaseDate": ${JSON.stringify(patch.date)}`;
      if (patch.year && !/"year":\s*-?\d/.test(out)) to += `, "year": ${patch.year}`;
      out = replaceOnce(out, '"releaseDate": ""', to);
    }
  }
  if (patch.year && !/"year":\s*-?\d/.test(out)) {
    const anchor = /"releaseDate": "[^"]*"/.exec(out);
    if (!anchor) throw new Error("no releaseDate anchor for year");
    out = replaceOnce(out, anchor[0], `${anchor[0]}, "year": ${patch.year}`);
  }

  if (patch.genres && patch.genres.length) {
    const value = `[${patch.genres.map((genre) => JSON.stringify(genre)).join(", ")}]`;
    out = replaceOnce(out, '"genres": []', `"genres": ${value}`);
  }

  if (out === line) throw new Error("nothing changed");
  return out;
}

function parseEntry(line) {
  const body = line.trim().replace(/,$/, "");
  try {
    return JSON.parse(body);
  } catch (error) {
    return null;
  }
}

// --- sources ---

let FEED_INDEX = null;

function loadFeed() {
  if (!existsSync(FEED_PATH)) return null;
  try {
    const rows = JSON.parse(readFileSync(FEED_PATH, "utf8")).releases || [];
    const index = new Map();
    for (const row of rows) {
      if (!row || !row.titleId) continue;
      if (!index.has(row.titleId)) index.set(row.titleId, []);
      index.get(row.titleId).push(row);
    }
    return index.size ? index : null;
  } catch {
    return null;
  }
}

// The feed already keys rows by our own id, so this needs no fuzzy match; the
// name check only guards against a reused id (the store does that).
function searchFeed(target) {
  const rows = FEED_INDEX ? FEED_INDEX.get(target.id) || [] : [];
  const candidates = rows.filter((row) => compatible(row.title, target.title));
  if (!candidates.length) return null;
  const value = (row) => [row.cover, row.releaseDate, row.genre].filter(Boolean).length;
  const row = candidates.reduce((best, entry) => (value(entry) > value(best) ? entry : best), candidates[0]);
  return {
    source: "feed",
    via: "title-id",
    contentId: row.titleId,
    name: row.title,
    releaseDate: row.releaseDate || "",
    genres: String(row.genre || "").split(" / ").filter(Boolean),
    cover: row.cover || ""
  };
}

// Whether a single source alone can satisfy every empty field of this target.
function fillsEverything(target, found) {
  if (target.needsCover && !found.cover && !(found.images && found.images.length)) return false;
  if ((target.needsDate || target.needsYear) && !yearOf(found.releaseDate) && !found.year) return false;
  if (target.needsGenres && !mapGenres(found.genres).genres.length) return false;
  return true;
}

// The feed often knows the release date or genre of a listing the store no
// longer answers for, so its fields backfill whatever the network source lacks.
function mergeFeed(feed, other, target) {
  if (!feed) return other || null;
  if (!other) return feed;
  const merged = { ...other };
  let changed = false;
  if ((target.needsDate || target.needsYear) && !yearOf(merged.releaseDate) && yearOf(feed.releaseDate)) {
    merged.releaseDate = feed.releaseDate;
    changed = true;
  }
  if (target.needsGenres && !mapGenres(merged.genres).genres.length && mapGenres(feed.genres).genres.length) {
    merged.genres = feed.genres;
    changed = true;
  }
  if (target.needsCover && !merged.cover && feed.cover) {
    merged.cover = feed.cover;
    changed = true;
  }
  if (changed) merged.via = `${merged.via || "name"}+feed`;
  return merged;
}

async function searchPlayStation(title, titleId) {
  const wanted = normalizeTitle(title);
  if (!wanted) return null;
  for (const region of ["us/en", "gb/en"]) {
    for (let start = 0; start < 40; start += 20) {
      const page = await getJson(`${PS_TUMBLER(region, title)}?start=${start}&size=20`);
      if (!page) break;
      const links = page.links || [];
      if (!links.length) break;
      const byId = links.find((link) => String(link.id || "").includes(titleId) && compatible(link.name, title));
      const byName = links.find((link) => normalizeTitle(link.name) === wanted);
      const match = byId || byName;
      if (match) {
        const metadata = (match && match.metadata) || {};
        const read = (key) => (metadata[key] && metadata[key].values) || [];
        return {
          source: `ps:${region.split("/")[0]}`,
          via: byId ? "title-id" : "name",
          contentId: match.id,
          name: match.name,
          releaseDate: match.release_date || "",
          genres: read("game_genre"),
          subgenres: read("game_subgenre"),
          images: match.images || []
        };
      }
      if (start + 20 >= (page.total_results || 0)) break;
    }
  }
  return null;
}

async function searchSteam(title) {
  const wanted = normalizeTitle(title);
  if (!wanted) return null;
  const page = await getJson(STEAM_SEARCH(title));
  if (!page) return null;
  const item = (page.items || []).find((entry) => normalizeTitle(entry.name) === wanted);
  if (!item) return null;
  const detail = await getJson(STEAM_APP(item.id));
  const data = detail && detail[String(item.id)] && detail[String(item.id)].data;
  if (!data || data.type !== "game") return null;
  const date = isoFromSteamDate((data.release_date || {}).date || "");
  return {
    source: "steam",
    via: "name",
    contentId: `appid:${item.id}`,
    name: data.name,
    releaseDate: date || "",
    year: yearOf(date) || yearOf((data.release_date || {}).date || ""),
    genres: (data.genres || []).map((genre) => genre.description),
    cover: cover600x900(item.id),
    header: (data.header_image || "").length > 0
  };
}

function cover600x900(appid) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_600x900.jpg`;
}

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

function isoFromSteamDate(text) {
  const match = /^(\d{1,2})\s+([A-Za-z]{3}),?\s+(\d{4})$/.exec(String(text).trim());
  if (!match) return "";
  const month = MONTHS[match[2].toLowerCase()];
  if (!month) return "";
  return `${match[3]}-${String(month).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function yearOf(text) {
  const match = /(\d{4})/.exec(String(text || ""));
  return match ? Number(match[1]) : 0;
}

// The catalog stores "YYYY-MM-DD"; the store answers with a full timestamp.
function isoDate(value) {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value || ""));
  return match ? match[1] : "";
}

async function probeImage(url) {
  const head = await http(url, { method: "HEAD" }, 20000);
  if (head.status >= 200 && head.status < 400) return head.status;
  // Some CDNs reject HEAD; a one-byte range proves the object exists.
  const ranged = await http(url, { headers: { Range: "bytes=0-0" } }, 20000);
  return ranged.status === 200 || ranged.status === 206 ? ranged.status : head.status || ranged.status;
}

async function playStationCover(match) {
  const square = match.images.find((image) => Number(image.type) === 10);
  if (!square) return "";
  const status = await probeImage(square.url);
  return status === 200 || status === 206 ? square.url : "";
}

// --- main ---

async function main() {
  mkdirSync(TMP, { recursive: true });
  const text = readFileSync(CATALOG, "utf8");
  const lines = text.split("\n");
  const index = new Map();
  lines.forEach((line, position) => {
    const match = /^    \{ "id": "([^"]+)"/.exec(line);
    if (match) index.set(match[1], position);
  });

  const targets = [];
  for (const [id, position] of index) {
    const entry = parseEntry(lines[position]);
    if (!entry) continue;
    const needsCover = !entry.art || !entry.art.cover;
    const needsYear = !entry.year && !yearOf(entry.releaseDate);
    const needsDate = !entry.releaseDate;
    const needsGenres = !Array.isArray(entry.genres) || entry.genres.length === 0;
    if (needsCover || needsYear || needsDate || needsGenres) {
      targets.push({ id, title: entry.title || "", position, needsCover, needsYear, needsDate, needsGenres });
    }
  }

  FEED_INDEX = loadFeed();
  const cache = existsSync(CACHE_PATH) ? JSON.parse(readFileSync(CACHE_PATH, "utf8")) : {};
  const selected = targets.slice(0, LIMIT);
  console.log(`Catalog entries: ${index.size} | needing metadata: ${targets.length} | probing: ${selected.length}`);
  console.log(`Local feed: ${FEED_INDEX ? `${FEED_INDEX.size} title-ids` : "not present (network sources only)"}`);

  const results = await pool(selected, 6, async (target) => {
    const cached = cache[target.id];
    // A cached result predates the feed, so its fields are topped up every run.
    const found = cached ? mergeFeed(searchFeed(target), cached, target) : await resolve(target);
    if (!cached) cache[target.id] = found;
    return { target, found };
  });

  const plan = [];
  const rejected = [];
  for (const { target, found } of results) {
    if (!found) {
      rejected.push({ id: target.id, title: target.title, why: "no exact feed/store/steam match" });
      continue;
    }
    const patch = {};
    const notes = [];
    if (target.needsCover) {
      // Preference: the store's square tile (already the catalog's dominant
      // shape), then an explicit cover URL from Steam or the feed.
      const tile = found.images && found.images.length ? await playStationCover(found) : "";
      if (tile) {
        patch.cover = tile;
      } else if (found.cover) {
        const status = await probeImage(found.cover);
        if (status === 200 || status === 206) patch.cover = found.cover;
        else notes.push(`cover HTTP ${status}`);
      } else {
        notes.push("no square store tile");
      }
    }
    if ((target.needsDate || target.needsYear) && found.releaseDate) {
      patch.date = isoDate(found.releaseDate);
      patch.year = yearOf(patch.date) || yearOf(found.releaseDate);
    } else if (target.needsYear && found.year) {
      patch.year = found.year;
    }
    if (target.needsGenres) {
      const { genres, dropped } = mapGenres(found.genres);
      if (genres.length) patch.genres = genres;
      else notes.push(`no mapped genre (store gave ${JSON.stringify(found.genres)})`);
      if (dropped.length) notes.push(`dropped unmapped ${JSON.stringify(dropped)}`);
    }
    if (!Object.keys(patch).length) {
      rejected.push({ id: target.id, title: target.title, why: notes.join("; ") || "nothing fillable" });
      continue;
    }
    plan.push({ ...target, source: found.source, via: found.via, match: found.name, patch, notes });
  }

  writeFileSync(CACHE_PATH, JSON.stringify(cache), "utf8");

  const fills = { cover: 0, year: 0, date: 0, genres: 0 };
  for (const item of plan) {
    if (item.patch.cover) fills.cover++;
    if (item.patch.year) fills.year++;
    if (item.patch.date) fills.date++;
    if (item.patch.genres) fills.genres++;
  }
  const bySource = {};
  for (const item of plan) bySource[item.source] = (bySource[item.source] || 0) + 1;

  console.log(`\nFillable: ${plan.length} | unmatched: ${rejected.length}`);
  console.log(`  art.cover  +${fills.cover}`);
  console.log(`  year       +${fills.year}`);
  console.log(`  releaseDate +${fills.date}`);
  console.log(`  genres     +${fills.genres}`);
  console.log(`  by source: ${JSON.stringify(bySource)}`);

  const report = { generatedAt: new Date().toISOString(), apply: APPLY, plan, rejected, bySource, fills };
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nReport: ${REPORT_PATH}`);

  if (!APPLY) {
    console.log("\nDry run. Re-run with --apply to write the catalog.");
    return;
  }
  if (!plan.length) {
    console.log("Nothing to write.");
    return;
  }

  let backup = join(TMP, "catalog.js.before-backfill");
  writeFileSync(backup, text, "utf8");

  const patched = [...lines];
  const errors = [];
  for (const item of plan) {
    try {
      patched[item.position] = patchLine(lines[item.position], item.patch);
    } catch (error) {
      errors.push(`${item.id}: ${error.message}`);
    }
  }
  if (errors.length) {
    console.log(`\nRefusing to write: ${errors.length} patch failures`);
    for (const error of errors.slice(0, 20)) console.log(`  ${error}`);
    process.exit(1);
  }

  writeFileSync(CATALOG, patched.join("\n"), "utf8");
  verify(text, patched.join("\n"), plan);
  console.log(`Wrote ${plan.length} entries to ${CATALOG}`);
  console.log(`Backup: ${backup}`);
}

async function resolve(target) {
  const feed = searchFeed(target);
  if (feed && fillsEverything(target, feed)) return feed;
  return mergeFeed(feed, await resolveNetwork(target), target);
}

async function resolveNetwork(target) {
  const playStation = await searchPlayStation(target.title, target.id);
  if (!playStation) return searchSteam(target.title);
  if (!target.needsGenres || mapGenres(playStation.genres).genres.length) return playStation;

  // The store often answers only "UNIQUE"; its own subgenre or Steam's list
  // still describe the game, so borrow them before giving up on the genre.
  const fromSubgenre = [...playStation.genres, ...(playStation.subgenres || [])];
  if (mapGenres(fromSubgenre).genres.length) return { ...playStation, genres: fromSubgenre };
  const steam = await searchSteam(target.title);
  if (steam && mapGenres(steam.genres).genres.length) {
    return { ...playStation, genres: steam.genres, supplementedBy: "steam" };
  }
  return playStation;
}

function verify(before, after, plan) {
  const readEntries = (source) => {
    const map = new Map();
    source.split("\n").forEach((line) => {
      const match = /^    \{ "id": "([^"]+)"/.exec(line);
      if (match) map.set(match[1], parseEntry(line));
    });
    return map;
  };
  const was = readEntries(before);
  const now = readEntries(after);
  if (was.size !== now.size) throw new Error(`entry count changed: ${was.size} -> ${now.size}`);
  const problems = [];
  for (const [id, entry] of now) {
    if (!entry) problems.push(`${id} no longer parses`);
    const old = was.get(id);
    if (old && entry && JSON.stringify(Object.keys(entry)) !== JSON.stringify(Object.keys(old)) && !plan.some((item) => item.id === id)) {
      problems.push(`${id} key order changed without a patch`);
    }
    if (old && entry && JSON.stringify(entry) === JSON.stringify(old) && plan.some((item) => item.id === id)) {
      problems.push(`${id} was planned but did not change`);
    }
  }
  if (problems.length) {
    console.log(`Verification failed (${problems.length}):`);
    for (const problem of problems.slice(0, 20)) console.log(`  ${problem}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
