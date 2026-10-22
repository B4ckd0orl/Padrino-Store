// ../pub-game-store/native/ui/UpdateDialog.jsx
// reconstructed from the esbuild bundle in eboot.bin

import '../assets/Inter-Regular.ttf';
import '../assets/JetBrainsMono-Regular.ttf';
import asciiDial from '../assets/ascii-dial.png';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useEffect, useState } from 'react';
import { formatPercent2 } from '../i18n/core.js';
import { useT } from '../i18n/index.js';
import { formatBytes } from '../state/size.js';
import { installUpdate, useAvailableUpdate } from '../state/update.js';
import { ImageReplaceError } from '../state/updater.js';
import { Button2 } from './Button.jsx';
import { ProgressBar } from './ProgressBar.jsx';
import { ShimmerText } from './ShimmerText.jsx';
import { px } from './scale.js';
import { VERSION } from '../version.js';
import { BackHandler, FocusScope, Image, ScrollView, Text, View } from '@ps5-react/core';

  var CLOSE_DELAY_MS = 2e3;
  var REOPEN_DELAY_MS = 11e3;
  var DIAL = 324;
  var STATUS2 = { fontFamily: "JetBrainsMono-Regular", fontSize: 23 };
  // GitHub release body → bullet list: strip markdown noise, keep one line per change.
  function changelogLines(body) {
    if (!body) return [];
    return body.split(/\r?\n/).map((line) => line.replace(/^\s*[-*•]\s+/, "").replace(/^\s*\d+[.)]\s+/, "").trim()).filter((line) => line && !/^#{1,6}\s/.test(line) && !/^```/.test(line)).slice(0, 24);
  }
  function Changelog({ body, title }) {
    const lines = changelogLines(body);
    if (!lines.length) return null;
    return /* @__PURE__ */ (0, jsxs)(View, { style: { width: 700, gap: 10 }, children: [
      /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "JetBrainsMono-Regular", fontSize: 16, color: "#6e675e", letterSpacing: 2 }, children: title.toLocaleUpperCase() }),
      /* @__PURE__ */ (0, jsx)(ScrollView, { style: { maxHeight: 280 }, children: /* @__PURE__ */ (0, jsx)(View, { style: { gap: 8, paddingRight: 8 }, children: lines.map((line) => /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "flex-start", gap: 12 }, children: [
        /* @__PURE__ */ (0, jsx)(View, { style: { width: 6, height: 6, borderRadius: 3, marginTop: 10, backgroundColor: "#e09f3e" } }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { flex: 1, fontFamily: "Inter-Regular", fontSize: 20, color: "#a39c92", lineHeight: 30 }, children: line })
      ] }, line)) }) })
    ] });
  }
  function UpdateDialog() {
    const t2 = useT();
    const update = useAvailableUpdate();
    const [dismissed, setDismissed] = (0, useState)(false);
    const [progress, setProgress] = (0, useState)(null);
    const [error2, setError] = (0, useState)(null);
    const state = progress?.state;
    const relaunch = progress?.relaunch;
    (0, useEffect)(() => {
      if (state !== "done") return;
      // A payload update does not relaunch from inside the app — the dialog stays open so the
      // user reads where the .elf landed and reloads it from their loader.
      if (progress?.payload) return;
      const id = setTimeout(() => BackHandler.exitApp({ relaunch }), relaunch ? CLOSE_DELAY_MS : REOPEN_DELAY_MS);
      return () => clearTimeout(id);
    }, [state, relaunch, progress?.payload]);
    if (!update || dismissed) return null;
    const install = async () => {
      setError(null);
      setProgress({ state: "downloading", written: 0, total: update.size });
      try {
        const { relaunch: relaunch2, payload: payload2 } = await installUpdate(update, setProgress);
        setProgress({ state: "done", relaunch: relaunch2, payload: payload2 });
      } catch (failure) {
        setProgress(null);
        setError(failure instanceof ImageReplaceError ? [t2("update.replaceFailed"), t2("update.replaceByHand")] : [failure.message]);
      }
    };
    const close = () => {
      if (!progress) setDismissed(true);
      return true;
    };
    const fraction = state === "downloading" && progress.total ? progress.written / progress.total : state ? 1 : 0;
    const installed = update.installed;
    const donePayload = state === "done" && Boolean(progress?.payload);
    const label = error2 ? t2("update.failed") : state === "done" || installed ? t2("update.done") : state ? t2("update.updating") : t2("update.available");
    const status = state === "downloading" ? `${formatPercent2(Math.round(fraction * 100)).replace(/\u202f/g, "\xA0")}  \xB7  ${formatBytes(progress.written)} / ${formatBytes(progress.total)}` : state === "installing" ? t2("update.installing") : state === "done" && !donePayload ? t2(relaunch ? "update.restarting" : "update.reopen") : null;
    return (
      // A modal: the page's actions stop here, and nothing leaves it while it installs.
      /* @__PURE__ */ (0, jsx)(FocusScope, { trap: true, autoFocus: true, onBack: close, onAction: () => true, children: /* @__PURE__ */ (0, jsx)(View, { style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 50, alignItems: "center", justifyContent: "center", backgroundColor: "#121110e6" }, children: /* @__PURE__ */ (0, jsxs)(View, { style: { width: 1410, flexDirection: "row", alignItems: "center", gap: 72, borderRadius: 24, borderWidth: 1, borderColor: "#e09f3e33", backgroundColor: "#121110", paddingHorizontal: 72, paddingVertical: 60 }, children: [
        /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 24 }, children: [
          /* @__PURE__ */ (0, jsx)(Image, { source: asciiDial, resizeMode: "contain", style: { width: px(DIAL), height: px(DIAL) } }),
          state ? /* @__PURE__ */ (0, jsx)(ProgressBar, { fraction, width: DIAL, active: true }) : null
        ] }),
        /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 36 }, children: [
          /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 18 }, children: [
            /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "JetBrainsMono-Regular", fontSize: 20, color: "#6e675e", letterSpacing: 3 }, children: label }),
            /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 66, fontWeight: 600, color: "#f5f1ea", letterSpacing: -1.65 }, children: `v${update.version}` }),
            /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "JetBrainsMono-Regular", fontSize: 23, color: "#a39c92" }, children: `v${VERSION}  \u2192  v${update.version}` })
          ] }),
          state && !donePayload ? null : donePayload ? /* @__PURE__ */ (0, jsxs)(View, { style: { width: 700, gap: 8 }, children: [
            /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 22, color: "#a39c92", lineHeight: 32 }, children: t2("update.payload.reload") }),
            /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "JetBrainsMono-Regular", fontSize: 19, color: "#6e675e" }, children: progress.payload })
          ] }) : /* @__PURE__ */ (0, jsxs)(View, { style: { width: 700, gap: 18 }, children: [
            error2 ? error2.map((text) => /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 22, color: "#fde68a", lineHeight: 32 }, children: text }, text)) : null,
            !error2 && installed ? /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 8 }, children: [
              /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 22, color: "#a39c92", lineHeight: 32 }, children: t2("update.reopenInstalled", { version: update.version }) }),
              update.stuck ? /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 22, color: "#fde68a", lineHeight: 32 }, children: t2("update.restartConsole") }) : null
            ] }) : null,
            !error2 && !installed ? /* @__PURE__ */ (0, jsx)(Changelog, { body: update.notes, title: t2("update.changelog") }) : null,
            !error2 && !installed && !update.notes ? /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 22, color: "#a39c92", lineHeight: 32 }, children: t2("update.detail") }) : null
          ] }),
          status && !donePayload ? /* @__PURE__ */ (0, jsx)(View, { focusable: true, children: /* @__PURE__ */ (0, jsx)(ShimmerText, { textStyle: STATUS2, children: status }) }) : donePayload ? /* @__PURE__ */ (0, jsx)(View, { style: { flexDirection: "row", gap: 18 }, children: /* @__PURE__ */ (0, jsx)(Button2, { variant: "primary", size: "lg", label: t2("update.quit"), autoFocus: true, onPress: () => BackHandler.exitApp({ relaunch: false }) }) }) : installed ? /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", gap: 18 }, children: [
            /* @__PURE__ */ (0, jsx)(Button2, { variant: "primary", size: "lg", label: t2("update.quit"), autoFocus: true, onPress: () => BackHandler.exitApp({ relaunch: false }) }),
            /* @__PURE__ */ (0, jsx)(Button2, { variant: "outline", size: "lg", label: t2("update.later"), onPress: close })
          ] }) : /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", gap: 18 }, children: [
            /* @__PURE__ */ (0, jsx)(Button2, { variant: "primary", size: "lg", icon: "download", label: t2(error2 ? "update.retry" : "update.install"), autoFocus: true, onPress: install }),
            /* @__PURE__ */ (0, jsx)(Button2, { variant: "outline", size: "lg", label: t2(error2 ? "update.close" : "update.later"), onPress: close })
          ] })
        ] })
      ] }) }) })
    );
  }

export { UpdateDialog };
