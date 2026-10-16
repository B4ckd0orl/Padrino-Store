// ../pub-game-store/native/index.jsx
// reconstructed from the esbuild bundle in eboot.bin

import { jsx, jsxs } from 'react/jsx-runtime';
import { useEffect, useState } from 'react';
import { AppRegistry, FocusScope, View } from '@ps5-react/core';
import { BrowsePage } from './browse/BrowsePage.jsx';
import { DownloadsScreen } from './downloads/DownloadsScreen.jsx';
import { FilesScreen } from './files/FilesScreen.jsx';
import { GameScreen } from './game/index.jsx';
import { LocaleProvider, useLocale } from './i18n/index.js';
import { SearchScreen } from './search/index.jsx';
import { getGame, warmCovers } from './state/catalog.js';
import { loadList, saveList } from './state/saved.js';
import { NavProvider, useIsImmersive, useNavActions, useNavState } from './state/nav.jsx';
import { StoreFreeze, StoreProvider } from './state/store.jsx';
import { Sidebar, SIDEBAR_W } from './ui/Sidebar.jsx';
import { SettingsScreen } from './ui/SettingsScreen.jsx';
  import { Legend } from './ui/Legend.jsx';
  import { WelcomeGate } from './ui/WelcomeGate.jsx';
  import { Bgm } from './ui/Bgm.jsx';
import { UpdateDialog } from './ui/UpdateDialog.jsx';
import { useInterfaceHaptics } from './ui/haptics.js';
import { useInterfaceSounds } from './ui/sounds.js';

  function Screen({ screen: screen2 }) {
    const { openGame, pop } = useNavActions();
    const openCard = (game) => openGame(game.id, `card:${game.id}`);
    if (screen2.name === "game") return /* @__PURE__ */ (0, jsx)(GameScreen, { game: getGame(screen2.id), download: screen2.download, onBack: pop, onOpenGame: openCard });
    if (screen2.name === "downloads") return /* @__PURE__ */ (0, jsx)(DownloadsScreen, { onBack: pop, onOpenGame: openGame });
    if (screen2.name === "files") return /* @__PURE__ */ (0, jsx)(FilesScreen, { onBack: pop });
    if (screen2.name === "settings") return /* @__PURE__ */ (0, jsx)(SettingsScreen, { onBack: pop });
    return /* @__PURE__ */ (0, jsx)(SearchScreen, { onBack: pop, onOpenGame: openCard });
  }
  function BrowseLayer({ shown }) {
    const { rtl } = useLocale();
    const side = rtl ? { left: 0, right: SIDEBAR_W } : { left: SIDEBAR_W, right: 0 };
    return /* @__PURE__ */ (0, jsx)(View, { style: [{ position: "absolute", top: 0, bottom: 60, ...side }, shown ? null : { display: "none" }], children: /* @__PURE__ */ (0, jsx)(StoreFreeze, { frozen: !shown, children: /* @__PURE__ */ (0, jsx)(FocusScope, { focusKey: "page", autoFocus: true, inert: !shown, children: /* @__PURE__ */ (0, jsx)(BrowsePage, {}) }) }) });
  }
  var WARM_DELAY_MS = 3e3;
  function App() {
    useInterfaceSounds();
    useInterfaceHaptics();
    (0, useEffect)(() => {
      const id = setTimeout(warmCovers, WARM_DELAY_MS);
      return () => clearTimeout(id);
    }, []);
    const { top } = useNavState();
    const onBrowse = top.name === "browse";
    const key = top.name === "game" ? `game:${top.id}` : top.name;
    const immersive = useIsImmersive();
    const { rtl } = useLocale();
    const side = rtl ? { left: 0, right: SIDEBAR_W } : { left: SIDEBAR_W, right: 0 };
    return (
      // Arabic and Urdu mirror every row and right-align every paragraph from here.
      /* @__PURE__ */ (0, jsxs)(View, { style: [{ width: 1920, height: 1080, backgroundColor: "#121110" }, { direction: rtl ? "rtl" : "ltr" }], children: [
        /* @__PURE__ */ (0, jsx)(Bgm, {}),
        /* @__PURE__ */ (0, jsxs)(Sidebar, { children: [
          /* @__PURE__ */ (0, jsx)(BrowseLayer, { shown: onBrowse }),
          onBrowse ? null : (
            // No background of its own: the root's canvas shows through, so a screen change does not
            // fill the whole screen twice. `screen` lets the sidebar's Into return to where it was left.
            /* @__PURE__ */ (0, jsx)(View, { style: immersive ? { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } : top.name === "downloads" || top.name === "files" || top.name === "settings" ? [{ position: "absolute", top: 0, bottom: 0 }, side] : [{ position: "absolute", top: 0, bottom: 60 }, side], children: /* @__PURE__ */ (0, jsx)(FocusScope, { focusKey: "screen", children: /* @__PURE__ */ (0, jsx)(Screen, { screen: top }) }) }, key)
          ),
          immersive ? null : /* @__PURE__ */ (0, jsx)(Legend, { screen: top.name, style: side }),
          /* @__PURE__ */ (0, jsx)(UpdateDialog, {})
        ] })
      ] })
    );
  }
  // The welcome gate shows once per console: the flag lives next to the other saved
  // lists, and the store mounts only after it is dismissed (like the splash before it).
  function Gate() {
    const [seen, setSeen] = (0, useState)(() => loadList("qr.json", "qr gate").seen === true);
    if (!seen) return /* @__PURE__ */ (0, jsx)(WelcomeGate, { onDone: () => {
      saveList("qr.json", "qr gate", { seen: true });
      setSeen(true);
    } });
    return /* @__PURE__ */ (0, jsx)(App, {});
  }
  // The console shows sce_sys/pic0.png during launch, so this is the only screen the player
  // ever waits on: the store mounts straight into the (first-time) community gate.
  function Boot() {
    return /* @__PURE__ */ (0, jsx)(View, { style: { width: 1920, height: 1080, backgroundColor: "#121110" }, children: /* @__PURE__ */ (0, jsx)(LocaleProvider, { children: /* @__PURE__ */ (0, jsx)(StoreProvider, { children: /* @__PURE__ */ (0, jsx)(NavProvider, { children: /* @__PURE__ */ (0, jsx)(Gate, {}) }) }) }) });
  }
  AppRegistry.registerComponent("overdrive", () => () => /* @__PURE__ */ (0, jsx)(Boot, {}));
