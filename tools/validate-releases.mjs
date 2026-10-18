// Validates release JSON files after link repairs: schema consistency and
// dead-link statistics. No network access.
// Usage: node tools/validate-releases.mjs

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const RELEASES = "C:/Users/SysVoid/Desktop/storemia/padrino-store/app/data/releases";

async function main() {
  const files = (await readdir(RELEASES)).filter((f) => f.endsWith(".json"));
  let parseErrors = 0;
  let schemaErrors = 0;
  let deadSources = 0;
  let fullyDeadFiles = 0;
  let partialDeadFiles = 0;
  let filesChecked = 0;
  const problems = [];

  for (const file of files) {
    let data;
    try {
      data = JSON.parse(await readFile(join(RELEASES, file), "utf8"));
    } catch (e) {
      parseErrors++;
      problems.push(`${file}: PARSE ERROR ${e.message}`);
      continue;
    }
    if (!Array.isArray(data) || !data.length) {
      schemaErrors++;
      problems.push(`${file}: not a non-empty array`);
      continue;
    }
    filesChecked++;
    let dead = 0;
    for (const rel of data) {
      if (rel.unavailableReason) { deadSources++; dead++; }
      if (!rel.url || !rel.format || !rel.id) {
        schemaErrors++;
        problems.push(`${file} [${rel.id}]: missing url/format/id`);
        continue;
      }
      const lower = rel.filename ? rel.filename.toLowerCase() : "";
      const ext = rel.filename ? lower.slice(lower.lastIndexOf(".") + 1) : "";
      const equivalent = (x) => (x === "fpkg" ? "pkg" : x);
      if (rel.filename && ext && equivalent(ext) !== equivalent(rel.format)) {
        schemaErrors++;
        problems.push(`${file} [${rel.id}]: filename .${ext} disagrees with format ${rel.format}`);
      }
      if (rel.unavailableReason && !/Source unavailable|Invalid volume|Ambiguous|missing volumes/i.test(rel.unavailableReason)) {
        schemaErrors++;
        problems.push(`${file} [${rel.id}]: odd unavailableReason: ${rel.unavailableReason}`);
      }
    }
    const anyAlive = data.some((r) => !r.unavailableReason && r.url);
    if (dead > 0 && !anyAlive) fullyDeadFiles++;
    else if (dead > 0) partialDeadFiles++;
  }

  console.log(`Files: ${filesChecked} ok, ${parseErrors} parse errors, ${schemaErrors} schema errors`);
  console.log(`Sources with unavailableReason: ${deadSources}`);
  console.log(`Fully dead files: ${fullyDeadFiles}, partially dead: ${partialDeadFiles}`);
  if (problems.length) {
    console.log(`\nProblems (${problems.length}):`);
    for (const p of problems.slice(0, 50)) console.log(`  ${p}`);
    if (problems.length > 50) console.log(`  ... +${problems.length - 50} more`);
  } else {
    console.log(`\nNo problems found.`);
  }
  process.exit(parseErrors || schemaErrors ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
