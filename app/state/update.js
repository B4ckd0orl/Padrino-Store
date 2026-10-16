// ../pub-game-store/native/state/update.js
// reconstructed from the esbuild bundle in eboot.bin

import { useEffect, useState } from 'react';
import { downloadQueue, storageRoots } from './downloads.js';
import { locateInstall } from './install-location.js';
import { createUpdater } from './updater.js';
import { VERSION } from '../version.js';
import { Archives, Downloads, FileSystem, Http, Platform } from '@ps5-react/core';

  var TITLE = "PPSA99059";
  var FEED = "https://api.github.com/repos/B4ckd0orl/Padrino-Store/releases/latest";
  var FEED_OVERRIDES = [`${FileSystem.dataDir}/padrino-store/update-feed`, `/data/ps5-react/${TITLE}/padrino-store/update-feed`];
  function location() {
    if (Platform.OS !== "ps5") return { installDir: `${FileSystem.dataDir}/homebrew/${TITLE}`, workDir: `${FileSystem.dataDir}/padrino-update` };
    return locateInstall({ http: Http, fs: FileSystem, title: TITLE, roots: storageRoots });
  }
  // One package carries an update: the image alone, for an image install; the full app folder,
  // for a folder install (the updater swaps it in with backup + rollback and relaunches).
  function assetFor({ image, installDir }) {
    if (Platform.OS !== "ps5") return "PadrinoStore-desktop.zip";
    if (image) return "update.zip";
    return installDir ? "update-app.zip" : null;
  }
  var foundInstall;
  var located = new Promise((resolve2) => {
    foundInstall = resolve2;
  });
  var updater;
  async function instance2() {
    if (updater) return updater;
    const install = await location();
    foundInstall(install);
    const override = FEED_OVERRIDES.find((path) => {
      try {
        return FileSystem.exists(path);
      } catch {
        return false;
      }
    });
    const feed = override ? FileSystem.readFile(override).trim() : FEED;
    return updater = createUpdater({
      http: Http,
      downloads: Downloads,
      archives: Archives,
      fs: FileSystem,
      version: VERSION,
      feed,
      asset: assetFor(install),
      marker: `${FileSystem.dataDir}/padrino-store/pending-image.json`,
      ...install
    });
  }
  var CHECK_DELAY_MS = 4e3;
  function useAvailableUpdate() {
    const [update, setUpdate] = (0, useState)(null);
    (0, useEffect)(() => {
      const id = setTimeout(async () => {
        try {
          const current = await instance2();
          void current.cleanup();
          setUpdate(await current.check());
        } catch (error2) {
          console.log(`padrino: update check failed: ${error2.message}`);
        }
      }, CHECK_DELAY_MS);
      return () => clearTimeout(id);
    }, []);
    return update;
  }
  async function installUpdate(update, onProgress) {
    try {
      await downloadQueue().yieldArchives?.();
    } catch (error2) {
      console.log(`[update] queue not yielded: ${error2.message}`);
    }
    return (await instance2()).install(update, onProgress);
  }
  function useFolderInstall() {
    const [folder, setFolder] = (0, useState)(false);
    (0, useEffect)(() => {
      if (Platform.OS === "ps5") located.then((install) => setFolder(Boolean(install.installDir)));
    }, []);
    return folder;
  }

export { installUpdate, useAvailableUpdate, useFolderInstall };
