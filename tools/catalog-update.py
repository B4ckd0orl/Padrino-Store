#!/usr/bin/env python3
# The publisher of the catalog's incremental update: the file state/catalog-update.js fetches
# from the repository's "catalog" branch. The delta runs from the last release's build (the tag
# named by the feed this build starts with) to the commit being built: what changed there is
# what the consoles still on that release are missing, so the update is published for that
# release's version (a v1.N release runs 1.N.0) and the next release folds the rest into its
# own catalog, as the consumer's header says.
#
# Everything the app refuses is dropped entry by entry with its id printed (tools/
# validate-update.mjs runs state/catalog-update.js's valid(), the console's own check): one
# bad line would otherwise make every console refuse the whole file. An update bigger than the
# app reads (4 MB) fails instead of being cut. With nothing changed, the publisher exits
# quietly and the branch is left alone.
#
#   python3 tools/catalog-update.py             publish (CI: gh and GH_TOKEN)
#   python3 tools/catalog-update.py --dry-run   compute and check, write the file locally

import argparse
import base64
import datetime
import json
import os
import pathlib
import re
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
CATALOG = "app/data/catalog.js"
FOLDERS = (("releases", "app/data/releases"), ("pages", "app/data/pages"))
MAX_BYTES = 4 * 1024 * 1024
ID = re.compile(r"^[A-Z]{4}\d{5}$")


def log(message):
    print(f"catalog-update: {message}", flush=True)


def run(args, *, check=True, input_text=None):
    proc = subprocess.run(args, cwd=ROOT, capture_output=True, text=True,
                          encoding="utf-8", input=input_text)
    if check and proc.returncode != 0:
        sys.exit(f"catalog-update: {' '.join(args)} failed: "
                 f"{(proc.stderr or proc.stdout).strip()}")
    return proc


def git(*args, check=True):
    return run(["git", *args], check=check)


def gh(*args, check=True, input_text=None):
    return run(["gh", *args], check=check, input_text=input_text)


def feed_tag(path):
    # The feed the build started with names the release the consoles are on; the publish step
    # rewrites update-feed.json with the new release, so CI passes the copy made before it.
    try:
        feed = json.loads(pathlib.Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    tag = feed.get("tag_name") if isinstance(feed, dict) else None
    return tag if isinstance(tag, str) and tag else None


def version_for(ref, asked):
    if asked:
        return asked
    match = re.fullmatch(r"v1\.(\d+)", ref)
    if not match:
        sys.exit(f"catalog-update: {ref!r} is not a v1.N tag: pass --version")
    # The stamp the build gives a release: tag v1.N runs as 1.N.0 (build.yml).
    return f"1.{match.group(1)}.0"


def ensure_ref(ref):
    # A shallow checkout has no history: fetch just the baseline tag when it is missing.
    if git("rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}", check=False).returncode == 0:
        return
    for spec in (f"refs/tags/{ref}:refs/tags/{ref}", ref):
        if git("fetch", "--depth=1", "origin", spec, check=False).returncode == 0:
            return
    sys.exit(f"catalog-update: baseline {ref} is neither local nor fetchable")


def has_catalog(ref):
    return bool(git("ls-tree", ref, "--", CATALOG).stdout.strip())


def dump(source):
    proc = run(["node", str(ROOT / "tools" / "dump-catalog.mjs"), str(source)])
    return json.loads(proc.stdout)


def baseline_catalog(ref):
    shown = git("show", f"{ref}:{CATALOG}", check=False)
    if shown.returncode != 0:
        return {"games": [], "twins": []}
    handle = tempfile.NamedTemporaryFile("w", suffix=".mjs", delete=False, encoding="utf-8")
    try:
        handle.write(shown.stdout)
        handle.close()
        return dump(handle.name)
    finally:
        if not handle.closed:
            handle.close()
        os.unlink(handle.name)


def diff_games(base, current):
    # An entry the app would read differently (added, edited, or moved between the games and
    # twins blocks) ships whole; one that vanished from the catalog ships as a removal.
    entries = []
    for block in ("games", "twins"):
        before = {line.get("id"): line for line in base[block]}
        for line in current[block]:
            if before.get(line.get("id")) != line:
                entries.append({"block": block, "line": line})
    present = {line.get("id") for block in ("games", "twins") for line in current[block]}
    named = {entry["line"].get("id") for entry in entries}
    removed = [line.get("id") for block in ("games", "twins") for line in base[block]
               if line.get("id") not in present and line.get("id") not in named]
    return entries, removed


def diff_files(ref):
    # Only the release and page files that differ from the baseline: the console already has
    # the rest, exactly as this build ships them. A deleted file becomes null (drop it).
    result = {"releases": {}, "pages": {}}
    paths = [directory for _, directory in FOLDERS]
    listed = git("diff", "--name-status", "--no-renames", ref, "--", *paths).stdout
    for row in listed.splitlines():
        parts = row.split("\t")
        if len(parts) < 2:
            continue
        status, path = parts[0][0], parts[-1]
        folder = next((name for name, directory in FOLDERS if path.startswith(directory + "/")),
                      None)
        name = path.rsplit("/", 1)[-1]
        if folder is None or not name.endswith(".json"):
            continue
        file_id = name[:-5]
        if not ID.fullmatch(file_id):
            log(f"{path}: not an id the app accepts: left to the build")
            continue
        if status == "D" or not (ROOT / path).exists():
            result[folder][file_id] = None
            continue
        try:
            result[folder][file_id] = json.loads((ROOT / path).read_text(encoding="utf-8"))
        except ValueError:
            log(f"{path}: no longer JSON: left to the build")
    return result


def build_update(version, ref, entries, removed, files):
    return {
        "format": 1,
        "version": version,
        "base": ref,
        "generated": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "games": entries,
        "removed": removed,
        "releases": files["releases"],
        "pages": files["pages"],
    }


def serialize(update):
    return json.dumps(update, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def validate(path):
    proc = run(["node", str(ROOT / "tools" / "validate-update.mjs"), str(path)], check=False)
    if proc.returncode != 0:
        log((proc.stderr or proc.stdout).strip())
        return False
    return True


def pinpoint(path):
    proc = run(["node", str(ROOT / "tools" / "validate-update.mjs"), str(path), "--pinpoint"],
               check=False)
    if proc.returncode != 0:
        sys.exit("catalog-update: the pinpoint pass failed")
    return json.loads(proc.stdout)


def drop_refused(update, bad):
    # The ids are printed before anything goes: a gap in the published data must be visible.
    def report(label, ids):
        shown = ", ".join(str(item) for item in ids[:20])
        more = f" and {len(ids) - 20} more" if len(ids) > 20 else ""
        log(f"{label} refused by the app's checks, dropped: {shown}{more}")

    if bad["games"]:
        report("entries", [update["games"][index]["line"].get("id", f"#{index}")
                           for index in bad["games"]])
        dropped = set(bad["games"])
        update["games"] = [entry for index, entry in enumerate(update["games"])
                           if index not in dropped]
    if bad["removed"]:
        report("removals", bad["removed"])
        dropped = set(bad["removed"])
        update["removed"] = [item for item in update["removed"] if item not in dropped]
    for field in ("releases", "pages"):
        if bad[field]:
            report(field, bad[field])
            for file_id in bad[field]:
                update[field].pop(file_id, None)


def publish(payload, version):
    # The contents API takes the body on stdin: an update near the 4 MB cap does not fit in
    # an argument. The branch is created from the built commit the first time.
    repo = os.environ.get("GITHUB_REPOSITORY", "B4ckd0orl/Padrino-Store")
    branch = "catalog"
    if gh("api", f"repos/{repo}/git/ref/heads/{branch}", "--jq", ".object.sha",
          check=False).returncode != 0:
        log(f"creating the {branch} branch")
        gh("api", "-X", "POST", f"repos/{repo}/git/refs", "-f", f"ref=refs/heads/{branch}",
           "-f", f"sha={git('rev-parse', 'HEAD').stdout.strip()}")
    body = {
        "message": f"chore: catalog update for {version} [skip ci]",
        "content": base64.b64encode(payload).decode("ascii"),
        "branch": branch,
    }
    current = gh("api", f"repos/{repo}/contents/catalog-update.json?ref={branch}", "--jq", ".sha",
                 check=False)
    if current.returncode == 0 and current.stdout.strip():
        body["sha"] = current.stdout.strip()
    gh("api", "-X", "PUT", f"repos/{repo}/contents/catalog-update.json", "--input", "-",
       input_text=json.dumps(body))
    log(f"published for {version} on the {branch} branch")


def main():
    parser = argparse.ArgumentParser(description="publish the catalog's incremental update")
    parser.add_argument("--ref", help="baseline git ref (default: the tag named by --feed)")
    parser.add_argument("--feed", default=str(ROOT / "update-feed.json"),
                        help="feed JSON naming the baseline release")
    parser.add_argument("--version", help="target app version (default: 1.N.0 from a v1.N ref)")
    parser.add_argument("--dry-run", action="store_true",
                        help="write the update locally instead of publishing it")
    parser.add_argument("--out", help="where --dry-run writes (default: a temp file)")
    args = parser.parse_args()

    ref = args.ref or feed_tag(args.feed)
    if not ref:
        log("no baseline release named by the feed: nothing to publish")
        return 0
    version = version_for(ref, args.version)
    ensure_ref(ref)
    if not has_catalog(ref):
        log(f"{ref} predates the catalog: its consoles get their data with the app update")
        return 0
    base = baseline_catalog(ref)
    current = dump(ROOT / CATALOG)
    entries, removed = diff_games(base, current)
    files = diff_files(ref)
    if not entries and not removed and not files["releases"] and not files["pages"]:
        log(f"no catalog changes since {ref}: nothing to publish")
        return 0
    update = build_update(version, ref, entries, removed, files)

    with tempfile.TemporaryDirectory() as dir_:
        path = pathlib.Path(dir_) / "catalog-update.json"
        path.write_bytes(serialize(update))
        if not validate(path):
            bad = pinpoint(path)
            if not any(bad.values()):
                sys.exit("catalog-update: refused for a reason no single entry explains")
            drop_refused(update, bad)
            if not (update["games"] or update["removed"] or update["releases"]
                    or update["pages"]):
                log("everything the delta held was refused: nothing to publish")
                return 0
            path.write_bytes(serialize(update))
            if not validate(path):
                sys.exit("catalog-update: still refused after dropping the refused entries")
        payload = path.read_bytes()

    log(f"{len(update['games'])} entries, {len(update['removed'])} removed, "
        f"{len(update['releases'])} releases, {len(update['pages'])} pages, "
        f"{len(payload)} bytes for {version} (baseline {ref})")
    if len(payload) > MAX_BYTES:
        sys.exit(f"catalog-update: more than the app reads ({MAX_BYTES} bytes): "
                 f"split the data change across pushes")
    if args.dry_run:
        out = (pathlib.Path(args.out) if args.out
               else pathlib.Path(tempfile.gettempdir()) / "catalog-update.json")
        out.write_bytes(payload)
        log(f"written to {out}")
        return 0
    publish(payload, version)
    return 0


if __name__ == "__main__":
    sys.exit(main())
