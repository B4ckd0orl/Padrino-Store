// ../pub-game-store/native/downloads/DownloadsScreen.jsx
// MODIFIED: KPI strip on top, segmented filter bar (no pills), full-width list.

import '../assets/Inter-Regular.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useEffect, useRef, useState } from 'react';
import { DownloadRow, linksOf, primaryKey } from './DownloadRow.jsx';
import { SummaryPanel } from './SummaryPanel.jsx';
import { useJobs } from './useQueue.js';
import { formatNumber2, t } from '../i18n/core.js';
import { SPAN_MAX, fitBytes } from '../i18n/fit.js';
import { useT } from '../i18n/index.js';
import { getGame } from '../state/catalog.js';
import { BUSY, COMPLETE } from '../state/download-queue.js';
import { downloadQueue } from '../state/downloads.js';
import { useNavActions } from '../state/nav.jsx';
import { Button2 } from '../ui/Button.jsx';
import { ButtonHints } from '../ui/ButtonHints.jsx';
import { FocusRing } from '../ui/FocusRing.jsx';
import { Icon } from '../ui/Icon.jsx';
import { HINT } from '../ui/Legend.jsx';
import { colors } from '../ui/colors.js';
import { EASE_OUT } from '../ui/ease.js';
import { GUTTER, HAIRLINE, RADIUS_PILL, SEGMENT_H } from '../ui/tokens.js';
import { FocusScope, ScrollView, Text, View, motion, useIsFocused, transitions } from '@ps5-react/core';

  var LIST_HINTS = [
    HINT.select,
    { button: "square", label: "hints.pauseResume" },
    { button: "triangle", label: "hints.gamePage" },
    HINT.back
  ];
  var EMPTY_HINTS = [HINT.select, HINT.back];
  var EMPTY_KEY = "downloads:empty";
  // The filter bar's right-hand segment, the one above a row's buttons.
  var STRIP_KEY = "downloads-filter:completed";
  var listAnim = { hidden: {}, shown: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } } };
  var rowAnim = { hidden: { opacity: 0, y: 16 }, shown: { opacity: 1, y: 0, transition: transitions.panel } };
  var headerAnim = { hidden: { opacity: 0, y: 10 }, shown: { opacity: 1, y: 0, transition: { type: "tween", duration: 0.3, ease: EASE_OUT } } };
  function summary(jobs) {
    const count = (states) => jobs.filter((job2) => states.includes(job2.state)).length;
    return [
      [count(BUSY), "inProgress"],
      [count(["paused", "awaiting-browser"]), "paused"],
      [count(["failed"]), "failed"],
      [count(COMPLETE), "completed"]
    ].filter(([n]) => n > 0).map(([n, key]) => t(`downloads.summary.${key}`, { count: n })).join(" \xB7 ");
  }
  function Segment({ label, count, current, focusKey, autoFocus, nextFocusDown, onPress }) {
    const focused = useIsFocused();
    return /* @__PURE__ */ (0, jsxs)(View, { focusKey, autoFocus, onPress, nextFocusDown, style: (_state) => [{ height: SEGMENT_H, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18, borderRadius: RADIUS_PILL }, current ? { backgroundColor: colors.accent } : focused ? { backgroundColor: colors.surface2 } : null], children: [
      /* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, fontWeight: 600, color: current ? "#1a1408" : focused ? "#f5f1ea" : "#a39c92", lineHeight: 26 }, children: label }),
      count > 0 ? /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, color: current ? "#1a1408b3" : "#6e675e", lineHeight: 26 }, children: formatNumber2(count) }) : null
    ] });
  }
  function Empty({ error: error2, onBrowse }) {
    const t2 = useT();
    return /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 144 }, children: [
      /* @__PURE__ */ (0, jsx)(Icon, { name: "download", size: 32, color: colors.subtle }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { marginTop: 24, fontFamily: "Inter-Regular", fontSize: 27, fontWeight: 600, color: "#f5f1ea", lineHeight: 42 }, children: t2(error2 ? "downloads.unavailable" : "downloads.empty") }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { marginTop: 6, width: 720, textAlign: "center", fontFamily: "Inter-Regular", fontSize: 24, color: "#a39c92", numberOfLines: 3, ellipsizeMode: "tail", lineHeight: 36 }, children: error2 || t2("downloads.emptyDetail") }),
      /* @__PURE__ */ (0, jsx)(View, { style: { marginTop: 36 }, children: /* @__PURE__ */ (0, jsx)(Button2, { variant: "outline", label: t2("downloads.browseGames"), focusKey: EMPTY_KEY, autoFocus: true, onPress: onBrowse }) })
    ] });
  }
  function DownloadsScreen({ onBack, onBrowse, onOpenGame }) {
    const t2 = useT();
    const { jobs, error: error2 } = useJobs();
    (0, useEffect)(() => {
      try {
        void downloadQueue().syncInstalls();
      } catch {
      }
    }, []);
    const [failure, setFailure] = (0, useState)("");
    const [filter, setFilter] = (0, useState)("all");
    const { focusLater } = useNavActions();
    const focused = (0, useRef)(null);
    const latest2 = (0, useRef)(jobs);
    latest2.current = jobs;
    const filterRef = (0, useRef)("all");
    filterRef.current = filter;
    const groupOf = (job2) => BUSY.includes(placed(job2)) ? "active" : ["paused", "failed", "awaiting-browser"].includes(placed(job2)) ? "stopped" : COMPLETE.includes(placed(job2)) ? "completed" : null;
    const neighbor = (job2) => {
      const list = latest2.current;
      const index = list.findIndex((item) => item.id === job2.id);
      for (const step of [1, -1]) {
        for (let i = index + step; i >= 0 && i < list.length; i += step) {
          if (filterRef.current === "all" || groupOf(list[i]) === filterRef.current) return primaryKey(list[i].id);
        }
      }
      return list.length > 1 ? `downloads-filter:${filterRef.current}` : EMPTY_KEY;
    };
    const [handlers] = (0, useState)(() => ({
      run(job2, name) {
        setFailure("");
        const target = ["remove", "cancel"].includes(name) ? neighbor(job2) : null;
        try {
          void Promise.resolve(downloadQueue()[name](job2.id)).catch((caught) => setFailure(caught.message));
          if (target) focusLater(target);
        } catch (caught) {
          setFailure(caught.message);
        }
      },
      openGame: (job2) => {
        if (getGame(job2.gameId)) onOpenGame(job2.gameId, primaryKey(job2.id));
      },
      focusRow: (job2) => {
        focused.current = job2;
      }
    }));
    const back2 = () => {
      onBack();
      return true;
    };
    const onAction = (action) => {
      const job2 = focused.current && jobs.find((item) => item.id === focused.current.id);
      if (!job2) return false;
      if (action === "triangle") handlers.openGame(job2);
      else if (action === "square" && BUSY.includes(job2.state)) handlers.run(job2, "pause");
      else if (action === "square" && ["paused", "failed"].includes(job2.state)) handlers.run(job2, "resume");
      else
        return false;
      return true;
    };
    const placed = (job2) => job2.removingFrom ?? job2.state;
    const active2 = jobs.filter((job2) => BUSY.includes(placed(job2)));
    const stopped = jobs.filter((job2) => ["paused", "failed", "awaiting-browser"].includes(placed(job2)));
    const done = jobs.filter((job2) => COMPLETE.includes(placed(job2)));
    const groups = { all: [...active2, ...stopped, ...done], active: active2, stopped, completed: done };
    const filtered = groups[filter];
    const first = filtered[0];
    // The rows in the order they are drawn: Up and Down go from a row to the one above or below it in
    // this list, and Down from the filter bar's segments goes to the first of them. Up from the first
    // row goes to the bar's right-hand segment, not to the summary panel above, which the D-pad found
    // nearer (2026-10-25).
    const near = filtered.map(linksOf);
    const strip = { info: STRIP_KEY, primary: STRIP_KEY, delete: STRIP_KEY };
    const links = new Map(filtered.map((job2, index) => [job2.id, { up: index ? near[index - 1] : strip, down: near[index + 1] }]));
    const firstRowKey = filtered.length ? primaryKey(filtered[0].id) : EMPTY_KEY;
    const FILTERS = [
      ["all", "downloads.filter.all", groups.all.length],
      ["active", "downloads.section.active", active2.length],
      ["stopped", "downloads.section.stopped", stopped.length],
      ["completed", "downloads.section.completed", done.length]
    ];
    return /* @__PURE__ */ (0, jsx)(FocusScope, { autoFocus: true, onBack: back2, onAction, children: /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1 }, children: [
      /* @__PURE__ */ (0, jsxs)(motion.View, { variants: listAnim, initial: "hidden", animate: "shown", style: { gap: 14 }, children: [
        /* @__PURE__ */ (0, jsxs)(motion.View, { variants: headerAnim, style: { flexDirection: "row", alignItems: "flex-end", gap: 48, paddingHorizontal: GUTTER, paddingTop: 40, paddingBottom: 4 }, children: [
          /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 4 }, children: [
            /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 14 }, children: [
              /* @__PURE__ */ (0, jsx)(Icon, { name: "download", size: 22, color: colors.accent }),
              /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 36, fontWeight: 600, color: "#f5f1ea", lineHeight: 48, letterSpacing: -1 }, children: fitBytes(t2("downloads.title"), SPAN_MAX) })
            ] }),
            jobs.length ? /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 20, color: "#6e675e", lineHeight: 28 }, children: fitBytes(summary(jobs), SPAN_MAX) }) : null
          ] }),
          /* @__PURE__ */ (0, jsx)(Text, { style: { width: 420, fontFamily: "Inter-Regular", fontSize: 20, color: "#f5f1ea", numberOfLines: 2, ellipsizeMode: "tail", lineHeight: 28 }, children: failure })
        ] }),
        /* @__PURE__ */ (0, jsx)(View, { style: { height: 1, marginHorizontal: GUTTER, backgroundColor: HAIRLINE } }),
        /* @__PURE__ */ (0, jsx)(SummaryPanel, { error: error2, onFocus: () => {
          focused.current = null;
        } }),
        jobs.length > 0 ? /* @__PURE__ */ (0, jsx)(motion.View, { variants: headerAnim, style: { flexDirection: "row", paddingHorizontal: GUTTER, paddingBottom: 14 }, children: /* @__PURE__ */ (0, jsx)(View, { style: { flexDirection: "row", gap: 4, padding: 4, borderRadius: RADIUS_PILL, backgroundColor: colors.surface, borderWidth: 1, borderColor: HAIRLINE }, children: FILTERS.map(
          ([key, labelKey, count]) => /* @__PURE__ */ (0, jsx)(Segment, { label: t2(labelKey), count, current: filter === key, focusKey: `downloads-filter:${key}`, nextFocusDown: firstRowKey, onPress: () => setFilter(key) }, key)
        ) }) }) : null
      ] }),
      /* @__PURE__ */ (0, jsx)(View, { style: { flex: 1, paddingHorizontal: GUTTER }, children: jobs.length > 0 ? /* @__PURE__ */ (0, jsx)(ScrollView, { style: { flex: 1 }, children: filtered.length ? /* @__PURE__ */ (0, jsx)(motion.View, { variants: listAnim, initial: "hidden", animate: "shown", style: { gap: 14, paddingBottom: 60 }, children: filtered.map(
        (job2) => /* @__PURE__ */ (0, jsx)(
          motion.View,
          {
            variants: rowAnim,
            style: { position: "relative" },
            children: /* @__PURE__ */ (0, jsx)(
              DownloadRow,
              {
                job: job2,
                game: getGame(job2.gameId) ?? { title: job2.title, art: {} },
                autoFocus: job2 === first,
                up: links.get(job2.id).up,
                down: links.get(job2.id).down,
                run: handlers.run,
                onOpenGame: handlers.openGame,
                onFocusRow: handlers.focusRow
              }
            )
          },
          job2.id
        )
      ) }) : /* @__PURE__ */ (0, jsx)(View, { style: { paddingTop: 96, alignItems: "center" }, children: /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 24, color: "#6e675e" }, children: t2("downloads.empty") }) }) }) : /* @__PURE__ */ (0, jsx)(Empty, { error: error2, onBrowse }) }),
      /* @__PURE__ */ (0, jsx)(ButtonHints, { hints: jobs.length > 0 ? LIST_HINTS : EMPTY_HINTS })
    ] }) });
  }

export { DownloadsScreen };
