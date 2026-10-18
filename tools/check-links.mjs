#!/usr/bin/env node
// Scans release JSON files for URLs and checks which are alive or dead.
// Usage: node tools/check-links.mjs [--all] [--dead-only] [--limit N] [--out results.json]
//   --all       check every URL, not just those with unavailableReason
//   --dead-only only check URLs already marked unavailableReason (default)
//   --limit N   check at most N files
//   --out FILE  write JSON results to FILE

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RELEASES = join(ROOT, "app", "data", "releases");

const args = process.argv.slice(2);
const ALL = args.includes("--all");
const DEAD_ONLY = !ALL;
const LIMIT = parseInt(args[args.indexOf("--limit") + 1]) || Infinity;
const OUT = args[args.indexOf("--out") + 1] || "C:/Users/SysVoid/AppData/Local/Temp/opencode/link-check-results.json";
const CONCURRENCY = 8;
const TIMEOUT_MS = 15_000;

async function checkUrl(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "PadrinoStore-LinkChecker/1.0" },
      });
      clearTimeout(timer);
      return { url, status: res.status, ok: res.ok, redirected: res.redirected };
    } catch (e) {
      clearTimeout(timer);
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      return { url, status: 0, ok: false, error: e.message };
    }
  }
}

async function runPool(tasks, concurrency) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

async function main() {
  const files = (await readdir(RELEASES)).filter((f) => f.endsWith(".json"));
  console.log(`Scanning ${files.length} release files...`);

  const tasks = [];
  const meta = []; // parallel array: { file, releaseIndex, release }

  for (let fi = 0; fi < files.length && meta.length < LIMIT * 50; fi++) {
    const filePath = join(RELEASES, files[fi]);
    let releases;
    try {
      releases = JSON.parse(await readFile(filePath, "utf8"));
    } catch {
      continue;
    }
    if (!Array.isArray(releases)) continue;

    for (let ri = 0; ri < releases.length; ri++) {
      const rel = releases[ri];
      if (!rel.url) continue;
      if (DEAD_ONLY && !rel.unavailableReason) continue;
      tasks.push(() => checkUrl(rel.url));
      meta.push({ file: files[fi], releaseIndex: ri, id: rel.id, provider: rel.provider, url: rel.url, hadUnavailable: !!rel.unavailableReason });
    }
  }

  console.log(`Checking ${tasks.length} URLs (${DEAD_ONLY ? "dead-only" : "all"}) with ${CONCURRENCY} workers...`);

  const started = Date.now();
  const results = [];
  let checked = 0;

  // Process in batches to show progress
  const BATCH = 100;
  for (let i = 0; i < tasks.length; i += BATCH) {
    const batch = tasks.slice(i, i + BATCH);
    const batchResults = await runPool(batch, CONCURRENCY);
    results.push(...batchResults);
    checked += batch.length;
    const elapsed = ((Date.now() - started) / 1000).toFixed(0);
    console.log(`  ${checked}/${tasks.length} checked (${elapsed}s)`);
  }

  // Merge results with metadata
  const output = results.map((r, i) => ({
    ...meta[i],
    status: r.status,
    ok: r.ok,
    error: r.error || undefined,
  }));

  // Summary
  const alive = output.filter((r) => r.ok);
  const dead = output.filter((r) => !r.ok);
  const byStatus = {};
  for (const d of dead) {
    const key = d.status === 0 ? "network" : `HTTP ${d.status}`;
    byStatus[key] = (byStatus[key] || 0) + 1;
  }

  console.log(`\n=== RESULTS ===`);
  console.log(`Alive: ${alive.length}`);
  console.log(`Dead: ${dead.length}`);
  if (Object.keys(byStatus).length) {
    console.log("Dead by status:");
    for (const [k, v] of Object.entries(byStatus).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${k}: ${v}`);
    }
  }

  // Group by file for easier analysis
  const byFile = {};
  for (const r of output) {
    if (!byFile[r.file]) byFile[r.file] = { alive: 0, dead: 0, entries: [] };
    if (r.ok) byFile[r.file].alive++;
    else byFile[r.file].dead++;
    byFile[r.file].entries.push(r);
  }

  const fullyDead = Object.entries(byFile).filter(([, v]) => v.alive === 0);
  const partiallyDead = Object.entries(byFile).filter(([, v]) => v.alive > 0 && v.dead > 0);
  const allAlive = Object.entries(byFile).filter(([, v]) => v.dead === 0);

  console.log(`\nFiles: ${allAlive.length} all-alive, ${partiallyDead.length} partial, ${fullyDead.length} fully-dead`);

  // Recovered: was marked dead but is actually alive
  const recovered = alive.filter((r) => r.hadUnavailable);
  console.log(`\nRECOVERED (was marked dead, now alive): ${recovered.length}`);
  for (const r of recovered.slice(0, 30)) {
    console.log(`  ${r.file} | ${r.provider} | ${r.url.substring(0, 80)}`);
  }
  if (recovered.length > 30) console.log(`  ... and ${recovered.length - 30} more`);

  await writeFile(OUT, JSON.stringify({ summary: { alive: alive.length, dead: dead.length, recovered: recovered.length, fullyDeadFiles: fullyDead.length }, results: output, byFile }, null, 2));
  console.log(`\nResults written to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
