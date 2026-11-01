// Muro de «foto real vs. anime»: cada post guarda SOLO la foto real; la escena del anime la pone la app.
// Rutas: GET /posts?cursor= · GET /img/:id · POST /posts (multipart) · POST /denunciar/:id · DELETE /posts/:id (Bearer ADMIN)
const ORIGENES = [/^https:\/\/2troll\.github\.io$/, /^capacitor:\/\/localhost$/, /^https?:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/];
const MAX_IMG = 900 * 1024, POSTS_POR_DIA = 6, DENUNCIAS_PARA_OCULTAR = 3, DENUNCIAS_POR_DIA = 15, CACHE_LISTA = 60;
const ESCENA = /^(lugares|fotos-web)\/[\w-]{6,80}\.jpg$/;

const cors = req => {
  const o = req.headers.get('origin') || '';
  return { 'access-control-allow-origin': ORIGENES.some(r => r.test(o)) ? o : 'https://2troll.github.io',
    'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS', 'access-control-allow-headers': 'content-type,authorization', vary: 'origin' };
};
const json = (req, datos, estado = 200) => new Response(JSON.stringify(datos), { status: estado, headers: { 'content-type': 'application/json', ...cors(req) } });
const limpio = (s, max) => String(s || '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
// Claves ordenadas de más nueva a más vieja: KV lista por orden alfabético
// La IP solo se guarda como hash y caduca en 26 h (lo que dice privacidad.html)
const huella = async ip => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('yc:' + ip)))].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
const claveDe = (ts, id) => `p:${String(1e13 - ts).padStart(13, '0')}:${id}`;

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url), [, ruta, arg] = url.pathname.split('/');
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req) });
    try {
      if (req.method === 'GET' && (ruta === 'posts' || ruta === 'img')) return await conCache(req, ctx, () => leer(req, env, url, ruta, arg));
      if (req.method === 'POST' && ruta === 'posts') return await publicar(req, env);
      if (req.method === 'POST' && ruta === 'denunciar' && arg) return await denunciar(req, env, arg);
      // Moderación: DELETE borra del todo; POST /restaurar/:id devuelve al muro una foto ocultada por denuncias
      if ((req.method === 'DELETE' && ruta === 'posts' && arg) || (req.method === 'POST' && ruta === 'restaurar' && arg)) {
        if (!env.ADMIN || req.headers.get('authorization') !== 'Bearer ' + env.ADMIN) return json(req, { error: 'no autorizado' }, 401);
        const r = req.method === 'DELETE' ? { borrado: await borrar(env, arg) } : { restaurado: await restaurar(env, arg) };
        await Promise.all(['/img/' + arg, '/posts'].map(x => caches.default.delete(new Request(new URL(x, req.url).toString()))));
        return json(req, r);
      }
      if (req.method === 'GET' && ruta === 'ocultos') {
        if (!env.ADMIN || req.headers.get('authorization') !== 'Bearer ' + env.ADMIN) return json(req, { error: 'no autorizado' }, 401);
        const l = await env.MURO.list({ prefix: 'h:' }); return json(req, { ocultos: l.keys.map(k => k.metadata) });
      }
      return json(req, { error: 'ruta desconocida' }, 404);
    } catch (e) {
      console.error(e);
      return json(req, { error: 'fallo del servidor' }, 500);
    }
  },
};

async function leer(req, env, url, ruta, arg) {
  if (ruta === 'posts') {
    const l = await env.MURO.list({ prefix: 'p:', limit: 24, cursor: url.searchParams.get('cursor') || undefined });
    return json(req, { posts: l.keys.map(k => k.metadata).filter(Boolean), cursor: l.list_complete ? null : l.cursor });
  }
  if (!/^[\w-]{10,40}$/.test(arg || '')) return json(req, { error: 'id no válido' }, 400);
  const { value: img, metadata } = await env.MURO.getWithMetadata('i:' + arg, 'arrayBuffer');
  if (!img || metadata?.oculto) return new Response('no existe', { status: 404, headers: cors(req) });
  return new Response(img, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable', ...cors(req) } });
}
// La respuesta se guarda en la caché del borde sin la cabecera CORS (depende de quién pregunta) y se le añade al servirla
async function conCache(req, ctx, hacer) {
  const clave = new Request(new URL(req.url).toString(), { method: 'GET' }), cache = caches.default;
  let r = await cache.match(clave);
  if (!r) {
    r = await hacer();
    if (r.status === 200) {
      const copia = new Response(r.clone().body, r);
      if (!copia.headers.get('cache-control')) copia.headers.set('cache-control', `public, max-age=${CACHE_LISTA}`);
      ctx.waitUntil(cache.put(clave, copia));
    }
  }
  r = new Response(r.body, r); Object.entries(cors(req)).forEach(([k, v]) => r.headers.set(k, v));
  return r;
}

async function publicar(req, env) {
  const ip = req.headers.get('cf-connecting-ip') || 'local', dia = new Date().toISOString().slice(0, 10);
  if (env.RAFAGA && !(await env.RAFAGA.limit({ key: 'p:' + await huella(ip) })).success) return json(req, { error: 'cupo', codigo: 'rafaga' }, 429);
  const claveCupo = `q:${dia}:${await huella(ip)}`, usados = +(await env.MURO.get(claveCupo) || 0);
  if (usados >= POSTS_POR_DIA) return json(req, { error: 'cupo', codigo: 'cupo' }, 429);
  await env.MURO.put(claveCupo, String(usados + 1), { expirationTtl: 60 * 60 * 26 });
  const form = await req.formData(), foto = form.get('foto');
  const escena = String(form.get('escena') || '');
  if (!(foto instanceof File) || !foto.size) return json(req, { error: 'falta la foto' }, 400);
  if (foto.size > MAX_IMG) return json(req, { error: 'foto demasiado grande' }, 413);
  if (!ESCENA.test(escena)) return json(req, { error: 'escena no válida' }, 400);
  const bytes = new Uint8Array(await foto.arrayBuffer());
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return json(req, { error: 'solo JPEG' }, 400);
  const ts = Date.now(), id = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  // Lo que se lista va en los metadatos de la clave (≤ 1 KB) para no leer cada post por separado
  // autor = huella de la IP: permite «ocultar a esta persona» sin depender del apodo
  const meta = { id, ts, escena, nombre: limpio(form.get('nombre'), 24), autor: (await huella(ip)).slice(0, 10),
    texto: limpio(form.get('texto'), 200), verificado: form.get('verificado') === '1' };
  // KV admite 1.024 bytes de metadatos: en japonés 200 caracteres son ~600 bytes
  while (new TextEncoder().encode(JSON.stringify(meta)).length > 1000) meta.texto = meta.texto.slice(0, -10);
  await env.MURO.put('i:' + id, bytes, { metadata: { clave: claveDe(ts, id) } });
  await env.MURO.put(claveDe(ts, id), '', { metadata: meta });
  return json(req, { ok: true, post: meta }, 201);
}

async function denunciar(req, env, id) {
  if (!/^[\w-]{10,40}$/.test(id)) return json(req, { error: 'id no válido' }, 400);
  const ip = req.headers.get('cf-connecting-ip') || 'local', h = await huella(ip), dia = new Date().toISOString().slice(0, 10);
  const ya = `d:${id}:${h}`, cupo = `dq:${dia}:${h}`;
  // Lecturas primero (baratas); las escrituras (1.000/día gratis) solo para denuncias válidas
  if (env.RAFAGA && !(await env.RAFAGA.limit({ key: 'd:' + h })).success) return json(req, { ok: true });
  const [existe, repetida, hechas] = await Promise.all([env.MURO.getWithMetadata('i:' + id), env.MURO.get(ya), env.MURO.get(cupo)]);
  if (!existe.metadata || existe.metadata.oculto || repetida) return json(req, { ok: true });
  if (+(hechas || 0) >= DENUNCIAS_POR_DIA) return json(req, { ok: true });
  await env.MURO.put(cupo, String(+(hechas || 0) + 1), { expirationTtl: 60 * 60 * 26 });
  await env.MURO.put(ya, '1', { expirationTtl: 60 * 60 * 26 });
  const n = +(await env.MURO.get('n:' + id) || 0) + 1;
  // Se oculta (no se borra): el administrador puede revisarla y restaurarla
  if (n >= DENUNCIAS_PARA_OCULTAR) {
    await ocultar(env, id, existe);
    // Fuera también de la caché del borde (la imagen se cachea un año)
    await Promise.all(['/img/' + id, '/posts'].map(r => caches.default.delete(new Request(new URL(r, req.url).toString()))));
    return json(req, { ok: true, oculto: true }); }
  await env.MURO.put('n:' + id, String(n), { expirationTtl: 60 * 60 * 24 * 30 });
  return json(req, { ok: true });
}

async function ocultar(env, id, { value, metadata }) {
  const meta = (await env.MURO.list({ prefix: metadata.clave, limit: 1 })).keys[0]?.metadata;
  if (meta) await env.MURO.put('h:' + id, '', { metadata: { ...meta, clave: metadata.clave } });
  await env.MURO.delete(metadata.clave);
  await env.MURO.put('i:' + id, value, { metadata: { ...metadata, oculto: true } });
}
async function restaurar(env, id) {
  const { keys } = await env.MURO.list({ prefix: 'h:' + id, limit: 1 }), meta = keys[0]?.metadata;
  if (!meta) return false;
  const { clave, ...pub } = meta;
  await env.MURO.put(clave, '', { metadata: pub });
  const img = await env.MURO.getWithMetadata('i:' + id, 'arrayBuffer');
  await env.MURO.put('i:' + id, img.value, { metadata: { clave } });
  await env.MURO.delete('h:' + id); await env.MURO.delete('n:' + id);
  return true;
}

async function borrar(env, id) {
  const { metadata } = await env.MURO.getWithMetadata('i:' + id);
  if (!metadata) return false;
  await env.MURO.delete(metadata.clave);
  await env.MURO.delete('i:' + id); await env.MURO.delete('h:' + id);
  return true;
}
