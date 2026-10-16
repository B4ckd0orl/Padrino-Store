// ../pub-game-store/native/ui/Logo.jsx
// reconstructed from the esbuild bundle in eboot.bin

import '../assets/Inter-Regular.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { Path, Svg, Text, View } from '@ps5-react/core';
import { colors } from './colors.js';
import { px } from './scale.js';

  function Logo({ color = colors.fg }) {
    return /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 12 }, children: [
      /* @__PURE__ */ (0, jsxs)(Svg, { width: px(28), height: px(28), viewBox: "0 0 32 32", children: [
        /* @__PURE__ */ (0, jsx)(Path, { d: "M3 16a13 13 0 1 0 26 0a13 13 0 1 0-26 0", fill: "#e09f3e" }),
        /* @__PURE__ */ (0, jsx)(Path, { d: "M13.8 27.6C14.4 22.6 15.6 18.4 17.3 15.4M17.3 15.4C14.6 12.4 11.2 11.9 8.6 13.6M17.3 15.4C13.6 14.6 10.7 15.7 9.1 18.4M17.3 15.4C19.8 12.4 23.2 11.8 25.6 13.8M17.3 15.4C20.7 14.8 23.5 16.2 24.9 18.8M17.3 15.4C17.6 12.6 19.4 10.4 21 9.2", fill: "none", stroke: "#121110", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" })
      ] }),
      /* @__PURE__ */ (0, jsx)(Text, { style: [{ fontFamily: "Inter-Regular", fontSize: 29, fontWeight: 600, letterSpacing: -0.85 }, { color }], children: "padrino" })
    ] });
  }

export { Logo };
