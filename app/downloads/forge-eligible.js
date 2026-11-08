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

  // A lone folder down is the game whatever it is named (a merged dump or a backport sits alone
  // under its extraction folder). An extraction may publish supplemental folders beside it -- a
  // patch, an update, a backport -- and those are never the game, so they are set aside first:
  // what is left has to be a single folder resolving to a game. Two folders left to choose
  // between is still the queue's own choice to make, and it already put the game where it
  // belongs, so nothing is guessed.
  function gameFolder(fs, path) {
    for (let depth = 0; depth <= 16; depth++) {
      if (GAME.every((marker) => fs.exists(`${path}${marker}`))) return path;
      let children;
      try {
        children = fs.readDir(path).filter((entry) => entry.isDirectory && !entry.name.startsWith(".ps5-react"));
      } catch {
        return "";
      }
      const usable = children.filter((entry) => !PATCH_FOLDER.test(entry.name) && !BACKPORT_FOLDER.test(entry.name));
      if (usable.length !== 1) return "";
      path = `${path}/${usable[0].name}`;
    }
    return "";
  }

  // The folder to compress, or "" when this job must not be offered one.
  function compressibleFolder(job, fs) {
    if (!job || !COMPLETE.includes(job.state)) return "";
    if (job.packages?.length) return "";
    if (job.artifact?.nextAction === "installer-required") return "";
    const path = destination(job);
    if (!path) return "";
    return eligibleFolder(fs, path);
  }

  // The same check for a folder already sitting on disk, where no job is around to describe it:
  // under the console's own roots, not a package, not a patch, and holding a game.
  function eligibleFolder(fs, path) {
    if (!path || PACKAGE.test(path) || !own(path)) return "";
    const name = path.slice(path.lastIndexOf("/") + 1);
    if (PATCH_FOLDER.test(name) || BACKPORT_FOLDER.test(name)) return "";
    return gameFolder(fs, path);
  }

export { compressibleFolder, eligibleFolder, own };
