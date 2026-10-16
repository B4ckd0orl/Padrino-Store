// Padrino Store — barra lateral de navegación (reemplaza al header horizontal).
// MODIFIED v2: darker champagne column with a gold hairline edge, gold pill for
// the live section, full labels (Favoritos/Ajustes), right-aligned badges, and
// hover preview of home sections.

import '../assets/Inter-Regular.ttf';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useRef, useState } from 'react';
import { focusEnd, useLocale, useT } from '../i18n/index.js';
import { getGame } from '../state/catalog.js';
import { useIsImmersive, useNavActions, useNavState } from '../state/nav.jsx';
import { useWishlist } from '../state/store.jsx';
import { DownloadToast } from './DownloadToast.jsx';
import { DownloadsBadge } from './DownloadsBadge.jsx';
import { FocusRing } from './FocusRing.jsx';
import { LanguageSheet } from './LanguageSheet.jsx';
import { Logo } from './Logo.jsx';
import { NavItem } from './NavItem.jsx';
import { useSections } from './useSections.js';
import { colors } from './colors.js';
import { VERSION } from '../version.js';
import { FocusScope, Text, View } from '@ps5-react/core';

  var SIDEBAR_W = 256;
  var BADGE = /* @__PURE__ */ (0, jsx)(DownloadsBadge, {});
  function Sidebar({ children }) {
    const t2 = useT();
    const { rtl } = useLocale();
    const { section, on, preview, step, keyOf } = useSections();
    const wishlist = useWishlist();
    const favorites = wishlist.filter((id) => getGame(id)).length;
    const nav = useNavActions();
    const { top } = useNavState();
    const [choosingLanguage, setChoosingLanguage] = (0, useState)(false);
    const immersive = useIsImmersive();
    const down = top.name === "browse" ? "page" : "screen";
    const toastAction = (0, useRef)(null);
    const into = focusEnd(rtl, down);
    const onAction = (action) => {
      if (action === "r2" && toastAction.current) {
        toastAction.current();
        return true;
      }
      if (action !== "l1" && action !== "r1") return false;
      if (action === "r1" && section === "files") setChoosingLanguage(true);
      else
        step(action === "r1");
      return true;
    };
    const onBack = () => {
      if (!nav.pop()) nav.focusLater("spotlight:cta");
      return true;
    };
    const side = rtl ? { right: 0 } : { left: 0 };
    const edge = rtl
      ? { borderLeftWidth: 1, borderColor: "#e09f3e29" }
      : { borderRightWidth: 1, borderColor: "#e09f3e29" };
    const hover = (name) => ({ onFocus: () => preview(name) });
    return /* @__PURE__ */ (0, jsxs)(FocusScope, { onAction, onBack, children: [
      children,
      /* @__PURE__ */ (0, jsx)(DownloadToast, { actionRef: toastAction }),
      choosingLanguage ? /* @__PURE__ */ (0, jsx)(LanguageSheet, { onClose: () => setChoosingLanguage(false) }) : null,
      /* @__PURE__ */ (0, jsx)(View, { style: [immersive ? { display: "none" } : null, { position: "absolute", top: 0, bottom: 0, width: SIDEBAR_W, zIndex: 40 }, side, edge], children: /* @__PURE__ */ (0, jsx)(FocusScope, { focusKey: "sidebar", inert: immersive, children: /* @__PURE__ */ (0, jsxs)(View, { style: { width: SIDEBAR_W, height: 1080, backgroundColor: "#0f0e0c", paddingHorizontal: 24, paddingTop: 32, paddingBottom: 32, gap: 4 }, children: [
        /* @__PURE__ */ (0, jsxs)(View, { focusKey: "nav:home", onPress: on.discover, ...into, onFocus: () => preview("discover"), style: { position: "relative", flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14999, paddingHorizontal: 24, paddingVertical: 8, marginBottom: 12 }, children: [
          /* @__PURE__ */ (0, jsx)(FocusRing, { round: "full" }),
          /* @__PURE__ */ (0, jsx)(Logo, {}),
          /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 19, color: colors.subtle }, children: `v${VERSION}` })
        ] }),
        /* @__PURE__ */ (0, jsx)(NavItem, { focusKey: keyOf("search"), icon: "search", label: t2("nav.search"), current: section === "search", onPress: on.search, ...into }),
        /* @__PURE__ */ (0, jsx)(NavItem, { focusKey: keyOf("discover"), icon: "globe", label: t2("nav.discover"), current: section === "discover", onPress: on.discover, ...into, ...hover("discover") }),
        /* @__PURE__ */ (0, jsx)(NavItem, { focusKey: keyOf("catalog"), icon: "list", label: t2("nav.browse"), current: section === "catalog", onPress: () => nav.home("catalog:sort"), ...into, ...hover("catalog") }),
        /* @__PURE__ */ (0, jsx)(NavItem, { focusKey: keyOf("top"), icon: "star", label: t2("nav.top"), current: section === "top", onPress: on.top, ...into, ...hover("top") }),
        /* @__PURE__ */ (0, jsx)(NavItem, { focusKey: keyOf("new"), icon: "disc", label: t2("nav.new"), current: section === "new", onPress: on.new, ...into, ...hover("new") }),
        /* @__PURE__ */ (0, jsx)(NavItem, { focusKey: keyOf("favorites"), icon: "heart", label: t2("nav.favorites"), current: section === "favorites", onPress: on.favorites, ...into, ...hover("favorites"), children: favorites ? /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 21, fontWeight: 600, color: colors.accent }, children: String(favorites) }) : null }),
        /* @__PURE__ */ (0, jsx)(View, { style: { height: 1, marginVertical: 10, backgroundColor: "#e09f3e33" } }),
        /* @__PURE__ */ (0, jsx)(NavItem, { focusKey: keyOf("downloads"), icon: "download", label: t2("downloads.title"), current: section === "downloads", onPress: on.downloads, ...into, children: BADGE }),
        /* @__PURE__ */ (0, jsx)(NavItem, { focusKey: keyOf("files"), icon: "folder", label: t2("nav.files"), current: section === "files", onPress: on.files, ...into }),
        /* @__PURE__ */ (0, jsx)(View, { style: { flex: 1 } }),
        /* @__PURE__ */ (0, jsx)(NavItem, { focusKey: "nav:language", icon: "settings", label: t2("settings.title"), onPress: () => setChoosingLanguage(true), ...into })
      ] }) }) })
    ] });
  }

export { SIDEBAR_W, Sidebar };
