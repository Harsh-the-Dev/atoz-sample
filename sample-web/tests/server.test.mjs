import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readdir } from 'node:fs/promises';
import { brotliDecompressSync } from 'node:zlib';
import { createHandler } from '../scripts/serve.mjs';
const root = fileURLToPath(new URL('../atoz-studio/dist', import.meta.url));
const handle = createHandler(root, { production: true });
async function request(url, headers = {}, method = 'GET') {
  const response = {};
  await handle({ url, headers, method }, { writeHead(status, headers) { response.status = status; response.headers = headers; }, end(body) { response.body = body; } });
  return response;
}
test('production preview serves Brotli when accepted and respects q=0', async () => {
  const compressed = await request('/', { 'accept-encoding': 'gzip, br' });
  assert.equal(compressed.status, 200);
  assert.equal(compressed.headers['Content-Encoding'], 'br');
  assert.match(brotliDecompressSync(compressed.body).toString(), /<!doctype html>/i);
  const plain = await request('/', { 'accept-encoding': 'br;q=0, gzip;q=0' });
  assert.equal(plain.headers['Content-Encoding'], undefined);
});
test('hashed assets cache immutably and ETags avoid transferring unchanged bytes', async () => {
  const filename = (await readdir(root + '/assets')).find(name => name.endsWith('.js'));
  const first = await request('/assets/' + filename);
  assert.equal(first.headers['Cache-Control'], 'public, max-age=31536000, immutable');
  const cached = await request('/assets/' + filename, { 'if-none-match': first.headers.ETag });
  assert.equal(cached.status, 304);
  assert.equal(cached.body, undefined);
});
test('preview returns clean missing-file responses and supports HEAD', async () => {
  assert.equal((await request('/missing-file')).status, 404);
  assert.equal((await request('/.git/config')).status, 403);
  const head = await request('/', {}, 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, undefined);
  assert.ok(head.headers['Content-Length'] > 0);
});
