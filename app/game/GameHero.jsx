// ../pub-game-store/native/game/GameHero.jsx
// reconstructed from the esbuild bundle in eboot.bin

import '../assets/Inter-Regular.ttf';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { BackLink } from './BackLink.jsx';
import { DownloadButton } from './DownloadButton.jsx';
  import { COVER, LOGO } from './art.js';
import { canDownload } from './releases.js';
import { SPAN_MAX, fitBytes } from '../i18n/fit.js';
import { latin, useLocale, useT } from '../i18n/index.js';
import { genreLabel, listedId } from '../state/catalog.js';
import { useStoreActions, useWishlist } from '../state/store.jsx';
import { Button2 } from '../ui/Button.jsx';
import { Cover } from '../ui/Cover.jsx';
import { GameLogo } from '../ui/GameLogo.jsx';
import { WishHeart } from '../ui/WishHeart.jsx';
import { EASE_OUT } from '../ui/ease.js';
import { Image, Text, View, motion } from '@ps5-react/core';

  var column = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.22 } } };
  var rise = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } } };
  function Backdrop({ game }) {
    const [failed, setFailed] = (0, useState)([]);
    const uri = [game.art.hero, ...game.shots.map((shot) => shot.url)].find((url) => url && !failed.includes(url));
    return uri ? /* @__PURE__ */ (0, jsx)(
      Image,
      {
        source: { uri },
        style: [{ position: "absolute", left: 0, right: 0, top: 0, height: 900, backgroundColor: "#26231f" }, game.art.tint ? { backgroundColor: game.art.tint } : null],
        resizeMode: "cover",
        onError: () => setFailed((previous) => [...previous, uri])
      },
      uri
    ) : null;
  }
  function Meta({ game }) {
    const t2 = useT();
    const { rtl } = useLocale();
    return /* @__PURE__ */ (0, jsxs)(Fragment, { children: [
      /* @__PURE__ */ (0, jsx)(motion.View, { variants: rise, style: { marginTop: 12 }, children: /* @__PURE__ */ (0, jsxs)(Text, { style: { width: 960, fontFamily: "Inter-Regular", fontSize: 23, color: "#a39c92", numberOfLines: 1, ellipsizeMode: "tail" }, children: [
        latin(rtl, fitBytes(game.developer, SPAN_MAX - 3)),
        game.developer && game.genres.length > 0 ? /* @__PURE__ */ (0, jsx)(Text, { style: { color: "#6e675e" }, children: "  \xB7  " }) : null,
        fitBytes(game.genres.map(genreLabel).join(", "), SPAN_MAX)
      ] }) }),
      /* @__PURE__ */ (0, jsxs)(motion.View, { variants: rise, style: { marginTop: 24, flexDirection: "row", alignItems: "center", gap: 36 }, children: [
        game.metacritic ? /* @__PURE__ */ (0, jsxs)(View, { style: { flexDirection: "row", alignItems: "center", gap: 12 }, children: [
          /* @__PURE__ */ (0, jsx)(View, { style: { borderRadius: 3, backgroundColor: "#ffffff1a", paddingHorizontal: 9 }, children: /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 21, fontWeight: 700, color: "#f5f1ea", lineHeight: 30 }, children: String(game.metacritic) }) }),
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 21, color: "#a39c92", lineHeight: 30 }, children: t2("game.metacritic") })
        ] }) : null,
        game.year ? /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 21, color: "#a39c92", lineHeight: 30 }, children: t2("game.released", { year: String(game.year) }) }) : null
      ] })
    ] });
  }
  function GameHero({ game, download, onBack, onDownloaded, onRequestDialog }) {
    const t2 = useT();
    const { rtl } = useLocale();
    const { toggleWish } = useStoreActions();
    const wished = useWishlist().includes(listedId(game.id));
    // Down from the buttons goes to the screenshots, or else to the description's Show more: without
    // either named, focus took the nearest card of "More like this" past the description.
    const nextDown = game.shots.length > 0 ? "game:shots" : game.about.some((text) => text.trim()) ? "game:about" : void 0;
    return /* @__PURE__ */ (0, jsxs)(View, { scrollAnchor: true, style: { position: "relative", overflow: "hidden", borderBottomWidth: 1, borderColor: "#e09f3e33" }, children: [
      /* @__PURE__ */ (0, jsx)(Backdrop, { game }, game.id),
      /* @__PURE__ */ (0, jsx)(View, { style: rtl ? { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundGradient: { type: "linear", to: "left", stops: [{ color: "#000000", offset: 0 }, { color: "#ffffffd9", offset: 0.45 }, { color: "#ffffff40", offset: 1 }] } } : { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundGradient: { type: "linear", to: "right", stops: [{ color: "#000000", offset: 0 }, { color: "#ffffffd9", offset: 0.45 }, { color: "#ffffff40", offset: 1 }] } } }),
      /* @__PURE__ */ (0, jsx)(View, { style: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundGradient: { type: "linear", to: "top", stops: [{ color: "#000000", offset: 0 }, { color: "transparent", offset: 0.4 }, { color: "#ffffff66", offset: 1 }] } } }),
      /* @__PURE__ */ (0, jsxs)(View, { style: { paddingHorizontal: 48, paddingTop: 36, paddingBottom: 72 }, children: [
        /* @__PURE__ */ (0, jsx)(BackLink, { onPress: onBack }),
        /* @__PURE__ */ (0, jsxs)(View, { style: { marginTop: 60, flexDirection: "row", alignItems: "flex-end", gap: 60 }, children: [
          /* @__PURE__ */ (0, jsx)(View, { style: { width: 288, height: 384, overflow: "hidden", borderRadius: 12, backgroundColor: "#1c1a17" }, children: /* @__PURE__ */ (0, jsx)(Cover, { game, style: COVER }) }),
          /* @__PURE__ */ (0, jsxs)(motion.View, { variants: column, initial: "hidden", animate: "show", style: { flex: 1 }, children: [
            /* @__PURE__ */ (0, jsx)(motion.View, { variants: rise, style: { marginBottom: 24 }, children: /* @__PURE__ */ (0, jsx)(GameLogo, { game, width: LOGO.width, height: LOGO.height }) }),
            /* @__PURE__ */ (0, jsx)(Meta, { game }),
            /* @__PURE__ */ (0, jsxs)(View, { style: { marginTop: 42, flexDirection: "row", alignItems: "flex-start", gap: 15 }, children: [
              /* @__PURE__ */ (0, jsx)(DownloadButton, { onRequestDialog, game, start: download, onDownloaded, nextDown }, game.id),
              /* @__PURE__ */ (0, jsx)(
                Button2,
                {
                  variant: "outline",
                  size: "lg",
                  label: t2(wished ? "game.favorite" : "game.addToFavorites"),
                  onPress: () => toggleWish(game.id),
                  nextFocusDown: nextDown,
                  autoFocus: !canDownload(game),
                  focusKey: `favorite:${game.id}`,
                  children: /* @__PURE__ */ (0, jsx)(WishHeart, { active: wished })
                }
              )
            ] })
          ] })
        ] })
      ] })
    ] });
  }

export { GameHero };
