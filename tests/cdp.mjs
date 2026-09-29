// Mínimo para manejar Chrome sin instalar Puppeteer: servidor estático + Chrome headless por CDP.
import { createServer } from 'node:http';
import { readFile, mkdtemp } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, extname, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.m4a': 'audio/mp4', '.webmanifest': 'application/manifest+json' };
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export function servir(raiz = RAIZ) {
  const srv = createServer(async (req, res) => {
    let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (ruta.endsWith('/')) ruta += 'index.html';
    try {
      const datos = await readFile(join(raiz, ruta));
      res.writeHead(200, { 'content-type': TIPOS[extname(ruta)] || 'application/octet-stream' }); res.end(datos);
    } catch { res.writeHead(404); res.end('404'); }
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ url: `http://127.0.0.1:${srv.address().port}/`, cerrar: () => srv.close() })));
}

export async function abrirChrome() {
  const perfil = await mkdtemp(join(tmpdir(), 'yc-chrome-'));
  const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${perfil}`, '--no-first-run',
    '--no-default-browser-check', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((ok, ko) => {
    let buf = ''; const t = setTimeout(() => ko(new Error('Chrome no arrancó en 15 s')), 15000);
    proc.stderr.on('data', d => { buf += d; const m = buf.match(/ws:\/\/[^\s]+/); if (m) { clearTimeout(t); ok(m[0]); } });
    proc.on('exit', c => ko(new Error('Chrome salió con código ' + c)));
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = ko; });
  let id = 0; const pendientes = new Map(), oyentes = [];
  ws.onmessage = ({ data }) => {
    const m = JSON.parse(data);
    if (m.id && pendientes.has(m.id)) { const { ok, ko } = pendientes.get(m.id); pendientes.delete(m.id); m.error ? ko(new Error(m.error.message)) : ok(m.result); }
    else if (m.method) oyentes.forEach(f => f(m));
  };
  const enviar = (method, params = {}, sessionId) => new Promise((ok, ko) => {
    const i = ++id; pendientes.set(i, { ok, ko }); ws.send(JSON.stringify({ id: i, method, params, sessionId }));
  });
  const { targetId } = await enviar('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await enviar('Target.attachToTarget', { targetId, flatten: true });
  const pagina = {
    cdp: (m, p) => enviar(m, p, sessionId),
    on: (metodo, f) => oyentes.push(m => m.sessionId === sessionId && m.method === metodo && f(m.params)),
    async evaluar(expr) {
      const r = await pagina.cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true, userGesture: true });
      if (r.exceptionDetails) throw new Error('En la página: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      return r.result.value;
    },
    async esperar(expr, ms = 10000) {
      const fin = Date.now() + ms;
      while (Date.now() < fin) { if (await pagina.evaluar(`!!(${expr})`)) return; await dormir(100); }
      throw new Error(`No se cumplió a tiempo: ${expr}`);
    },
    async captura(ruta) { const { data } = await pagina.cdp('Page.captureScreenshot', { format: 'png' }); await (await import('node:fs/promises')).writeFile(ruta, Buffer.from(data, 'base64')); },
  };
  await pagina.cdp('Page.enable'); await pagina.cdp('Runtime.enable'); await pagina.cdp('Log.enable');
  return { pagina, cerrar: () => { try { ws.close(); } catch {} proc.kill(); } };
}

export const dormir = ms => new Promise(r => setTimeout(r, ms));

// Móvil tipo Android de gama media: pantalla, toque y CPU 4× más lenta que el Mac
export async function comoMovil(pagina, { ancho = 412, alto = 915, dpr = 2.625, cpu = 4, idioma = 'es' } = {}) {
  await pagina.cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: dpr, mobile: true });
  await pagina.cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await pagina.cdp('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 16; A059) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36', acceptLanguage: idioma });
  if (cpu > 1) await pagina.cdp('Emulation.setCPUThrottlingRate', { rate: cpu });
  await pagina.cdp('Emulation.setGeolocationOverride', { latitude: 35.4903, longitude: 138.6004, accuracy: 20 }); // Minobu
  await pagina.cdp('Browser.grantPermissions', { permissions: ['geolocation'] }).catch(() => {});
}
