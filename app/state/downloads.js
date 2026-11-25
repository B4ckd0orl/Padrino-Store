// ../pub-game-store/native/state/downloads.js
// reconstructed from the esbuild bundle in eboot.bin

import { getGame } from './catalog.js';
import { driveName, driveShortName } from './drive-names.js';
import { createDownloadQueue } from './download-queue.js';
import { createSourceResolver } from './download-sources.js';
import { createMockDownloadQueue } from './mock-download-queue.js';
import { consoleRoots } from './roots.js';
import { createShadowMountProbe } from './shadowmount.js';
import { createPkgHelper } from './pkg-helper.js';
import { Archives, BrowserCapture, DownloadFormats, Downloads, FileSystem, Http, Linking, Notifications, Packages, Platform, Power } from '@ps5-react/core';

  var instance;
  var mocked = () => Platform.OS !== "ps5" && FileSystem.exists(`${FileSystem.dataDir}/padrino-store/mock-downloads`);
  var stateDir = Platform.OS === "ps5" ? "/data/ps5-react/PPSA99059/queue" : void 0;
  var downloadQueue = () => instance ?? (instance = mocked() ? createMockDownloadQueue() : createDownloadQueue({
    fs: FileSystem,
    archives: Archives,
    downloads: Downloads,
    http: Http,
    formats: DownloadFormats,
    dataDir: FileSystem.dataDir,
    stateDir,
    platform: Platform.OS,
    notifications: Notifications,
    power: Power,
    linking: Linking,
    sources: createSourceResolver({ http: Http }),
    packages: Packages,
    // On the PS5 the console's Downloads take a package from the helper payload, which outlives the app.
    helper: Platform.OS === "ps5" && typeof Packages.startHelper === "function" ? createPkgHelper({ packages: Packages, http: Http, fs: FileSystem, dir: "/data/ps5-react/PPSA99059/queue", log: "/data/ps5-react/PPSA99059/pkg-helper.log" }) : null,
    browserCapture: BrowserCapture,
    releasesOf: (id) => getGame(id)?.releases || []
  }));
  var shadowMountUp = Platform.OS === "ps5" ? createShadowMountProbe({ http: Http, now: Date.now }) : async () => true;
  // The mounts and the free space of a drive change only when a drive is plugged or a download
  // writes: a few seconds of staleness shows nothing the player can act on differently, and both
  // calls are made again for every screen that lists the roots (state/roots.js reads the mounts
  // on each call, freeBytes a stat per root).
  var SPACE_TTL_MS = 3e3;
  var freeCache = { at: 0, values: /* @__PURE__ */ new Map() };
  function freeBytes(root2) {
    const hit = freeCache.values.get(root2);
    if (hit && Date.now() - hit.at < SPACE_TTL_MS) return hit.value;
    let value = null;
    try {
      value = FileSystem.diskUsage(root2).free;
    } catch {
      value = null;
    }
    freeCache.values.set(root2, { at: Date.now(), value });
    return value;
  }
  var rootsCache = { at: 0, value: null };
  function storageRoots() {
    if (Platform.OS !== "ps5") return [FileSystem.dataDir];
    if (rootsCache.value && Date.now() - rootsCache.at < SPACE_TTL_MS) return rootsCache.value;
    const roots = consoleRoots(() => FileSystem.mounts());
    rootsCache.at = Date.now();
    rootsCache.value = roots;
    return roots;
  }

export { downloadQueue, driveName, driveShortName, freeBytes, shadowMountUp, storageRoots };
