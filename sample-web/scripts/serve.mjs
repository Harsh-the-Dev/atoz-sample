import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.json': 'application/json' };
function acceptsEncoding(header = '', encoding) {
  return header.split(',').some(part => {
    const [name, ...params] = part.trim().split(';');
    const quality = params.find(p => p.trim().startsWith('q='));
    return name === encoding && (!quality || Number(quality.trim().slice(2)) > 0);
  });
}
export function createHandler(root, { production = false } = {}) {
  root = path.resolve(root);
  return async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!filename.startsWith(root + path.sep) || pathname.split('/').some(part => part.startsWith('.'))) { res.writeHead(403); return res.end('Forbidden'); }
      let info = await stat(filename);
      if (info.isDirectory()) { filename = path.join(filename, 'index.html'); info = await stat(filename); }
      const etag = `W/"${info.size}-${Math.trunc(info.mtimeMs)}"`;
      const headers = { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'ETag': etag, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': production && /\/assets\//.test(pathname) ? 'public, max-age=31536000, immutable' : production && /\/public\/images\//.test(pathname) ? 'public, max-age=86400' : 'no-cache' };
      if (production) headers.Vary = 'Accept-Encoding';
      if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }
      if (production) {
        for (const [encoding, suffix] of [['br', '.br'], ['gzip', '.gz']]) {
          if (!acceptsEncoding(req.headers['accept-encoding'], encoding)) continue;
          try { await stat(filename + suffix); filename += suffix; headers['Content-Encoding'] = encoding; break; } catch { /* Serve the original when a precompressed copy does not exist. */ }
        }
      }
      const body = await readFile(filename);
      headers['Content-Length'] = body.length;
      res.writeHead(200, headers);
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch { res.writeHead(404); res.end('Not found'); }
  };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const production = process.argv.includes('--dist');
  const root = path.resolve('atoz-studio', production ? 'dist' : '.');
  const port = Number(process.env.PORT || 5173);
  const server = http.createServer(createHandler(root, { production }));
  server.on('error', error => { console.error(`Could not start preview: ${error.code}. Open client-preview.html directly if this environment blocks server ports.`); process.exit(1); });
  server.listen(port, '127.0.0.1', () => console.log(`Dearly is ready at http://localhost:${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
