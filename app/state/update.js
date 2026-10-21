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
  // Espejo del mismo JSON del release, servido desde raw.githubusercontent: si api.github.com
  // no responde desde la consola (DNS, límite de peticiones, caída), el check sigue teniendo dónde mirar.
  var FEED_MIRROR = "https://raw.githubusercontent.com/B4ckd0orl/Padrino-Store/main/update-feed.json";
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
    const feeds = feed === FEED_MIRROR ? [feed] : [feed, FEED_MIRROR];
    return updater = createUpdater({
      http: Http,
      downloads: Downloads,
      archives: Archives,
      fs: FileSystem,
      version: VERSION,
      feed: feeds,
      asset: assetFor(install),
      marker: `${FileSystem.dataDir}/padrino-store/pending-image.json`,
      ...install
    });
  }
  var CHECK_DELAY_MS = 4e3;
  // El check corre una sola vez al abrir; si el release se publica con la app ya abierta
  // (o GitHub falla ese instante) la consola se entera tarde. Se reintenta solo:
  // fallo -> backoff, y sin novedad -> otra pasada cada pocos minutos.
  var RETRY_MS = [15e3, 30e3, 60e3, 120e3, 300e3];
  var REFRESH_MS = 180e3;
  function useAvailableUpdate() {
    const [update, setUpdate] = (0, useState)(null);
    (0, useEffect)(() => {
      let cancelled = false;
      let timer = null;
      let failures = 0;
      const schedule = (ms) => {
        timer = setTimeout(run, ms);
      };
      const run = async () => {
        if (cancelled) return;
        try {
          const current = await instance2();
          void current.cleanup();
          const found = await current.check();
          if (cancelled) return;
          if (found) {
            setUpdate(found);
            return;
          }
          failures = 0;
          schedule(REFRESH_MS);
        } catch (error2) {
          console.log(`padrino: update check failed: ${error2.message}`);
          if (cancelled) return;
          schedule(RETRY_MS[Math.min(failures, RETRY_MS.length - 1)]);
          failures++;
        }
      };
      schedule(CHECK_DELAY_MS);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
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
