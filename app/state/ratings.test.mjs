import assert from 'node:assert/strict';
import {register} from 'node:module';
import test from 'node:test';

register(new URL('./download-queue-test-loader.mjs', import.meta.url), import.meta.url);
const {ratings} = await import('../data/ratings.js');
const {getGame, ratingScore, sortGames} = await import('./catalog.js');

// The store's star rating (data/ratings.js) is what the cards, the game page and the "rating" sort
// show: [stars, ratings] for a title id, weighed by how many rated it so a handful of 5-star votes
// doesn't stand over a game tens of thousands rated.
test('every rating is 1..5 stars with a whole positive number of ratings', () => {
  const entries = Object.entries(ratings);
  assert.ok(entries.length > 3000, `only ${entries.length} ratings`);
  for (const [id, pair] of entries) {
    assert.match(id, /^(?:CUSA|PPSA)\d{5}$/, id);
    const [stars, count] = pair;
    assert.ok(Number.isFinite(stars) && stars >= 1 && stars <= 5, `${id}: ${stars}`);
    assert.ok(Number.isSafeInteger(count) && count > 0, `${id}: ${count}`);
  }
});

test('a game carries the rating of its title id', () => {
  const id = Object.keys(ratings).find((key) => getGame(key));
  assert.ok(id, 'no rated game in the catalog');
  const game = getGame(id);
  assert.equal(game.stars, ratings[id][0]);
  assert.equal(game.ratingCount, ratings[id][1]);
});

test('the rating score weighs the number of ratings, and an unrated game scores 0', () => {
  // 4.9 stars from 40 people ranks under 4.8 from 70 000.
  assert.ok(ratingScore({stars: 4.9, ratingCount: 40}) < ratingScore({stars: 4.8, ratingCount: 70000}));
  assert.equal(ratingScore({metacritic: 90}), 0);
  const [first, second] = sortGames([
    {title: 'A', stars: 4.9, ratingCount: 40},
    {title: 'B', stars: 4.8, ratingCount: 70000}
  ], 'rating');
  assert.equal(second.title, 'A');
  assert.equal(first.title, 'B');
});
