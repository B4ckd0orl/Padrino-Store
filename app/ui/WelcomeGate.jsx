// Padrino Store — first-launch welcome screen (replaces the old QR gate).
// Shows a thank-you message and social links as plain text, then Cross into the store.

import '../assets/Inter-Regular.ttf';
import '../assets/JetBrainsMono-Regular.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useLocale, useT } from '../i18n/index.js';
import { Button2 } from './Button.jsx';
import { ButtonHints } from './ButtonHints.jsx';
import { HINT } from './Legend.jsx';
import { Logo } from './Logo.jsx';
import { colors } from './colors.js';
import { FocusScope, Text, View } from '@ps5-react/core';

  var LINKS = [
    { label: "Telegram", url: "https://t.me/padrinostore" },
    { label: "X", url: "https://x.com/granpadrinostor" }
  ];
  function WelcomeGate({ onDone }) {
    const t2 = useT();
    const { rtl } = useLocale();
    const back2 = () => {
      onDone();
      return true;
    };
    return /* @__PURE__ */ (0, jsx)(FocusScope, { trap: true, autoFocus: true, onBack: back2, onAction: back2, children: /* @__PURE__ */ (0, jsxs)(View, { style: { width: 1920, height: 1080, backgroundColor: "#121110", direction: rtl ? "rtl" : "ltr", alignItems: "center", justifyContent: "center", paddingHorizontal: 320, gap: 36 }, children: [
      /* @__PURE__ */ (0, jsx)(Logo, {}),
      /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 52, fontWeight: 600, color: colors.fg, lineHeight: 68, letterSpacing: -1.3, textAlign: "center" }, children: t2("welcome.title") }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 26, color: colors.muted, lineHeight: 42, textAlign: "center", maxWidth: 1100 }, children: t2("welcome.detail") }),
      /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", gap: 48, marginTop: 12 }, children: LINKS.map((link) => /* @__PURE__ */ (0, jsxs)(View, { style: { alignItems: "center", gap: 8 }, children: [
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 22, fontWeight: 600, color: colors.accent }, children: link.label }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "JetBrainsMono-Regular", fontSize: 19, color: colors.muted, writingDirection: "ltr" }, children: link.url })
      ] }, link.url)) }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 24, color: colors.accent, fontWeight: 600, marginTop: 12 }, children: t2("welcome.family") }),
      /* @__PURE__ */ (0, jsx)(View, { style: { marginTop: 18 }, children: /* @__PURE__ */ (0, jsx)(Button2, { variant: "primary", size: "lg", label: t2("welcome.enter"), focusKey: "welcome:enter", autoFocus: true, onPress: onDone }) }),
      /* @__PURE__ */ (0, jsx)(ButtonHints, { hints: [HINT.select] })
    ] }) });
  }

export { WelcomeGate };
