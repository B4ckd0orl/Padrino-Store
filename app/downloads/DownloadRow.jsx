// ../pub-game-store/native/downloads/DownloadRow.jsx
// MODIFIED: flat console row — neutral border, no lift/shine/gold bar, subtle focus.

import '../assets/Inter-Regular.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { memo, useEffect, useState } from 'react';
import { RowProgress } from './RowProgress.jsx';
import { StatsStrip } from './StatsStrip.jsx';
import { STALE_PARTIAL, cause, explainError } from './errors.js';
import { WAITING, clearAction, shownState, stateLabel } from './labels.js';
import { shapeOf } from './useQueue.js';
import { formatLabel, inferFormat, isOverdriveCdn } from '../game/sources.js';
import { useT } from '../i18n/index.js';
import { getGame } from '../state/catalog.js';
import { BUSY, COMPLETE } from '../state/download-queue.js';
import { Button2 } from '../ui/Button.jsx';
import { CdnSpark } from '../ui/CdnAura.jsx';
import { Cover } from '../ui/Cover.jsx';
import { colors } from '../ui/colors.js';
import { HAIRLINE, RADIUS_CARD } from '../ui/tokens.js';
import { px } from '../ui/scale.js';
import { Text, View } from '@ps5-react/core';

  var THUMB2 = { width: px(78), height: px(104), borderRadius: px(8) };
  var PRIMARY = { width: 210 };
  var ARM_MS = 3e3;
  var primaryKey = (id) => `downloads:${id}`;
  var FILE_KIND = /\.(exfat|ffpfsc|ffpfs|ffpkg|fpkg|pkg|rar|7z|zip)$/i;
  function shownFormat(job2, release) {
    const format = job2.artifact?.format || release.format;
    if (format && format !== "binary") return format;
    // Else what the archive's headers said while downloading, the name of the file itself, or
    // the format the link and label name.
    return job2.inspected || FILE_KIND.exec(job2.fileName || "")?.[1] || inferFormat(release) || format || null;
  }
  function primary({ state, error: error2 }, run, openGame) {
    if (state === "pausing") return { icon: "pause", label: "downloads.action.pausing", onPress: () => {
    } };
    if (BUSY.includes(state)) return { icon: "pause", label: "downloads.action.pause", onPress: () => run("pause") };
    if (["paused", "failed"].includes(state) && STALE_PARTIAL.test(cause(error2))) return { icon: "download", label: "downloads.action.restart", onPress: () => run("restart") };
    if (state === "paused") return { icon: "play", label: "downloads.action.resume", onPress: () => run("resume") };
    if (state === "failed") return { icon: "download", label: "downloads.action.retry", onPress: () => run("resume") };
    if (state === "awaiting-browser") return { icon: "play", label: "downloads.action.continueOnPage", onPress: openGame, page: true };
    if (state === "downloaded") return { icon: "circleCheck", label: "downloads.action.install", onPress: () => run("register") };
    return { icon: "chevronRight", label: "downloads.action.gamePage", onPress: openGame, page: true };
  }
  // The row's three buttons, by the key the D-pad moves to. A row outside the catalog, or one whose
  // primary already opens the game page, has no info button.
  var keyFor = (id, kind) => kind === "info" ? `downloads-info:${id}` : kind === "delete" ? `downloads-cancel:${id}` : primaryKey(id);
  var infoShown = (job2) => Boolean(getGame(job2.gameId)) && !primary(job2).page;
  // Where Up or Down lands in a neighbouring row, by the button it leaves from: the same button, or the
  // primary one where that row has no info button. Plain keys, so a row redraws only when they change:
  // the jobs themselves are new objects on every progress update.
  var linksOf = (job2) => ({ info: keyFor(job2.id, infoShown(job2) ? "info" : "primary"), primary: primaryKey(job2.id), delete: keyFor(job2.id, "delete") });
  var sameLinks = (a, b) => a === b || Boolean(a && b) && a.info === b.info && a.primary === b.primary && a.delete === b.delete;
  function DeleteButton({ id, action, run, onBlur, vertical }) {
    const [armed, setArmed] = (0, useState)(false);
    (0, useEffect)(() => {
      if (!armed) return void 0;
      const timer = setTimeout(() => setArmed(false), ARM_MS);
      return () => clearTimeout(timer);
    }, [armed]);
    return /* @__PURE__ */ (0, jsx)(
      Button2,
      {
        variant: armed ? "primary" : "secondary",
        size: "icon",
        icon: armed ? "delete" : "x",
        focusKey: `downloads-cancel:${id}`,
        ...vertical,
        onBlur: () => {
          setArmed(false);
          onBlur?.();
        },
        onPress: () => {
          if (action === "remove") {
            run(action);
            return;
          }
          setArmed(!armed);
          if (armed) run(action);
        }
      }
    );
  }
  function InfoButton({ id, onPress, onFocus, vertical }) {
    return /* @__PURE__ */ (0, jsx)(
      Button2,
      {
        variant: "secondary",
        size: "icon",
        icon: "info",
        focusKey: `downloads-info:${id}`,
        ...vertical,
        onFocus,
        onPress
      }
    );
  }
  function DownloadRowView({ job: job2, game, autoFocus, up, down, run, onOpenGame, onFocusRow }) {
    const t2 = useT();
    const { state, release } = job2;
    const shown = shownState(job2);
    const complete = COMPLETE.includes(state);
    const openGame = () => onOpenGame(job2);
    const main = primary(job2, (name) => run(job2, name), openGame);
    // A job outside the catalog has no page to open, and a primary button that already leads there
    // (continue on page) needs no second one; the triangle shortcut opens it either way.
    const infoPage = infoShown(job2) ? () => openGame() : null;
    // Up and Down go from a button to the same button of the row above or below, instead of letting
    // the D-pad pick whatever is nearest: the summary panel sits right of the list and won, so Up from
    // the first row's X landed on the storage block (2026-10-25).
    const vertical = (kind) => ({ nextFocusUp: up?.[kind], nextFocusDown: down?.[kind] });
    const onFocus = () => onFocusRow(job2);
    // This line shares 285 px with the host and the path, so it stays the bare code: whatever the
    // bytes already revealed, else the format the link itself names.
    const meta = [formatLabel(shownFormat(job2, release)), `${release.provider} ${release.version || ""}`.trim(), job2.root].join(" \xB7 ");
    const problem = job2.error && explainError(job2.error, Boolean(release.parts));
    // The files' own title id differs from the game chosen: said before anything else but an error.
    const mismatch = job2.titleMismatch ? t2("downloads.titleMismatch", { found: job2.titleMismatch, expected: job2.titleId }) : "";
    const note = problem ? problem.action ? t2("downloads.problem", { title: problem.title, action: problem.action }) : problem.title : mismatch || (state === "downloaded" ? job2.message || t2("downloads.installHint") : state === "extracted" || job2.streamed ? job2.message || "" : "");
    const cdn = isOverdriveCdn(release.provider);
    const busy = BUSY.includes(state);
    return /* @__PURE__ */ (0, jsxs)(
      View,
      {
        style: [
          { position: "relative", overflow: "hidden", borderRadius: RADIUS_CARD, backgroundColor: colors.surface, borderWidth: 1, borderColor: busy ? "#e09f3e40" : HAIRLINE }
        ],
        children: [
          /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 30, paddingHorizontal: 30, paddingVertical: 24 }, children: [
            /* @__PURE__ */ (0, jsx)(Cover, { game, label: false, style: THUMB2 }),
            /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 15 }, children: [
              /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }, children: [
                /* @__PURE__ */ (0, jsx)(Text, { style: { flex: 1, fontFamily: "Inter-Regular", fontSize: 27, fontWeight: 600, color: "#f5f1ea", numberOfLines: 1, ellipsizeMode: "tail", lineHeight: 42, letterSpacing: -0.68 }, children: job2.title }),
                /* @__PURE__ */ (0, jsxs)(View, { style: { width: 285, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 9 }, children: [
                  cdn ? /* @__PURE__ */ (0, jsx)(CdnSpark, { size: 13 }) : null,
                  /* @__PURE__ */ (0, jsx)(Text, { style: cdn ? { maxWidth: 285, fontFamily: "Inter-Regular", fontSize: 21, color: "#f5f1ea", numberOfLines: 1, ellipsizeMode: "tail", lineHeight: 30 } : { width: 285, textAlign: "end", fontFamily: "Inter-Regular", fontSize: 21, color: "#6e675e", numberOfLines: 1, ellipsizeMode: "tail", lineHeight: 30 }, children: meta })
                ] })
              ] }),
              /* @__PURE__ */ (0, jsx)(
                RowProgress,
                {
                  id: job2.id,
                  label: stateLabel(shown),
                  moving: busy && state !== "pausing",
                  // An extraction of unknown length has nothing to count: the bar shows full until
                  // the total arrives.
                  waiting: WAITING.includes(shown) || (shown === "extracting" && !job2.total),
                  open: shown === "extracting" && !job2.total,
                  complete,
                  detail: shown === "finishing" ? t2("downloads.writingToDisk") : null
                }
              ),
              note ? /* @__PURE__ */ (0, jsx)(Text, { style: problem ? { fontFamily: "Inter-Regular", fontSize: 21, color: "#f5f1ea", numberOfLines: 1, ellipsizeMode: "tail", lineHeight: 30 } : { fontFamily: "Inter-Regular", fontSize: 21, color: mismatch ? "#fde68a" : "#a39c92", numberOfLines: 1, ellipsizeMode: "tail", lineHeight: 30 }, children: note }) : null
            ] }),
            /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", gap: 12 }, children: [
              infoPage ? /* @__PURE__ */ (0, jsx)(InfoButton, { id: job2.id, onPress: infoPage, onFocus, vertical: vertical("info") }) : null,
              /* @__PURE__ */ (0, jsx)(
                Button2,
                {
                  variant: "secondary",
                  icon: main.icon,
                  label: t2(main.label),
                  style: PRIMARY,
                  autoFocus,
                  focusKey: primaryKey(job2.id),
                  ...vertical("primary"),
                  onFocus,
                  onPress: main.onPress
                }
              ),
              /* @__PURE__ */ (0, jsx)(
                DeleteButton,
                {
                  id: job2.id,
                  action: clearAction(state),
                  run: (name) => run(job2, name),
                  vertical: vertical("delete")
                }
              )
            ] })
          ] }),
          state === "downloading" ? /* @__PURE__ */ (0, jsx)(StatsStrip, { id: job2.id }) : null
        ]
      }
    );
  }
  var DownloadRow = (0, memo)(
    DownloadRowView,
    (a, b) => shapeOf(a.job) === shapeOf(b.job) && a.autoFocus === b.autoFocus && sameLinks(a.up, b.up) && sameLinks(a.down, b.down)
  );

export { DownloadRow, linksOf, primaryKey };
