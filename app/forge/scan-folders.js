// The list Compresión offers: every folder on the drives the engine may touch, read straight
// from the disk. A finished download does not stay where it was extracted -- the queue moves it
// to homebrew/<name>-app when it completes (download-queue.js) -- so both trees are read here.
// A folder the console installed itself, an image, a patch, a backport or a plain file never
// reaches the list; which folders those are is decided in downloads/forge-eligible.js.

import { folderSize } from '../files/scan.js';
import { eligibleFolder, titleIn } from '../downloads/forge-eligible.js';
import { packedFormat } from './detect.js';

// Which scan kinds hold folders worth judging: the extraction's own tree, and homebrew where the
// queue publishes finished games (the scan calls that kind "images" -- the folder ShadowMount
// reads -- so the name says nothing about what is inside it).
const FOLDER_KINDS = ['extracted', 'images'];

// rowsFor(entries, fs, {titles, titleIds, gameTitle}) -> the rows the screen shows, one per
// folder to compress or already packed, biggest first. `entries` is what files/scan.js read;
// `titles`/`titleIds` describe the finished downloads the queue still knows (path -> title,
// path -> title id); `gameTitle` maps a title id to the catalog's name for it. Everything that
// decides whether a folder qualifies lives in forge-eligible.js, so the dialog a finished
// download offers and this list cannot disagree.
function rowsFor(entries, fs, { titles = new Map(), titleIds = new Map(), gameTitle = () => null } = {}) {
  const rows = new Map();
  for (const entry of entries) {
    if (!entry.isDirectory || !FOLDER_KINDS.includes(entry.kind)) continue;
    // The queue's own title id for this path is what settles which of several folders is the
    // game, the way the queue's finder uses the job's title id among the same candidates.
    const known = titleIds.get(entry.path) ?? entry.titleId ?? undefined;
    const packed = packedFormat(fs, entry.path);
    const folder = packed ? entry.path : eligibleFolder(fs, entry.path, known);
    if (!folder) continue;
    const size = folder === entry.path ? entry.size : folderSize(fs, folder, 4, { left: 4000 });
    // The title id the row carries: what the folder's own name says, else what its param.json
    // says (a game folder named by hand has no id in the name), else the queue's record. The
    // title shown: the catalog's name for that id first, else the name the download had.
    const titleId = entry.titleId ?? titleIn(fs, folder) ?? titleIds.get(entry.path) ?? titleIds.get(folder) ?? '';
    const title = (titleId && gameTitle(titleId)) || titles.get(entry.path) || titles.get(folder) || '';
    rows.set(folder, { path: folder, name: folder.slice(folder.lastIndexOf('/') + 1), size, packed, title, titleId });
  }
  return [...rows.values()].sort((a, b) => b.size - a.size || a.name.localeCompare(b.name));
}

export { FOLDER_KINDS, rowsFor };
