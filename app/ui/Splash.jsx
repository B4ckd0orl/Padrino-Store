// ../pub-game-store/native/ui/Splash.jsx
// reconstructed from the esbuild bundle in eboot.bin

import { jsx, jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { Path, Svg, motion } from '@ps5-react/core';
import { colors } from './colors.js';
import { px } from './scale.js';

  var SIZE3 = 200 / 1.5;
  var UNIT = SIZE3 / 32;
  var HUB = { x: 15.45, y: 16.55 };
  var needleBox = { position: "absolute", left: px((HUB.x - 16) * UNIT), top: px((HUB.y - 16) * UNIT) };
  var STEPS = [
    // Swings back like a revved engine settling...
    { rotate: -10, transition: { type: "tween", duration: 0.4, ease: "easeInOut", delay: 0.15 } },
    // ...then kicks through the limit and settles in the gap.
    { rotate: 0, transition: { type: "spring", stiffness: 260, damping: 11 } }
  ];
  // `onDone` reports the end of the intro so the store can mount behind it: nothing of the
  // store is rendered or loaded while the needle swings.
  function Splash({ onDone }) {
    const [step, setStep] = (0, useState)(0);
    const [done, setDone] = (0, useState)(false);
    if (done) return null;
    const leaving = step === STEPS.length;
    return /* @__PURE__ */ (0, jsx)(
      motion.View,
      {
        style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", backgroundColor: "#1e1e1e" },
        initial: false,
        animate: { opacity: leaving ? 0 : 1 },
        transition: { duration: 0.35, ease: "easeIn", delay: 0.1 },
        onAnimationComplete: () => {
          if (!leaving) return;
          setDone(true);
          if (onDone) onDone();
        },
        children: /* @__PURE__ */ (0, jsxs)(
          motion.View,
          {
            style: { width: px(SIZE3), height: px(SIZE3) },
            initial: false,
            animate: { scale: leaving ? 0.9 : 1 },
            transition: { duration: 0.45, ease: "easeIn" },
            children: [
              /* @__PURE__ */ (0, jsx)(Svg, { width: px(SIZE3), height: px(SIZE3), viewBox: "0 0 32 32", children: /* @__PURE__ */ (0, jsx)(Path, { d: "M3 16a13 13 0 1 0 26 0a13 13 0 1 0-26 0", fill: "#e09f3e" }) }),
              /* @__PURE__ */ (0, jsx)(
                motion.View,
                {
                  style: needleBox,
                  initial: { rotate: 0 },
                  animate: STEPS[Math.min(step, STEPS.length - 1)],
                  onAnimationComplete: () => setStep((s) => Math.min(s + 1, STEPS.length)),
                  children: /* @__PURE__ */ (0, jsx)(Svg, { width: px(SIZE3), height: px(SIZE3), viewBox: `${HUB.x - 16} ${HUB.y - 16} 32 32`, children: /* @__PURE__ */ (0, jsx)(Path, { d: "M13.8 27.6C14.4 22.6 15.6 18.4 17.3 15.4M17.3 15.4C14.6 12.4 11.2 11.9 8.6 13.6M17.3 15.4C13.6 14.6 10.7 15.7 9.1 18.4M17.3 15.4C19.8 12.4 23.2 11.8 25.6 13.8M17.3 15.4C20.7 14.8 23.5 16.2 24.9 18.8M17.3 15.4C17.6 12.6 19.4 10.4 21 9.2", fill: "none", stroke: "#1e1e1e", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" }) })
                }
              )
            ]
          }
        )
      }
    );
  }

export { Splash };
