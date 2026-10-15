// ../pub-game-store/native/state/downloads.js
// reconstructed from the esbuild bundle in eboot.bin

import { t } from '../i18n/core.js';
import { getGame } from './catalog.js';
import { createDownloadQueue } from './download-queue.js';
import { createSourceResolver } from './download-sources.js';
import { createMockDownloadQueue } from './mock-download-queue.js';
import { consoleRoots } from './roots.js';
import { createShadowMountProbe } from './shadowmount.js';
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
    browserCapture: BrowserCapture,
    releasesOf: (id) => getGame(id)?.releases || []
  }));
  var shadowMountUp = Platform.OS === "ps5" ? createShadowMountProbe({ http: Http, now: Date.now }) : async () => true;
  function freeBytes(root2) {
    try {
      return FileSystem.diskUsage(root2).free;
    } catch {
      return null;
    }
  }
  function driveName(root2) {
    if (root2 === "/data") return t("drives.internal");
    const mount = /^\/mnt\/(usb|ext)(\d+)$/.exec(root2);
    if (!mount) return t("drives.thisDevice");
    return t(mount[1] === "usb" ? "drives.usb" : "drives.extended", { number: String(Number(mount[2]) + 1) });
  }
  function storageRoots() {
    if (Platform.OS !== "ps5") return [FileSystem.dataDir];
    return consoleRoots(() => FileSystem.mounts());
  }

export { downloadQueue, driveName, freeBytes, shadowMountUp, storageRoots };
