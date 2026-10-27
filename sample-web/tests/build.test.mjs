import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access, stat } from 'node:fs/promises';
import vm from 'node:vm';
import { brotliDecompressSync } from 'node:zlib';

const dist = new URL('../atoz-studio/dist/', import.meta.url);
test('production entry uses one deferred bundle, hashed caching and local assets', async () => {
  const html = await readFile(new URL('index.html', dist), 'utf8');
  assert.match(html, /<script src="\/assets\/app\.[a-f0-9]{12}\.js" defer>/);
  assert.equal([...html.matchAll(/<script\b/g)].length, 1);
  for (const match of html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)) await access(new URL('.' + match[1], dist));
  assert.ok(!html.includes('motion.js'));
  assert.ok(!html.includes('.jpg'));
  const headers = await readFile(new URL('_headers', dist), 'utf8');
  assert.match(headers, /max-age=31536000, immutable/);
});
test('production JavaScript and standalone scripts parse successfully', async () => {
  const files = await readdir(new URL('assets/', dist));
  for (const file of files.filter(file => file.endsWith('.js'))) new vm.Script(await readFile(new URL('assets/' + file, dist), 'utf8'));
  const html = await readFile(new URL('../client-preview.html', import.meta.url), 'utf8');
  const scripts = [...html.matchAll(/<script(?: type="module")?>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 2);
  for (const match of scripts) new vm.Script(match[1]);
});
test('all compressed assets decode to the matching current source', async () => {
  for (const name of (await readdir(new URL('assets/', dist))).filter(name => name.endsWith('.br'))) {
    const compressed = await readFile(new URL('assets/' + name, dist));
    const original = await readFile(new URL('assets/' + name.slice(0, -3), dist));
    assert.deepEqual(brotliDecompressSync(compressed), original);
  }
});
test('payload budgets prevent accidental performance regressions', async () => {
  const stats = JSON.parse(await readFile(new URL('build-stats.json', dist), 'utf8'));
  assert.ok(stats.javascriptBrotliBytes < 16 * 1024);
  assert.ok(stats.cssBrotliBytes < 16 * 1024);
  assert.ok(stats.mobileHeroBytes < 30 * 1024);
  assert.ok(stats.desktopHeroBytes < 90 * 1024);
  assert.ok(stats.primaryImagesBytes < 300 * 1024);
  assert.equal(stats.externalRuntimeDependencies, 0);
  assert.ok((await stat(new URL('../client-preview.html', import.meta.url))).size < 512 * 1024);
});
test('standalone embeds each full image once, with no network image references', async () => {
  const html = await readFile(new URL('../client-preview.html', import.meta.url), 'utf8');
  assert.equal([...html.matchAll(/data:image\/webp;base64,/g)].length, 5);
  assert.ok(!html.includes('src="/public/images/'));
  assert.ok(!html.includes('srcset="/public/images/'));
  assert.ok(!html.includes('rel="preload"'));
});
