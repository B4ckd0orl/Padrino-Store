// Finds replacement download links for dead archive.org releases.
// Strategy: search archive.org for individual items by CUSA/PPSA ID.
// Usage: node tools/find-replacements.mjs [--limit N] [--platform ps5|ps4] [--out FILE]

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const RELEASES_DIR = "C:/Users/SysVoid/Desktop/storemia/padrino-store/app/data/releases";
const OUT = "C:/Users/SysVoid/AppData/Local/Temp/opencode/replacements.json";
const SEARCH_DELAY_MS = 2000;
const METADATA_DELAY_MS = 800;

const args = process.argv.slice(2);
const LIMIT = parseInt(args[args.indexOf("--limit") + 1]) || Infinity;
const PLATFORM = args[args.indexOf("--platform") + 1] || null;

async function searchArchiveOrg(query, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl%5B%5D=identifier&fl%5B%5D=title&rows=10&page=1&output=json`;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) return null;
      const data = await res.json();
      return data.response?.docs || [];
    } catch (e) {
      if (attempt < retries - 1) await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return null;
}

async function getMetadata(identifier, retries = 2) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(`https://archive.org/metadata/${identifier}`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      if (!res.ok) return null;
      const data = await res.json();
      return { files: data.files || [], metadata: data.metadata || {} };
    } catch {}
  }
  return null;
}

async function checkDownload(url) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-1023" },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    return res.ok || res.status === 206;
  } catch {
    return false;
  }
}

async function findReplacement(id, platform, deadUrls) {
  const results = [];
  const idNum = id.replace(/^(PPSA|CUSA)/i, "");
  const idLower = id.toLowerCase();

  // Strategy 1: Search by exact title ID patterns (most reliable)
  const idPatterns = [
    `identifier:cusa-${idNum}`,      // cusa-00003
    `identifier:ppsa-${idNum}`,      // ppsa-04609
    `"${id}"`,                        // CUSA00003 exact
  ];

  for (const query of idPatterns) {
    const docs = await searchArchiveOrg(query);
    if (!docs || docs.length === 0) {
      await new Promise((r) => setTimeout(r, SEARCH_DELAY_MS));
      continue;
    }

    for (const doc of docs.slice(0, 3)) {
      // STRICT: identifier must match our ID pattern
      const docIdNorm = doc.identifier.toLowerCase().replace(/[^a-z0-9]/g, "");
      const ourIdNorm = idLower.replace(/[^a-z0-9]/g, "");
      if (!docIdNorm.includes(ourIdNorm) && !docIdNorm.includes(`cusa${idNum}`) && !docIdNorm.includes(`ppsa${idNum}`)) {
        continue;
      }

      // Skip known restricted collections
      if (doc.identifier.startsWith("ps4-fpkg-collection")) continue;

      await new Promise((r) => setTimeout(r, METADATA_DELAY_MS));
      const meta = await getMetadata(doc.identifier);
      if (!meta || meta.files.length === 0) continue;

      // Find game files: correct extension, size between 100MB and 100GB
      const gameFiles = meta.files.filter((f) => {
        const name = (f.name || "").toLowerCase();
        const size = parseInt(f.size) || 0;
        if (size < 100 * 1024 * 1024 || size > 100 * 1024 * 1024 * 1024) return false;
        return name.endsWith(".pkg") || name.endsWith(".zip") ||
               name.endsWith(".ffpfsc") || name.endsWith(".exfat");
      });

      if (gameFiles.length === 0) continue;

      const bestFile = gameFiles.sort((a, b) => (parseInt(b.size) || 0) - (parseInt(a.size) || 0))[0];
      const url = `https://archive.org/download/${doc.identifier}/${encodeURIComponent(bestFile.name)}`;

      const dlOk = await checkDownload(url);
      await new Promise((r) => setTimeout(r, 500));

      if (dlOk) {
        results.push({
          identifier: doc.identifier,
          title: doc.title,
          filename: bestFile.name,
          sizeBytes: parseInt(bestFile.size) || 0,
          url,
          format: bestFile.name.split(".").pop()?.toLowerCase() || "binary",
        });
        break;
      }
    }

    if (results.length > 0) break;
    await new Promise((r) => setTimeout(r, SEARCH_DELAY_MS));
  }

  // Strategy 2: Name-based search (stricter validation)
  if (results.length === 0 && deadUrls.length > 0) {
    const gameName = extractGameName(deadUrls[0].url);
    if (gameName) {
      const clean = gameName
        .replace(/\s*-\s*\[(EU|US|JP|AS|ASIA)\].*$/i, "")
        .replace(/\s*\d{2}\.\d{2}.*$/, "")
        .replace(/\s*\d{1,2}\s*(GB|GiB)$/i, "")
        .trim();
      if (clean.length > 3) {
        const query = `"${clean}" AND (identifier:cusa-* OR identifier:ppsa-* OR format:pkg OR format:ffpfsc)`;
        const docs = await searchArchiveOrg(query);
        if (docs) {
          for (const doc of docs.slice(0, 5)) {
            // Validate: title must contain our game name
            const titleLower = (doc.title || "").toLowerCase();
            const cleanLower = clean.toLowerCase();
            if (!titleLower.includes(cleanLower) && !doc.identifier.toLowerCase().includes(cleanLower.replace(/\s+/g, "-"))) {
              continue;
            }
            if (doc.identifier.startsWith("ps4-fpkg-collection")) continue;

            await new Promise((r) => setTimeout(r, METADATA_DELAY_MS));
            const meta = await getMetadata(doc.identifier);
            if (!meta) continue;
            const gameFile = meta.files.filter((f) => {
              const size = parseInt(f.size) || 0;
              const name = (f.name || "").toLowerCase();
              return size > 100 * 1024 * 1024 && size < 100 * 1024 * 1024 * 1024 &&
                (name.endsWith(".pkg") || name.endsWith(".zip") || name.endsWith(".ffpfsc") || name.endsWith(".exfat"));
            }).sort((a, b) => (parseInt(b.size) || 0) - (parseInt(a.size) || 0))[0];
            if (!gameFile) continue;

            const url = `https://archive.org/download/${doc.identifier}/${encodeURIComponent(gameFile.name)}`;
            if (await checkDownload(url)) {
              results.push({
                identifier: doc.identifier,
                title: doc.title,
                filename: gameFile.name,
                sizeBytes: parseInt(gameFile.size) || 0,
                url,
                format: gameFile.name.split(".").pop()?.toLowerCase() || "binary",
              });
              break;
            }
            await new Promise((r) => setTimeout(r, 500));
          }
        }
      }
    }
  }

  return results;
}

function extractGameName(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 3) {
      return decodeURIComponent(parts[2]).replace(/\.(pkg|ffpfsc|ffpfs|exfat|zip|rar|7z)$/i, "").trim();
    }
  } catch {}
  return "";
}

async function main() {
  const files = (await readdir(RELEASES_DIR)).filter((f) => f.endsWith(".json"));
  const deadEntries = [];

  for (const file of files) {
    const id = file.replace(".json", "");
    if (PLATFORM === "ps5" && !id.startsWith("PPSA")) continue;
    if (PLATFORM === "ps4" && !id.startsWith("CUSA")) continue;

    let releases;
    try {
      releases = JSON.parse(await readFile(join(RELEASES_DIR, file), "utf8"));
    } catch { continue; }
    if (!Array.isArray(releases)) continue;

    const dead = releases.filter((r) => r.unavailableReason && r.url);
    if (dead.length === 0) continue;

    deadEntries.push({
      id,
      file,
      platform: id.startsWith("PPSA") ? "ps5" : "ps4",
      allDead: releases.every((r) => r.unavailableReason),
      deadUrls: dead.map((r) => ({ url: r.url, format: r.format, label: r.label })),
    });
  }

  console.log(`Found ${deadEntries.length} files with dead links (${deadEntries.filter((e) => e.allDead).length} fully dead)`);

  const toProcess = deadEntries.slice(0, LIMIT);
  console.log(`Processing ${toProcess.length}...`);

  const replacements = [];
  let processed = 0;

  for (const entry of toProcess) {
    processed++;
    if (processed % 10 === 0) {
      console.log(`  ${processed}/${toProcess.length} processed, ${replacements.length} with replacements found`);
    }

    const found = await findReplacement(entry.id, entry.platform, entry.deadUrls);
    if (found.length > 0) {
      replacements.push({
        id: entry.id,
        file: entry.file,
        platform: entry.platform,
        allDead: entry.allDead,
        replacements: found,
      });
    }

    await new Promise((r) => setTimeout(r, SEARCH_DELAY_MS));
  }

  const fullyDeadFixed = replacements.filter((r) => r.allDead);
  console.log(`\n=== RESULTS ===`);
  console.log(`Processed: ${processed}`);
  console.log(`Found replacements: ${replacements.length}`);
  console.log(`Fully-dead games fixed: ${fullyDeadFixed.length}`);

  await writeFile(OUT, JSON.stringify({ processed, found: replacements.length, fullyDeadFixed: fullyDeadFixed.length, replacements }, null, 2));
  console.log(`\nWritten to ${OUT}`);

  console.log(`\nSample:`);
  for (const r of replacements.slice(0, 20)) {
    console.log(`  ${r.id} (${r.platform}) -> ${r.replacements[0]?.url?.substring(0, 80)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
