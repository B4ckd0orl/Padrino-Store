// ../pub-game-store/native/ui/LanguageSheet.jsx
// reconstructed from the esbuild bundle in eboot.bin
// MODIFIED: the sheet is the app's settings: a download speed limit, navigation vibration, then the languages.
// MODIFIED: Data section with backup export/import (C3).

import '../assets/Inter-Regular.ttf';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { chooseLanguage, languageChoice, systemLocale, useT } from '../i18n/index.js';
import { LOCALES } from '../i18n/locales.js';
import { exportBackup } from '../state/backup.js';
import { storageRoots } from '../state/downloads.js';
import { replaceRecent, useRecent } from '../state/recent.js';
import { replaceSearches, useSearchHistory } from '../search/history.js';
import { useStoreActions, useWishlist } from '../state/store.jsx';
import { BackupList } from './BackupSheet.jsx';
import { FocusRing } from './FocusRing.jsx';
import { Icon } from './Icon.jsx';
import { SideSheet } from './SideSheet.jsx';
import { colors } from './colors.js';
import { setNavigationHaptics, useNavigationHaptics } from './haptics.js';
import { LIMITS, setSpeedLimit, useSpeedLimit } from '../state/speed-limit.js';
import { playError, playNotify } from './sounds.js';
import { FileSystem, Text, View, useIsFocused } from '@ps5-react/core';

  var nameOf = (code) => LOCALES.find((locale2) => locale2.code === code).name;
  function LanguageFace({ name, detail: detail2, checked }) {
    const focused = useIsFocused();
    return /* @__PURE__ */ (0, jsxs)(Fragment, { children: [
      /* @__PURE__ */ (0, jsx)(FocusRing, {}),
      /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 3 }, children: [
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 23, fontWeight: 600, color: "#f5f5f7" }, children: name }),
        /* @__PURE__ */ (0, jsx)(Text, { style: [{ fontFamily: "Inter-Regular", fontSize: 21, lineHeight: 30 }, { color: focused ? colors.fg : colors.muted }], children: detail2 })
      ] }),
      checked ? /* @__PURE__ */ (0, jsx)(Icon, { name: "check", color: colors.fg }) : /* @__PURE__ */ (0, jsx)(View, { style: { width: 24, height: 24 } })
    ] });
  }
  function Row4({ code, name, detail: detail2, checked, onPress }) {
    return /* @__PURE__ */ (0, jsx)(View, { focusKey: `language:${code}`, onPress, style: (_state) => [{ position: "relative", flexDirection: "row", alignItems: "center", gap: 24, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 18 }, _state.focused ? { backgroundColor: "#323232" } : null], children: /* @__PURE__ */ (0, jsx)(LanguageFace, { name, detail: detail2, checked }) });
  }
  // One segment of the speed limit (issue #15): every value in view, the chosen one filled. The D-pad
  // moves along the row and Cross picks, so no value has to be typed.
  function SpeedSegment({ limit, chosen }) {
    const t2 = useT();
    return /* @__PURE__ */ (0, jsxs)(View, { focusKey: `settings:speed:${limit}`, autoFocus: chosen, onPress: () => setSpeedLimit(limit), style: { position: "relative", flex: limit ? 1 : 2, height: 60, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: chosen ? colors.fg : colors.surface2 }, children: [
      /* @__PURE__ */ (0, jsx)(FocusRing, {}),
      /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 21, fontWeight: 600, color: chosen ? colors.accentFg : colors.muted, numberOfLines: 1 }, children: limit ? String(limit) : t2("settings.speedUnlimited") })
    ] });
  }
  function SpeedLimit() {
    const t2 = useT();
    const limit = useSpeedLimit();
    return /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 18, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 18 }, children: [
      /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 3 }, children: [
        /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, children: [
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 23, fontWeight: 600, color: colors.fg }, children: t2("settings.speedLimit") }),
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 21, color: colors.fg }, children: limit ? t2("units.speed", { n: String(limit) }) : t2("settings.speedUnlimited") })
        ] }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 21, color: colors.muted, lineHeight: 30 }, children: t2("settings.speedLimitDetail") })
      ] }),
      /* @__PURE__ */ (0, jsx)(View, { style: { flexDirection: "row", gap: 9 }, children: LIMITS.map((value) => /* @__PURE__ */ (0, jsx)(SpeedSegment, { limit: value, chosen: value === limit }, value)) })
    ] });
  }
  function SectionLabel({ icon, title, detail: detail2 }) {
    const text = /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 3 }, children: [
      /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, fontWeight: 600, color: colors.muted, letterSpacing: 1.5 }, children: title }),
      detail2 ? /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, color: colors.muted, lineHeight: 27 }, children: detail2 }) : null
    ] });
    return /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "flex-start", gap: 18, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 6 }, children: [
      icon ? /* @__PURE__ */ (0, jsx)(Icon, { name: icon, size: 26, color: colors.muted }) : null,
      text
    ] });
  }
  function ActionRow({ focusKey, autoFocus, name, detail: detail2, onPress }) {
    return /* @__PURE__ */ (0, jsx)(View, { focusKey, autoFocus, onPress, style: (_state) => [{ position: "relative", flexDirection: "row", alignItems: "center", gap: 24, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 18 }, _state.focused ? { backgroundColor: "#323232" } : null], children: /* @__PURE__ */ (0, jsx)(LanguageFace, { name, detail: detail2, checked: false }) });
  }
  function StatusRow({ status }) {
    if (!status) return null;
    return /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingTop: 4, paddingBottom: 6 }, children: [
      /* @__PURE__ */ (0, jsx)(Icon, { name: status.kind === "error" ? "alert" : "circleCheck", size: 22, color: colors.fg }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { flex: 1, fontFamily: "Inter-Regular", fontSize: 19, color: "#98989d", lineHeight: 27 }, children: status.text })
    ] });
  }
  function LanguageSheet({ onClose }) {
    const t2 = useT();
    const choice2 = languageChoice();
    const vibration = useNavigationHaptics();
    const [view, setView] = (0, useState)("settings");
    const [status, setStatus] = (0, useState)(null);
    const wishlist = useWishlist();
    const recent = useRecent();
    const searches = useSearchHistory();
    const actions = useStoreActions();
    const pick2 = (code) => {
      chooseLanguage(code);
      onClose();
    };
    const exportNow = () => {
      try {
        const result = exportBackup({
          fs: FileSystem,
          roots: storageRoots(),
          data: { wishlist, recent, searches },
          now: Date.now()
        });
        setStatus({ kind: "ok", text: t2("backup.exported", { name: result.name }) });
        playNotify();
      } catch (error) {
        setStatus({ kind: "error", text: t2("backup.exportFailed", { error: error.message }) });
        playError();
      }
    };
    const applyImport = (parsed) => {
      if (parsed.wishlist) actions.replaceWishlist(parsed.wishlist);
      if (parsed.recent) replaceRecent(parsed.recent);
      if (parsed.searches) replaceSearches(parsed.searches);
    };
    // The speed limit and vibration stay open on press, so the change shows (or is felt) at once; a
    // language choice still closes the sheet as before. Focus opens on the chosen speed, at the top.
    // Import swaps the sheet body for the backup list; Circle returns to settings
    // (the SideSheet back handler is re-routed while the backup view is open).
    const settings = /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 6, padding: 9, paddingBottom: 48 }, children: [
      /* @__PURE__ */ (0, jsx)(SectionLabel, { icon: "download", title: t2("settings.downloads") }),
      /* @__PURE__ */ (0, jsx)(SpeedLimit, {}),
      /* @__PURE__ */ (0, jsx)(SectionLabel, { title: t2("settings.controller") }),
      /* @__PURE__ */ (0, jsx)(View, { focusKey: "settings:vibration", onPress: () => setNavigationHaptics(!vibration), style: (_state) => [{ position: "relative", flexDirection: "row", alignItems: "center", gap: 24, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 18 }, _state.focused ? { backgroundColor: "#323232" } : null], children: /* @__PURE__ */ (0, jsx)(LanguageFace, { name: t2("settings.vibration"), detail: t2("settings.vibrationDetail"), checked: vibration }) }),
      /* @__PURE__ */ (0, jsx)(SectionLabel, { icon: "hardDrive", title: t2("settings.data"), detail: t2("settings.dataDetail") }),
      /* @__PURE__ */ (0, jsx)(StatusRow, { status }),
      /* @__PURE__ */ (0, jsx)(ActionRow, { focusKey: "settings:export", name: t2("backup.export"), detail: t2("backup.exportDetail"), onPress: exportNow }),
      /* @__PURE__ */ (0, jsx)(ActionRow, { focusKey: "settings:import", name: t2("backup.import"), detail: t2("backup.importDetail"), onPress: () => {
        setStatus(null);
        setView("backup");
      } }),
      /* @__PURE__ */ (0, jsx)(SectionLabel, { icon: "languages", title: t2("language.title"), detail: t2("language.subtitle") }),
      /* @__PURE__ */ (0, jsx)(Row4, { code: "system", name: t2("language.system"), detail: nameOf(systemLocale()), checked: choice2 === null, onPress: () => pick2(null) }),
      LOCALES.map(
        ({ code, name }) => /* @__PURE__ */ (0, jsx)(Row4, { code, name, detail: t2(`language.name.${code}`), checked: choice2 === code, onPress: () => pick2(code) }, code)
      )
    ] });
    return /* @__PURE__ */ (0, jsx)(SideSheet, { title: view === "settings" ? t2("settings.title") : t2("backup.title"), onClose: view === "backup" ? () => setView("settings") : onClose, children: view === "settings" ? settings : /* @__PURE__ */ (0, jsx)(BackupList, { onImport: applyImport, onBack: () => setView("settings") }) });
  }

export { LanguageSheet };
