import { readFile, writeFile, stat } from 'node:fs/promises';
const root = 'atoz-studio';
const assetNames = ['hero', 'hamper', 'mug', 'frame', 'florals'];
const assets = Object.fromEntries(await Promise.all(assetNames.map(async name => [name, `data:image/webp;base64,${(await readFile(`${root}/public/images/${name}.webp`)).toString('base64')}`])));
const css = await readFile(`${root}/styles.css`, 'utf8');
const source = (await Promise.all(['catalog.js', 'site-config.js', 'booking.js', 'app.js'].map(file => readFile(`${root}/${file}`, 'utf8'))))
  .map(text => text.replace(/^import .*;\n/gm, '').replace(/^export /gm, '')).join('\n')
  .replace("const imagePath = (name, size = '') => `/public/images/${name}${size ? `-${size}` : ''}.webp`;", 'const imagePath = name => window.__giftImages[name];');
// Each image is embedded exactly once, including photos reused in the page and dialogs.
const boot = `window.__giftImages=${JSON.stringify(assets)};document.querySelectorAll('img[data-asset]').forEach(el=>{el.src=window.__giftImages[el.dataset.asset];});`;
const inlineScript = text => text.replace(/<\/script/gi, '<\\/script');
let html = await readFile(`${root}/index.html`, 'utf8');
html = html.replace(/\s*<link rel="preload"[^>]+>/, '')
  .replace('<link rel="stylesheet" href="/styles.css" />', `<style>${css}</style>`)
  .replace('<script type="module" src="/app.js"></script>', `<script type="module">${inlineScript(source)}</script>`)
  .replace(/<img\b[^>]+>/g, tag => {
    const name = tag.match(/src="\/public\/images\/([a-z]+)(?:-\d+)?\.webp"/)?.[1];
    if (!name) return tag;
    return tag.replace(/\s+srcset="[^"]*"/g, '').replace(/\s+sizes="[^"]*"/g, '').replace(/src="[^"]*"/, `data-asset="${name}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"`);
  })
  .replace('/public/favicon.svg', `data:image/svg+xml;base64,${(await readFile(`${root}/public/favicon.svg`)).toString('base64')}`)
  .replace('</body>', `<script>${inlineScript(boot)}</script></body>`);
await writeFile('client-preview.html', html);
console.log(`Created client-preview.html: ${Math.round((await stat('client-preview.html')).size / 1024)} KB, fully offline.`);
