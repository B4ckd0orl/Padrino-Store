// Shown before a new download starts: what the chosen source is, what to watch for with it, and
// tips for choosing one behind a dropdown, so the provider's browser page opens only once the player
// has read it and pressed Continue. Padrino Store skin: warm gold hairlines, source-type badge.

import '../assets/Inter-Regular.ttf';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { useEffect, useState } from 'react';
import { describeSource, formatAction, inferFormat, isDlc, requiredFirmware } from './sources.js';
import { useT } from '../i18n/index.js';
import { sourceKind } from '../state/download-sources.js';
import { isPs5Package } from '../state/firmware.js';
import { useNavActions } from '../state/nav.jsx';
import { isPatchOnly } from '../state/release-sets.js';
import { Button2 } from '../ui/Button.jsx';
import { Cover } from '../ui/Cover.jsx';
import { FocusRing } from '../ui/FocusRing.jsx';
import { Icon } from '../ui/Icon.jsx';
import { colors } from '../ui/colors.js';
import { HAIRLINE } from '../ui/tokens.js';
import { FocusScope, ScrollView, Text, View, useIsFocused } from '@ps5-react/core';

  var LABEL = { fontFamily: "Inter-Regular", fontSize: 17, fontWeight: 600, color: colors.subtle, letterSpacing: 2 };
  var BODY = { fontFamily: "Inter-Regular", fontSize: 21, color: colors.muted, lineHeight: 30 };
  var TINT = { warn: [colors.warn, "#fde68a18"], info: [colors.info, "#a5f3fc14"] };
  var TIPS = ["firmware", "fullGame", "top", "retry"];
  var NOTE_TEXT = 1200 - 44 - 18;
  var TIP_WIDTH = (1200 - 44) / 2;
  var TIP_TEXT = TIP_WIDTH - 9 - 16;
  function accessKind(release) {
    try {
      return sourceKind(release.parts?.[0]?.sources[0] ?? release);
    } catch {
      return "direct";
    }
  }
  function notesFor(release) {
    const notes = [];
    if (isDlc(release)) notes.push({ tone: "warn", icon: "package", key: "dlc" });
    if (isPatchOnly(release)) notes.push({ tone: "warn", icon: "fileMinus", key: "patch" });
    if (isPs5Package(release)) notes.push({ tone: "warn", icon: "alert", key: "package" });
    const kind = accessKind(release);
    if (kind === "vikingfile") notes.push({ tone: "info", icon: "globe", key: "browserViking" });
    else if (kind === "browser" || kind === "datanodes" || kind === "buzzheavier") notes.push({ tone: "info", icon: "globe", key: "browserOther" });
    const need = requiredFirmware(release);
    if (need !== null && !isDlc(release)) notes.push({ tone: "info", icon: "cpu", key: "firmware", values: { need: `${need}.xx` } });
    if (!formatAction(inferFormat(release))) notes.push({ tone: "info", icon: "download", key: "format" });
    return notes;
  }
  function TypeBadge({ kind }) {
    const t2 = useT();
    const direct = kind === "direct" || kind === "manifest";
    const key = direct ? "tips.badge.direct" : "tips.badge.browser";
    const ink = direct ? colors.ok : colors.info;
    const wash = direct ? "#a7f3d018" : "#a5f3fc14";
    return /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, height: 36, borderRadius: 8, backgroundColor: wash, borderWidth: 1, borderColor: `${ink}33` }, children: [
      /* @__PURE__ */ (0, jsx)(Icon, { name: direct ? "download" : "globe", size: 18, color: ink }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 17, fontWeight: 600, color: ink, letterSpacing: 0.5 }, children: t2(key) })
    ] });
  }
  function Note({ tone, icon, text }) {
    const [ink, wash] = TINT[tone];
    return /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "flex-start", gap: 16 }, children: [
      /* @__PURE__ */ (0, jsx)(View, { style: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: wash, borderWidth: 1, borderColor: `${ink}22` }, children: /* @__PURE__ */ (0, jsx)(Icon, { name: icon, size: 22, color: ink }) }),
      /* @__PURE__ */ (0, jsx)(Text, { style: [BODY, { width: NOTE_TEXT, paddingTop: 5 }], children: text })
    ] });
  }
  function Tip({ title, body }) {
    return /* @__PURE__ */ (0, jsxs)(View, { style: { width: TIP_WIDTH, flexDirection: "row", alignItems: "flex-start", gap: 14, padding: 16, borderRadius: 12, backgroundColor: colors.surface2, borderWidth: 1, borderColor: HAIRLINE }, children: [
      /* @__PURE__ */ (0, jsx)(View, { style: { width: 8, height: 8, borderRadius: 4, marginTop: 10, backgroundColor: colors.accent } }),
      /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 4 }, children: [
        /* @__PURE__ */ (0, jsx)(Text, { style: [BODY, { width: TIP_TEXT - 32, fontWeight: 600, color: colors.fg, fontSize: 20 }], children: title }),
        /* @__PURE__ */ (0, jsx)(Text, { style: [BODY, { width: TIP_TEXT - 32, fontSize: 19, lineHeight: 27 }], children: body })
      ] })
    ] });
  }
  function ToggleFace({ open }) {
    const t2 = useT();
    const focused = useIsFocused();
    return /* @__PURE__ */ (0, jsxs)(Fragment, { children: [
      /* @__PURE__ */ (0, jsx)(FocusRing, {}),
      /* @__PURE__ */ (0, jsx)(View, { style: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface3 }, children: /* @__PURE__ */ (0, jsx)(Icon, { name: "lightbulb", size: 22, color: colors.accent }) }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { flex: 1, fontFamily: "Inter-Regular", fontSize: 22, fontWeight: 600, color: colors.fg }, children: t2("tips.toggle") }),
      /* @__PURE__ */ (0, jsx)(Icon, { name: open ? "chevronUp" : "chevronDown", size: 24, color: focused ? colors.fg : colors.muted })
    ] });
  }
  function DownloadTipsDialog({ game, release, submit, changeSource, onClose }) {
    const t2 = useT();
    const [open, setOpen] = (0, useState)(false);
    const { focusLater } = useNavActions();
    (0, useEffect)(() => {
      focusLater("tips:toggle");
    }, []);
    const { name, detail: detail2, size } = describeSource(release);
    const notes = notesFor(release);
    const kind = accessKind(release);
    const proceed = () => {
      onClose();
      submit();
    };
    const pick = () => {
      changeSource();
    };
    const cancel = () => {
      onClose();
      return true;
    };
    return (
      /* @__PURE__ */ (0, jsx)(FocusScope, { trap: true, autoFocus: true, onBack: cancel, onAction: () => true, children: /* @__PURE__ */ (0, jsx)(View, { style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 50, alignItems: "center", justifyContent: "center", backgroundColor: "#121110e0" }, children: /* @__PURE__ */ (0, jsxs)(View, { style: { width: 1340, maxHeight: 920, gap: 0, borderRadius: 20, borderWidth: 1, borderColor: "#e09f3e40", backgroundColor: colors.canvas, overflow: "hidden" }, children: [
        /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 48, paddingTop: 36, paddingBottom: 20, borderBottomWidth: 1, borderColor: HAIRLINE, backgroundColor: colors.surface }, children: [
          /* @__PURE__ */ (0, jsx)(Icon, { name: "download", size: 24, color: colors.accent }),
          /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 2 }, children: [
            /* @__PURE__ */ (0, jsx)(Text, { style: LABEL, children: t2("tips.eyebrow").toLocaleUpperCase() }),
            /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 36, fontWeight: 600, color: colors.fg, letterSpacing: -0.9, lineHeight: 44 }, children: t2("tips.title") })
          ] }),
          /* @__PURE__ */ (0, jsx)(TypeBadge, { kind })
        ] }),
        /* @__PURE__ */ (0, jsx)(ScrollView, { style: { maxHeight: 700 }, children: /* @__PURE__ */ (0, jsxs)(View, { style: { paddingHorizontal: 48, paddingTop: 28, paddingBottom: 24, gap: 28 }, children: [
          /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 12 }, children: [
            /* @__PURE__ */ (0, jsx)(Text, { style: LABEL, children: t2("tips.downloading").toLocaleUpperCase() }),
            /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 20, borderRadius: 14, backgroundColor: colors.surface, paddingHorizontal: 20, paddingVertical: 16, borderWidth: 1, borderColor: HAIRLINE }, children: [
              /* @__PURE__ */ (0, jsx)(Cover, { game, label: false, style: { width: 72, height: 72, borderRadius: 8, overflow: "hidden" } }),
              /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 4 }, children: [
                /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 24, fontWeight: 600, color: colors.fg, numberOfLines: 1, ellipsizeMode: "tail" }, children: game.title }),
                /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, color: colors.muted, numberOfLines: 1, ellipsizeMode: "tail" }, children: [detail2, name].filter(Boolean).join(" \xB7 ") })
              ] }),
              size ? /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 20, fontWeight: 600, color: colors.accent }, children: size }) : null
            ] })
          ] }),
          notes.length ? /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 12 }, children: [
            /* @__PURE__ */ (0, jsx)(Text, { style: LABEL, children: t2("tips.about").toLocaleUpperCase() }),
            /* @__PURE__ */ (0, jsx)(View, { style: { gap: 10 }, children: notes.map((note) => /* @__PURE__ */ (0, jsx)(Note, { tone: note.tone, icon: note.icon, text: t2(`tips.note.${note.key}`, note.values) }, note.key)) })
          ] }) : null,
          /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 12 }, children: [
            /* @__PURE__ */ (0, jsx)(View, { focusKey: "tips:toggle", nextFocusDown: "tips:continue", onPress: () => setOpen(!open), style: (_state) => [{ position: "relative", flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 12, marginHorizontal: -12, paddingHorizontal: 12, paddingVertical: 10 }, _state.focused ? { backgroundColor: colors.surface2 } : null], children: /* @__PURE__ */ (0, jsx)(ToggleFace, { open }) }),
            open ? /* @__PURE__ */ (0, jsx)(View, { style: { flexDirection: "row", flexWrap: "wrap", rowGap: 14, columnGap: 16 }, children: TIPS.map((key) => /* @__PURE__ */ (0, jsx)(Tip, { title: t2(`tips.tip.${key}.title`), body: t2(`tips.tip.${key}.body`) }, key)) }) : null
          ] })
        ] }) }),
        /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 48, paddingTop: 22, paddingBottom: 32, borderTopWidth: 1, borderColor: HAIRLINE, backgroundColor: colors.surface }, children: [
          /* @__PURE__ */ (0, jsx)(Button2, { variant: "primary", size: "lg", icon: "download", label: t2("tips.continue"), halo: false, focusKey: "tips:continue", onPress: proceed }),
          /* @__PURE__ */ (0, jsx)(Button2, { variant: "secondary", size: "lg", icon: "layers", label: t2("tips.changeSource"), focusKey: "tips:source", onPress: pick })
        ] })
      ] }) }) })
    );
  }

export { DownloadTipsDialog };
