// Service worker: la app funciona sin conexión y sin el Mac.
// Cambia VERSION al publicar cambios para que el teléfono descargue lo nuevo.
const VERSION = 'v14';
const NUCLEO = `nucleo-${VERSION}`, MEDIOS = 'medios-v1', TESELAS = 'teselas-v1';
const ARCHIVOS = ['./', 'index.html', 'campings.js', 'vocabulario.js', 'voces.js', 'anime.js', 'lugares.js', 'audios.js', 'casting.js', 'extras.js', 'manifest.json',
  'iconos/icono-192.png', 'iconos/icono-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css', 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'];
const MAX_TESELAS = 2500;

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(NUCLEO);
    await c.addAll(ARCHIVOS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('nucleo-') && k !== NUCLEO) await caches.delete(k);
    await self.clients.claim();
    guardarVoces(); // en segundo plano: no bloquea la app
  })());
});

// Las 897 voces grabadas, para que los personajes hablen también sin conexión
async function guardarVoces() {
  try {
    const texto = await (await fetch('audios.js')).text();
    const rutas = [...new Set(texto.match(/voces\/[0-9a-f]+\.m4a/g) || [])];
    const c = await caches.open(MEDIOS);
    const ya = new Set((await c.keys()).map(r => new URL(r.url).pathname.split('/').pop()));
    for (const r of rutas) if (!ya.has(r.split('/').pop())) { try { await c.add(r); } catch {} }
  } catch {}
}

const esMedio = p => /\/(voces|lugares|fotos|fotos-web|iconos)\//.test(p);
// Teselas de mapa que no cambian (el radar de la JMA no: va siempre en directo)
const esTesela = u => ['server.arcgisonline.com', 'cyberjapandata.gsi.go.jp'].includes(u.hostname) || u.hostname.endsWith('tile.opentopomap.org');

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Motores de voz y el tiempo: siempre en directo
  if (url.port === '10101' || url.port === '50021' || url.hostname.includes('open-meteo')) return;
  if (url.origin === location.origin && esMedio(url.pathname)) return e.respondWith(primeroCache(req, MEDIOS));
  if (esTesela(url)) return e.respondWith(primeroCache(req, TESELAS, MAX_TESELAS));
  if (url.origin === location.origin || url.hostname === 'cdnjs.cloudflare.com') return e.respondWith(cacheYActualiza(req));
});

async function primeroCache(req, nombre, max) {
  const c = await caches.open(nombre), hit = await c.match(req);
  if (hit) return hit;
  const r = await fetch(req);
  if (r.ok || r.type === 'opaque') {
    await c.put(req, r.clone());
    if (max) { const k = await c.keys(); for (let i = 0; i < k.length - max; i++) await c.delete(k[i]); }
  }
  return r;
}
// La app sale al instante de la caché y se actualiza por detrás para la próxima vez
async function cacheYActualiza(req) {
  const c = await caches.open(NUCLEO), hit = await c.match(req, { ignoreSearch: true });
  const red = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
  return hit || (await red) || new Response('Sin conexión', { status: 503 });
}
