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
  // Fixed plate for both QRs: the largest encoding is version 3 (29 modules), so
  // BOX covers the max + quiet zone. Smaller codes are centered inside the same box
  // via a symmetric module offset — identical plates, no fractional scaling.
  var MAX_MODULES = 29;
  var BOX = (MAX_MODULES + QUIET * 2) * MODULE;
  var LINKS = [
    { text: "https://t.me/padrinostore", labelKey: "qr.telegram" },
    { text: "https://x.com/granpadrinostor", labelKey: "qr.x" }
  ];
  // Absolute-pixel modules, one merged subpath per horizontal run: the PS5 SVG renderer
  // clips fractional/negative viewBoxes and huge per-module paths. The quiet zone is the
  // offset, so it lives inside the SVG on the white plate. A square viewBox with a
  // non-negative origin keeps the 1:1 pixel mapping (no re-scale, no clip).
  function modulePath(qr) {
    const off = ((MAX_MODULES - qr.size) / 2 + QUIET) * MODULE;
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
        d += `M${x * MODULE + off} ${y * MODULE + off}h${w}v${MODULE}h-${w}z`;
        x = run;
      }
    }
    return d;
  }
  function QrCard({ text, labelKey }) {
    const t2 = useT();
    const qr = useMemo(() => qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.MEDIUM), [text]);
    return /* @__PURE__ */ (0, jsxs)(View, { style: { alignItems: "center", gap: 24 }, children: [
      /* @__PURE__ */ (0, jsxs)(View, { style: { borderRadius: 24, backgroundColor: "#ffffff", padding: 24 }, children: [
        /* @__PURE__ */ (0, jsxs)(Svg, { width: BOX, height: BOX, viewBox: `0 0 ${BOX} ${BOX}`, children: [
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
    return /* @__PURE__ */ (0, jsx)(FocusScope, { trap: true, autoFocus: true, onBack: back2, onAction: back2, children: /* @__PURE__ */ (0, jsxs)(View, { style: { width: 1920, height: 1080, backgroundColor: "#121110", direction: rtl ? "rtl" : "ltr", flexDirection: "row", alignItems: "center", paddingHorizontal: 96, gap: 64 }, children: [
      /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 42 }, children: [
        /* @__PURE__ */ (0, jsx)(Logo, {}),
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 45, fontWeight: 600, color: colors.fg, lineHeight: 60, letterSpacing: -1.13 }, children: t2("qr.title") }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 24, color: colors.muted, lineHeight: 38 }, children: t2("qr.detail") }),
        /* @__PURE__ */ (0, jsx)(View, { style: { marginTop: 18 }, children: /* @__PURE__ */ (0, jsx)(Button2, { variant: "primary", size: "lg", label: t2("qr.enter"), focusKey: "qr:enter", autoFocus: true, onPress: onDone }) })
      ] }),
      /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", gap: 48 }, children: LINKS.map(
        (link) => /* @__PURE__ */ (0, jsx)(QrCard, { text: link.text, labelKey: link.labelKey }, link.text)
      ) }),
      /* @__PURE__ */ (0, jsx)(ButtonHints, { hints: [HINT.select] })
    ] }) });
  }

export { QrGate };
