// Applies verified replacement links to release JSON files.
// Usage: node tools/apply-replacements.mjs [--dry] [--rep file1,file2,...] [--details]
//   --dry      report what would change without writing
//   --rep      comma-separated replacement result files (default: auto-detect temp results)
//   --details  also resolve dead archive.org/details/ page URLs to real download URLs

import { readdir, readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

const RELEASES_DIR = "C:/Users/SysVoid/Desktop/storemia/padrino-store/app/data/releases";
const TMP = "C:/Users/SysVoid/AppData/Local/Temp/opencode";
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const SKIP_VERIFY = args.includes("--skip-verify");
const DETAILS = !args.includes("--no-details");
const _repArg = args.indexOf("--rep");
const REP_ARG = _repArg >= 0 && args[_repArg + 1] ? args[_repArg + 1] : null;

const VALID_EXT = ["pkg", "zip", "7z", "rar", "ffpfsc", "ffpfs", "ffpkg", "exfat"];
const MIN_SIZE = 100 * 1024 * 1024;
const MAX_SIZE = 200 * 1024 * 1024 * 1024;

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function checkDl(url) {
  for (let i = 0; i < 2; i++) {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 12000);
      const r = await fetch(url, { method: "GET", headers: { Range: "bytes=0-1023" }, signal: c.signal });
      clearTimeout(t);
      if (r.ok || r.status === 206) return true;
      if (r.status === 500 || r.status === 503 || r.status === 429) {
        await new Promise((x) => setTimeout(x, 3000));
        continue;
      }
      return false;
    } catch {
      await new Promise((x) => setTimeout(x, 2000));
    }
  }
  return false;
}

async function getMetadata(identifier) {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 15000);
    const r = await fetch(`https://archive.org/metadata/${identifier}`, { signal: c.signal });
    clearTimeout(t);
    if (!r.ok) return null;
    const d = await r.json();
    return { files: d.files || [], title: d.metadata?.title || "" };
  } catch { return null; }
}

function extensionOf(name) {
  const lower = name.toLowerCase();
  return VALID_EXT.find((e) => lower.endsWith(`.${e}`)) || null;
}

function platformMarker(id) {
  return id.startsWith("PPSA") ? /ppsa|ps5|playstation\s*5/i : /cusa|ps4|playstation\s*4/i;
}

// A candidate is trusted when its identifier self-identifies with the title ID,
// or when identifier/title carry an explicit platform marker for this title.
function validateCandidate(id, rep) {
  const idNum = id.replace(/^(PPSA|CUSA)/i, "");
  const idNorm = id.toLowerCase().replace(/[^a-z0-9]/g, "");
  const docNorm = String(rep.identifier || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const selfIdentified = docNorm.includes(idNorm) || docNorm.includes(`cusa${idNum}`) || docNorm.includes(`ppsa${idNum}`);
  const marker = platformMarker(id);
  if (!selfIdentified && !marker.test(rep.identifier || "") && !marker.test(rep.title || "")) {
    return { ok: false, why: "no platform marker" };
  }
  const ext = extensionOf(rep.filename || "");
  if (!ext) return { ok: false, why: `extension not usable: ${rep.filename}` };
  const size = rep.sizeBytes || 0;
  if (size < MIN_SIZE || size > MAX_SIZE) return { ok: false, why: `size out of range: ${size}` };
  return { ok: true, ext };
}

function serialize(raw, data) {
  const pretty = raw.includes("\n  ");
  const trailing = raw.endsWith("\n");
  const body = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  return trailing ? body + "\n" : body;
}

async function loadReleases(file) {
  const raw = await readFile(join(RELEASES_DIR, file), "utf8");
  return { raw, data: JSON.parse(raw) };
}

// Rewrites one dead entry with the replacement source.
function applyToEntry(entry, rep, ext) {
  const base = String(entry.filename || `${entry.id}-game`).replace(/\.[a-z0-9]+$/i, "");
  entry.url = rep.url;
  entry.format = ext;
  entry.filename = `${base}.${ext}`;
  entry.sizeBytes = rep.sizeBytes ?? null;
  entry.health = "ok";
  delete entry.unavailableReason;
}

async function resolveDetailsUrl(id, entry) {
  const m = String(entry.url).match(/archive\.org\/details\/([^/?#]+)/i);
  if (!m) return null;
  const identifier = decodeURIComponent(m[1]);
  const meta = await getMetadata(identifier);
  if (!meta) return null;
  const marker = platformMarker(id);
  const candidates = meta.files.filter((f) => {
    const ext = extensionOf(f.name || "");
    if (!ext) return false;
    const size = parseInt(f.size) || 0;
    return size >= MIN_SIZE && size <= MAX_SIZE;
  });
  if (!candidates.length) return null;
  // Prefer files whose name mentions the title id; then biggest.
  const want = id.replace(/^(PPSA|CUSA)/i, "");
  candidates.sort((a, b) => {
    const an = (a.name || "").toLowerCase().includes(want) ? 1 : 0;
    const bn = (b.name || "").toLowerCase().includes(want) ? 1 : 0;
    if (an !== bn) return bn - an;
    return (parseInt(b.size) || 0) - (parseInt(a.size) || 0);
  });
  if (!marker.test(identifier) && !marker.test(meta.title) && !marker.test(candidates[0].name || "")) return null;
  const best = candidates[0];
  const url = `https://archive.org/download/${identifier}/${encodeURIComponent(best.name)}`;
  if (!(await checkDl(url))) return null;
  return { url, filename: best.name, sizeBytes: parseInt(best.size) || 0 };
}

async function main() {
  // 1. Gather replacement candidates.
  let repFiles;
  if (REP_ARG) {
    repFiles = REP_ARG.split(",").map((s) => s.trim());
  } else {
    repFiles = [];
    for (const name of ["rep-ps4-a.json", "rep-ps4-b2.json", "rep-ps5.json"]) {
      if (await exists(join(TMP, name))) repFiles.push(join(TMP, name));
    }
  }
  const candidates = [];
  for (const f of repFiles) {
    try {
      const j = JSON.parse(await readFile(f, "utf8"));
      candidates.push(...(j.replacements || []));
      console.log(`${f}: ${j.replacements?.length || 0} candidates (checked ${j.checked}, found ${j.found})`);
    } catch (e) {
      console.log(`${f}: unreadable (${e.message})`);
    }
  }

  // 2. Validate candidates live.
  console.log(`\nValidating ${candidates.length} candidates...`);
  const valid = [];
  let rejected = 0;
  for (const c of candidates) {
    const v = validateCandidate(c.id, c.replacements[0]);
    if (!v.ok) {
      rejected++;
      console.log(`  REJECT ${c.id}: ${v.why}`);
      continue;
    }
    if (!SKIP_VERIFY) {
      const live = await checkDl(c.replacements[0].url);
      if (!live) {
        rejected++;
        console.log(`  REJECT ${c.id}: download check failed`);
        continue;
      }
    }
    valid.push({ id: c.id, file: c.file, rep: c.replacements[0], ext: v.ext });
    console.log(`  OK ${c.id} -> ${c.replacements[0].identifier}/${c.replacements[0].filename}`);
    await new Promise((r) => setTimeout(r, 400));
  }
  console.log(`Valid: ${valid.length}, rejected: ${rejected}`);

  // 3. Apply replacements (grouped per file).
  const perFile = new Map();
  for (const v of valid) {
    if (!perFile.has(v.file)) perFile.set(v.file, []);
    perFile.get(v.file).push(v);
  }
  let updatedFiles = 0;
  for (const [file, list] of perFile) {
    const { raw, data } = await loadReleases(file);
    let changed = 0;
    for (const v of list) {
      const entry = data.find((e) => e.unavailableReason && e.url);
      if (!entry) continue;
      applyToEntry(entry, v.rep, v.ext);
      changed++;
    }
    if (changed) {
      updatedFiles++;
      console.log(`${DRY ? "[dry] " : ""}Updated ${file}: ${changed} source(s)`);
      if (!DRY) await writeFile(join(RELEASES_DIR, file), serialize(raw, data), "utf8");
    }
  }

  // 4. Resolve dead archive.org/details/ page URLs.
  let detailsFixed = 0;
  if (DETAILS) {
    const files = (await readdir(RELEASES_DIR)).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const { raw, data } = await loadReleases(file);
      const id = file.replace(".json", "");
      let changed = 0;
      for (const entry of data) {
        if (!entry.unavailableReason || !entry.url) continue;
        if (!/archive\.org\/details\//i.test(entry.url)) continue;
        const resolved = await resolveDetailsUrl(id, entry);
        if (!resolved) continue;
        const ext = extensionOf(resolved.filename);
        if (!ext) continue;
        const base = String(entry.filename || entry.id).replace(/\.[a-z0-9]+$/i, "");
        entry.url = resolved.url;
        entry.format = ext;
        entry.filename = `${base}.${ext}`;
        entry.sizeBytes = resolved.sizeBytes;
        entry.health = "ok";
        delete entry.unavailableReason;
        changed++;
        detailsFixed++;
        console.log(`${DRY ? "[dry] " : ""}Details URL resolved: ${file} -> ${resolved.url.substring(0, 90)}`);
        await new Promise((r) => setTimeout(r, 400));
      }
      if (changed) {
        updatedFiles++;
        if (!DRY) await writeFile(join(RELEASES_DIR, file), serialize(raw, data), "utf8");
      }
    }
  }

  console.log(`\n=== APPLIED ===`);
  console.log(`Replacement sources applied: ${valid.length}`);
  console.log(`Details URLs resolved: ${detailsFixed}`);
  console.log(`Release files updated: ${updatedFiles}${DRY ? " (dry run)" : ""}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
