import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const {configure, setLocale, t} = await import('./core.js');
const {compile} = await import('./icu.js');
const {LOCALES, matchLocale} = await import('./locales.js');
const {formatDate} = await import('./format.js');

const read = (code) => JSON.parse(readFileSync(new URL(`./locales/${code}.json`, import.meta.url), 'utf8'));
const en = read('en');
const pl = read('pl');
const ko = read('ko');

// Polish arrived for issue #121: a language is only added when the file carries every string, and
// Polish counts in one, few and many, which the interface's plurals have to follow.

test('Polish carries every English string', () => {
  assert.deepEqual(Object.keys(en).filter((key) => !(key in pl)), []);
});

test('every Polish string is a valid message', () => {
  for (const [key, text] of Object.entries(pl)) {
    assert.doesNotThrow(() => compile(text), key);
  }
});

test('Polish plurals say one, few and many', () => {
  configure((code) => (code === 'pl' ? pl : en), en);
  setLocale('pl');
  assert.equal(t('catalog.gameCount', {count: 1}), '1 gra');
  assert.equal(t('catalog.gameCount', {count: 3}), '3 gry');
  assert.equal(t('catalog.gameCount', {count: 22}), '22 gry', 'a 2 at the end wins over the teens rule');
  assert.equal(t('catalog.gameCount', {count: 5}), '5 gier');
  assert.equal(t('catalog.gameCount', {count: 12}), '12 gier');
  assert.equal(t('catalog.gameCount', {count: 0}), '0 gier');
});

// Korean: the file carries every English string with the same placeholders, and Korean has no
// plural forms, so every count takes "other".

const placeholders = (text) => [...text.matchAll(/(?<!\b(?:one|other|few|many|zero|two|all|yes) )\{([A-Za-z_]\w*)\s*[,}]/g)].map((match) => match[1]).sort();

test('Korean is registered and matched from system language tags', () => {
  assert.equal(LOCALES.find((locale) => locale.code === 'ko')?.name, '한국어');
  assert.equal(matchLocale('ko'), 'ko');
  assert.equal(matchLocale('ko-KR'), 'ko');
  assert.equal(matchLocale('ko_KR'), 'ko');
});

test('Korean carries every English string and nothing else', () => {
  assert.deepEqual(Object.keys(en).filter((key) => !(key in ko)), []);
  assert.deepEqual(Object.keys(ko).filter((key) => !(key in en)), []);
});

test('every Korean string is a valid message with the English placeholders', () => {
  for (const [key, text] of Object.entries(ko)) {
    assert.doesNotThrow(() => compile(text), key);
    assert.deepEqual(placeholders(text), placeholders(en[key]), key);
  }
});

test('Korean plurals take the same form for every count', () => {
  configure((code) => (code === 'ko' ? ko : en), en);
  setLocale('ko');
  for (const count of [0, 1, 2, 5, 21]) {
    assert.equal(t('catalog.gameCount', {count}), `게임 ${count}개`);
  }
  assert.equal(formatDate('ko', '2026-11-27'), '2026년 11월 27일');
});
