// Padrino Store — Info screen: author's message, store caveats and community links.
// Opens from the sidebar under Archivos (nav:info) and behaves like a full screen.

import '../assets/Inter-Regular.ttf';
import '../assets/JetBrainsMono-Regular.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useT } from '../i18n/index.js';
import { ButtonHints } from './ButtonHints.jsx';
import { FocusRing } from './FocusRing.jsx';
import { HINT } from './Legend.jsx';
import { Icon } from './Icon.jsx';
import { colors } from './colors.js';
import { GUTTER, HAIRLINE, HAIRLINE_FOCUS, RADIUS_CARD, ROW_H } from './tokens.js';
import { FocusScope, Linking, ScrollView, Text, View } from '@ps5-react/core';

  var INFO_HINTS = [HINT.select, HINT.back];
  var LINKS = [
    { label: "Telegram", url: "https://t.me/padrinostore" },
    { label: "X", url: "https://x.com/granpadrinostor" }
  ];

  function InfoCard({ icon, title, body }) {
    return /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 12, padding: 26, borderRadius: RADIUS_CARD, backgroundColor: colors.surface, borderWidth: 1, borderColor: HAIRLINE }, children: [
      /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 12 }, children: [
        /* @__PURE__ */ (0, jsx)(Icon, { name: icon, size: 22, color: colors.accent }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 24, fontWeight: 600, color: colors.fg, numberOfLines: 1 }, children: title })
      ] }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 20, lineHeight: 30, color: colors.muted }, children: body })
    ] });
  }

  function LinkButton({ label, url }) {
    return /* @__PURE__ */ (0, jsxs)(View, { focusKey: `info:link:${url}`, onPress: () => Linking.openURL(url), style: (_state) => [
      { position: "relative", minHeight: ROW_H, flexDirection: "row", alignItems: "center", gap: 14, borderRadius: RADIUS_CARD, paddingHorizontal: 20, borderWidth: 1, borderColor: HAIRLINE },
      _state.focused ? { backgroundColor: colors.surface2, borderColor: HAIRLINE_FOCUS } : null
    ], children: [
      /* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" }),
      /* @__PURE__ */ (0, jsx)(Icon, { name: "external", size: 18, color: colors.accent }),
      /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 2 }, children: [
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 22, fontWeight: 600, color: colors.fg, numberOfLines: 1 }, children: label }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "JetBrainsMono-Regular", fontSize: 17, color: colors.subtle, writingDirection: "ltr", numberOfLines: 1 }, children: url })
      ] }),
      /* @__PURE__ */ (0, jsx)(Icon, { name: "chevronRight", size: 16, color: colors.subtle })
    ] });
  }

  function InfoScreen({ onBack }) {
    const t2 = useT();
    const back2 = () => {
      onBack();
      return true;
    };
    return /* @__PURE__ */ (0, jsx)(FocusScope, { autoFocus: true, onBack: back2, onAction: () => true, children: /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1 }, children: [
      /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: GUTTER, paddingTop: 40, paddingBottom: 20 }, children: [
        /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 4 }, children: [
          /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 14 }, children: [
            /* @__PURE__ */ (0, jsx)(Icon, { name: "info", size: 22, color: colors.accent }),
            /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 36, fontWeight: 600, color: "#f5f1ea", lineHeight: 48, letterSpacing: -1 }, children: t2("nav.info") })
          ] }),
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 20, color: "#6e675e", lineHeight: 28 }, children: t2("info.subtitle") })
        ] })
      ] }),
      /* @__PURE__ */ (0, jsx)(View, { style: { height: 1, marginHorizontal: GUTTER, backgroundColor: HAIRLINE } }),
      /* @__PURE__ */ (0, jsx)(ScrollView, { style: { flex: 1 }, children: /* @__PURE__ */ (0, jsxs)(View, { style: { paddingHorizontal: GUTTER, paddingTop: 28, paddingBottom: 24, gap: 26 }, children: [
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 23, lineHeight: 36, color: colors.muted, maxWidth: 1360 }, children: t2("info.lead") }),
        /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", gap: 24, alignItems: "stretch" }, children: [
          /* @__PURE__ */ (0, jsx)(InfoCard, { icon: "cpu", title: t2("info.firmwareTitle"), body: t2("info.firmware") }),
          /* @__PURE__ */ (0, jsx)(InfoCard, { icon: "layers", title: t2("info.coversTitle"), body: t2("info.covers") })
        ] }),
        /* @__PURE__ */ (0, jsx)(View, { style: { flexDirection: "row", alignItems: "center", gap: 12 }, children: [
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 22, fontWeight: 600, color: colors.accent }, children: t2("info.follow") }),
          /* @__PURE__ */ (0, jsx)(View, { style: { flex: 1, height: 1, backgroundColor: HAIRLINE } })
        ] }),
        /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", gap: 24 }, children: LINKS.map(
          (link) => /* @__PURE__ */ (0, jsx)(LinkButton, { label: link.label, url: link.url }, link.url)
        ) })
      ] }) }),
      /* @__PURE__ */ (0, jsx)(ButtonHints, { hints: INFO_HINTS })
    ] }) });
  }

export { InfoScreen };
