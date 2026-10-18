// ../pub-game-store/native/browse/PopularRail.jsx
// reconstructed from the esbuild bundle in eboot.bin

import { jsx } from 'react/jsx-runtime';
import { memo } from 'react';
import { GameRail } from './GameRail.jsx';
import { games } from '../data/catalog.js';
import { PINNED } from '../data/curate.js';
import { useT } from '../i18n/index.js';
import { NO_FILTERS, getGame, isHidden } from '../state/catalog.js';
import { FAMOUS, INDIE, picked, shuffle } from './picks.js';
import { useNavActions } from '../state/nav.jsx';
import { useStoreActions } from '../state/store.jsx';
import { GameCard } from '../ui/GameCard.jsx';

  var WIDTH4 = 152;
  // "You might like" (was the most popular, which only Archive.org's few games could reach): fifteen
  // games, new on every launch, from the hand-picked famous and indie ones, the pinned rows and the
  // rest of the catalog's games that have art and a genre, so the row always has something worth opening.
  function selectPicks() {
    const pinned = (PINNED.popular || []).map((id) => getGame(id)).filter((game) => game && !isHidden(game));
    const pinnedIds = new Set(pinned);
    const famous = picked(games, FAMOUS).filter((game) => !pinnedIds.has(game) && !isHidden(game)).slice(0, 6);
    const indie = picked(games, INDIE).filter((game) => !pinnedIds.has(game) && !isHidden(game)).slice(0, 3);
    const chosen = new Set([...pinned, ...famous, ...indie]);
    const others = shuffle(games.filter((game) => !chosen.has(game) && !isHidden(game) && game.art.cover && game.art.hero && game.genres.length)).slice(0, Math.max(0, 15 - chosen.size));
    return [...pinned, ...shuffle([...famous, ...indie, ...others])];
  }
  var POPULAR = selectPicks();
  var FIRST_POPULAR = `popular:${POPULAR[0].id}`;
  var PopularRail = (0, memo)(function PopularRail2() {
    const t2 = useT();
    const { openGame, focusLater } = useNavActions();
    const { setFilters, setQuery, setSort } = useStoreActions();
    const seeAll = () => {
      setFilters(NO_FILTERS);
      setQuery("");
      setSort("newest");
      focusLater("catalog:sort");
    };
    return /* @__PURE__ */ (0, jsx)(GameRail, { title: t2("browse.forYou"), onSeeAll: seeAll, seeAllKey: "popular:all", children: POPULAR.map((game, index) => {
      const key = `popular:${game.id}`;
      return /* @__PURE__ */ (0, jsx)(
        GameCard,
        {
          game,
          width: WIDTH4,
          detailed: true,
          focusKey: key,
          rowEnd: index === POPULAR.length - 1,
          onPress: () => openGame(game.id, key)
        },
        game.id
      );
    }) });
  });

export { FIRST_POPULAR, PopularRail };
