// ../pub-game-store/native/downloads/RowProgress.jsx
// reconstructed from the esbuild bundle in eboot.bin
// MODIFIED: thicker track, status dot, tighter console spacing.

import '../assets/Inter-Regular.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { formatTimeLeft } from './format.js';
import { fractionOf, useProgress } from './useQueue.js';
import { SPAN_MAX, fitBytes } from '../i18n/fit.js';
import { useT } from '../i18n/index.js';
import { formatBytes } from '../state/size.js';
import { ProgressBar } from '../ui/ProgressBar.jsx';
import { ShimmerText } from '../ui/ShimmerText.jsx';
import { colors } from '../ui/colors.js';
import { Text, View } from '@ps5-react/core';

  var TRACK2 = 416;
  var LABEL = { fontFamily: "Inter-Regular", fontSize: 21, lineHeight: 30 };
  function RowProgress({ id, label, moving, waiting: waiting2, complete, open, detail: detail2 }) {
    const t2 = useT();
    const progress = useProgress(id);
    const { written = 0, total = null, bytesPerSecond = 0 } = progress ?? {};
    const left = moving && total && bytesPerSecond ? formatTimeLeft((total - written) / bytesPerSecond) : "";
    const size = detail2 ?? (complete ? formatBytes(total || written) : total ? t2("download.status.progress", { done: formatBytes(written), total: formatBytes(total) }) : written ? t2("download.soFar", { size: formatBytes(written) }) : "");
    return /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 10 }, children: [
      /* @__PURE__ */ (0, jsx)(ProgressBar, { fraction: complete || open ? 1 : fractionOf(progress), width: TRACK2, active: (moving && !open) || complete }),
      /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, children: [
        waiting2 ? /* @__PURE__ */ (0, jsx)(View, { style: { flex: 1 }, children: /* @__PURE__ */ (0, jsx)(ShimmerText, { textStyle: LABEL, background: colors.surface, children: label }) }) : /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }, children: [
          moving ? /* @__PURE__ */ (0, jsx)(View, { style: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent } }) : null,
          /* @__PURE__ */ (0, jsxs)(Text, { style: { flex: 1, fontFamily: "Inter-Regular", fontSize: 21, color: "#f5f1ea", numberOfLines: 1, ellipsizeMode: "tail", lineHeight: 30 }, children: [
            fitBytes(label, SPAN_MAX),
            /* @__PURE__ */ (0, jsx)(Text, { style: { color: "#a39c92" }, children: left ? fitBytes(`  ${left}`, SPAN_MAX) : "" })
          ] })
        ] }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { width: 315, textAlign: "end", fontFamily: "Inter-Regular", fontSize: 21, color: "#a39c92", lineHeight: 30 }, children: size })
      ] })
    ] });
  }

export { RowProgress };
