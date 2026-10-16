// ../pub-game-store/native/ui/ProgressBar.jsx
// reconstructed from the esbuild bundle in eboot.bin

import { jsx } from 'react/jsx-runtime';
import { useLocale } from '../i18n/index.js';
import { px } from './scale.js';
import { View, motion } from '@ps5-react/core';

  var glide = { type: "tween", duration: 0.05, ease: "linear" };
  function ProgressBar({ fraction, width, active: active2 }) {
    const { rtl } = useLocale();
    return /* @__PURE__ */ (0, jsx)(View, { style: [{ height: 6, overflow: "hidden", borderRadius: 14999, backgroundColor: "#323232" }, { width: px(width) }], children: /* @__PURE__ */ (0, jsx)(
      motion.View,
      {
        style: active2 ? { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "#0a84ff" } : { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "#6e6e73" },
        initial: false,
        animate: { x: (rtl ? 1 : -1) * (1 - fraction) * width },
        transition: glide
      }
    ) });
  }

export { ProgressBar, glide };
