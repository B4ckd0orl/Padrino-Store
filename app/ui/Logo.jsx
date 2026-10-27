// ../pub-game-store/native/ui/Logo.jsx
// The store brand is sce_sys/icon0.png (the sticker), baked into the bundle like cdn-card.

import '../assets/Inter-Regular.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import brandIcon from '../sce_sys/icon0.png';
import { Text, View, Image } from '@ps5-react/core';
import { colors } from './colors.js';
import { px } from './scale.js';

  var ICON = { width: px(30), height: px(30) };
  // `compact` is the sticker on its own, at `size` px where it sits beside something else.
  function Logo({ color = colors.fg, compact = false, size = 30 }) {
    if (compact) {
      const mark = { width: px(size), height: px(size) };
      return /* @__PURE__ */ (0, jsx)(Image, { source: brandIcon, resizeMode: "contain", style: mark });
    }
    return /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 12 }, children: [
      /* @__PURE__ */ (0, jsx)(Image, { source: brandIcon, resizeMode: "contain", style: ICON }),
      /* @__PURE__ */ (0, jsx)(Text, { style: [{ fontFamily: "Inter-Regular", fontSize: 29, fontWeight: 600, letterSpacing: -0.85 }, { color }], children: "padrino" })
    ] });
  }

export { Logo };
