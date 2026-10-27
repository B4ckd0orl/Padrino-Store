// ../pub-game-store/native/index.jsx
// reconstructed from the esbuild bundle in eboot.bin

import { jsx, jsxs } from 'react/jsx-runtime';
import { useEffect, useState } from 'react';
import { AppRegistry, FileSystem, FocusScope, ReleaseImages, View } from '@ps5-react/core';
import { BrowsePage } from './browse/BrowsePage.jsx';
import { DownloadsScreen } from './downloads/DownloadsScreen.jsx';
import { FilesScreen } from './files/FilesScreen.jsx';
import { GameScreen } from './game/index.jsx';
import { HomebrewGame, HomebrewScreen } from './homebrew/HomebrewScreen.jsx';
import { LocaleProvider, useLocale } from './i18n/index.js';
import { SearchScreen } from './search/index.jsx';
import { NO_FILTERS, getGame, warmCovers } from './state/catalog.js';
import { fetchUpdate } from './state/catalog-update.js';
import { isHomebrewId } from './state/homebrew.js';
import { loadList, saveList } from './state/saved.js';
import { NavProvider, useIsImmersive, useNavActions, useNavState } from './state/nav.jsx';
import { StoreFreeze, StoreProvider } from './state/store.jsx';
import { Sidebar, SIDEBAR_W } from './ui/Sidebar.jsx';
import { InfoScreen } from './ui/InfoScreen.jsx';
import { SettingsScreen } from './ui/SettingsScreen.jsx';
  import { Legend } from './ui/Legend.jsx';
  import { WelcomeGate } from './ui/WelcomeGate.jsx';
  import { Bgm } from './ui/Bgm.jsx';
  import { UpdateDialog } from './ui/UpdateDialog.jsx';
  import { useInterfaceHaptics } from './ui/haptics.js';
  import { useInterfaceSounds } from './ui/sounds.js';
  import { useShowLibrary } from './ui/useSections.js';
  import { games, twins } from './data/catalog.js';
  import { VERSION } from './version.js';
  import { BUILD } from './build.js';

  function Screen({ screen: screen2 }) {
    const { openGame, pop } = useNavActions();
    // "Browse games" on an empty Downloads opens the store front as Discover does, whatever section
    // (Favorites, Top rated) the store was left on.
    const showLibrary = useShowLibrary();
    const openCard = (game) => openGame(game.id, `card:${game.id}`);
    // A homebrew app's page reads its file from the catalog first, and says so when the app is gone.
    if (screen2.name === "game" && isHomebrewId(screen2.id)) return /* @__PURE__ */ (0, jsx)(HomebrewGame, { game: getGame(screen2.id), download: screen2.download, onBack: pop, onOpenGame: openCard });
    if (screen2.name === "game") return /* @__PURE__ */ (0, jsx)(GameScreen, { game: getGame(screen2.id), download: screen2.download, onBack: pop, onOpenGame: openCard });
    if (screen2.name === "downloads") return /* @__PURE__ */ (0, jsx)(DownloadsScreen, { onBack: pop, onBrowse: () => showLibrary(NO_FILTERS, "newest", "spotlight:cta", "discover"), onOpenGame: openGame });
    if (screen2.name === "files") return /* @__PURE__ */ (0, jsx)(FilesScreen, { onBack: pop });
    if (screen2.name === "settings") return /* @__PURE__ */ (0, jsx)(SettingsScreen, { onBack: pop });
    if (screen2.name === "info") return /* @__PURE__ */ (0, jsx)(InfoScreen, { onBack: pop });
    return /* @__PURE__ */ (0, jsx)(SearchScreen, { onBack: pop, onOpenGame: openCard });
  }
  function BrowseLayer({ shown }) {
    const { rtl } = useLocale();
    const side = rtl ? { left: 0, right: SIDEBAR_W } : { left: SIDEBAR_W, right: 0 };
    // The store front stays mounted under every other screen; while hidden it lets its images go (the
    // decoded cache keeps them until another screen needs the room), so a game page or the Homebrew page
    // is not left fighting a full cache for its own.
    return /* @__PURE__ */ (0, jsx)(View, { style: [{ position: "absolute", top: 0, bottom: 60, ...side }, shown ? null : { display: "none" }], children: /* @__PURE__ */ (0, jsx)(ReleaseImages, { when: !shown, children: /* @__PURE__ */ (0, jsx)(StoreFreeze, { frozen: !shown, children: /* @__PURE__ */ (0, jsx)(FocusScope, { focusKey: "page", autoFocus: true, inert: !shown, children: /* @__PURE__ */ (0, jsx)(BrowsePage, {}) }) }) }) });
  }
  // The Homebrew page stays mounted while an app opened from it is on top, hidden like the store front,
  // so Back finds it as it was left: its filter, its scroll and the card focus came from.
  function HomebrewLayer({ shown }) {
    const { rtl } = useLocale();
    const { pop } = useNavActions();
    const side = rtl ? { left: 0, right: SIDEBAR_W } : { left: SIDEBAR_W, right: 0 };
    return /* @__PURE__ */ (0, jsx)(View, { style: [{ position: "absolute", top: 0, bottom: 60, ...side }, shown ? null : { display: "none" }], children: /* @__PURE__ */ (0, jsx)(ReleaseImages, { when: !shown, children: /* @__PURE__ */ (0, jsx)(FocusScope, { focusKey: "homebrew-page", inert: !shown, children: /* @__PURE__ */ (0, jsx)(HomebrewScreen, { onBack: pop }) }) }) });
  }
  var WARM_DELAY_MS = 3e3;
  var UPDATE_DELAY_MS = 2e4;
  function App() {
    useInterfaceSounds();
    useInterfaceHaptics();
    (0, useEffect)(() => {
      const id = setTimeout(warmCovers, WARM_DELAY_MS);
      // The catalog's update for the next launch, read once the app has settled: no list changes
      // under the player.
      const update = setTimeout(fetchUpdate, UPDATE_DELAY_MS);
      return () => {
        clearTimeout(id);
        clearTimeout(update);
      };
    }, []);
    const { stack, top } = useNavState();
    const onBrowse = top.name === "browse";
    const onHomebrew = top.name === "homebrew";
    const keepHomebrew = stack.some((screen2) => screen2.name === "homebrew");
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
          keepHomebrew ? /* @__PURE__ */ (0, jsx)(HomebrewLayer, { shown: onHomebrew }) : null,
          onBrowse || onHomebrew ? null : (
            // No background of its own: the root's canvas shows through, so a screen change does not
            // fill the whole screen twice. `screen` lets the sidebar's Into return to where it was left.
            /* @__PURE__ */ (0, jsx)(View, { style: immersive ? { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } : top.name === "downloads" || top.name === "files" || top.name === "settings" || top.name === "info" ? [{ position: "absolute", top: 0, bottom: 0 }, side] : [{ position: "absolute", top: 0, bottom: 60 }, side], children: /* @__PURE__ */ (0, jsx)(FocusScope, { focusKey: "screen", children: /* @__PURE__ */ (0, jsx)(Screen, { screen: top }) }) }, key)
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
  // Which build wrote this session of app.log: a draft rebuilt with the same version is otherwise
  // indistinguishable from the one before it.
  console.log(`[padrino] version ${VERSION} build ${BUILD.commit}${BUILD.built ? ` ${BUILD.built}` : ""}`);
  // The same files at another cluster size make an image of another size, so what app.log says about
  // the image is how a console test tells two drafts of one version apart. The free space is the
  // image's own slack, and the app reads its catalog files from this volume.
  try {
    const image = FileSystem.diskUsage(FileSystem.appDir);
    console.log(`[padrino] image ${FileSystem.appDir}: ${(image.total / 1048576).toFixed(0)} MiB total, ` +
      `${((image.total - image.free) / 1048576).toFixed(0)} MiB in use, ${(image.free / 1048576).toFixed(0)} MiB free`);
  } catch (error) {
    console.log(`[padrino] image ${FileSystem.appDir}: usage not read: ${error.message}`);
  }
  // What the lists hold after the nightly update, if one was kept: a build whose catalog did not
  // arrive intact otherwise looks like a working one with games missing.
  console.log(`[padrino] catalog: ${games.length} games, ${twins.length} editions`);
  AppRegistry.registerComponent("overdrive", () => () => /* @__PURE__ */ (0, jsx)(Boot, {}));
