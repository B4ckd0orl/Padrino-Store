// ../pub-game-store/native/downloads/StatsStrip.jsx
// reconstructed from the esbuild bundle in eboot.bin
// MODIFIED: console strip — separated stat tiles under the active row.

import '../assets/Inter-Regular.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { SpeedChart } from './SpeedChart.jsx';
import { formatSpeed } from './format.js';
import { useThroughput } from './useThroughput.js';
import { useLocale, useT } from '../i18n/index.js';
import { colors } from '../ui/colors.js';
import { Text, View } from '@ps5-react/core';

  var CHART = { width: 240, height: 44 };
  function Stat({ label, value, chart, first }) {
    const { rtl } = useLocale();
    return /* @__PURE__ */ (0, jsxs)(View, { style: [
      { height: 102, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
      rtl ? { paddingRight: 30, paddingLeft: 24 } : { paddingLeft: 30, paddingRight: 24 },
      first ? null : rtl ? { borderRightWidth: 1, borderColor: "#e09f3e33" } : { borderLeftWidth: 1, borderColor: "#e09f3e33" }
    ], children: [
      /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 2 }, children: [
        /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 18, fontWeight: 600, color: "#6e675e", letterSpacing: 1, lineHeight: 24 }, children: label }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { width: 210, fontFamily: "Inter-Regular", fontSize: 24, fontWeight: 600, color: "#f5f1ea", lineHeight: 32 }, children: value })
      ] }),
      chart
    ] });
  }
  var latest = (samples) => samples[samples.length - 1] ?? 0;
  function StatsStrip({ id }) {
    const t2 = useT();
    const { network, disk } = useThroughput(id);
    const max = Math.max(...network, ...disk, 1);
    return /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", borderTopWidth: 1, borderColor: "#e09f3e33", backgroundColor: "#161412" }, children: [
      /* @__PURE__ */ (0, jsx)(
        Stat,
        {
          first: true,
          label: t2("downloads.stats.download"),
          value: formatSpeed(latest(network)),
          chart: /* @__PURE__ */ (0, jsx)(SpeedChart, { samples: network, max, color: colors.accent, ...CHART })
        }
      ),
      /* @__PURE__ */ (0, jsx)(
        Stat,
        {
          label: t2("downloads.stats.write"),
          value: formatSpeed(latest(disk)),
          chart: /* @__PURE__ */ (0, jsx)(SpeedChart, { samples: disk, max, color: colors.muted, ...CHART })
        }
      )
    ] });
  }

export { StatsStrip };
