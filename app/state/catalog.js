// ../pub-game-store/native/state/catalog.js
// reconstructed from the esbuild bundle in eboot.bin

import { features, games, twins } from '../data/catalog.js';
import { HIDDEN } from '../data/curate.js';
import { formatDate2, formatNumber2, t } from '../i18n/core.js';
import { createPageCache } from './page-cache.js';
import { createReleaseCache } from './release-cache.js';
import { FileSystem, Image } from '@ps5-react/core';

  var COVER_WIDTH = 440;
  var coverSize = (url) => url.startsWith("https://image.api.playstation.com/") ? url.replace(/([?&]w=)\d+/, `$1${COVER_WIDTH}`) : url;
  var releaseCache = createReleaseCache((path) => FileSystem.readFile(`/app0/${path}`));
  var pageCache = createPageCache((path) => FileSystem.readFile(`/app0/${path}`));
  var NO_PAGE = { about: [], shots: [], summary: "" };
  var hiddenIds = new Set(HIDDEN);
  var isHidden = (game) => hiddenIds.has(game.id);
  var SYNONYMS = {
    "Role Playing Game (RPG)": "RPG",
    "Role Playing Games": "RPG",
    "Role-playing": "RPG",
    Simulator: "Simulation",
    "Driving/Racing": "Racing"
  };
  var dataFile = (dir2, id) => `data/${dir2}/${encodeURIComponent(id)}.json`;
  var pageOf = (game) => {
    try {
      return pageCache(dataFile("pages", game.id));
    } catch {
      return NO_PAGE;
    }
  };
  var Entry = {
    get releases() {
      try {
        return releaseCache(dataFile("releases", this.id));
      } catch {
        return [];
      }
    },
    get about() {
      return pageOf(this).about;
    },
    get shots() {
      return pageOf(this).shots;
    },
    get shortDescription() {
      return pageOf(this).summary;
    },
    get titleId() {
      return this.id;
    }
  };
  var entries = [...games, ...twins];
  var _a;
  for (const game of entries) {
    Object.setPrototypeOf(game, Entry);
    game.genres = [...new Set(game.genres.flatMap((genre) => genre.split(" / ")).map((genre) => SYNONYMS[genre] ?? genre))];
    (_a = game.art).cover && (_a.cover = coverSize(game.art.cover));
    if (game.art.coverFallbacks) game.art.coverFallbacks = game.art.coverFallbacks.map(coverSize);
  }
  var editionsByWork = /* @__PURE__ */ new Map();
  for (const game of entries) if (game.work) editionsByWork.set(game.work, [...editionsByWork.get(game.work) ?? [], game]);
  var listed = new Set(games);
  for (const game of entries) game.platforms = [...new Set(editionsOf(game).map((edition2) => edition2.platform))].sort();
  function editionsOf(game) {
    return [...editionsByWork.get(game.work) ?? [game]].sort((a, b) => b.platform.localeCompare(a.platform) || Number(listed.has(b)) - Number(listed.has(a)) || a.titleId.localeCompare(b.titleId));
  }
  var genres = [...new Set(games.flatMap((game) => game.genres))].sort();
  var byId = new Map(entries.map((game) => [game.id, game]));
  var getGame = (id) => byId.get(id);
  function listedId(id) {
    const game = byId.get(id);
    if (!game || listed.has(game)) return id;
    return editionsOf(game).find((edition2) => listed.has(edition2) && edition2.platform === game.platform)?.id ?? id;
  }
  function warmCovers() {
    Image.warm(sortGames(games, "relevance").filter((game) => game.art.cover).map((game) => game.art.cover));
  }
  var SORTS = [
    // New releases first: the library's sort menu opens on it.
    { id: "newest", compare: (a, b) => b.releaseDate.localeCompare(a.releaseDate) },
    // Most popular puts the games Archive.org serves first: the app downloads them fastest.
    { id: "relevance", compare: (a, b) => fromArchive(b) - fromArchive(a) || b.recommendations - a.recommendations },
    { id: "rating", compare: (a, b) => (b.metacritic ?? 0) - (a.metacritic ?? 0) },
    { id: "size", compare: (a, b) => (b.sizeGb ?? 0) - (a.sizeGb ?? 0) },
    { id: "title", compare: (a, b) => a.title.localeCompare(b.title) }
  ];
  var sortLabel = (id) => t(`sort.${id}`);
  var sortGames = (list, id) => [...list].sort(SORTS.find((sort) => sort.id === id).compare);
  var fromArchive = (game) => Boolean(game.providers?.includes("archive.org"));
  function showcase(list, count) {
    const first = list.filter(fromArchive);
    return first.length >= count ? first.slice(0, count) : [...first, ...list.filter((game) => !fromArchive(game))].slice(0, count);
  }
  var HOST_NAMES = {
    "padrino cdn": "Padrino CDN",
    vikingfile: "VikingFile",
    "archive.org": "Archive.org",
    "1fichier": "1fichier",
    "pippo26442999.github": "Pippo mirror",
    datanodes: "DataNodes",
    mediafire: "MediaFire",
    filekeeper: "FileKeeper",
    datavaults: "DataVaults",
    spectrum: "Spectrum",
    buzzheavier: "Buzzheavier",
    gofile: "Gofile",
    rapidgator: "Rapidgator",
    filecrypt: "Filecrypt",
    fileditchfiles: "FileDitch",
    ranoz: "Ranoz",
    transfer: "Transfer.it",
    akirabox: "AkiraBox",
    "link-vault.org": "LinkVault",
    "rootz.so": "Rootz",
    mega: "Mega"
  };
  var MIN_HOST_GAMES = 20;
  var hostCounts = /* @__PURE__ */ new Map();
  for (const game of games) for (const host2 of game.providers ?? []) hostCounts.set(host2, (hostCounts.get(host2) ?? 0) + 1);
  function slug(value) {
    const words = value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    return words.map((word, i) => i ? word[0].toUpperCase() + word.slice(1) : word).join("");
  }
  var CDN_HOST = "padrino cdn";
  var hosts = [...hostCounts].filter(([host2, count]) => count >= MIN_HOST_GAMES || host2 === CDN_HOST).sort((a, b) => (b[0] === CDN_HOST) - (a[0] === CDN_HOST) || b[1] - a[1]).map(([host2]) => ({ value: host2, name: HOST_NAMES[host2] ?? host2 }));
  var onCdn = (game) => Boolean(game.providers?.includes(CDN_HOST));
  var SIZES = [
    { value: "small", label: "filters.size.small", test: (gb) => gb < 10 },
    { value: "medium", label: "filters.size.medium", test: (gb) => gb >= 10 && gb <= 50 },
    { value: "large", label: "filters.size.large", test: (gb) => gb > 50 }
  ];
  var named = (values, namespace) => values.map((value) => ({ value, label: `${namespace}.${slug(value)}`, name: value }));
  var byGames = (values, has) => {
    const counts = new Map(values.map((value) => [value, games.filter((game) => has(game, value)).length]));
    return [...values].sort((a, b) => counts.get(b) - counts.get(a) || a.localeCompare(b));
  };
  var RELEASES = [
    { value: "recent", label: "filters.release.recent", test: (year) => year >= 2024 },
    { value: "current", label: "filters.release.current", test: (year) => year >= 2020 && year <= 2023 },
    { value: "older", label: "filters.release.older", test: (year) => year < 2020 }
  ];
  var FACETS = [
    {
      key: "platform",
      any: true,
      options: [{ value: "ps5", name: "PS5" }, { value: "ps4", name: "PS4" }],
      has: (game, value) => game.platform === value
    },
    // A source the app downloads by itself, with no CAPTCHA page to pass in a browser.
    { key: "access", options: [{ value: "direct", label: "filters.access.direct" }], has: (game) => Boolean(game.direct) },
    {
      key: "genre",
      options: named(byGames(genres, (game, genre) => game.genres.includes(genre)), "genre"),
      has: (game, value) => game.genres.includes(value)
    },
    { key: "feature", options: named(features, "feature"), has: (game, value) => game.features.includes(value) },
    {
      key: "release",
      any: true,
      options: RELEASES,
      has: (game, value) => game.year != null && RELEASES.find((release) => release.value === value).test(game.year)
    },
    {
      key: "size",
      any: true,
      options: SIZES,
      has: (game, value) => game.sizeGb != null && SIZES.find((size) => size.value === value).test(game.sizeGb)
    },
    { key: "provider", any: true, options: hosts, has: (game, value) => game.providers?.includes(value) }
  ];
  var facetTitle = (key) => t(`filters.facet.${key}`);
  function optionLabel(option) {
    if (!option.label) return option.name;
    const text = t(option.label);
    return text === option.label ? option.name : text;
  }
  var facetLabel = (key, value) => {
    const option = FACETS.find((facet) => facet.key === key).options.find((candidate) => candidate.value === value);
    return option ? optionLabel(option) : value;
  };
  var genreLabel = (genre) => optionLabel({ label: `genre.${slug(genre)}`, name: genre });
  var featureLabel = (feature) => optionLabel({ label: `feature.${slug(feature)}`, name: feature });
  var NO_FILTERS = { ...Object.fromEntries(FACETS.map((facet) => [facet.key, []])), wishlist: false };
  var activeCount = (filters) => FACETS.reduce((sum, facet) => sum + filters[facet.key].length, Number(filters.wishlist));
  var toggleValue = (list, value) => list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  var passes = (game, facet, picked) => !picked.length || (facet.any ? picked.some((value) => facet.has(game, value)) : picked.every((value) => facet.has(game, value)));
  function matching({ filters, query, wishlist }, skip) {
    const q = query.trim().toLowerCase();
    return games.filter((game) => !isHidden(game) && (!q || `${game.title} ${game.developer} ${game.publisher}`.toLowerCase().includes(q)) && FACETS.every((facet) => facet === skip || passes(game, facet, filters[facet.key])) && (!filters.wishlist || wishlist.includes(game.id)));
  }
  var filterGames = (state) => matching(state);
  function facetCounts(state, facet) {
    const pool = matching(state, facet.any ? facet : void 0);
    return Object.fromEntries(facet.options.map(({ value }) => [value, pool.filter((game) => facet.has(game, value)).length]));
  }
  var summaryOf = (game) => game.about.find((text) => text.length > 80 && text !== text.toUpperCase()) ?? game.shortDescription;
  function relatedGames(game, limit = 6) {
    const shared = (other) => other.genres.filter((genre) => game.genres.includes(genre)).length;
    return games.filter((other) => other.id !== game.id && shared(other) > 0).sort((a, b) => shared(b) - shared(a) || b.recommendations - a.recommendations).slice(0, limit);
  }
  var formatDate3 = (iso) => iso ? formatDate2(iso) : "\u2014";
  function formatCount(n) {
    const short = (value) => formatNumber2(value, { maximumFractionDigits: 1 });
    if (n >= 1e6) return t("units.millions", { n: short(n / 1e6) });
    if (n >= 1e3) return t("units.thousands", { n: short(n / 1e3) });
    return formatNumber2(n);
  }

export { CDN_HOST, FACETS, NO_FILTERS, SORTS, activeCount, editionsOf, facetCounts, facetLabel, facetTitle, featureLabel, filterGames, formatCount, formatDate3, fromArchive, genreLabel, genres, getGame, isHidden, listedId, onCdn, optionLabel, relatedGames, showcase, sortGames, sortLabel, summaryOf, toggleValue, warmCovers };
