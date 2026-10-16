// ../pub-game-store/native/ui/NavItem.jsx
// reconstructed from the esbuild bundle in eboot.bin
// MODIFIED: sidebar item — the current section reads as a gold pill with gold
// ink, focus stays a white ring, so "active" and "focused" never look alike.

import '../assets/Inter-Regular.ttf';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { memo } from 'react';
import { FocusRing } from './FocusRing.jsx';
import { Icon } from './Icon.jsx';
import { useLocale } from '../i18n/index.js';
import { colors } from './colors.js';
import { Text, View, useIsFocused } from '@ps5-react/core';

  function Content2({ label, icon, iconFill, trailing, current }) {
    const focused = useIsFocused();
    const color = current ? colors.accent : focused ? colors.fg : "#f5f1eaa6";
    return /* @__PURE__ */ (0, jsxs)(Fragment, { children: [
      /* @__PURE__ */ (0, jsx)(FocusRing, { round: "full" }),
      icon && /* @__PURE__ */ (0, jsx)(Icon, { name: icon, size: 18, color, fill: iconFill ? color : "none" }),
      label && /* @__PURE__ */ (0, jsx)(Text, { numberOfLines: 1, style: [{ fontFamily: "Inter-Regular", fontSize: 21, flex: 1 }, { color }], children: label }),
      trailing && /* @__PURE__ */ (0, jsx)(Icon, { name: trailing, size: 14, color })
    ] });
  }
  var NavItem = (0, memo)(function NavItem2({ label, icon, iconFill, trailing, current = false, children, ...rest2 }) {
    const { rtl } = useLocale();
    return /* @__PURE__ */ (0, jsxs)(View, { ...rest2, style: [{ position: "relative", height: 60, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 14999, paddingHorizontal: 24 }, current ? { backgroundColor: "#e09f3e1f" } : null], children: [
      current ? /* @__PURE__ */ (0, jsx)(View, { style: [{ position: "absolute", top: 15, bottom: 15, width: 3, borderRadius: 14999, backgroundColor: colors.accent }, rtl ? { right: 4 } : { left: 4 }] }) : null,
      /* @__PURE__ */ (0, jsx)(Content2, { label, icon, iconFill, trailing, current }),
      children
    ] });
  });

export { NavItem };
