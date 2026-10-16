// ../pub-game-store/native/ui/CdnAura.jsx
// reconstructed from the esbuild bundle in eboot.bin

import { jsx, jsxs } from 'react/jsx-runtime';
import { useEffect } from 'react';
import { Animated, Easing, Path, Svg, View, motion, useAnimatedValue } from '@ps5-react/core';
import { px } from './scale.js';

  var SHINE_MS = 6e3;
  var DANCE = [
    { color: "#e09f3e00", offset: 0.22 },
    { color: "#e09f3ecc", offset: 0.38 },
    { color: "#ffe9c4e6", offset: 0.5 },
    { color: "#ffd694cc", offset: 0.62 },
    { color: "#f2b65500", offset: 0.78 }
  ];
  var ground = { backgroundGradient: {
    type: "linear",
    angle: 115,
    stops: [
      { color: "#e09f3e17", offset: 0 },
      { color: "#f2b6550d", offset: 0.55 },
      { color: "#ffd69412", offset: 1 }
    ]
  } };
  var band = { backgroundGradient: {
    type: "linear",
    angle: 115,
    stops: [
      { color: "#ffffff00", offset: 0.32 },
      { color: "#ffffff14", offset: 0.5 },
      { color: "#ffffff00", offset: 0.68 }
    ]
  } };
  var crossing = { type: "tween", duration: 2.2, ease: [0.4, 0, 0.3, 1], repeat: Infinity, repeatDelay: 4.2 };
  function CdnAura({ radius = 8, width }) {
    const angle = useAnimatedValue(0);
    (0, useEffect)(() => {
      const run = Animated.loop(Animated.timing(angle, { toValue: 360, duration: SHINE_MS, easing: Easing.linear }));
      run.start();
      return () => run.stop();
    }, []);
    return /* @__PURE__ */ (0, jsxs)(View, { pointerEvents: "none", style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }, children: [
      /* @__PURE__ */ (0, jsx)(View, { style: [{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }, [{ borderRadius: px(radius) }, ground]] }),
      /* @__PURE__ */ (0, jsx)(View, { style: [{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, overflow: "hidden" }, { borderRadius: px(radius) }], children: /* @__PURE__ */ (0, jsx)(
        motion.View,
        {
          style: [{ position: "absolute", top: 0, bottom: 0, left: 0 }, [{ width: px(width) }, band]],
          initial: { x: -0.8 * width },
          animate: { x: 0.8 * width },
          transition: crossing
        }
      ) }),
      /* @__PURE__ */ (0, jsx)(View, { style: [{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }, { borderRadius: px(radius), borderWidth: px(1), borderColor: "#e09f3e29" }] }),
      /* @__PURE__ */ (0, jsx)(Animated.View, { style: [{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }, {
        borderRadius: px(radius),
        borderGradientAngle: angle,
        borderGradient: { type: "radial", width: px(1.5), size: 3, stops: DANCE }
      }] })
    ] });
  }
  var FOIL = {
    type: "conic",
    width: px(1.5),
    angle: 210,
    stops: [
      { color: "#e09f3e", offset: 0 },
      { color: "#f2b655", offset: 0.3 },
      { color: "#ffe9c4", offset: 0.5 },
      { color: "#ffd694", offset: 0.75 },
      { color: "#e09f3e", offset: 1 }
    ]
  };
  function CdnMark({ radius = 8 }) {
    return /* @__PURE__ */ (0, jsx)(View, { pointerEvents: "none", style: [{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }, { borderRadius: px(radius), borderGradient: FOIL }] });
  }
  function CdnSpark({ size = 14 }) {
    return /* @__PURE__ */ (0, jsxs)(Svg, { width: px(size), height: px(size), viewBox: "0 0 24 24", children: [
      /* @__PURE__ */ (0, jsx)(Path, { d: "M10 1C10 7 13 10 19 10C13 10 10 13 10 19C10 13 7 10 1 10C7 10 10 7 10 1Z", fill: "#f2b655" }),
      /* @__PURE__ */ (0, jsx)(Path, { d: "M19 14C19 17 20 18 23 18C20 18 19 19 19 22C19 19 18 18 15 18C18 18 19 17 19 14Z", fill: "#ffd694" })
    ] });
  }

export { CdnAura, CdnMark, CdnSpark };
