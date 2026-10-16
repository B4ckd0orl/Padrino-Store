// Padrino Store — rail item: icon-only, gold flyout label on focus, rectangular ring.

import '../assets/Inter-Regular.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { memo } from 'react';
import { useLocale } from '../i18n/index.js';
import { FocusRing } from './FocusRing.jsx';
import { Icon } from './Icon.jsx';
import { colors } from './colors.js';
import { RADIUS_CARD } from './tokens.js';
import { Text, View, useIsFocused } from '@ps5-react/core';

  function Flyout({ label, trailing }) {
    const focused = useIsFocused();
    const { rtl } = useLocale();
    if (!focused || !label) return null;
    const side = rtl ? { right: 62 } : { left: 62 };
    return /* @__PURE__ */ (0, jsxs)(View, { style: { position: "absolute", ...side, top: "50%", transform: [{ translateY: -18 }], flexDirection: "row", alignItems: "center", gap: 10, height: 36, paddingHorizontal: 16, borderRadius: 10, backgroundColor: colors.surface2, borderWidth: 1, borderColor: "#e09f3e44", zIndex: 50 }, children: [
      /* @__PURE__ */ (0, jsx)(Text, { numberOfLines: 1, style: { fontFamily: "Inter-Regular", fontSize: 19, fontWeight: 600, color: colors.fg }, children: label }),
      trailing ? /* @__PURE__ */ (0, jsx)(Icon, { name: trailing, size: 14, color: colors.muted }) : null
    ] });
  }
  function NavItem2({ label, icon, iconFill, trailing, current = false, children, ...rest2 }) {
    const focused = useIsFocused();
    const tint = current ? colors.accent : focused ? colors.fg : "#f5f1eaa6";
    return /* @__PURE__ */ (0, jsxs)(View, { ...rest2, style: [{ position: "relative", width: 56, height: 56, alignItems: "center", justifyContent: "center", borderRadius: RADIUS_CARD }, current ? { backgroundColor: colors.surface2 } : null], children: [
      current ? /* @__PURE__ */ (0, jsx)(View, { style: { position: "absolute", top: 12, bottom: 12, left: 0, width: 3, borderRadius: 2, backgroundColor: colors.accent } }) : null,
      /* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" }),
      icon ? /* @__PURE__ */ (0, jsx)(Icon, { name: icon, size: 20, color: tint, fill: iconFill ? tint : "none" }) : null,
      /* @__PURE__ */ (0, jsx)(Flyout, { label, trailing }),
      children
    ] });
  }
  var NavItem = (0, memo)(NavItem2);

export { NavItem };
