// ../pub-game-store/native/downloads/SummaryPanel.jsx
// MODIFIED: horizontal KPI strip replacing the right panel — speed, activity, drives inline.

import '../assets/Inter-Regular.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { formatDuration, formatSpeed } from './format.js';
import { useActivity } from './useQueue.js';
import { formatNumber2 } from '../i18n/core.js';
import { useT } from '../i18n/index.js';
import { downloadQueue, driveName, storageRoots } from '../state/downloads.js';
import { formatBytes } from '../state/size.js';
import { useSpeedLimit } from '../state/speed-limit.js';
import { FocusRing } from '../ui/FocusRing.jsx';
import { colors } from '../ui/colors.js';
import { HAIRLINE, HAIRLINE_FOCUS, RADIUS_CARD } from '../ui/tokens.js';
import { FileSystem, Text, View, useIsFocused } from '@ps5-react/core';

  var PANEL_KEY = "downloads:panel";
  function awake() {
    try {
      return downloadQueue().awake;
    } catch {
      return false;
    }
  }
  function Kpi({ label, value, focusKey, onFocus }) {
    const focused = useIsFocused();
    return /* @__PURE__ */ (0, jsxs)(
      View,
      {
        focusable: true,
        focusKey,
        onFocus,
        style: (_state) => [
          { gap: 2, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
          _state.focused ? { backgroundColor: colors.surface2 } : null
        ],
        children: [
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 16, fontWeight: 600, color: "#6e675e", letterSpacing: 1, lineHeight: 22 }, children: label }),
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 24, fontWeight: 600, color: "#f5f1ea", lineHeight: 32, numberOfLines: 1, ellipsizeMode: "tail" }, children: value }),
          /* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" })
        ]
      }
    );
  }
  function DrivePill({ root: root2 }) {
    const t2 = useT();
    let usage = null;
    try {
      usage = FileSystem.diskUsage(root2);
    } catch {
    }
    const free = usage ? t2("download.free", { size: formatBytes(usage.free) }) : t2("downloads.panel.unavailable");
    return /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: HAIRLINE }, children: [
      /* @__PURE__ */ (0, jsx)(View, { style: { height: 8, width: 8, borderRadius: 4, backgroundColor: colors.accent } }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, fontWeight: 600, color: "#f5f1ea", numberOfLines: 1 }, children: driveName(root2) }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, color: "#6e675e", numberOfLines: 1 }, children: free })
    ] });
  }
  function SummaryPanel({ error: error2, onFocus }) {
    const t2 = useT();
    const { active: active2, speed, left, connections, peak } = useActivity();
    const limit = useSpeedLimit();
    if (error2) return null;
    return /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 56, paddingBottom: 16 }, children: [
      /* @__PURE__ */ (0, jsx)(Kpi, { label: t2("downloads.panel.activity"), value: active2 ? formatSpeed(speed) : t2("downloads.panel.idle"), focusKey: PANEL_KEY, onFocus }),
      /* @__PURE__ */ (0, jsx)(Kpi, { label: t2("downloads.panel.downloading"), value: active2 ? t2("catalog.gameCount", { count: active2 }) : "\u2014" }),
      /* @__PURE__ */ (0, jsx)(Kpi, { label: t2("downloads.panel.timeLeft"), value: active2 && speed && left ? formatDuration(left / speed) : "\u2014" }),
      /* @__PURE__ */ (0, jsx)(Kpi, { label: t2("downloads.panel.peak"), value: peak ? formatSpeed(peak) : "\u2014" }),
      /* @__PURE__ */ (0, jsx)(Kpi, { label: t2("downloads.panel.connections"), value: connections ? formatNumber2(connections) : "\u2014" }),
      /* @__PURE__ */ (0, jsx)(Kpi, { label: t2("settings.speedLimit"), value: limit ? t2("units.speed", { n: String(limit) }) : t2("settings.speedUnlimited") }),
      /* @__PURE__ */ (0, jsx)(View, { style: { flex: 1 } }),
      storageRoots().map((root2) => /* @__PURE__ */ (0, jsx)(DrivePill, { root: root2 }, root2)),
      awake() ? /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 17, color: "#6e675e", marginLeft: 8 }, children: t2("downloads.panel.awake") }) : null
    ] });
  }

export { PANEL_KEY, SummaryPanel };
