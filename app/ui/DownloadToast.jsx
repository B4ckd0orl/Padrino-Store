// ../pub-game-store/native/ui/DownloadToast.jsx
// reconstructed from the esbuild bundle in eboot.bin

import { jsx, jsxs } from 'react/jsx-runtime';
import { useEffect, useState } from 'react';
import { useDownloadAlerts } from '../downloads/useDownloadAlerts.js';
import { CompressDialog } from '../forge/CompressDialog.jsx';
import { packError, startPack } from '../forge/start-pack.js';
import { useT } from '../i18n/index.js';
import { getGame } from '../state/catalog.js';
import { forgeAsk, forgeDeleteOriginal, forgeLevel } from '../state/forge-ask.js';
import { useNavActions, useNavState } from '../state/nav.jsx';
import { Toast } from './Toast.jsx';
import { pulseNotice } from './haptics.js';
import { AnimatePresence } from '@ps5-react/core';

  var TOAST_MS2 = 6e3;
  function DownloadToast({ actionRef }) {
    const t2 = useT();
    const [alert, setAlert] = (0, useState)(null);
    // A finished folder offered for compression, held here so the dialog outlives the toast.
    const [ask, setAsk] = (0, useState)(null);
    useDownloadAlerts((next) => {
      pulseNotice();
      setAlert((last) => ({ ...next, n: (last?.n ?? 0) + 1 }));
    });
    const { top } = useNavState();
    const nav = useNavActions();
    const quiet = top.name === "downloads" || top.name === "game" && top.id === alert?.gameId;
    const shown = alert && !quiet ? alert : null;
    const game = shown && getGame(shown.gameId);
    const failed = shown?.kind === "failed";
    const mode = forgeAsk();
    // A download that landed as a game folder offers its compression here; the answer stored in
    // settings decides whether that is asked for, started at once, or not offered at all.
    const offer = Boolean(shown?.folder) && mode !== "never";
    const packed = (folder, title) => {
      const saved = forgeLevel();
      const level = saved.mode === mode ? saved.level : mode === "zstd" ? 9 : 0;
      // The engine may have to be started first; the toast says so for as long as that lasts.
      const preparing = () => setAlert((last) => last ? { ...last, message: t2("forge.auto.starting") } : last);
      startPack({ folder, mode, level, deleteAfter: forgeDeleteOriginal(), preparing }).then((code) => {
        if (code) setAsk({ folder, title, error: packError(t2, code) });
        else setAlert((last) => last ? { ...last, message: t2("forge.ask.packing"), folder: null, n: last.n + 1 } : last);
      });
    };
    (0, useEffect)(() => {
      if (!alert) return void 0;
      const id = setTimeout(() => setAlert(null), TOAST_MS2);
      return () => clearTimeout(id);
    }, [alert]);
    actionRef.current = shown && (() => {
      if (offer && (mode === "zstd" || mode === "lz4")) {
        packed(shown.folder, shown.title);
        return;
      }
      setAlert(null);
      if (offer) setAsk({ folder: shown.folder, title: shown.title, error: "" });
      else if (failed || !game) nav.push({ name: "downloads" });
      else nav.openGame(game.id);
    });
    // The job is away: the toast says so and stops offering the folder it just packed.
    const started = () => {
      setAsk(null);
      setAlert((last) => last ? { ...last, message: t2("forge.ask.packing"), folder: null, n: last.n + 1 } : last);
    };
    return /* @__PURE__ */ (0, jsxs)(AnimatePresence, { children: [
      shown ? /* @__PURE__ */ (0, jsx)(Toast, {
        game,
        icon: failed ? "alert" : "circleCheck",
        status: shown.message,
        title: shown.title,
        failed,
        action: { button: "r2", label: t2(failed ? "toast.openDownloads" : offer ? "toast.compress" : "toast.viewGame") },
        duration: TOAST_MS2
      }, shown.n) : null,
      ask ? /* @__PURE__ */ (0, jsx)(CompressDialog, {
        folder: ask.folder,
        title: ask.title,
        initialError: ask.error,
        onClose: () => setAsk(null),
        onStarted: started
      }, ask.folder) : null
    ] });
  }

export { DownloadToast };
