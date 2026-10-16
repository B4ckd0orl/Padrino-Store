// ../pub-game-store/native/ui/Button.jsx
// reconstructed from the esbuild bundle in eboot.bin

import '../assets/Inter-Regular.ttf';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { FocusRing } from './FocusRing.jsx';
import { Icon } from './Icon.jsx';
import { colors } from './colors.js';
import { Text, motion, useIsFocused } from '@ps5-react/core';

  var BASE = { flexDirection: "row", flexShrink: 0, alignItems: "center", justifyContent: "center", gap: 12, borderRadius: 12 };
  var SIZE2 = { sm: { height: 48, paddingHorizontal: 18 }, md: { height: 60, paddingHorizontal: 24 }, lg: { height: 72, paddingHorizontal: 30 }, icon: { width: 60, height: 60 } };
  var BOX = {
    primary: { backgroundColor: "#e09f3e" },
    secondary: { backgroundColor: "#26231f" },
    // Over light art a bare line vanishes: the translucent fill keeps the button readable anywhere.
    outline: { borderWidth: 2, borderColor: "#ffffff33", backgroundColor: "#12111099" },
    ghost: null
  };
  var FOCUSED_BOX = { primary: { backgroundColor: "#f2b655" }, secondary: { backgroundColor: "#302c27" }, outline: { backgroundColor: "#1c1a17" }, ghost: null };
  var TEXT = {
    primary: { fontFamily: "Inter-Regular", color: "#1a1408" },
    secondary: { fontFamily: "Inter-Regular", color: "#f5f1ea" },
    outline: { fontFamily: "Inter-Regular", color: "#f5f1ea" },
    ghost: { fontFamily: "Inter-Regular", color: "#a39c92" }
  };
  var TEXT_SIZE = { sm: { fontSize: 21, lineHeight: 30 }, md: { fontSize: 21, lineHeight: 30 }, lg: { fontSize: 23 }, icon: { fontSize: 21, lineHeight: 30 } };
  var press2 = { scale: 0.95 };
  var pressMotion = { type: "tween", duration: 0.12, ease: "easeOut" };
  var ink = (variant, focused) => variant === "primary" ? colors.accentFg : variant === "ghost" && !focused ? colors.muted : colors.fg;
  function Content({ variant, size, label, icon, iconFill }) {
    const focused = useIsFocused();
    const color = ink(variant, focused);
    return /* @__PURE__ */ (0, jsxs)(Fragment, { children: [
      icon && /* @__PURE__ */ (0, jsx)(Icon, { name: icon, size: size === "icon" ? 20 : 16, color, fill: iconFill ? color : "none" }),
      label && /* @__PURE__ */ (0, jsx)(Text, { style: [TEXT[variant], TEXT_SIZE[size], focused && variant === "ghost" && { color: "#f5f1ea" }], children: label })
    ] });
  }
  // `halo: false` gives a primary button the plain ring the page's other buttons have.
  function Button2({ variant = "secondary", size = "md", label, icon, iconFill, children, onPress, style, halo = true, ...rest2 }) {
    return /* @__PURE__ */ (0, jsxs)(
      motion.View,
      {
        ...rest2,
        onPress,
        whilePress: press2,
        transition: pressMotion,
        style: ({ focused }) => [BASE, SIZE2[size], BOX[variant], focused && FOCUSED_BOX[variant], style],
        children: [
          variant === "primary" && halo ? /* @__PURE__ */ (0, jsx)(FocusRing, { halo: true, radius: 6 }) : /* @__PURE__ */ (0, jsx)(FocusRing, {}),
          children,
          /* @__PURE__ */ (0, jsx)(Content, { variant, size, label, icon, iconFill })
        ]
      }
    );
  }

export { Button2 };
