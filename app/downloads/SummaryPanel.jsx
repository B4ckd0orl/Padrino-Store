// ../pub-game-store/native/downloads/SummaryPanel.jsx
// reconstructed from the esbuild bundle in eboot.bin
// MODIFIED: console dashboard — hero speed tile, 2x2 stat grid, storage tiles with lift.

import '../assets/Inter-Regular.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { formatDuration, formatSpeed } from './format.js';
import { useActivity } from './useQueue.js';
import { formatNumber2 } from '../i18n/core.js';
import { useT } from '../i18n/index.js';
import { downloadQueue, driveName, storageRoots } from '../state/downloads.js';
import { formatBytes } from '../state/size.js';
import { useSpeedLimit } from '../state/speed-limit.js';
import { ProgressBar } from '../ui/ProgressBar.jsx';
import { FocusRing } from '../ui/FocusRing.jsx';
import { colors } from '../ui/colors.js';
import { EASE_OUT } from '../ui/ease.js';
import { FileSystem, ScrollView, Text, View, motion, transitions } from '@ps5-react/core';

  var PANEL_KEY = "downloads:panel";
  var tileMotion = { type: "tween", duration: 0.25, ease: EASE_OUT };
  var gridAnim = { hidden: {}, shown: { transition: { staggerChildren: 0.04, delayChildren: 0.12 } } };
  var tileAnim = { hidden: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0, transition: transitions.panel } };
  function awake() {
    try {
      return downloadQueue().awake;
    } catch {
      return false;
    }
  }
  function Tile({ label, value, hero, onFocus, focusKey }) {
    return /* @__PURE__ */ (0, jsxs)(
      View,
      {
        focusable: true,
        focusKey,
        onFocus,
        style: (_state) => [
          { flex: 1, minWidth: 0, gap: 6, borderRadius: 14, borderWidth: 1, borderColor: "#e09f3e29", backgroundColor: "#1c1a17", padding: hero ? 22 : 18 },
          _state.focused ? { backgroundColor: "#26231f", borderColor: "#e09f3e66" } : null
        ],
        children: [
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 18, fontWeight: 600, color: "#6e675e", letterSpacing: 1, lineHeight: 24 }, children: label }),
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: hero ? 42 : 24, fontWeight: 600, color: "#f5f1ea", lineHeight: hero ? 50 : 32, letterSpacing: hero ? -1.05 : -0.4, numberOfLines: 1, ellipsizeMode: "tail" }, children: value }),
          /* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" })
        ]
      }
    );
  }
  function Activity({ onFocus }) {
    const t2 = useT();
    const { active: active2, speed, left, connections, peak, low, mean } = useActivity();
    const limit = useSpeedLimit();
    const figures = [
      ["downloads.panel.downloading", active2 ? t2("catalog.gameCount", { count: active2 }) : t2("downloads.panel.none")],
      ["downloads.panel.timeLeft", active2 && speed && left ? formatDuration(left / speed) : "\u2014"],
      ["downloads.panel.peak", peak ? formatSpeed(peak) : "\u2014"],
      ["downloads.panel.low", low ? formatSpeed(low) : "\u2014"],
      ["downloads.panel.average", mean ? formatSpeed(mean) : "\u2014"],
      ["downloads.panel.connections", connections ? formatNumber2(connections) : "\u2014"],
      // Why a download goes no faster: the cap chosen in Settings (issue #15).
      ["settings.speedLimit", limit ? t2("units.speed", { n: String(limit) }) : t2("settings.speedUnlimited")]
    ];
    return /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 18 }, children: [
      /* @__PURE__ */ (0, jsxs)(motion.View, { variants: tileAnim, style: { gap: 18, borderRadius: 16, borderWidth: 1, borderColor: "#e09f3e33", backgroundColor: "#1c1a17", padding: 24 }, children: [
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 18, fontWeight: 600, color: "#6e675e", letterSpacing: 1 }, children: t2("downloads.panel.activity") }),
        /* @__PURE__ */ (0, jsxs)(View, { focusable: true, focusKey: PANEL_KEY, onFocus, style: (_state) => [{ gap: 4, borderRadius: 10, padding: 10, margin: -10 }, _state.focused ? { backgroundColor: "#26231f" } : null], children: [
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 48, fontWeight: 600, color: active2 ? "#f5f1ea" : "#a39c92", lineHeight: 56, letterSpacing: -1.2 }, children: active2 ? formatSpeed(speed) : t2("downloads.panel.idle") }),
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 21, color: "#6e675e", lineHeight: 30 }, children: awake() ? t2("downloads.panel.awake") : " " })
        ] })
      ] }),
      /* @__PURE__ */ (0, jsx)(motion.View, { variants: gridAnim, initial: "hidden", animate: "shown", style: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, children: figures.map(
        ([key, value]) => /* @__PURE__ */ (0, jsx)(motion.View, { variants: tileAnim, style: { width: 184 }, children: /* @__PURE__ */ (0, jsx)(Tile, { label: t2(key), value, onFocus }) }, key)
      ) })
    ] });
  }
  function Drive({ root: root2, focusKey, onFocus }) {
    const t2 = useT();
    let usage = null;
    try {
      usage = FileSystem.diskUsage(root2);
    } catch {
    }
    const free = usage ? t2("download.free", { size: formatBytes(usage.free) }) : t2("downloads.panel.unavailable");
    const used = usage ? t2("downloads.panel.used", { used: formatBytes(usage.total - usage.free), total: formatBytes(usage.total) }) : "";
    return /* @__PURE__ */ (0, jsxs)(View, { focusable: true, focusKey, onFocus, style: (_state) => [{ gap: 12, borderRadius: 14, borderWidth: 1, borderColor: "#e09f3e29", backgroundColor: "#1c1a17", padding: 18 }, _state.focused ? { backgroundColor: "#26231f", borderColor: "#e09f3e66" } : null], children: [
      /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, children: [
        /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 2 }, children: [
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 21, fontWeight: 600, color: "#f5f1ea", lineHeight: 30, numberOfLines: 1, ellipsizeMode: "tail" }, children: driveName(root2) }),
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 21, color: "#a39c92", lineHeight: 30, textAlign: "end" }, children: free })
        ] })
      ] }),
      /* @__PURE__ */ (0, jsx)(ProgressBar, { fraction: usage?.total ? 1 - usage.free / usage.total : 0, width: 324, active: false }),
      used ? /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 18, color: "#6e675e", lineHeight: 24 }, children: used }) : null,
      /* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" })
    ] });
  }
  function SummaryPanel({ error: error2, onFocus }) {
    const t2 = useT();
    return /* @__PURE__ */ (0, jsx)(ScrollView, { style: { width: 420 }, children: /* @__PURE__ */ (0, jsxs)(motion.View, { variants: gridAnim, initial: "hidden", animate: "shown", style: { gap: 18, paddingBottom: 36 }, children: [
      error2 ? null : /* @__PURE__ */ (0, jsx)(Activity, { onFocus }),
      /* @__PURE__ */ (0, jsxs)(motion.View, { variants: tileAnim, style: { gap: 12, borderRadius: 16, borderWidth: 1, borderColor: "#e09f3e29", backgroundColor: "#1c1a17", padding: 20 }, children: [
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 18, fontWeight: 600, color: "#6e675e", letterSpacing: 1 }, children: t2("downloads.panel.storage") }),
        /* @__PURE__ */ (0, jsx)(View, { style: { gap: 12 }, children: storageRoots().map((root2, index) => /* @__PURE__ */ (0, jsx)(
          Drive,
          {
            root: root2,
            onFocus,
            focusKey: error2 && !index ? PANEL_KEY : void 0
          },
          root2
        )) })
      ] }),
      /* @__PURE__ */ (0, jsxs)(motion.View, { focusable: true, onFocus, variants: tileAnim, style: (_state) => [{ gap: 12, borderRadius: 16, borderWidth: 1, borderColor: "#e09f3e29", backgroundColor: "#1c1a17", padding: 20 }, _state.focused ? { backgroundColor: "#26231f" } : null], children: [
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 18, fontWeight: 600, color: "#6e675e", letterSpacing: 1 }, children: t2("downloads.panel.installing") }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 21, color: "#6e675e", lineHeight: 30 }, children: t2("downloads.panel.installNote") })
      ] })
    ] }) });
  }

export { PANEL_KEY, SummaryPanel };
