// ../pub-game-store/native/ui/NavItem.jsx
// MODIFIED: rail item — icon-only with hover label, rectangular focus, no gold pill.

import '../assets/Inter-Regular.ttf';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { memo } from 'react';
import { FocusRing } from './FocusRing.jsx';
import { Icon } from './Icon.jsx';
import { useLocale } from '../i18n/index.js';
import { colors } from './colors.js';
import { RADIUS_CARD } from './tokens.js';
import { Text, View, useIsFocused } from '@ps5-react/core';

  function Content2({ label, icon, iconFill, trailing, current }) {
    const focused = useIsFocused();
    const color = current ? colors.accent : focused ? colors.fg : "#f5f1eaa6";
    return /* @__PURE__ */ (0, jsxs)(Fragment, { children: [
      /* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" }),
      icon && /* @__PURE__ */ (0, jsx)(Icon, { name: icon, size: 20, color, fill: iconFill ? color : "none" }),
      label && /* @__PURE__ */ (0, jsx)(Text, { numberOfLines: 1, style: [{ fontFamily: "Inter-Regular", fontSize: 21, flex: 1 }, { color }], children: label }),
      trailing && /* @__PURE__ */ (0, jsx)(Icon, { name: trailing, size: 14, color })
    ] });
  }
  var NavItem = (0, memo)(function NavItem2({ label, icon, iconFill, trailing, current = false, children, ...rest2 }) {
    return /* @__PURE__ */ (0, jsxs)(View, { ...rest2, style: [{ position: "relative", width: 56, height: 56, alignItems: "center", justifyContent: "center", borderRadius: RADIUS_CARD }, current ? { backgroundColor: colors.surface2 } : null], children: [
      current ? /* @__PURE__ */ (0, jsx)(View, { style: { position: "absolute", top: 12, bottom: 12, left: 0, width: 3, borderRadius: 2, backgroundColor: colors.accent } }) : null,
      /* @__PURE__ */ (0, jsx)(Content2, { label: null, icon, iconFill, trailing, current }),
      children
    ] });
  });

export { NavItem };
