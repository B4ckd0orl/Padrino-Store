// ../pub-game-store/native/search/match.js
// reconstructed from the esbuild bundle in eboot.bin

// Loaded for its side effects: the catalogue's synonyms and hidden games are applied by this
// module's run, and searching without it would match the raw entries.
import '../state/catalog.js';
import { games } from '../data/catalog.js';

  var fold = (text) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  var haystacks = games.map((game) => fold(`${game.title} ${game.developer} ${game.publisher}`));
  function searchGames(query) {
    const needle = fold(query.trim());
    return needle ? games.filter((_, i) => haystacks[i].includes(needle)) : games;
  }

export { searchGames };
