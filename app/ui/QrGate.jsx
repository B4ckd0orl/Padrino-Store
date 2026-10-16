// ../pub-game-store/native/ui/QrGate.jsx
// Shown only the first time the store opens: community QR codes, then Cross into the games.

import '../assets/Inter-Regular.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useMemo } from 'react';
import { qrcodegen } from '../lib/qrcodegen';
import { useLocale, useT } from '../i18n/index.js';
import { Button2 } from './Button.jsx';
import { ButtonHints } from './ButtonHints.jsx';
import { HINT } from './Legend.jsx';
import { Logo } from './Logo.jsx';
import { colors } from './colors.js';
import { FocusScope, Path, Svg, Text, View } from '@ps5-react/core';

  var QUIET = 4;
  var MODULE = 11;
  var LINKS = [
    { text: "https://t.me/padrinostore", labelKey: "qr.telegram" },
    { text: "https://x.com/granpadrinostor", labelKey: "qr.x" }
  ];
  // Absolute-pixel modules, one merged subpath per horizontal run: the PS5 SVG renderer
  // clips fractional/negative viewBoxes and huge per-module paths. The quiet zone is the
  // offset, so it lives inside the SVG on the white plate.
  function modulePath(qr) {
    let d = "";
    for (let y = 0; y < qr.size; y++) {
      let x = 0;
      while (x < qr.size) {
        if (!qr.getModule(x, y)) {
          x += 1;
          continue;
        }
        let run = x;
        while (run < qr.size && qr.getModule(run, y)) run += 1;
        const w = (run - x) * MODULE;
        d += `M${(x + QUIET) * MODULE} ${(y + QUIET) * MODULE}h${w}v${MODULE}h-${w}z`;
        x = run;
      }
    }
    return d;
  }
  function QrCard({ text, labelKey }) {
    const t2 = useT();
    const qr = useMemo(() => qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM), [text]);
    const box = (qr.size + QUIET * 2) * MODULE;
    return /* @__PURE__ */ (0, jsxs)(View, { style: { alignItems: "center", gap: 24 }, children: [
      /* @__PURE__ */ (0, jsxs)(View, { style: { borderRadius: 24, backgroundColor: "#f5f1ea", padding: 24 }, children: [
        /* @__PURE__ */ (0, jsxs)(Svg, { width: box, height: box, children: [
          /* @__PURE__ */ (0, jsx)(Path, { d: modulePath(qr), fill: "#121110" })
        ] })
      ] }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 23, fontWeight: 600, color: colors.fg, lineHeight: 36 }, children: t2(labelKey) }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 20, color: colors.muted, lineHeight: 30, writingDirection: "ltr" }, children: text })
    ] });
  }
  function QrGate({ onDone }) {
    const t2 = useT();
    const { rtl } = useLocale();
    const back2 = () => {
      onDone();
      return true;
    };
    return /* @__PURE__ */ (0, jsx)(FocusScope, { trap: true, autoFocus: true, onBack: back2, onAction: back2, children: /* @__PURE__ */ (0, jsxs)(View, { style: { width: 1920, height: 1080, backgroundColor: "#121110", direction: rtl ? "rtl" : "ltr", flexDirection: "row", alignItems: "center", paddingHorizontal: 132, gap: 96 }, children: [
      /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 42 }, children: [
        /* @__PURE__ */ (0, jsx)(Logo, {}),
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 45, fontWeight: 600, color: colors.fg, lineHeight: 60, letterSpacing: -1.13 }, children: t2("qr.title") }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { width: 640, fontFamily: "Inter-Regular", fontSize: 24, color: colors.muted, lineHeight: 38 }, children: t2("qr.detail") }),
        /* @__PURE__ */ (0, jsx)(View, { style: { marginTop: 18 }, children: /* @__PURE__ */ (0, jsx)(Button2, { variant: "primary", size: "lg", label: t2("qr.enter"), focusKey: "qr:enter", autoFocus: true, onPress: onDone }) })
      ] }),
      /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", gap: 48 }, children: LINKS.map(
        (link) => /* @__PURE__ */ (0, jsx)(QrCard, { text: link.text, labelKey: link.labelKey }, link.text)
      ) }),
      /* @__PURE__ */ (0, jsx)(ButtonHints, { hints: [HINT.select] })
    ] }) });
  }

export { QrGate };
