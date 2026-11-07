// The compression screen: every game folder on the console's drives that the engine may pack,
// what is already packed (and at which level, as far as this app's own record knows), what is
// running right now, and what each conversion took and gave back. Packing opens the dialog that
// asks first; the original is only ever taken off the disk once the engine's own result has been
// verified, and this screen only reports that it went. Unpacking only writes files back.

import '../assets/Inter-Regular.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useEffect, useMemo, useRef, useState } from 'react';
import { folderSize, scanDrive } from '../files/scan.js';
import { eligibleFolder } from '../downloads/forge-eligible.js';
import { useT } from '../i18n/index.js';
import { COMPLETE } from '../state/download-queue.js';
import { downloadQueue, driveName, storageRoots } from '../state/downloads.js';
import { getGame } from '../state/catalog.js';
import { forgeEngine } from '../state/forge-live.js';
import { useNavActions } from '../state/nav.jsx';
import { formatBytes } from '../state/size.js';
import { ButtonHints } from '../ui/ButtonHints.jsx';
import { FocusRing } from '../ui/FocusRing.jsx';
import { HINT } from '../ui/Legend.jsx';
import { Icon } from '../ui/Icon.jsx';
import { ProgressBar } from '../ui/ProgressBar.jsx';
import { colors } from '../ui/colors.js';
import { GUTTER, HAIRLINE, RADIUS_CARD } from '../ui/tokens.js';
import { FocusScope, FileSystem, ScrollView, Text, View, useIsFocused } from '@ps5-react/core';
import { CompressDialog } from './CompressDialog.jsx';
import { packedFormat } from './detect.js';
import { rootOf } from './options.js';
import { ensureEngine, packError, recoverInterrupted } from './start-pack.js';

  var ARM_MS = 4e3;
  var rowKey = (path) => `forge:${path}`;
  var TEXT = { fontFamily: "Inter-Regular" };

  // The stage the engine reports, in the player's words: anything it does not name is still work
  // happening, never a dead job.
  function stageLabel(t2, stage) {
    const name = String(stage ?? "").toLowerCase();
    const key = name.includes("unpack") ? "forge.stage.unpack" : name.includes("verify") || name.includes("check") ? "forge.stage.verify" : name.includes("pack") ? "forge.stage.pack" : null;
    return key ? t2(key) : t2("forge.stage.working");
  }

  // Every folder on the drives the engine may touch: a game folder the store can pack, or one
  // whose packs are already inside it. A folder the console installed itself, a patch, a
  // backport or a plain file never reaches the list.
  function scanFolders() {
    const titles = new Map();
    try {
      for (const job of downloadQueue().snapshot()) {
        if (!COMPLETE.includes(job.state)) continue;
        for (const path of [job.output, job.artifact?.destination]) {
          if (typeof path === "string" && path.length > 1 && job.title) titles.set(path, job.title);
        }
      }
    } catch {
      // No queue here (nothing downloaded yet): the disk alone decides.
    }
    const rows = new Map();
    for (const root of storageRoots()) {
      let entries;
      try {
        entries = scanDrive(FileSystem, root);
      } catch {
        continue;
      }
      for (const entry of entries) {
        if (!entry.isDirectory || entry.kind !== "extracted") continue;
        const packed = packedFormat(FileSystem, entry.path);
        const folder = packed ? entry.path : eligibleFolder(FileSystem, entry.path);
        if (!folder) continue;
        const size = folder === entry.path ? entry.size : folderSize(FileSystem, folder, 4, { left: 4000 });
        const title = entry.titleId ? getGame(entry.titleId)?.title ?? "" : titles.get(entry.path) ?? titles.get(folder) ?? "";
        rows.set(folder, { path: folder, name: folder.slice(folder.lastIndexOf("/") + 1), size, packed, title, titleId: entry.titleId });
      }
    }
    return [...rows.values()].sort((a, b) => b.size - a.size || a.name.localeCompare(b.name));
  }

  // The engine as it is right now: its jobs (with progress), our own records, and the last
  // failure to reach it. The first poll lands as soon as the screen opens; `polls` counts every
  // answer, good or bad, so the screen can act on the first one that arrives.
  function useEngine() {
    const [state, setState] = (0, useState)(() => ({ jobs: [], records: forgeEngine().records(), error: null, polls: 0 }));
    (0, useEffect)(() => {
      const stop = forgeEngine().watch((list, error) => {
        setState((last) => ({
          jobs: list ?? [],
          records: forgeEngine().records(),
          error: error ? String(error.code ?? error.message ?? "unreachable") : null,
          polls: last.polls + 1
        }));
      }, { intervalMs: 2500 });
      return stop;
    }, []);
    return state;
  }

  function ForgeRow({ row, job, record, armed, autoFocus, focusKey, onFocus, onPress }) {
    const t2 = useT();
    const focused = useIsFocused();
    const live = job?.state === "running" ? job : null;
    const fraction = live && live.progress.total > 0 ? Math.min(1, live.progress.done / live.progress.total) : 0;
    const settled = !live && record && ["done", "failed", "interrupted"].includes(record.state) ? record.state : null;
    const level = row.packed && record?.action === "pack" && record.output === row.path && record.mode === row.packed && typeof record.level === "number" ? record.level : null;
    // What the packing took and gave back, kept from the moment the job started: the original's
    // own size against the packed folder as it sits on disk now.
    const before = row.packed && record?.action === "pack" && record.output === row.path && record.size > 0 ? record.size : null;
    const freed = before && before > row.size ? before - row.size : 0;
    // The historical marker: the original this pack came from is gone, so Unpack is the way back.
    const originalGone = record?.deletion?.state === "removed";
    const sizes = before
      ? `${formatBytes(before)} \u2192 ${formatBytes(row.size)}${freed ? ` \u00B7 \u2212${formatBytes(freed)}` : ""}`
      : formatBytes(row.size);
    const status = settled ? t2(`forge.${settled}`) : "";
    const line = status ? `${sizes} \u00B7 ${status}` : sizes;
    const primary = row.title || row.name;
    const secondary = [row.title && row.title !== row.name ? row.name : null, row.titleId && !primary.includes(row.titleId) ? row.titleId : null, driveName(rootOf(row.path))].filter(Boolean).join(" \u00B7 ");
    const tone = settled === "done" ? colors.ok : settled ? colors.warn : focused ? colors.muted : colors.subtle;
    return /* @__PURE__ */ (0, jsxs)(View, {
      focusKey, autoFocus, onPress, onFocus,
      style: (state) => [
        { position: "relative", height: 72, flexDirection: "row", alignItems: "center", gap: 20, borderRadius: RADIUS_CARD, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: HAIRLINE },
        armed ? { backgroundColor: colors.accent, borderBottomColor: "transparent" } : state.focused ? { backgroundColor: colors.surface } : null
      ],
      children: [
        armed ? null : /* @__PURE__ */ (0, jsx)(FocusRing, { round: "md" }),
        /* @__PURE__ */ (0, jsx)(Icon, { name: "layers", size: 20, color: armed ? colors.accentInk : row.packed ? colors.accent : colors.muted }),
        /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 4 }, children: [
          /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 21, fontWeight: 600, color: armed ? colors.accentInk : colors.fg, numberOfLines: 1, ellipsizeMode: "tail" }, children: primary }),
          armed
            ? /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 8 }, children: [
              /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 18, fontWeight: 600, color: colors.accentInk }, children: t2("hints.confirm") })
            ] })
            : /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 18, color: focused ? colors.muted : colors.subtle, numberOfLines: 1, ellipsizeMode: "tail" }, children: secondary })
        ] }),
        row.packed ? /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: colors.surface2, borderWidth: 1, borderColor: "#e09f3e44" }, children: [
          /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 17, fontWeight: 600, color: colors.accent }, children: t2(`forge.badge.${row.packed}`) }),
          level !== null ? /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 17, color: colors.muted }, children: t2("forge.badge.level", { n: level }) }) : null
        ] }) : null,
        originalGone ? /* @__PURE__ */ (0, jsx)(View, { style: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: colors.surface2, borderWidth: 1, borderColor: "#e09f3e44" }, children: /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 17, fontWeight: 600, color: colors.ok }, children: t2("forge.badge.originalRemoved") }) }) : null,
        live
          ? /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 16, width: 460, justifyContent: "flex-end" }, children: [
            /* @__PURE__ */ (0, jsx)(ProgressBar, { fraction, width: 180, active: true }),
            /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 18, color: colors.fg }, children: t2("forge.progress", { pct: Math.round(fraction * 100), stage: stageLabel(t2, job.progress.stage) }) })
          ] })
          : /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 19, color: tone, width: 460, textAlign: "right", numberOfLines: 1, ellipsizeMode: "tail" }, children: line })
      ]
    });
  }

  function Empty2() {
    const t2 = useT();
    return /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 96 }, children: [
      /* @__PURE__ */ (0, jsx)(Icon, { name: "layers", size: 32, color: colors.subtle }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { marginTop: 24, ...TEXT, fontSize: 27, fontWeight: 600, color: colors.fg, lineHeight: 42 }, children: t2("forge.empty") }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { marginTop: 6, width: 660, textAlign: "center", ...TEXT, fontSize: 24, color: colors.muted, numberOfLines: 2, ellipsizeMode: "tail", lineHeight: 36 }, children: t2("forge.emptyDetail") })
    ] });
  }

  function ForgeScreen({ onBack }) {
    const t2 = useT();
    const { focusLater } = useNavActions();
    const [version, setVersion] = (0, useState)(0);
    const rescan = () => setVersion((value) => value + 1);
    const rows = (0, useMemo)(() => scanFolders(), [version]);
    const { jobs, records, error, polls } = useEngine();
    const [focused, setFocused] = (0, useState)(null);
    const [armed, setArmed] = (0, useState)(null);
    const [notice, setNotice] = (0, useState)("");
    const [dialog, setDialog] = (0, useState)(null);
    // Whether the words on screen are the ones recovery put there, so its own resume can take
    // them back without wiping a notice another action left.
    const recoveryNotice = (0, useRef)(false);

    // A job settling changes the disk: the packed copy appears, the original may be gone. The
    // scan runs again only at that moment, never under the player's focus.
    const running = records.filter((record) => record.state === "running").length;
    const wasRunning = (0, useRef)(running);
    (0, useEffect)(() => {
      if (running < wasRunning.current) rescan();
      wasRunning.current = running;
    }, [running]);
    // A row that went away takes its armed state with it, and focus moves to what is left.
    (0, useEffect)(() => {
      if (!focused) return;
      if (rows.some((row) => row.path === focused.path)) return;
      setFocused(null);
      setArmed(null);
      if (rows[0]) focusLater(rowKey(rows[0].path));
    }, [rows, focused]);
    (0, useEffect)(() => {
      if (!armed) return void 0;
      const id = setTimeout(() => setArmed(null), ARM_MS);
      return () => clearTimeout(id);
    }, [armed]);

    // The engine answered a poll: a job it lost in between may be running again. Recovery only
    // ever resumes what the files still allow, and says so when it cannot; the words go once
    // the resume it was about has actually got away. While the polls themselves are failing
    // there is nothing to resume against, so the attempt waits for one that lands.
    (0, useEffect)(() => {
      if (!polls || error) return;
      let alive = true;
      // A removal that just happened -- or just refused -- is the newer fact on disk, so its own
      // words come first and stay until another action replaces them.
      const taken = forgeEngine().takeNotices();
      const removal = taken.length ? t2(taken[taken.length - 1] === "deleteFailed" ? "forge.delete.failed" : "forge.delete.originalRemoved") : "";
      // The original's own folder may just have gone: the list is read again at that moment,
      // never under the player's focus.
      if (taken.length) rescan();
      const sayRemoval = () => {
        recoveryNotice.current = false;
        setNotice(removal);
      };
      void recoverInterrupted().then(({ resumed, notices }) => {
        if (!alive) return;
        if (removal) sayRemoval();
        else if (notices.length) {
          recoveryNotice.current = true;
          setNotice(t2("forge.auto.interrupted"));
        } else if (resumed.length && recoveryNotice.current) {
          recoveryNotice.current = false;
          setNotice("");
        }
      }, () => {
        if (alive && removal) sayRemoval();
      });
      return () => {
        alive = false;
      };
    }, [polls, error]);

    const jobOf = (row) => jobs.find((job) => job.source === row.path || job.output === row.path) ?? null;
    const recordOf = (row) => records.find((record) => record.source === row.path) ?? records.find((record) => record.output === row.path) ?? null;
    const busy = (row) => Boolean(jobOf(row)) || records.some((record) => record.state === "running" && (record.source === row.path || record.output === row.path));

    const unpack = async (row) => {
      try {
        // The engine may not be running yet: starting it is part of getting this job away.
        const code = await ensureEngine({ preparing: () => setNotice(t2("forge.auto.starting")) });
        if (code) {
          setNotice(packError(t2, code));
          return;
        }
        // Writing the folder back from its packs: only ever adds files, never removes any.
        await forgeEngine().unpackJob({ source: row.path, output: row.path, mode: row.packed });
        setNotice(t2("forge.unpacking"));
      } catch (failure) {
        const code = failure?.code ?? "unknown";
        setNotice(packError(t2, code === "downloads-active" ? "downloads" : code));
      }
    };

    const onAction = (action) => {
      if (action !== "square" || !focused?.packed) return false;
      if (armed !== focused.path) {
        setArmed(focused.path);
        return true;
      }
      setArmed(null);
      void unpack(focused);
      return true;
    };
    const back = () => {
      if (armed) setArmed(null);
      else onBack();
      return true;
    };

    const ready = rows.filter((row) => !row.packed && !busy(row));
    const readySize = ready.reduce((total, row) => total + row.size, 0);
    // An engine that cannot be reached only matters while a job of ours is out there running:
    // otherwise the dialog reports it plainly the moment the player asks for a pack.
    const shown = notice || error && records.some((record) => record.state === "running") ? notice || packError(t2, error) : "";
    const hints = focused?.packed
      ? [{ button: "square", label: armed ? "hints.confirm" : "hints.unpack" }, HINT.back]
      : [{ button: "cross", label: "hints.compress" }, HINT.back];

    return /* @__PURE__ */ (0, jsx)(FocusScope, { autoFocus: true, onBack: back, onAction, children: /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1 }, children: [
      /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: GUTTER, paddingTop: 40, paddingBottom: 16 }, children: [
        /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 4 }, children: [
          /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 14 }, children: [
            /* @__PURE__ */ (0, jsx)(Icon, { name: "layers", size: 22, color: colors.accent }),
            /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 36, fontWeight: 600, color: colors.fg, lineHeight: 48, letterSpacing: -1 }, children: t2("forge.title") })
          ] }),
          /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 20, color: colors.subtle, lineHeight: 28 }, children: t2("forge.summary", { count: ready.length, size: formatBytes(readySize) }) })
        ] }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 20, color: colors.muted, maxWidth: 760, textAlign: "right", numberOfLines: 2, ellipsizeMode: "tail", lineHeight: 28 }, children: shown })
      ] }),
      /* @__PURE__ */ (0, jsx)(View, { style: { height: 1, marginHorizontal: GUTTER, backgroundColor: HAIRLINE } }),
      /* @__PURE__ */ (0, jsx)(View, { style: { flex: 1, paddingHorizontal: GUTTER }, children: rows.length
        ? /* @__PURE__ */ (0, jsx)(ScrollView, { style: { flex: 1 }, children: /* @__PURE__ */ (0, jsx)(View, { style: { gap: 4, paddingTop: 8, paddingBottom: 48 }, children: rows.map(
          (row, index) => /* @__PURE__ */ (0, jsx)(ForgeRow, {
            row,
            job: jobOf(row),
            record: recordOf(row),
            armed: armed === row.path,
            autoFocus: index === 0,
            focusKey: rowKey(row.path),
            onFocus: () => {
              setFocused(row);
              if (armed && armed !== row.path) setArmed(null);
            },
            onPress: row.packed ? void 0 : () => setDialog(row)
          }, row.path)
        ) }) })
        : /* @__PURE__ */ (0, jsx)(Empty2, {}) }),
      /* @__PURE__ */ (0, jsx)(ButtonHints, { hints }),
      dialog ? /* @__PURE__ */ (0, jsx)(CompressDialog, {
        folder: dialog.path,
        title: dialog.title || dialog.name,
        onClose: () => {
          setDialog(null);
          focusLater(rowKey(dialog.path));
        },
        onStarted: () => setNotice(t2("forge.ask.packing"))
      }, dialog.path) : null
    ] }) });
  }

export { ForgeScreen };
