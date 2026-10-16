// ../pub-game-store/native/files/FilesScreen.jsx
// MODIFIED: horizontal tabs under header, StorageBar in header, flat 72px rows.

import '../assets/Inter-Regular.ttf';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { useEffect, useMemo, useState } from 'react';
import { FileRow } from './FileRow.jsx';
import { StorageBar } from './StorageBar.jsx';
import { KINDS, isPackage, totals } from './scan.js';
import { useFiles, finishedJobs } from './useFiles.js';
import { useT } from '../i18n/index.js';
import { driveName, storageRoots } from '../state/downloads.js';
import { useNavActions } from '../state/nav.jsx';
import { formatBytes } from '../state/size.js';
import { ButtonHints } from '../ui/ButtonHints.jsx';
import { FocusRing } from '../ui/FocusRing.jsx';
import { Icon } from '../ui/Icon.jsx';
import { HINT } from '../ui/Legend.jsx';
import { colors } from '../ui/colors.js';
import { GUTTER, HAIRLINE, HAIRLINE_FOCUS, RADIUS_CARD, RADIUS_PILL, SEGMENT_H } from '../ui/tokens.js';
import { FileSystem, FocusScope, ScrollView, Text, View, useIsFocused } from '@ps5-react/core';

  var ARM_MS2 = 4e3;
  var RAIL_HINTS = [HINT.select, HINT.back];
  var PACKAGE_HINTS = [{ button: "cross", label: "hints.install" }, { button: "square", label: "hints.delete" }, HINT.back];
  var FILE_HINTS = [{ button: "square", label: "hints.delete" }, { button: "triangle", label: "hints.move" }, HINT.back];
  var ARMED_HINTS = [{ button: "square", label: "hints.confirmDelete" }, HINT.back];
  var fileKey = (path) => `files:${path}`;
  function DriveTab({ label, detail: detail2, current, focusKey, autoFocus, onFocus, onPress }) {
    const focused = useIsFocused();
    return /* @__PURE__ */ (0, jsxs)(View, { focusKey, autoFocus, onPress, onFocus, style: (_state) => [
      { position: "relative", height: SEGMENT_H, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: RADIUS_PILL, paddingHorizontal: 18 },
      current ? { backgroundColor: colors.accent } : _state.focused ? { backgroundColor: colors.surface2 } : null
    ], children: [
      /* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" }),
      /* @__PURE__ */ (0, jsx)(Icon, { name: "hardDrive", size: 16, color: current ? colors.accentFg : focused ? colors.fg : colors.subtle }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 18, fontWeight: 600, color: current ? colors.accentFg : focused ? colors.fg : colors.muted, numberOfLines: 1 }, children: label }),
      detail2 ? /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 16, color: current ? "#1a1408b3" : colors.subtle, numberOfLines: 1 }, children: detail2 }) : null
    ] });
  }
  function KindTab({ icon, label, detail: detail2, current, focusKey, autoFocus, onFocus, onPress }) {
    const focused = useIsFocused();
    return /* @__PURE__ */ (0, jsxs)(View, { focusKey, autoFocus, onPress, onFocus, style: (_state) => [
      { position: "relative", height: SEGMENT_H, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: RADIUS_PILL, paddingHorizontal: 16 },
      current ? { backgroundColor: colors.accent } : _state.focused ? { backgroundColor: colors.surface2 } : null
    ], children: [
      /* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" }),
      /* @__PURE__ */ (0, jsx)(Icon, { name: icon, size: 16, color: current ? colors.accentFg : focused ? colors.fg : colors.subtle }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 18, fontWeight: 600, color: current ? colors.accentFg : focused ? colors.fg : colors.muted, numberOfLines: 1 }, children: label }),
      detail2 ? /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 16, color: current ? "#1a1408b3" : colors.subtle, numberOfLines: 1 }, children: detail2 }) : null
    ] });
  }
  function ShadowMountStatus({ up }) {
    const t2 = useT();
    return /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: HAIRLINE }, children: [
      /* @__PURE__ */ (0, jsx)(View, { style: up ? { height: 8, width: 8, borderRadius: 4, backgroundColor: colors.accent } : { height: 8, width: 8, borderRadius: 4, borderWidth: 2, borderColor: colors.subtle } }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 17, color: up ? colors.muted : colors.subtle }, children: t2(up ? "files.shadowMountOn" : "files.shadowMountOff") })
    ] });
  }
  function Empty2() {
    const t2 = useT();
    return /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 96 }, children: [
      /* @__PURE__ */ (0, jsx)(Icon, { name: "folder", size: 32, color: colors.subtle }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { marginTop: 24, fontFamily: "Inter-Regular", fontSize: 27, fontWeight: 600, color: "#f5f1ea", lineHeight: 42 }, children: t2("files.empty") }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { marginTop: 6, width: 660, textAlign: "center", fontFamily: "Inter-Regular", fontSize: 24, color: "#a39c92", numberOfLines: 2, ellipsizeMode: "tail", lineHeight: 36 }, children: t2("files.emptyDetail") })
    ] });
  }
  function FilesScreen({ onBack }) {
    const t2 = useT();
    const [roots] = (0, useState)(storageRoots);
    const [drive, setDrive] = (0, useState)(0);
    const [kind, setKind] = (0, useState)("all");
    const root2 = roots[drive];
    const { files, installing, install, remove, shadowMount } = useFiles(root2);
    const sums = (0, useMemo)(() => totals(files), [files]);
    const shown = kind === "all" ? files : files.filter((file) => file.kind === kind);
    const usage = (0, useMemo)(() => {
      try {
        return FileSystem.diskUsage(root2);
      } catch {
        return null;
      }
    }, [root2, files]);
    const [focused, setFocused] = (0, useState)(null);
    const [armed, setArmed] = (0, useState)(null);
    const [notice, setNotice] = (0, useState)("");
    const { focusLater } = useNavActions();
    (0, useEffect)(() => {
      if (!armed) return void 0;
      const timer = setTimeout(() => setArmed(null), ARM_MS2);
      return () => clearTimeout(timer);
    }, [armed]);
    const focusFile = (file) => {
      setFocused(file);
      if (armed && armed !== file.path) setArmed(null);
    };
    const onAction = (action) => {
      if (!focused) return false;
      if (action === "triangle") {
        const { queue, jobs } = finishedJobs(focused.path);
        const image = jobs.find((job2) => job2.artifact.nextAction === "shadowmount");
        if (!image || !queue) {
          setNotice(t2("files.moveNoJob"));
          return true;
        }
        const roots2 = storageRoots();
        const current = roots2.indexOf(image.root);
        const nextRoot = roots2[(current + 1) % roots2.length];
        if (!nextRoot || nextRoot === image.root) {
          setNotice(t2("files.moveNoTarget"));
          return true;
        }
        setNotice(t2("files.moving", { drive: driveName(nextRoot) }));
        queue.relocate(image.id, nextRoot).then(
          () => {
            setNotice(t2("files.moveDone", { drive: driveName(nextRoot) }));
            rescan();
          },
          (error2) => setNotice(/ShadowMount/.test(error2.message) ? error2.message : t2("files.moveFailed"))
        );
        return true;
      }
      if (action !== "square") return false;
      if (armed !== focused.path) {
        setArmed(focused.path);
        return true;
      }
      setArmed(null);
      const index = shown.indexOf(focused);
      const next = shown[index + 1] ?? shown[index - 1];
      const file = focused;
      remove(file).then(() => {
        focusLater(next ? fileKey(next.path) : `files-kind:${kind}`);
        setNotice(t2("files.deleted", { name: file.game?.title ?? file.name }));
      }, (error2) => setNotice(/ShadowMount/.test(error2.message) ? error2.message : t2("files.deleteFailed")));
      return true;
    };
    const back2 = () => {
      if (armed) setArmed(null);
      else onBack();
      return true;
    };
    const hints = !focused ? RAIL_HINTS : armed === focused.path ? ARMED_HINTS : isPackage(focused.name) ? PACKAGE_HINTS : FILE_HINTS;
    return /* @__PURE__ */ (0, jsx)(FocusScope, { autoFocus: true, onBack: back2, onAction, children: /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1 }, children: [
      /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: GUTTER, paddingTop: 40, paddingBottom: 16 }, children: [
        /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 4 }, children: [
          /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 14 }, children: [
            /* @__PURE__ */ (0, jsx)(Icon, { name: "folder", size: 22, color: colors.accent }),
            /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 36, fontWeight: 600, color: "#f5f1ea", lineHeight: 48, letterSpacing: -1 }, children: t2("files.title") })
          ] }),
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 20, color: "#6e675e", lineHeight: 28 }, children: t2("files.summary", { count: sums.all.count, size: formatBytes(sums.all.size) }) })
        ] }),
        /* @__PURE__ */ (0, jsxs)(View, { style: { alignItems: "flex-end", gap: 10 }, children: [
          /* @__PURE__ */ (0, jsx)(ShadowMountStatus, { up: shadowMount }),
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 20, color: "#a39c92", numberOfLines: 2, ellipsizeMode: "tail", lineHeight: 28 }, children: notice })
        ] })
      ] }),
      /* @__PURE__ */ (0, jsx)(View, { style: { height: 1, marginHorizontal: GUTTER, backgroundColor: HAIRLINE } }),
      /* @__PURE__ */ (0, jsx)(StorageBar, { usage, sums, focus: focused?.kind ?? (kind === "all" ? null : kind), width: 1808 }),
      /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", gap: 10, paddingHorizontal: GUTTER, paddingBottom: 14, flexWrap: "wrap" }, children: [
        roots.map(
          (path, index) => /* @__PURE__ */ (0, jsx)(
            DriveTab,
            {
              label: driveName(path),
              detail: index === drive ? usage ? formatBytes(usage.free) : null : null,
              current: index === drive,
              focusKey: `files-drive:${path}`,
              onFocus: () => setFocused(null),
              onPress: () => {
                setDrive(index);
                setArmed(null);
              }
            },
            path
          )
        ),
        /* @__PURE__ */ (0, jsx)(View, { style: { width: 1, backgroundColor: HAIRLINE, marginHorizontal: 6 } }),
        [{ key: "all", icon: "layers" }, ...KINDS].map(
          (item) => /* @__PURE__ */ (0, jsx)(
            KindTab,
            {
              icon: item.icon,
              label: t2(`files.kind.${item.key}`),
              detail: sums[item.key].count ? formatBytes(sums[item.key].size) : null,
              current: kind === item.key,
              focusKey: `files-kind:${item.key}`,
              onFocus: () => setFocused(null),
              onPress: () => setKind(item.key),
              autoFocus: !files.length && item.key === "all"
            },
            item.key
          )
        )
      ] }),
      /* @__PURE__ */ (0, jsx)(View, { style: { flex: 1, paddingHorizontal: GUTTER }, children: shown.length ? /* @__PURE__ */ (0, jsx)(ScrollView, { style: { flex: 1 }, children: /* @__PURE__ */ (0, jsx)(View, { style: { gap: 4, paddingBottom: 48 }, children: shown.map(
        (file, index) => /* @__PURE__ */ (0, jsx)(
          FileRow,
          {
            file,
            focusKey: fileKey(file.path),
            autoFocus: index === 0,
            armed: armed === file.path,
            installing: installing?.path === file.path ? installing : null,
            shadowMount,
            onFocus: () => focusFile(file),
            onPress: isPackage(file.name) ? () => install(file) : void 0
          },
          file.path
        )
      ) }) }) : /* @__PURE__ */ (0, jsx)(Empty2, {}) }),
      /* @__PURE__ */ (0, jsx)(ButtonHints, { hints })
    ] }) });
  }

export { FilesScreen };
