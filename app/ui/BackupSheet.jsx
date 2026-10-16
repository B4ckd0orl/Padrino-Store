// ../pub-game-store/native/ui/BackupSheet.jsx
// MODIFIED: flat rows — no lift/shine, neutral border, console-native.

import '../assets/Inter-Regular.ttf';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { useEffect, useRef, useState } from 'react';
import { listBackups, readBackup } from '../state/backup.js';
import { storageRoots } from '../state/downloads.js';
import { useT } from '../i18n/index.js';
import { FocusRing } from './FocusRing.jsx';
import { Icon } from './Icon.jsx';
import { colors } from './colors.js';
import { HAIRLINE, HAIRLINE_FOCUS, RADIUS_CARD, ROW_H } from './tokens.js';
import { playError, playNotify } from './sounds.js';
import { FileSystem, Text, View, useIsFocused } from '@ps5-react/core';

  var STATUS_MS = 1500;
  function FileFace({ name, armed }) {
    const t2 = useT();
    const focused = useIsFocused();
    return /* @__PURE__ */ (0, jsxs)(Fragment, { children: [
      /* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" }),
      /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 2 }, children: [
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 21, fontWeight: 600, color: armed ? "#121110" : "#f5f1ea", numberOfLines: 1, ellipsizeMode: "tail" }, children: name }),
        armed ? /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 18, fontWeight: 600, color: "#1a1408" }, children: t2("backup.confirm") }) : /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 18, color: focused ? colors.fg : colors.muted }, children: " " })
      ] })
    ] });
  }
  function FileRow({ file, armed, autoFocus, focusKey, onPress }) {
    return /* @__PURE__ */ (0, jsx)(View, { focusKey, autoFocus, onPress, style: (_state) => armed ? { position: "relative", height: ROW_H, borderRadius: RADIUS_CARD, paddingHorizontal: 18, backgroundColor: colors.accent } : [{ position: "relative", height: ROW_H, borderRadius: RADIUS_CARD, borderWidth: 1, borderColor: HAIRLINE, paddingHorizontal: 18 }, _state.focused ? { backgroundColor: colors.surface2, borderColor: HAIRLINE_FOCUS } : null], children: /* @__PURE__ */ (0, jsx)(FileFace, { name: file.name, armed }) });
  }
  function Empty() {
    const t2 = useT();
    return /* @__PURE__ */ (0, jsxs)(View, { style: { alignItems: "center", justifyContent: "center", paddingVertical: 72, gap: 6, paddingHorizontal: 18 }, children: [
      /* @__PURE__ */ (0, jsx)(Icon, { name: "archive", size: 32, color: colors.subtle }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { marginTop: 18, fontFamily: "Inter-Regular", fontSize: 23, fontWeight: 600, color: "#f5f1ea", textAlign: "center", lineHeight: 36 }, children: t2("backup.none") }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { width: 620, textAlign: "center", fontFamily: "Inter-Regular", fontSize: 20, color: "#6e675e", lineHeight: 30 }, children: t2("backup.noneDetail") })
    ] });
  }
  function Status({ status }) {
    if (!status) return null;
    return /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 12 }, children: [
      /* @__PURE__ */ (0, jsx)(Icon, { name: status.kind === "error" ? "alert" : "circleCheck", size: 20, color: status.kind === "error" ? colors.warn : colors.ok }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { flex: 1, fontFamily: "Inter-Regular", fontSize: 18, color: "#a39c92", lineHeight: 26 }, children: status.text })
    ] });
  }
  function BackupList({ onImport, onBack }) {
    const t2 = useT();
    const [files] = (0, useState)(() => listBackups({ fs: FileSystem, roots: storageRoots() }));
    const [armed, setArmed] = (0, useState)(null);
    const [status, setStatus] = (0, useState)(null);
    const live = (0, useRef)(true);
    (0, useEffect)(() => () => {
      live.current = false;
    }, []);
    const restore = (file) => {
      let parsed;
      try {
        parsed = readBackup({ fs: FileSystem, path: file.path });
      } catch (error) {
        setStatus({ kind: "error", text: t2("backup.invalid", { error: error.message }) });
        playError();
        setArmed(null);
        return;
      }
      onImport(parsed);
      playNotify();
      setStatus({ kind: "ok", text: parsed.wishlist ? t2("backup.importedCount", { count: String(parsed.wishlist.length) }) : t2("backup.imported") });
      setArmed(null);
      setTimeout(() => {
        if (live.current) onBack();
      }, STATUS_MS);
    };
    const press = (file) => {
      if (armed === file.path) {
        restore(file);
        return;
      }
      setArmed(file.path);
      setStatus(null);
    };
    if (!files.length) return /* @__PURE__ */ (0, jsxs)(View, { focusable: true, focusKey: "backup:empty", autoFocus: true, onPress: onBack, style: { position: "relative", gap: 6, borderRadius: RADIUS_CARD }, children: [
      /* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" }),
      /* @__PURE__ */ (0, jsx)(Empty, {}),
      /* @__PURE__ */ (0, jsx)(Status, { status })
    ] });
    return /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 4 }, children: [
      files.map(
        (file, index) => /* @__PURE__ */ (0, jsx)(
          FileRow,
          {
            file,
            armed: armed === file.path,
            autoFocus: index === 0,
            focusKey: `backup:${file.path}`,
            onPress: () => press(file)
          },
          file.path
        )
      ),
      /* @__PURE__ */ (0, jsx)(Status, { status })
    ] });
  }

export { BackupList };
