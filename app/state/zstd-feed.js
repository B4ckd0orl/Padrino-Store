// The community ZSTD catalog (francovoid9/zstd-catalog), read once a launch in the background and
// kept on disk (zstd-feed.json); the next launch merges it into the catalog before any list is made
// (state/catalog.js), the same way the catalog's own update works. The published page is HTML with a
// `const ITEMS = [...]` object literal inside: it is parsed here with a string-aware scan, so a
// bracket, colon or comma inside a title never counts, and only a feed whose every item passes its
// checks is kept. Without one the catalog is the build's own. A link's #fragment is cosmetic (the
// file page never reads location.hash) and is cut, so the /f/<10 chars> path stays clean for the
// capture (state/viking-capture.js).

import { isRecord, readJSON } from './read-json.js';
import { pausedSource } from './paused-hosts.js';
import { webURL } from './download-sources.js';
import { FileSystem, Http } from '@ps5-react/core';

  var URL2 = "https://raw.githubusercontent.com/FrancoVoid9/zstd-catalog/main/index.html";
  var DIR = `${FileSystem.dataDir}/padrino-store`;
  var FILE = `${DIR}/zstd-feed.json`;
  var TAG = `${DIR}/zstd-feed.etag`;
  // The page is about 31 KB; the most network.request reads (native network_api.cpp: more is
  // refused before any request) is what the catalog's own update already allows itself.
  var MAX_BYTES = 512 * 1024;
  var ID = /^[A-Z]{4}\d{5}$/;
  var COVER_ORIGIN = "https://francovoid9.github.io/zstd-catalog/";
  // The store's own covers/ folder, the origin every other game's cover already uses: the three
  // games only the feed names have their covers kept here, so they do not lean on the catalog's site.
  var STORE_COVERS = "https://raw.githubusercontent.com/B4ckd0orl/Padrino-Store/main/covers/";
  var log = (message) => console.log(`[zstd-feed] ${message}`);
  var isText = (value, max) => typeof value === "string" && value.length <= max;
  var optionalText = (value, max) => value === void 0 || value === null || isText(value, max);
  // The index just past a string literal's closing quote; the escape before it is stepped over,
  // and the end of the source when the quote never closes.
  function skipString(source, start) {
    const quote = source[start];
    for (let index = start + 1; index < source.length; index++) {
      if (source[index] === "\\") index++;
      else if (source[index] === quote) return index + 1;
    }
    return source.length;
  }
  // The index just past a // or /* comment, or the end of the source when it never closes.
  function skipComment(source, start) {
    if (source[start + 1] === "/") {
      const end = source.indexOf("\n", start);
      return end < 0 ? source.length : end;
    }
    const end = source.indexOf("*/", start + 2);
    return end < 0 ? source.length : end + 2;
  }
  // The index of the next character that is neither space nor comment, or the end of the source.
  function significant(source, from) {
    let index = from;
    while (index < source.length) {
      const char = source[index];
      if (/\s/.test(char)) index++;
      else if (char === "/" && (source[index + 1] === "/" || source[index + 1] === "*")) index = skipComment(source, index);
      else return index;
    }
    return source.length;
  }
  // The `const ITEMS = [ ... ]` array literal: brackets counted only outside strings and comments,
  // so a "]" inside a title never ends it early.
  function arrayLiteral(page) {
    const match = /const\s+ITEMS\s*=\s*\[/.exec(page);
    if (!match) throw new Error("the page holds no ITEMS array");
    const start = match.index + match[0].length - 1;
    let depth = 0;
    for (let index = start; index < page.length; index++) {
      const char = page[index];
      if (char === '"' || char === "'") index = skipString(page, index) - 1;
      else if (char === "/" && (page[index + 1] === "/" || page[index + 1] === "*")) index = skipComment(page, index) - 1;
      else if (char === "[") depth++;
      else if (char === "]" && --depth === 0) return page.slice(start, index + 1);
    }
    throw new Error("its ITEMS array never closes");
  }
  // A single-quoted string's escapes as the characters they stand for, so the JSON string of the
  // same value can be written over it (' and \xNN are the ones JSON has no spelling for).
  function unquote(body) {
    return body.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (all, seq) => {
      if (seq[0] === "u" || seq[0] === "x") return String.fromCharCode(parseInt(seq.slice(1), 16));
      return { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f" }[seq] ?? seq;
    });
  }
  // The same literal as JSON: an identifier before a colon is a key and gets quoted, a comma before
  // ] or } goes, and both only step outside a string or a comment. Everything else is copied as it
  // is, so a title's punctuation is never touched.
  function literalJSON(literal) {
    let out = "";
    let index = 0;
    while (index < literal.length) {
      const char = literal[index];
      if (char === '"' || char === "'") {
        const end = skipString(literal, index);
        const closed = end > index + 1 && literal[end - 1] === char;
        const body = literal.slice(index + 1, closed ? end - 1 : end);
        out += char === '"' ? `"${body}"` : JSON.stringify(unquote(body));
        index = end;
        continue;
      }
      if (char === "/" && (literal[index + 1] === "/" || literal[index + 1] === "*")) {
        index = skipComment(literal, index);
        continue;
      }
      if (char === ",") {
        const next = significant(literal, index + 1);
        if (next < literal.length && (literal[next] === "]" || literal[next] === "}")) {
          index++;
          continue;
        }
        out += char;
        index++;
        continue;
      }
      if (/[A-Za-z_$]/.test(char)) {
        let end = index;
        while (end < literal.length && /[A-Za-z0-9_$]/.test(literal[end])) end++;
        const word = literal.slice(index, end);
        const colon = significant(literal, end);
        out += colon < literal.length && literal[colon] === ":" ? JSON.stringify(word) : word;
        index = end;
        continue;
      }
      out += char;
      index++;
    }
    return out;
  }
  // The feed's items out of the published page: the array literal, then JSON over it.
  function itemsOf(page) {
    if (!isText(page, 4 * MAX_BYTES)) throw new Error("the page is not text");
    const items = JSON.parse(literalJSON(arrayLiteral(page)));
    if (!Array.isArray(items)) throw new Error("its ITEMS is not an array");
    return items;
  }
  function validItem(item) {
    return isRecord(item) && ID.test(item.id ?? "") && isText(item.title, 300) && item.title.length > 0 &&
      Array.isArray(item.links) && item.links.length > 0 && item.links.length <= 64 &&
      item.links.every((link) => isText(link, 2048)) &&
      optionalText(item.version, 40) && optionalText(item.size, 40) && optionalText(item.image, 300) &&
      optionalText(item.ampr, 40) && optionalText(item.firmware, 40);
  }
  function valid(feed) {
    return isRecord(feed) && feed.format === 1 && isText(feed.generated, 40) &&
      Array.isArray(feed.items) && feed.items.length > 0 && feed.items.length <= 500 && feed.items.every(validItem);
  }
  // The feed kept by the last launch, for this format only.
  function loadZstdFeed() {
    return readJSON(FileSystem, FILE, null, valid, log);
  }
  // Once a launch, after the start: the feed for the next one. Unchanged (the same ETag) it is not
  // read again; one that fails a check is not kept. Without anything published the 404 leaves the
  // catalog the build's own.
  async function fetchZstdFeed() {
    try {
      const etag = FileSystem.exists(FILE) && FileSystem.exists(TAG) ? FileSystem.readFile(TAG).trim() : "";
      const response = await Http.request(URL2, { headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "Padrino Store", ...etag ? { "If-None-Match": etag } : {} }, maxBytes: MAX_BYTES });
      if (response.status === 304) {
        log("no change since the kept feed");
        return;
      }
      if (response.status === 404) {
        log("no feed published");
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const page = await response.text();
      const items = itemsOf(page);
      if (!items.length) throw new Error("its ITEMS array is empty");
      if (!items.every(validItem)) throw new Error("an item failed its checks");
      FileSystem.mkdir(DIR, { recursive: true });
      FileSystem.writeFile(`${FILE}.tmp`, JSON.stringify({ format: 1, generated: new Date().toISOString(), items }));
      FileSystem.rename(`${FILE}.tmp`, FILE);
      if (response.headers.etag) FileSystem.writeFile(TAG, response.headers.etag);
      log(`kept ${items.length} items of the catalog for the next launch`);
    } catch (error2) {
      log(`not read: ${error2.message}`);
    }
  }
  // The hosts the feed links to: the provider name the row and its source picker show, the
  // catalog's own provider key for a new game's providers list, and whether the console's browser
  // opens the file page (the capture then takes the file) or the app reaches the file by itself.
  var HOSTS = {
    "vik1ngfile.site": { provider: "VikingFile", key: "vikingfile", flow: "vikingfile", browser: true },
    "vikingfile.com": { provider: "VikingFile", key: "vikingfile", flow: "vikingfile", browser: true },
    "gofile.io": { provider: "gofile.io", key: "gofile", flow: "browser", browser: true },
    "rootz.so": { provider: "Rootz", key: "rootz.so", flow: "browser", browser: false },
    "welinkly.com": { provider: "Welinkly", key: "welinkly", flow: "browser", browser: true }
  };
  // The row's own id: the same link of the same game always hashes the same, so a feed already
  // merged never gains a second row for it.
  function rowId(value) {
    let first = 2166136261, second = 5381;
    for (let index = 0; index < value.length; index++) {
      const code = value.charCodeAt(index);
      first = Math.imul(first ^ code, 16777619);
      second = Math.imul(second, 33) ^ code;
    }
    return `r${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0).toString(16).padStart(8, "0").slice(0, 4)}`;
  }
  var pausedOf = (row) => {
    try {
      return pausedSource(row);
    } catch {
      return true;
    }
  };
  // A row per link, grouped the way the label counts them: "ZSTD <firmware> ampr-emu-ng <ampr>",
  // (n/N) when one item offers the same host several times, then the host. No credits, whatever
  // the feed's own page shows. A link that is not one of these hosts, or not an http(s) address,
  // is skipped; the #fragment is cut on the way.
  function rowsOf(item) {
    const found = [];
    const seen = new Set();
    for (const link of item.links) {
      const url = String(link).split("#")[0];
      let host;
      try {
        host = webURL(url).host.replace(/^www\./, "");
      } catch {
        continue;
      }
      if (!HOSTS[host] || seen.has(url)) continue;
      seen.add(url);
      found.push({ url, host });
    }
    const totals = new Map();
    for (const { host } of found) totals.set(host, (totals.get(host) ?? 0) + 1);
    const version = String(item.version || "").replace(/^v/i, "");
    const firmware = String(item.firmware || "1.00+");
    const ampr = String(item.ampr || "ampr");
    const done = new Map();
    return found.map(({ url, host }) => {
      const spec = HOSTS[host];
      const index = (done.get(host) ?? 0) + 1;
      done.set(host, index);
      const count = totals.get(host);
      const id = rowId(`${item.id}|${url}`);
      return {
        id,
        format: "rar",
        filename: `${item.id}-game-${version || "unknown"}-${id}.rar`,
        url,
        ...(spec.browser ? { browserUrl: url } : {}),
        requiresBrowser: spec.browser,
        sizeBytes: null,
        version,
        category: "game",
        provider: spec.provider,
        source: "zstd-catalog",
        flow: spec.flow,
        label: `ZSTD ${firmware} ampr-emu-ng ${ampr}${count > 1 ? ` (${index}/${count})` : ""} - ${spec.provider}`,
        platform: "ps5",
        record: `zstd-${item.id}`
      };
    });
  }
  // The three games the build's catalog does not have yet, with what the store shows besides what
  // the feed says: dates and genres from the publishers' own pages (2026-11-14), a short page each
  // so the game screen and Spotlight have a description. A game the feed names later is added with
  // the feed's own title and size alone.
  var KNOWN = {
    PPSA34884: {
      developer: "Ratata Arts", publisher: "Game Source Entertainment",
      releaseDate: "2026-10-15", year: 2026, genres: ["Action"], added: "2026-11-14",
      summary: "Rhythm roguelike action from the creators of Patapon: command Ratatan and the Kobun troupe to the beat as every run remixes the worlds ahead.",
      about: [
        "RATATAN is a rhythm roguelike action game from Ratata Arts: lead Ratatan and the Kobun troupe through music-driven worlds, issuing commands on the beat to move, attack and evolve your party.",
        "Every run remixes the stages and enemies ahead, so the march learned in one run becomes the command of the next, and the soundtrack carries the whole charge."
      ]
    },
    PPSA36136: {
      developer: "Nihon Falcom", publisher: "NIS America",
      releaseDate: "2026-09-10", year: 2026, genres: ["RPG"], added: "2026-11-14",
      summary: "Lloyd Bannings and the Special Support Section take on the cases Crossbell's police overlook, in the first chapter of the Zero/Azure arc.",
      about: [
        "The Legend of Heroes: Trails from Zero follows Lloyd Bannings, freshly transferred to Crossbell's Special Support Section, as the four-person team takes on the cases the city's own police overlook.",
        "Its investigations pull the SSS into the conflict between Calvard and Erebonia that defines the Zero/Azure duology, with turn-based combat, bond episodes and a fully voiced cast."
      ]
    },
    PPSA36140: {
      developer: "Nihon Falcom", publisher: "NIS America",
      releaseDate: "2026-09-10", year: 2026, genres: ["RPG"], added: "2026-11-14",
      summary: "The Special Support Section is drawn into the war between Calvard and Erebonia, closing the Crossbell saga of the Zero/Azure duology.",
      about: [
        "The Legend of Heroes: Trails to Azure continues the Crossbell saga: Lloyd and the SSS are pulled into the open conflict between Calvard and Erebonia as the city's own fate is decided.",
        "The duology's second chapter keeps the party system and combat of Zero while raising the stakes to the scale the later arcs build on."
      ]
    }
  };
  // The feed's size ("1.77 GB", "703.55 MB") as the catalog's own sizeGb, or null when it names
  // no number the app can read.
  function sizeOf(value) {
    const match = /^([\d.]+)\s*(TB|GB|MB)?/i.exec(String(value || "").trim());
    if (!match) return null;
    const number = Number(match[1]);
    if (!Number.isFinite(number)) return null;
    const unit = (match[2] || "GB").toUpperCase();
    return unit === "TB" ? number * 1024 : unit === "MB" ? number / 1024 : number;
  }
  // A game the feed names and the build lacks: what the feed says, the publishers' metadata the
  // store needs to list it, and the ZSTD catalog's own cover.
  function gameOf(item, rows) {
    const known = KNOWN[item.id] ?? {};
    const image = String(item.image || "");
    const cover = item.id in KNOWN ? `${STORE_COVERS}${item.id}.jpg` : /^https?:\/\//i.test(image) ? image : `${COVER_ORIGIN}${image.replace(/^\/+/, "") || `Covers/${item.id}.jpg`}`;
    const providers = [...new Set(rows.filter((row) => !pausedOf(row)).map((row) => HOSTS[webURL(row.url).host.replace(/^www\./, "")].key))];
    return {
      id: item.id,
      title: item.title,
      platform: "ps5",
      providers,
      direct: false,
      developer: known.developer ?? "",
      publisher: known.publisher ?? "",
      releaseDate: known.releaseDate ?? "",
      ...(known.year ? { year: known.year } : {}),
      genres: known.genres ?? [],
      features: ["Single-player"],
      recommendations: 0,
      sizeGb: sizeOf(item.size),
      art: { cover },
      region: "USA",
      ...(known.added ? { added: known.added } : {}),
      source: "zstd-catalog"
    };
  }
  // Into the data the lists are made of, before state/catalog.js makes anything of them: each
  // item's rows join its game's release file (a link the file already holds is never added
  // twice), a game the feed names that the build lacks is added when any of its rows is live, and
  // a game with a live ZSTD row is marked for the ZSTD filter and chip. A row a paused host holds
  // is still written; paused-hosts decides what a screen sees of it, as for every other source.
  function applyZstdFeed(feed, games, twins, read, updated) {
    if (!feed) return;
    const byId = new Map();
    for (const game of [...games, ...twins]) if (!byId.has(game.id)) byId.set(game.id, game);
    let written = 0, files = 0, made = 0, flagged = 0;
    for (const item of feed.items) {
      const rows = rowsOf(item);
      if (!rows.length) continue;
      const path = `data/releases/${encodeURIComponent(item.id)}.json`;
      let current = [];
      try {
        const parsed = JSON.parse(read(path));
        if (Array.isArray(parsed)) current = parsed;
      } catch {
        current = [];
      }
      const have = new Set(current.filter((row) => isRecord(row) && typeof row.url === "string").map((row) => row.url.split("#")[0]));
      const fresh = rows.filter((row) => !have.has(row.url));
      // A game is marked when the feed's own rows would show (a paused host's never do) or when a
      // ZSTD row an earlier merge wrote is still live there: the link the feed names may already
      // be in the file under another source, and the game is the catalog's either way.
      const live = rows.some((row) => !pausedOf(row)) ||
        current.some((row) => isRecord(row) && row.source === "zstd-catalog" && !pausedOf(row));
      if (fresh.length) {
        updated.set(path, JSON.stringify([...current, ...fresh]));
        written += fresh.length;
        files++;
      }
      let game = byId.get(item.id);
      if (!game && live) {
        game = gameOf(item, rows);
        games.push(game);
        byId.set(item.id, game);
        made++;
        const page = KNOWN[item.id];
        if (page?.summary) updated.set(`data/pages/${encodeURIComponent(item.id)}.json`, JSON.stringify({ about: page.about ?? [], shots: [], summary: page.summary }));
      }
      if (game && live && !game.zstd) {
        game.zstd = true;
        flagged++;
      }
    }
    if (written || made) log(`merged ${written} rows into ${files} files, ${made} games added, ${flagged} marked ZSTD`);
  }

export { applyZstdFeed, fetchZstdFeed, itemsOf, loadZstdFeed, valid };
