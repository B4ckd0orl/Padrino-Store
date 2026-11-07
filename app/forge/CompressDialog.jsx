// What to do with a game folder the download just finished: pack it with the engine, or leave it
// as it is. The level is offered as a name and what it means, not a bare number, and the original
// is only ever removed after the packed result has been verified (the engine deletes it itself
// when asked, and never before).

import '../assets/Inter-Regular.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useEffect, useState } from 'react';
import { folderSize } from '../files/scan.js';
import { useT } from '../i18n/index.js';
import { forgeDeleteOriginal, forgeLevel, forgeOriginal } from '../state/forge-ask.js';
import { formatBytes } from '../state/size.js';
import { useNavActions } from '../state/nav.jsx';
import { Button2 } from '../ui/Button.jsx';
import { FocusRing } from '../ui/FocusRing.jsx';
import { Icon } from '../ui/Icon.jsx';
import { colors } from '../ui/colors.js';
import { FileSystem, FocusScope, Text, View } from '@ps5-react/core';
import { packError, startPack } from './start-pack.js';
import { PRESETS, levelValid, rootOf, stepLevel } from './options.js';

  var TEXT = { fontFamily: "Inter-Regular", color: colors.fg };
  var TILE = 360;
  var CUSTOM = PRESETS.length;

  function mark(selected) {
    return /* @__PURE__ */ (0, jsx)(View, { style: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: selected ? colors.accent : colors.subtle, backgroundColor: selected ? colors.accent : "transparent", alignItems: "center", justifyContent: "center" }, children: selected ? /* @__PURE__ */ (0, jsx)(Icon, { name: "check", size: 16, color: colors.accentInk }) : null });
  }

  function Choice({ focusKey, mode, level, name, hint, recommended, selected, onPress }) {
    const t2 = useT();
    return /* @__PURE__ */ (0, jsxs)(View, {
      focusKey, onPress,
      style: (state) => [{ position: "relative", width: TILE, gap: 12, borderRadius: 16, padding: 22, borderWidth: 2, borderColor: selected ? colors.accent : "transparent", backgroundColor: selected ? colors.surface3 : colors.surface2 }, state.focused ? { backgroundColor: colors.surface3 } : null],
      children: [
        /* @__PURE__ */ (0, jsx)(FocusRing, {}),
        /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 12 }, children: [
          mark(selected),
          /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 19, fontWeight: 600, letterSpacing: 1.5, color: colors.muted }, children: mode.toUpperCase() }),
          recommended ? /* @__PURE__ */ (0, jsx)(View, { style: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: colors.ok }, children: /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 16, fontWeight: 600, color: colors.accentInk }, children: t2("forge.recommended") }) }) : null
        ] }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 25, fontWeight: 600, lineHeight: 32 }, children: level === null ? t2("forge.option.custom") : t2(`forge.option.${mode}.${name}`) }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 18, color: colors.muted, lineHeight: 26 }, children: level === null ? t2("forge.option.custom.hint") : t2(`forge.option.${mode}.${name}.hint`) })
      ]
    });
  }

  function CompressDialog({ folder, title, initialError = "", onClose, onStarted }) {
    const t2 = useT();
    const { focusLater } = useNavActions();
    const saved = forgeLevel();
    const found = PRESETS.findIndex((preset) => preset.mode === saved.mode && preset.level === saved.level);
    const [choice, setChoice] = (0, useState)(found < 0 ? CUSTOM : found);
    const [custom, setCustom] = (0, useState)(saved);
    const [remove, setRemove] = (0, useState)(forgeDeleteOriginal());
    const [space, setSpace] = (0, useState)(null);
    const [busy, setBusy] = (0, useState)(false);
    // The engine may have to be started first; the button says so for as long as that lasts.
    const [preparing, setPreparing] = (0, useState)(false);
    const [error2, setError2] = (0, useState)(initialError);
    // As the stream dialog: a focus move still pending from the page would land under this one.
    (0, useEffect)(() => {
      focusLater(choice === CUSTOM ? "forge:opt:custom" : `forge:opt:${choice}`);
    }, []);
    (0, useEffect)(() => {
      let alive = true;
      const size = folderSize(FileSystem, folder, 4, { left: 4000 });
      let free = null;
      try {
        free = FileSystem.diskUsage(rootOf(folder)).free;
      } catch {}
      if (alive) setSpace({ size, free });
      return () => {
        alive = false;
      };
    }, [folder]);
    const preset = choice < CUSTOM ? PRESETS[choice] : null;
    const mode = preset ? preset.mode : custom.mode;
    const level = preset ? preset.level : custom.level;
    // What the standing setting says about the original, in the words that go under the tick, so
    // "remove it", "keep it" and "ask me" read differently even though the tick starts the same.
    const standing = forgeOriginal();
    const originalDetail = standing === "off" ? "forge.ask.keepOriginalDetail" : standing === "ask" ? "forge.ask.askOriginalDetail" : "forge.ask.deleteOriginalDetail";
    // The engine writes its output beside the source, so the original's own size has to fit
    // while it converts; without it there is no start.
    const free = space?.free ?? null;
    const fits = space !== null && (free === null || free >= space.size);

    const start = async () => {
      if (busy) return;
      if (!levelValid(mode, level)) {
        setError2(t2("forge.error.level"));
        return;
      }
      if (space && !fits) {
        setError2(t2("forge.error.space"));
        return;
      }
      setBusy(true);
      setError2("");
      try {
        const code = await startPack({ folder, mode, level, deleteAfter: remove, preparing: () => setPreparing(true) });
        if (code) {
          setError2(packError(t2, code));
          setBusy(false);
          setPreparing(false);
          return;
        }
        onClose();
        if (onStarted) onStarted({ mode, level });
      } catch (failure) {
        setError2(packError(t2, failure?.code ?? "unknown"));
        setBusy(false);
        setPreparing(false);
      }
    };
    const step = (delta) => setCustom((last) => ({ mode: last.mode, level: stepLevel(last.mode, last.level, delta) }));

    return /* @__PURE__ */ (0, jsx)(FocusScope, {
      trap: true, autoFocus: true,
      onBack: () => {
        onClose();
        return true;
      },
      onAction: (action) => {
        if (action === "r2") start();
        return true;
      },
      children: /* @__PURE__ */ (0, jsx)(View, { style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, zIndex: 50, alignItems: "center", justifyContent: "center", backgroundColor: "#000000d9" }, children: /* @__PURE__ */ (0, jsxs)(View, { style: { width: 1240, gap: 26, borderRadius: 24, borderWidth: 2, borderColor: "#e09f3e33", backgroundColor: colors.surface, paddingHorizontal: 56, paddingTop: 44, paddingBottom: 40 }, children: [
        /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 6 }, children: [
          /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 40, fontWeight: 600, letterSpacing: -1, lineHeight: 48 }, children: t2("forge.ask.title") }),
          /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 21, color: colors.muted, numberOfLines: 1, ellipsizeMode: "tail" }, children: [title, space ? formatBytes(space.size) : ""].filter(Boolean).join(" \xB7 ") })
        ] }),
        /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 20, color: colors.subtle, lineHeight: 28 }, children: t2("forge.ask.body") }),
        /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: 20 }, children: [
          PRESETS.map((preset2, index) => /* @__PURE__ */ (0, jsx)(Choice, {
            focusKey: `forge:opt:${index}`,
            mode: preset2.mode,
            level: preset2.level,
            name: preset2.name,
            recommended: Boolean(preset2.recommended),
            selected: choice === index,
            onPress: () => {
              setChoice(index);
              setCustom({ mode: preset2.mode, level: preset2.level });
              setError2("");
            }
          }, `${preset2.mode}:${preset2.level}`)),
          /* @__PURE__ */ (0, jsx)(Choice, {
            focusKey: "forge:opt:custom",
            mode: custom.mode,
            level: null,
            name: "",
            selected: choice === CUSTOM,
            onPress: () => {
              setChoice(CUSTOM);
              setError2("");
            }
          }, "custom")
        ] }),
        choice === CUSTOM ? /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 24, borderRadius: 16, backgroundColor: colors.surface2, padding: 20 }, children: [
          /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", gap: 12 }, children: [
            ...["zstd", "lz4"].map((codec) => /* @__PURE__ */ (0, jsx)(View, {
              focusKey: `forge:codec:${codec}`,
              onPress: () => {
                setCustom((last) => ({ mode: codec, level: stepLevel(codec, last.level, 0) }));
                setError2("");
              },
              style: (state) => [{ borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: custom.mode === codec ? colors.accent : colors.surface3 }, state.focused ? { backgroundColor: colors.accentBright } : null],
              children: [/* @__PURE__ */ (0, jsx)(FocusRing, {}), /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 20, fontWeight: 600, color: custom.mode === codec ? colors.accentInk : colors.fg }, children: codec.toUpperCase() })]
            }, codec))
          ] }),
          /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 18 }, children: [
            /* @__PURE__ */ (0, jsx)(View, { focusKey: "forge:level:down", onPress: () => step(-1), style: (state) => [{ width: 56, height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface3 }, state.focused ? { backgroundColor: colors.surface3, borderWidth: 2, borderColor: colors.accent } : null], children: [/* @__PURE__ */ (0, jsx)(FocusRing, {}), /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 30, fontWeight: 600 }, children: "\u2212" })] }),
            /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 34, fontWeight: 600, minWidth: 70, textAlign: "center" }, children: String(level) }),
            /* @__PURE__ */ (0, jsx)(View, { focusKey: "forge:level:up", onPress: () => step(1), style: (state) => [{ width: 56, height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface3 }, state.focused ? { backgroundColor: colors.surface3, borderWidth: 2, borderColor: colors.accent } : null], children: [/* @__PURE__ */ (0, jsx)(FocusRing, {}), /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 30, fontWeight: 600 }, children: "+" })] })
          ] }),
          /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 19, color: colors.muted, flex: 1, lineHeight: 27 }, children: t2(`forge.help.${mode}`) })
        ] }) : null,
        /* @__PURE__ */ (0, jsxs)(View, {
          focusKey: "forge:delete",
          onPress: () => setRemove(!remove),
          style: (state) => [{ position: "relative", flexDirection: "row", alignItems: "center", gap: 18, borderRadius: 14, marginHorizontal: -16, paddingHorizontal: 16, paddingVertical: 12 }, state.focused ? { backgroundColor: colors.surface2 } : null],
          children: [
            /* @__PURE__ */ (0, jsx)(FocusRing, {}),
            /* @__PURE__ */ (0, jsx)(View, { style: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 8, borderWidth: 2, borderColor: remove ? colors.fg : colors.subtle, backgroundColor: remove ? colors.fg : "transparent" }, children: remove ? /* @__PURE__ */ (0, jsx)(Icon, { name: "check", size: 22, color: colors.accentFg }) : null }),
            /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1, gap: 2 }, children: [
              /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 22, fontWeight: 600 }, children: t2("forge.ask.deleteOriginal") }),
              /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 19, color: colors.subtle }, children: t2(originalDetail) })
            ] })
          ]
        }),
        /* @__PURE__ */ (0, jsxs)(View, { style: { gap: 6 }, children: [
          space ? /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 20, color: colors.muted }, children: t2("forge.space.free", { n: free === null ? "\u2014" : formatBytes(free) }) }) : null,
          space && remove ? /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 20, color: colors.muted }, children: t2("forge.space.frees", { n: formatBytes(space.size) }) }) : null,
          space && !fits ? /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 20, color: colors.warn }, children: t2("forge.space.need", { n: formatBytes(space.size) }) }) : null,
          /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 19, color: colors.subtle, lineHeight: 27 }, children: t2("forge.help.tradeoff") })
        ] }),
        error2 ? /* @__PURE__ */ (0, jsx)(Text, { style: { ...TEXT, fontSize: 21, color: colors.warn, lineHeight: 30 }, children: error2 }) : null,
        /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", gap: 18, justifyContent: "flex-end" }, children: [
          /* @__PURE__ */ (0, jsx)(Button2, { variant: "primary", size: "lg", icon: "layers", label: busy ? t2(preparing ? "forge.auto.starting" : "forge.ask.packing") : t2("forge.ask.start"), autoFocus: true, onPress: start }),
          /* @__PURE__ */ (0, jsx)(Button2, { variant: "outline", size: "lg", label: t2("forge.ask.later"), onPress: onClose })
        ] })
      ] }) })
    });
  }

export { CompressDialog };
