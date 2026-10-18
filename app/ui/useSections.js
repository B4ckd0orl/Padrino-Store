// ../pub-game-store/native/ui/useSections.js
// reconstructed from the esbuild bundle in eboot.bin

import { useRef, useState } from 'react';
import { NO_FILTERS, activeCount } from '../state/catalog.js';
import { useNavActions, useNavState } from '../state/nav.jsx';
import { useQueryActive, useStoreActions, useStoreState } from '../state/store.jsx';

  var KEYS2 = {
    search: "nav:search",
    discover: "nav:discover",
    catalog: "nav:browse",
    top: "nav:top",
    new: "nav:new",
    favorites: "nav:favorites",
    downloads: "nav:downloads",
    files: "nav:files"
  };
  // L1/R1 stop on Browse too: the item only takes focus there, and ✕ opens its menu.
  var TABS = ["search", "discover", "catalog", "top", "new", "favorites", "downloads", "files"];
  // The section a header item showed, with the filters and sort it set: it names the page while
  // they stay as they are, since the library opens on New releases for Discover and Browse too and
  // the sort alone can no longer tell them apart. A change made on the page itself falls back to
  // what the filters and sort say (sectionOf).
  var pinned = { section: "discover", filters: NO_FILTERS, sort: "newest" };
  // Whether the Browse item has focus, so L1/R1 move on from it rather than from the page's section.
  var onBrowse = false;
  function useShowLibrary() {
    const store = useStoreActions();
    const nav = useNavActions();
    const [show] = (0, useState)(() => (filters, sort, target = "catalog:sort", section = "catalog") => {
      pinned = { section, filters, sort };
      store.setFilters(filters);
      store.setQuery("");
      store.setSort(sort);
      nav.home(target);
    });
    return show;
  }
  function sectionOf({ filters, sort }, query) {
    if (!query && filters === pinned.filters && sort === pinned.sort) return pinned.section;
    if (filters.wishlist) return "favorites";
    if (sort === "rating") return "top";
    if (sort === "newest") return "new";
    if (activeCount(filters) > 0 || query) return "catalog";
    return "discover";
  }
  function useSections() {
    const store = { ...useStoreState(), ...useStoreActions() };
    const queryActive = useQueryActive();
    const nav = useNavActions();
    const { top } = useNavState();
    const show = useShowLibrary();
    const underneath = top.name === "downloads" || top.name === "files" ? top.name : sectionOf(store, queryActive);
    const section = top.name === "search" ? "search" : top.name === "game" ? null : underneath;
    const topName = (0, useRef)(top.name);
    topName.current = top.name;
    // L1/R1 stopped on Browse: the pill and the item show it as the current section, like any other
    // tab, while the page stays where it was until ✕ opens the menu and a choice there shows the library.
    const [stopped, setStopped] = (0, useState)(false);
    const [on] = (0, useState)(() => ({
      show,
      search: () => topName.current !== "search" && nav.push({ name: "search" }, "nav:search"),
      discover: () => show(NO_FILTERS, "newest", "spotlight:cta", "discover"),
      top: () => show(NO_FILTERS, "rating", void 0, "top"),
      new: () => show(NO_FILTERS, "newest", void 0, "new"),
      favorites: () => show({ ...NO_FILTERS, wishlist: true }, "newest", void 0, "favorites"),
      downloads: () => topName.current !== "downloads" && nav.push({ name: "downloads" }, "nav:downloads"),
      files: () => topName.current !== "files" && nav.push({ name: "files" }, "nav:files")
    }));
    // Focus preview: hovering a browse section in the sidebar swaps the home
    // content live, PS5-guide style. Screens (search/downloads/files) and the
    // derived "catalog" still need a press, and a preview must never steal
    // focus — that only happens in on.* below.
    const preview = (name) => {
      if (topName.current !== "browse") return;
      if (name === section) return;
      if (name === "search" || name === "downloads" || name === "files" || name === "catalog") return;
      // The preview names its section too, so sectionOf keeps the pill on the hovered item.
      if (name === "discover") {
        pinned = { section: "discover", filters: NO_FILTERS, sort: "newest" };
        store.setFilters(NO_FILTERS);
        store.setQuery("");
        store.setSort("newest");
      } else if (name === "top") {
        pinned = { section: "top", filters: NO_FILTERS, sort: "rating" };
        store.setFilters(NO_FILTERS);
        store.setQuery("");
        store.setSort("rating");
      } else if (name === "new") {
        pinned = { section: "new", filters: NO_FILTERS, sort: "newest" };
        store.setFilters(NO_FILTERS);
        store.setQuery("");
        store.setSort("newest");
      } else if (name === "favorites") {
        pinned = { section: "favorites", filters: { ...NO_FILTERS, wishlist: true }, sort: "newest" };
        store.setFilters({ ...NO_FILTERS, wishlist: true });
        store.setQuery("");
        store.setSort("newest");
      }
    };
    const step = (forward) => {
      const current = onBrowse ? "catalog" : top.name === "search" ? "search" : underneath;
      const next = TABS[TABS.indexOf(current) + (forward ? 1 : -1)] ?? TABS[forward ? 0 : TABS.length - 1];
      if (next === "catalog") {
        setStopped(true);
        nav.focusLater(next === section ? "nav:current" : KEYS2.catalog);
        return;
      }
      setStopped(false);
      if (next === "downloads" || next === "files") {
        store.setQuery("");
        nav.home();
      }
      on[next]();
    };
    return {
      section,
      filters: store.filters,
      on,
      preview,
      step,
      // The page's top elements go up to `nav:current`, the current section's item, like a PS5 tab
      // row; the scope's own memory would be stale after L1/R1 or a closed menu.
      keyOf: (name) => name === section ? "nav:current" : KEYS2[name],
      shown: stopped ? "catalog" : section,
      browseFocus: { onFocus: () => onBrowse = true, onBlur: () => onBrowse = false },
      // The stop ends once focus is off Browse and its menu is closed.
      leaveBrowse: () => onBrowse || setStopped(false)
    };
  }

export { useSections, useShowLibrary };
