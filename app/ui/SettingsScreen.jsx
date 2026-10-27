// Padrino Store — Settings screen: full-width rail (categories) + detail pane.
// Replaces the old SideSheet overlay with a console-native layout.

import '../assets/Inter-Regular.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { chooseLanguage, languageChoice, systemLocale, useT } from '../i18n/index.js';
import { formatPercent2 } from '../i18n/core.js';
import { LOCALES } from '../i18n/locales.js';
import { exportBackup } from '../state/backup.js';
import { setDownloadRoot, useDownloadRoot } from '../state/download-root.js';
import { driveShortName, storageRoots } from '../state/downloads.js';
import { replaceRecent, useRecent } from '../state/recent.js';
import { replaceSearches, useSearchHistory } from '../search/history.js';
import { useStoreActions, useWishlist } from '../state/store.jsx';
import { BackupList } from './BackupSheet.jsx';
import { FocusRing } from './FocusRing.jsx';
import { Icon } from './Icon.jsx';
import { colors } from './colors.js';
import { EASE_OUT } from './ease.js';
import { LEVELS, setVibrationLevel, useVibrationLevel } from './haptics.js';
import { LIMITS, setSpeedLimit, useSpeedLimit } from '../state/speed-limit.js';
import { setDeletePackages, useDeletePackages } from '../state/package-cleanup.js';
import { MODES, setPkgMode, usePkgMode } from '../state/pkg-mode.js';
import { playError, playNotify } from './sounds.js';
import { GUTTER, HAIRLINE, HAIRLINE_FOCUS, RADIUS_CARD, RADIUS_PILL, ROW_H, SEGMENT_H } from './tokens.js';
import { ButtonHints } from './ButtonHints.jsx';
import { HINT } from './Legend.jsx';
import { FileSystem, FocusScope, ScrollView, Text, View, motion, transitions, useIsFocused } from '@ps5-react/core';

  var nameOf = (code) => LOCALES.find((locale2) => locale2.code === code).name;
  var listAnim = { hidden: {}, shown: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } } };
  var itemAnim = { hidden: { opacity: 0, y: 12 }, shown: { opacity: 1, y: 0, transition: transitions.panel } };
  var SETTINGS_HINTS = [HINT.select, HINT.back];

  function CategoryRow({ icon, label, detail: detail2, current, focusKey, autoFocus, onPress }) {
    const focused = useIsFocused();
    return /* @__PURE__ */ (0, jsxs)(View, { focusKey, autoFocus, onPress, style: (_state) => [
      { position: "relative", height: ROW_H, flexDirection: "row", alignItems: "center", gap: 14, borderRadius: RADIUS_CARD, paddingHorizontal: 18, marginHorizontal: 12, marginBottom: 4 },
      current ? { backgroundColor: colors.surface2 } : null,
      _state.focused && !current ? { backgroundColor: colors.surface } : null
    ], children: [
      current ? /* @__PURE__ */ (0, jsx)(View, { style: { position: "absolute", top: 14, bottom: 14, left: 0, width: 3, borderRadius: 2, backgroundColor: colors.accent } }) : null,
      /* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" }),
      /* @__PURE__ */ (0, jsx)(Icon, { name: icon, size: 20, color: current || focused ? colors.accent : colors.subtle }),
      /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 2 }, children: [
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 22, fontWeight: 600, color: current ? colors.fg : focused ? colors.fg : colors.muted, numberOfLines: 1 }, children: label }),
        detail2 ? /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 17, color: colors.subtle, numberOfLines: 1 }, children: detail2 }) : null
      ] })
    ] });
  }

  function FlatRow({ focusKey, autoFocus, onPress, children, armed }) {
    return /* @__PURE__ */ (0, jsx)(View, { focusKey, autoFocus, onPress, style: (_state) => [
      { position: "relative", minHeight: ROW_H, flexDirection: "row", alignItems: "center", borderRadius: RADIUS_CARD, paddingHorizontal: 18, paddingVertical: 14, borderWidth: 1, borderColor: armed ? colors.accent : HAIRLINE },
      _state.focused ? { backgroundColor: colors.surface2, borderColor: HAIRLINE_FOCUS } : null,
      armed ? { backgroundColor: colors.accent } : null
    ], children: [/* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" }), children] });
  }

  function LanguageFace({ name, detail: detail2, checked, onAccent }) {
    const focused = useIsFocused();
    const nameInk = onAccent ? colors.accentFg : "#f5f1ea";
    const detailInk = onAccent ? "#1a1408cc" : focused ? colors.fg : colors.muted;
    return /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, flexDirection: "row", alignItems: "center", gap: 14 }, children: [
      /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 2 }, children: [
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 22, fontWeight: 600, color: nameInk }, children: name }),
        /* @__PURE__ */ (0, jsx)(Text, { style: [{ fontFamily: "Inter-Regular", fontSize: 19, lineHeight: 26 }, { color: detailInk }], children: detail2 })
      ] }),
      checked ? /* @__PURE__ */ (0, jsx)(Icon, { name: "check", color: onAccent ? colors.accentFg : colors.accent }) : /* @__PURE__ */ (0, jsx)(View, { style: { width: 24, height: 24 } })
    ] });
  }

  function LanguageRow({ code, name, detail: detail2, checked, onPress }) {
    return /* @__PURE__ */ (0, jsx)(FlatRow, { focusKey: `language:${code}`, onPress, armed: checked, children: /* @__PURE__ */ (0, jsx)(LanguageFace, { name, detail: detail2, checked, onAccent: checked }) });
  }

  function SpeedSegment({ limit, chosen }) {
    const t2 = useT();
    return /* @__PURE__ */ (0, jsxs)(View, { focusKey: `settings:speed:${limit}`, autoFocus: chosen, onPress: () => setSpeedLimit(limit), style: { position: "relative", flex: limit ? 1 : 2, height: SEGMENT_H, borderRadius: RADIUS_PILL, backgroundColor: colors.surface2, overflow: "hidden" }, children: [
      /* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" }),
      /* @__PURE__ */ (0, jsx)(motion.View, { initial: false, animate: { opacity: chosen ? 1 : 0 }, transition: { type: "tween", duration: 0.22, ease: EASE_OUT }, style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.accent, borderRadius: RADIUS_PILL } }),
      /* @__PURE__ */ (0, jsx)(View, { style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, fontWeight: 600, color: chosen ? colors.accentFg : colors.muted, numberOfLines: 1 }, children: limit ? String(limit) : t2("settings.speedUnlimited") }) })
    ] });
  }

  function SpeedLimit() {
    const t2 = useT();
    const limit = useSpeedLimit();
    return /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 14, paddingTop: 6, paddingBottom: 18 }, children: [
      /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 3 }, children: [
        /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, children: [
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 22, fontWeight: 600, color: colors.fg }, children: t2("settings.speedLimit") }),
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, color: colors.accent, fontWeight: 600 }, children: limit ? t2("units.speed", { n: String(limit) }) : t2("settings.speedUnlimited") })
        ] }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, color: colors.muted, lineHeight: 26 }, children: t2("settings.speedLimitDetail") })
      ] }),
      /* @__PURE__ */ (0, jsx)(View, { style: { flexDirection: "row", gap: 8 }, children: LIMITS.map((value) => /* @__PURE__ */ (0, jsx)(SpeedSegment, { limit: value, chosen: value === limit }, value)) })
    ] });
  }

  function PackagesSegment({ on, chosen }) {
    const t2 = useT();
    return /* @__PURE__ */ (0, jsxs)(View, { focusKey: `settings:packages:${on ? "on" : "off"}`, autoFocus: chosen, onPress: () => setDeletePackages(on), style: { position: "relative", flex: 1, height: SEGMENT_H, borderRadius: RADIUS_PILL, backgroundColor: colors.surface2, overflow: "hidden" }, children: [
      /* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" }),
      /* @__PURE__ */ (0, jsx)(motion.View, { initial: false, animate: { opacity: chosen ? 1 : 0 }, transition: { type: "tween", duration: 0.22, ease: EASE_OUT }, style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.accent, borderRadius: RADIUS_PILL } }),
      /* @__PURE__ */ (0, jsx)(View, { style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, fontWeight: 600, color: chosen ? colors.accentFg : colors.muted, numberOfLines: 1 }, children: t2(on ? "settings.on" : "settings.off") }) })
    ] });
  }

  function DeletePackages() {
    const t2 = useT();
    const on = useDeletePackages();
    return /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 14, paddingTop: 6, paddingBottom: 18 }, children: [
      /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 3 }, children: [
        /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, children: [
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 22, fontWeight: 600, color: colors.fg }, children: t2("settings.deletePackages") }),
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, color: colors.accent, fontWeight: 600 }, children: on ? t2("settings.on") : t2("settings.off") })
        ] }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, color: colors.muted, lineHeight: 26 }, children: t2("settings.deletePackagesDetail") })
      ] }),
      /* @__PURE__ */ (0, jsx)(View, { style: { flexDirection: "row", gap: 8 }, children: [true, false].map((value) => /* @__PURE__ */ (0, jsx)(PackagesSegment, { on: value, chosen: value === on }, String(value))) })
    ] });
  }

  // Where a PKG downloads (pkg-mode.js): asked each time, in Padrino Store, or in the background on the PS5.
  function PkgModeSegment({ mode, chosen }) {
    const t2 = useT();
    return /* @__PURE__ */ (0, jsxs)(View, { focusKey: `settings:pkg:${mode}`, autoFocus: chosen, onPress: () => setPkgMode(mode), style: { position: "relative", flex: 1, height: SEGMENT_H, borderRadius: RADIUS_PILL, backgroundColor: colors.surface2, overflow: "hidden" }, children: [
      /* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" }),
      /* @__PURE__ */ (0, jsx)(motion.View, { initial: false, animate: { opacity: chosen ? 1 : 0 }, transition: { type: "tween", duration: 0.22, ease: EASE_OUT }, style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.accent, borderRadius: RADIUS_PILL } }),
      /* @__PURE__ */ (0, jsx)(View, { style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, fontWeight: 600, color: chosen ? colors.accentFg : colors.muted, numberOfLines: 1 }, children: t2(`settings.pkgMode.${mode}`) }) })
    ] });
  }

  function PkgMode() {
    const t2 = useT();
    const mode = usePkgMode();
    return /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 14, paddingTop: 6, paddingBottom: 18 }, children: [
      /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 3 }, children: [
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 22, fontWeight: 600, color: colors.fg }, children: t2("settings.pkgMode") }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, color: colors.muted, lineHeight: 26 }, children: t2("settings.pkgModeDetail") })
      ] }),
      /* @__PURE__ */ (0, jsx)(View, { style: { flexDirection: "row", gap: 8 }, children: MODES.map((value) => /* @__PURE__ */ (0, jsx)(PkgModeSegment, { mode: value, chosen: value === mode }, value)) })
    ] });
  }

  // The drive downloads go to (issue #103), laid out like the speed limit: every drive in view,
  // plus Automatic for the app's own pick. It shows only when there is more than one drive.
  function DiskSegment({ root, label, chosen }) {
    return /* @__PURE__ */ (0, jsxs)(View, { focusKey: `settings:disk:${root ?? "auto"}`, autoFocus: chosen, onPress: () => setDownloadRoot(root), style: { position: "relative", flex: 1, height: SEGMENT_H, borderRadius: RADIUS_PILL, backgroundColor: colors.surface2, overflow: "hidden" }, children: [
      /* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" }),
      /* @__PURE__ */ (0, jsx)(motion.View, { initial: false, animate: { opacity: chosen ? 1 : 0 }, transition: { type: "tween", duration: 0.22, ease: EASE_OUT }, style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.accent, borderRadius: RADIUS_PILL } }),
      /* @__PURE__ */ (0, jsx)(View, { style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, fontWeight: 600, color: chosen ? colors.accentFg : colors.muted, numberOfLines: 1 }, children: label }) })
    ] });
  }

  function DiskForDownloads() {
    const t2 = useT();
    const root2 = useDownloadRoot();
    const [roots] = (0, useState)(() => {
      try {
        return storageRoots();
      } catch {
        return ["/data"];
      }
    });
    if (roots.length < 2) return null;
    return /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 14, paddingTop: 6, paddingBottom: 18 }, children: [
      /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 3 }, children: [
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 22, fontWeight: 600, color: colors.fg }, children: t2("settings.disk") }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, color: colors.muted, lineHeight: 26 }, children: t2("settings.diskDetail") })
      ] }),
      /* @__PURE__ */ (0, jsx)(View, { style: { flexDirection: "row", gap: 8 }, children: [null, ...roots].map((value) => /* @__PURE__ */ (0, jsx)(DiskSegment, { root: value, chosen: value === root2, label: value ? driveShortName(value) : t2("settings.diskAuto") }, value ?? "auto")) })
    ] });
  }

  function VibrationSegment({ level, chosen }) {
    const t2 = useT();
    return /* @__PURE__ */ (0, jsxs)(View, { focusKey: `settings:vibration:${level}`, onPress: () => setVibrationLevel(level), style: { position: "relative", flex: level ? 1 : 2, height: SEGMENT_H, borderRadius: RADIUS_PILL, backgroundColor: colors.surface2, overflow: "hidden" }, children: [
      /* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" }),
      /* @__PURE__ */ (0, jsx)(motion.View, { initial: false, animate: { opacity: chosen ? 1 : 0 }, transition: { type: "tween", duration: 0.22, ease: EASE_OUT }, style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.accent, borderRadius: RADIUS_PILL } }),
      /* @__PURE__ */ (0, jsx)(View, { style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, fontWeight: 600, color: chosen ? colors.accentFg : colors.muted, numberOfLines: 1 }, children: level ? formatPercent2(level) : t2("settings.vibrationOff") }) })
    ] });
  }

  function VibrationLevel() {
    const t2 = useT();
    const level = useVibrationLevel();
    return /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 14, paddingTop: 6, paddingBottom: 18 }, children: [
      /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 3 }, children: [
        /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, children: [
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 22, fontWeight: 600, color: colors.fg }, children: t2("settings.vibration") }),
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, color: colors.accent, fontWeight: 600 }, children: level ? formatPercent2(level) : t2("settings.vibrationOff") })
        ] }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, color: colors.muted, lineHeight: 26 }, children: t2("settings.vibrationDetail") })
      ] }),
      /* @__PURE__ */ (0, jsx)(View, { style: { flexDirection: "row", gap: 8 }, children: LEVELS.map((value) => /* @__PURE__ */ (0, jsx)(VibrationSegment, { level: value, chosen: value === level }, value)) })
    ] });
  }

  function SectionLabel({ icon, title, detail: detail2 }) {
    const text = /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 2 }, children: [
      /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 16, fontWeight: 600, color: colors.subtle, letterSpacing: 1.5 }, children: title }),
      detail2 ? /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 17, color: colors.muted, lineHeight: 24 }, children: detail2 }) : null
    ] });
    return /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingTop: 20, paddingBottom: 8 }, children: [
      icon ? /* @__PURE__ */ (0, jsx)(Icon, { name: icon, size: 22, color: colors.accent }) : null,
      text
    ] });
  }

  function StatusRow({ status }) {
    if (!status) return null;
    return /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 4, paddingBottom: 6 }, children: [
      /* @__PURE__ */ (0, jsx)(Icon, { name: status.kind === "error" ? "alert" : "circleCheck", size: 20, color: status.kind === "error" ? colors.warn : colors.ok }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { flex: 1, fontFamily: "Inter-Regular", fontSize: 18, color: "#a39c92", lineHeight: 26 }, children: status.text })
    ] });
  }

  function SettingsScreen({ onBack }) {
    const t2 = useT();
    const choice2 = languageChoice();
    const [category, setCategory] = (0, useState)("general");
    const [status, setStatus] = (0, useState)(null);
    const [view, setView] = (0, useState)("settings");
    const wishlist = useWishlist();
    const recent = useRecent();
    const searches = useSearchHistory();
    const actions = useStoreActions();
    const pick2 = (code) => {
      chooseLanguage(code);
      onBack();
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
    const back2 = () => {
      if (view === "backup") {
        setView("settings");
        return true;
      }
      onBack();
      return true;
    };
    const CATEGORIES = [
      { key: "general", icon: "download", label: t2("settings.downloads") },
      { key: "language", icon: "languages", label: t2("language.title") },
      { key: "data", icon: "hardDrive", label: t2("settings.data") }
    ];
    const general = /* @__PURE__ */ (0, jsxs)(motion.View, { variants: listAnim, initial: "hidden", animate: "shown", style: { gap: 4 }, children: [
      /* @__PURE__ */ (0, jsx)(motion.View, { variants: itemAnim, children: /* @__PURE__ */ (0, jsx)(SpeedLimit, {}) }),
      /* @__PURE__ */ (0, jsx)(motion.View, { variants: itemAnim, children: /* @__PURE__ */ (0, jsx)(DiskForDownloads, {}) }),
      /* @__PURE__ */ (0, jsx)(motion.View, { variants: itemAnim, children: /* @__PURE__ */ (0, jsx)(DeletePackages, {}) }),
      /* @__PURE__ */ (0, jsx)(motion.View, { variants: itemAnim, children: /* @__PURE__ */ (0, jsx)(PkgMode, {}) }),
      /* @__PURE__ */ (0, jsx)(motion.View, { variants: itemAnim, children: /* @__PURE__ */ (0, jsx)(SectionLabel, { title: t2("settings.controller") }) }),
      /* @__PURE__ */ (0, jsx)(motion.View, { variants: itemAnim, children: /* @__PURE__ */ (0, jsx)(VibrationLevel, {}) })
    ] });
    const language = /* @__PURE__ */ (0, jsxs)(motion.View, { variants: listAnim, initial: "hidden", animate: "shown", style: { gap: 4 }, children: [
      /* @__PURE__ */ (0, jsx)(motion.View, { variants: itemAnim, children: /* @__PURE__ */ (0, jsx)(LanguageRow, { code: "system", name: t2("language.system"), detail: nameOf(systemLocale()), checked: choice2 === null, onPress: () => pick2(null) }) }),
      LOCALES.map(
        ({ code, name }) => /* @__PURE__ */ (0, jsx)(motion.View, { variants: itemAnim, children: /* @__PURE__ */ (0, jsx)(LanguageRow, { code, name, detail: t2(`language.name.${code}`), checked: choice2 === code, onPress: () => pick2(code) }) }, code)
      )
    ] });
    const data = /* @__PURE__ */ (0, jsxs)(motion.View, { variants: listAnim, initial: "hidden", animate: "shown", style: { gap: 4 }, children: [
      /* @__PURE__ */ (0, jsx)(motion.View, { variants: itemAnim, children: /* @__PURE__ */ (0, jsx)(SectionLabel, { icon: "hardDrive", title: t2("settings.data"), detail: t2("settings.dataDetail") }) }),
      /* @__PURE__ */ (0, jsx)(motion.View, { variants: itemAnim, children: /* @__PURE__ */ (0, jsx)(StatusRow, { status }) }),
      /* @__PURE__ */ (0, jsx)(motion.View, { variants: itemAnim, children: /* @__PURE__ */ (0, jsx)(FlatRow, { focusKey: "settings:export", onPress: exportNow, children: /* @__PURE__ */ (0, jsx)(LanguageFace, { name: t2("backup.export"), detail: t2("backup.exportDetail"), checked: false }) }) }),
      /* @__PURE__ */ (0, jsx)(motion.View, { variants: itemAnim, children: /* @__PURE__ */ (0, jsx)(FlatRow, { focusKey: "settings:import", onPress: () => {
        setStatus(null);
        setView("backup");
      }, children: /* @__PURE__ */ (0, jsx)(LanguageFace, { name: t2("backup.import"), detail: t2("backup.importDetail"), checked: false }) }) })
    ] });
    const detail2 = view === "backup" ? /* @__PURE__ */ (0, jsx)(BackupList, { onImport: applyImport, onBack: () => setView("settings") }) : category === "general" ? general : category === "language" ? language : data;
    return /* @__PURE__ */ (0, jsx)(FocusScope, { autoFocus: true, onBack: back2, onAction: () => true, children: /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1 }, children: [
      /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: GUTTER, paddingTop: 40, paddingBottom: 20 }, children: [
        /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 4 }, children: [
          /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 14 }, children: [
            /* @__PURE__ */ (0, jsx)(Icon, { name: "settings", size: 22, color: colors.accent }),
            /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 36, fontWeight: 600, color: "#f5f1ea", lineHeight: 48, letterSpacing: -1 }, children: t2("settings.title") })
          ] }),
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 20, color: "#6e675e", lineHeight: 28 }, children: view === "backup" ? t2("backup.title") : t2("settings.subtitle") })
        ] })
      ] }),
      /* @__PURE__ */ (0, jsx)(View, { style: { height: 1, marginHorizontal: GUTTER, backgroundColor: HAIRLINE } }),
      /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, flexDirection: "row", paddingHorizontal: GUTTER, paddingTop: 20 }, children: [
        /* @__PURE__ */ (0, jsxs)(View, { style: { width: 320, gap: 4 }, children: CATEGORIES.map(
          (item) => /* @__PURE__ */ (0, jsx)(
            CategoryRow,
            {
              icon: item.icon,
              label: item.label,
              current: category === item.key && view === "settings",
              focusKey: `settings-cat:${item.key}`,
              autoFocus: item.key === "general" && view === "settings",
              onPress: () => {
                setCategory(item.key);
                setView("settings");
              }
            },
            item.key
          )
        ) }),
        /* @__PURE__ */ (0, jsx)(View, { style: { width: 1, backgroundColor: HAIRLINE, marginRight: 36 } }),
        /* @__PURE__ */ (0, jsx)(ScrollView, { style: { flex: 1 }, children: detail2 })
      ] }),
      /* @__PURE__ */ (0, jsx)(ButtonHints, { hints: SETTINGS_HINTS })
    ] }) });
  }

export { SettingsScreen };
