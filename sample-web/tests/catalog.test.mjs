import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { products, filterProducts, validateBag, bagTotal, money } from '../atoz-studio/catalog.js';

test('gift finder combines occasion and inclusive budget correctly', () => {
  const results = filterProducts({ occasion: 'anniversary', budget: 899 });
  assert.deepEqual(results.map(p => p.id), ['heart-mug', 'our-story']);
  assert.equal(filterProducts({ occasion: 'celebration', budget: 750 }).length, 0);
});
test('search trims spaces, ignores case and searches gift descriptions', () => {
  assert.ok(filterProducts({ query: '  MUG  ' }).some(p => p.id === 'heart-mug'));
  assert.ok(filterProducts({ query: 'camera roll' }).some(p => p.id === 'our-story'));
  assert.deepEqual(filterProducts({ query: 'nonexistent product' }), []);
});
test('saved filter does not leak products outside favorites', () => {
  assert.deepEqual(filterProducts({ saved: ['heart-mug'] }).map(p => p.id), ['heart-mug']);
  assert.deepEqual(filterProducts({ saved: [] }), []);
});
test('corrupted browser storage cannot create invalid cart lines', () => {
  const valid = { id: 'heart-mug', qty: 2, name: 'Asha', message: 'Happy birthday', ribbon: 'rose' };
  assert.deepEqual(validateBag(null), []);
  assert.deepEqual(validateBag({}), []);
  assert.deepEqual(validateBag([valid, null, { ...valid, id: 'fake' }, { ...valid, qty: -2 }, { ...valid, qty: 2.5 }, { ...valid, qty: 21 }, { ...valid, ribbon: 'unknown' }, { ...valid, message: {} }]), [valid]);
  assert.equal(validateBag([{ ...valid, name: 'x'.repeat(100), message: 'y'.repeat(1000) }])[0].message.length, 160);
});
test('gift total includes quantities and uses rupee formatting', () => {
  assert.equal(bagTotal([{ id: 'heart-mug', qty: 2 }, { id: 'our-story', qty: 1 }]), 2197);
  assert.equal(bagTotal([]), 0);
  assert.equal(money(1499), '₹1,499');
});
test('all catalog photos and static assets are present', async () => {
  for (const p of products) await access(new URL(`../atoz-studio/public/images/${p.image}.webp`, import.meta.url));
  const html = await readFile(new URL('../atoz-studio/index.html', import.meta.url), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size, 'HTML ids must be unique');
  for (const match of html.matchAll(/href="#([^\"]+)"/g)) assert.ok(ids.includes(match[1]), `Missing anchor: ${match[1]}`);
});
test('standalone client sample has no external scripts, styles, images or module imports', async () => {
  const html = await readFile(new URL('../client-preview.html', import.meta.url), 'utf8');
  assert.ok(html.includes('data:image/webp;base64,'));
  assert.ok(!/<script[^>]*\bsrc=/.test(html));
  assert.ok(!/<link[^>]*rel="stylesheet"/.test(html));
  assert.ok(!/<img[^>]*src="(?:https?:|\/public)/.test(html));
  assert.ok(!/^import .* from /m.test(html));
  assert.ok(!html.includes('@import url('));
});
