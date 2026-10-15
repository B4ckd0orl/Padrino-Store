// ../pub-game-store/native/ui/NavItem.jsx
// reconstructed from the esbuild bundle in eboot.bin

import '../assets/Inter-Regular.ttf';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { memo } from 'react';
import { FocusRing } from './FocusRing.jsx';
import { Icon } from './Icon.jsx';
import { colors } from './colors.js';
import { Text, View, useIsFocused } from '@ps5-react/core';

  function Content2({ label, icon, iconFill, trailing, current }) {
    const focused = useIsFocused();
    const color = current || focused ? colors.fg : "#f2f2f3a6";
    return /* @__PURE__ */ (0, jsxs)(Fragment, { children: [
      /* @__PURE__ */ (0, jsx)(FocusRing, { round: "full" }),
      icon && /* @__PURE__ */ (0, jsx)(Icon, { name: icon, size: 18, color, fill: iconFill ? color : "none" }),
      label && /* @__PURE__ */ (0, jsx)(Text, { style: [{ fontFamily: "Inter-Regular", fontSize: 23 }, { color }], children: label }),
      trailing && /* @__PURE__ */ (0, jsx)(Icon, { name: trailing, size: 14, color })
    ] });
  }
  var NavItem = (0, memo)(function NavItem2({ label, icon, iconFill, trailing, current = false, children, ...rest2 }) {
    return /* @__PURE__ */ (0, jsxs)(View, { ...rest2, style: { position: "relative", height: 60, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 14999, paddingHorizontal: 24 }, children: [
      /* @__PURE__ */ (0, jsx)(Content2, { label, icon, iconFill, trailing, current }),
      children
    ] });
  });

export { NavItem };
