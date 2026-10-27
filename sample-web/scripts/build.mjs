import { cp, mkdir, rm, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync, brotliCompressSync } from 'node:zlib';
const root = 'atoz-studio';
const out = `${root}/dist`;
await rm(out, { recursive: true, force: true });
await mkdir(`${out}/assets`, { recursive: true });
await mkdir(`${out}/public/images`, { recursive: true });
const sourceFiles = ['catalog.js', 'site-config.js', 'booking.js', 'app.js'];
const source = (await Promise.all(sourceFiles.map(file => readFile(`${root}/${file}`, 'utf8'))))
  .map(text => text.replace(/^import .*;\n/gm, '').replace(/^export /gm, '')).join('\n');
const js = `(()=>{'use strict';\n${source}\n})();`;
const css = await readFile(`${root}/styles.css`, 'utf8');
const digest = text => createHash('sha256').update(text).digest('hex').slice(0, 12);
const jsPath = `assets/app.${digest(js)}.js`;
const cssPath = `assets/styles.${digest(css)}.css`;
async function compressedWrite(file, content) {
  await Promise.all([writeFile(`${out}/${file}`, content), writeFile(`${out}/${file}.br`, brotliCompressSync(content)), writeFile(`${out}/${file}.gz`, gzipSync(content))]);
}
await compressedWrite(jsPath, js);
await compressedWrite(cssPath, css);
let html = await readFile(`${root}/index.html`, 'utf8');
html = html.replace('/styles.css', `/${cssPath}`).replace('<script type="module" src="/app.js"></script>', `<script src="/${jsPath}" defer></script>`);
await compressedWrite('index.html', html);
await cp(`${root}/public/favicon.svg`, `${out}/public/favicon.svg`);
const images = (await readdir(`${root}/public/images`)).filter(name => name.endsWith('.webp'));
await Promise.all(images.map(name => cp(`${root}/public/images/${name}`, `${out}/public/images/${name}`)));
await writeFile(`${out}/_headers`, `/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/public/images/*\n  Cache-Control: public, max-age=86400, stale-while-revalidate=604800\n/\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`);
const imageBytes = await Promise.all(images.filter(name => !/-\d+\./.test(name)).map(async name => (await stat(`${out}/public/images/${name}`)).size));
const stats = {
  javascriptBytes: Buffer.byteLength(js), javascriptBrotliBytes: brotliCompressSync(js).length,
  cssBytes: Buffer.byteLength(css), cssBrotliBytes: brotliCompressSync(css).length,
  htmlBrotliBytes: brotliCompressSync(html).length,
  mobileHeroBytes: (await stat(`${out}/public/images/hero-640.webp`)).size,
  desktopHeroBytes: (await stat(`${out}/public/images/hero.webp`)).size,
  primaryImagesBytes: imageBytes.reduce((a, b) => a + b, 0), externalRuntimeDependencies: 0,
};
await writeFile(`${out}/build-stats.json`, JSON.stringify(stats, null, 2));
console.log('Built optimized static site → atoz-studio/dist');
console.log(JSON.stringify(stats, null, 2));
