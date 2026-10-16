// ../pub-game-store/native/files/FileRow.jsx
// MODIFIED: flat 72px row — no card border, subtle focus bg, hairline separator.

import '../assets/Inter-Regular.ttf';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { memo } from 'react';
import { KINDS, isPackage } from './scan.js';
import { formatPercent2 } from '../i18n/core.js';
import { useT } from '../i18n/index.js';
import { formatBytes } from '../state/size.js';
import { ButtonGlyph } from '../ui/ButtonHints.jsx';
import { Cover } from '../ui/Cover.jsx';
import { FocusRing } from '../ui/FocusRing.jsx';
import { Icon } from '../ui/Icon.jsx';
import { PlatformBadge } from '../ui/PlatformBadge.jsx';
import { ProgressBar } from '../ui/ProgressBar.jsx';
import { colors } from '../ui/colors.js';
import { HAIRLINE } from '../ui/tokens.js';
import { px } from '../ui/scale.js';
import { Text, View, useIsFocused } from '@ps5-react/core';

  var COVER2 = { width: px(36), height: px(48), borderRadius: px(4) };
  var TEXT_WIDTH = 560;
  var ICON_OF = Object.fromEntries(KINDS.map((kind) => [kind.key, kind.icon]));
  function typeOf2(file) {
    if (isPackage(file.name)) return "files.type.package";
    if (file.kind === "images") return "files.type.image";
    if (file.kind === "archives") return "files.type.archive";
    return file.isDirectory ? "files.type.folder" : "files.type.file";
  }
  function Thumb({ file, dark }) {
    if (file.game?.art?.cover) return /* @__PURE__ */ (0, jsx)(Cover, { game: file.game, label: false, style: COVER2 });
    return /* @__PURE__ */ (0, jsx)(View, { style: [{ height: 48, width: 36, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "#26231f" }, dark ? { backgroundColor: "#dcdce0" } : null], children: /* @__PURE__ */ (0, jsx)(Icon, { name: ICON_OF[file.kind], size: 16, color: dark ? colors.canvas : colors.muted }) });
  }
  function detail(t2, file, shadowMount) {
    const parts = [t2(typeOf2(file))];
    if (file.titleId) parts.push(file.titleId);
    if (file.installed) parts.push(t2("files.installed"));
    else if (file.kind === "images") parts.push(t2(shadowMount ? "files.byShadowMount" : "files.waitingShadowMount"));
    else if (isPackage(file.name)) parts.push(t2("files.notInstalled"));
    return parts.join(" \xB7 ");
  }
  function Face2({ file, armed, installing, shadowMount }) {
    const t2 = useT();
    const focused = useIsFocused();
    const busy = installing && !installing.done && !installing.error;
    return /* @__PURE__ */ (0, jsxs)(Fragment, { children: [
      armed ? null : /* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" }),
      /* @__PURE__ */ (0, jsx)(Thumb, { file, dark: armed }),
      /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 4 }, children: [
        /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 12 }, children: [
          file.platform ? /* @__PURE__ */ (0, jsx)(PlatformBadge, { platforms: [file.platform] }) : null,
          /* @__PURE__ */ (0, jsx)(
            Text,
            {
              style: [armed ? { fontFamily: "Inter-Regular", fontSize: 21, fontWeight: 600, color: "#1a1408", numberOfLines: 1, ellipsizeMode: "tail" } : { fontFamily: "Inter-Regular", fontSize: 21, fontWeight: 600, color: "#f5f1ea", numberOfLines: 1, ellipsizeMode: "tail" }],
              children: file.game?.title ?? file.name
            }
          )
        ] }),
        armed ? /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ (0, jsx)(ButtonGlyph, { button: "square", size: 14 }),
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 18, fontWeight: 600, color: "#1a1408" }, children: t2("files.confirmDelete", { size: formatBytes(file.size) }) })
        ] }) : busy ? /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 16 }, children: [
          /* @__PURE__ */ (0, jsx)(ProgressBar, { fraction: installing.fraction, width: 200, active: true }),
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 18, color: "#f5f1ea" }, children: t2("files.installing", { percent: formatPercent2(Math.round(installing.fraction * 100)) }) })
        ] }) : /* @__PURE__ */ (0, jsx)(
          Text,
          {
            style: [installing?.error ? { fontFamily: "Inter-Regular", fontSize: 18, color: "#f5f1ea", numberOfLines: 1, ellipsizeMode: "tail" } : focused ? { fontFamily: "Inter-Regular", fontSize: 18, color: "#a39c92", numberOfLines: 1, ellipsizeMode: "tail" } : { fontFamily: "Inter-Regular", fontSize: 18, color: "#6e675e", numberOfLines: 1, ellipsizeMode: "tail" }],
            children: installing?.error ? t2("files.installFailed") : installing?.done ? t2("files.installDone") : file.game ? `${file.name} \xB7 ${detail(t2, file, shadowMount)}` : detail(t2, file, shadowMount)
          }
        )
      ] }),
      /* @__PURE__ */ (0, jsx)(Text, { style: armed ? { fontFamily: "Inter-Regular", fontSize: 21, fontWeight: 600, color: "#1a1408" } : { fontFamily: "Inter-Regular", fontSize: 21, color: "#f5f1ea" }, children: formatBytes(file.size) })
    ] });
  }
  var FileRow = (0, memo)(function FileRow2({ file, armed, installing, shadowMount, autoFocus, focusKey, onPress, onFocus }) {
    return /* @__PURE__ */ (0, jsx)(View, { focusKey, autoFocus, onPress, onFocus, style: (_state) => armed ? { height: 72, flexDirection: "row", alignItems: "center", gap: 20, borderRadius: 10, backgroundColor: colors.accent, paddingHorizontal: 20 } : [{ height: 72, flexDirection: "row", alignItems: "center", gap: 20, borderRadius: 10, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: HAIRLINE }, _state.focused ? { backgroundColor: colors.surface } : null], children: /* @__PURE__ */ (0, jsx)(Face2, { file, armed, installing, shadowMount }) });
  });

export { FileRow };
