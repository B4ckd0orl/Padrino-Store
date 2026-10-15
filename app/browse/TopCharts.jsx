// ../pub-game-store/native/browse/TopCharts.jsx
// reconstructed from the esbuild bundle in eboot.bin

import '../assets/Inter-Regular.ttf';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { games } from '../data/catalog.js';
import { prefetchWhenSettled } from '../game/art.js';
import { latin, useLocale, useT } from '../i18n/index.js';
import { NO_FILTERS, formatCount, formatDate3, showcase, sortGames, sortLabel } from '../state/catalog.js';
import { useNavActions } from '../state/nav.jsx';
import { useStoreActions } from '../state/store.jsx';
import { Cover } from '../ui/Cover.jsx';
import { FocusFrame } from '../ui/FocusRing.jsx';
import { SectionHeader } from '../ui/SectionHeader.jsx';
import { lightGame, unlight } from '../ui/lightBar.js';
import { Text, View } from '@ps5-react/core';

  var CHARTS = ["relevance", "newest", "rating"].map((id) => ({ id, games: showcase(sortGames(games, id), 5) }));
  var DETAIL = {
    relevance: (t2, game) => t2("browse.reviews", { count: formatCount(game.recommendations) }),
    newest: (t2, game) => formatDate3(game.releaseDate)
  };
  var thumb = { width: 66, height: 87, borderRadius: 9 };
  function Detail({ chart, game }) {
    const t2 = useT();
    if (chart !== "rating") return /* @__PURE__ */ (0, jsx)(Text, { style: { marginTop: 6, fontFamily: "Inter-Regular", fontSize: 21, color: "#a3a3ab" }, children: DETAIL[chart](t2, game) });
    return /* @__PURE__ */ (0, jsxs)(View, { style: { marginTop: 6, flexDirection: "row", alignItems: "center", gap: 9 }, children: [
      /* @__PURE__ */ (0, jsx)(View, { style: { borderRadius: 3, backgroundColor: "#f2f2f3", paddingHorizontal: 9 }, children: /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 21, fontWeight: 700, color: "#000000", lineHeight: 30 }, children: String(game.metacritic ?? "\u2014") }) }),
      /* @__PURE__ */ (0, jsx)(Text, { style: { fontFamily: "Inter-Regular", fontSize: 21, color: "#a3a3ab" }, children: "Metacritic" })
    ] });
  }
  function Row3({ rank, game, chart }) {
    const { rtl } = useLocale();
    return /* @__PURE__ */ (0, jsxs)(Fragment, { children: [
      /* @__PURE__ */ (0, jsx)(FocusFrame, {}),
      /* @__PURE__ */ (0, jsx)(Text, { style: { width: 18, fontFamily: "Inter-Regular", fontSize: 21, color: "#8a8a94", lineHeight: 30 }, children: String(rank) }),
      /* @__PURE__ */ (0, jsx)(Cover, { game, style: thumb, label: false }),
      /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1 }, children: [
        /* @__PURE__ */ (0, jsx)(Text, { style: { width: 444, fontFamily: "Inter-Regular", fontSize: 21, color: "#f2f2f3", numberOfLines: 1, ellipsizeMode: "tail", lineHeight: 30 }, children: latin(rtl, game.title) }),
        /* @__PURE__ */ (0, jsx)(Detail, { chart, game })
      ] })
    ] });
  }
  function TopCharts() {
    useT();
    const { openGame, focusLater } = useNavActions();
    const { setFilters, setQuery, setSort } = useStoreActions();
    const seeAll = (id) => {
      setFilters(NO_FILTERS);
      setQuery("");
      setSort(id);
      focusLater("catalog:sort");
    };
    return /* @__PURE__ */ (0, jsx)(View, { scrollAnchor: true, style: { marginBottom: -18, marginTop: -12, flexDirection: "row", gap: 48 }, children: CHARTS.map(
      (chart) => /* @__PURE__ */ (0, jsxs)(View, { style: { flex: 1 }, children: [
        /* @__PURE__ */ (0, jsx)(SectionHeader, { title: sortLabel(chart.id), onSeeAll: () => seeAll(chart.id) }),
        chart.games.map((game, index) => {
          const key = `chart:${chart.id}:${game.id}`;
          return /* @__PURE__ */ (0, jsx)(
            View,
            {
              focusKey: key,
              onPress: () => openGame(game.id, key),
              onFocus: () => {
                prefetchWhenSettled(game);
                lightGame(key, game);
              },
              onBlur: () => unlight(key),
              style: (_state) => [{ position: "relative", marginHorizontal: -12, flexDirection: "row", alignItems: "center", gap: 21, borderRadius: 12, padding: 12 }, _state.focused ? { backgroundColor: "#17171a" } : null],
              children: /* @__PURE__ */ (0, jsx)(Row3, { rank: index + 1, game, chart: chart.id })
            },
            game.id
          );
        })
      ] }, chart.id)
    ) });
  }

export { TopCharts };
