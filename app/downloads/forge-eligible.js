// Which finished download may be compressed: the store only offers a pack job over a folder it
// owns, holding a game the runtime can launch. A package the console installed, a plain file, a
// supplemental folder (patch, update, backport) or a path outside the console's own roots is
// never offered, so the engine is only ever pointed somewhere a download we started landed.

import { COMPLETE } from '../state/download-queue.js';

  var PATCH_FOLDER = /(?:^|[-_ .(\[])(?:patch|update|upd)(?:$|[-_ .)\]\d])/i;
  var BACKPORT_FOLDER = /(?:^|[-_ .(\[])backport(?:$|[-_ .)\]\d])/i;
  var PACKAGE = /\.f?pkg$/i;
  var GAME = ["/eboot.bin", "/sce_sys/param.json"];
  // Where a download this app started can only have landed: the console's own data, or a drive
  // plugged into it (the same roots download-root.js accepts).
  var ROOT = /^\/(?:data|mnt\/(?:usb|ext)\d+)(?:\/|$)/;

  function own(path) {
    return ROOT.test(path);
  }

  // The download's folder: what the extraction published, else where the file itself landed.
  function destination(job) {
    const path = job?.output ?? job?.artifact?.destination;
    return typeof path === "string" && path.length > 1 ? path : "";
  }

  // Every folder under `path` holding a game, read the way the queue's own finder reads the same
  // trees (download-queue.js, gameFolders): breadth first, a few levels deep, capped so a
  // pathological tree cannot spin. Keep the two in step.
  function gameFolders(fs, path) {
    const found = [];
    const queue = [{ path, depth: 0 }];
    for (let visited = 0; queue.length && visited < 2e3 && found.length < 16; visited++) {
      const { path: current, depth } = queue.shift();
      if (GAME.every((marker) => fs.exists(`${current}${marker}`))) {
        found.push(current);
        continue;
      }
      if (depth >= 6) continue;
      let children;
      try {
        children = fs.readDir(current).filter((entry) => entry.isDirectory && !entry.name.startsWith(".ps5-react"));
      } catch {
        continue;
      }
      for (const child of children) queue.push({ path: `${current}/${child.name}`, depth: depth + 1 });
    }
    return found;
  }

  // The title id the folder's own files carry, read from its param.json (the queue's own titleIn
  // reads the same file the same way).
  function titleIn(fs, folder) {
    try {
      const parsed = JSON.parse(fs.readFile(`${folder}/sce_sys/param.json`));
      return typeof parsed?.titleId === "string" ? parsed.titleId : null;
    } catch {
      return null;
    }
  }

  // A lone chain of one-child directories down to the game, the way the queue's own finder takes
  // it before the breadth-first search (download-queue.js, gameFolder): deeper than the search
  // ever walks, so a game far down a narrow extraction is still found. A patch at the end of the
  // chain is still turned away by the name filter below. Keep the two in step.
  function chainFolder(fs, path) {
    for (let depth = 0; depth <= 16; depth++) {
      if (GAME.every((marker) => fs.exists(`${path}${marker}`))) return path;
      let children;
      try {
        children = fs.readDir(path).filter((entry) => entry.isDirectory && !entry.name.startsWith(".ps5-react"));
      } catch {
        return "";
      }
      if (children.length !== 1) return "";
      path = `${path}/${children[0].name}`;
    }
    return "";
  }

  // The folder to compress, the way the queue's own finder (findGame) chooses among the same
  // candidates: a lone folder down is the game whatever it is named; among several, patches,
  // updates and backports below the folder holding them all are set aside, then the title id the
  // download was for decides. Only one left is taken, else nothing is guessed. Keep the two in
  // step with download-queue.js.
  function gameFolder(fs, path, titleId) {
    const lone = chainFolder(fs, path);
    const found = lone ? [lone] : gameFolders(fs, path);
    if (!found.length) return "";
    let games;
    if (found.length > 1) {
      const parts = found.map((item) => item.split("/"));
      let shared = 0;
      while (parts.every((list) => shared < list.length - 1 && list[shared] === parts[0][shared])) shared++;
      const supplemental = (list) => list.slice(shared).some((segment) => PATCH_FOLDER.test(segment) || BACKPORT_FOLDER.test(segment));
      games = found.filter((item, index) => !supplemental(parts[index]));
    } else {
      games = found.filter((item) => !PATCH_FOLDER.test(item.slice(item.lastIndexOf("/") + 1)));
    }
    if (titleId) {
      const wanted = games.filter((item) => String(titleIn(fs, item) || "").toUpperCase() === String(titleId).toUpperCase());
      if (wanted.length) games = wanted;
    }
    return games.length === 1 ? games[0] : "";
  }

  // The folder to compress, or "" when this job must not be offered one.
  function compressibleFolder(job, fs) {
    if (!job || !COMPLETE.includes(job.state)) return "";
    if (job.packages?.length) return "";
    if (job.artifact?.nextAction === "installer-required") return "";
    const path = destination(job);
    if (!path) return "";
    return eligibleFolder(fs, path, job.titleId);
  }

  // The same check for a folder already sitting on disk, where no job is around to describe it:
  // under the console's own roots, not a package, not a patch itself, and holding a game. A folder
  // merely NAMED a patch may still be the wrapper a game came in; only a folder whose own files
  // are a game's (the markers at the top) with that name is turned away.
  function eligibleFolder(fs, path, titleId) {
    if (!path || PACKAGE.test(path) || !own(path)) return "";
    const name = path.slice(path.lastIndexOf("/") + 1);
    const atTop = GAME.every((marker) => fs.exists(`${path}${marker}`));
    if (atTop && (PATCH_FOLDER.test(name) || BACKPORT_FOLDER.test(name))) return "";
    return gameFolder(fs, path, titleId);
  }

export { compressibleFolder, eligibleFolder, own, titleIn };
