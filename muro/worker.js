// Muro de «foto real vs. anime»: cada post guarda SOLO la foto real; la escena del anime la pone la app.
// Rutas: GET /posts?cursor= · GET /img/:id · POST /posts (multipart) · POST /denunciar/:id · DELETE /posts/:id (Bearer ADMIN)
const ORIGENES = [/^https:\/\/2troll\.github\.io$/, /^capacitor:\/\/localhost$/, /^https?:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/];
const MAX_IMG = 900 * 1024, POSTS_POR_DIA = 6, DENUNCIAS_PARA_OCULTAR = 2;
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
  async fetch(req, env) {
    const url = new URL(req.url), [, ruta, arg] = url.pathname.split('/');
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req) });
    try {
      if (req.method === 'GET' && ruta === 'posts') {
        const l = await env.MURO.list({ prefix: 'p:', limit: 24, cursor: url.searchParams.get('cursor') || undefined });
        return json(req, { posts: l.keys.map(k => k.metadata).filter(Boolean), cursor: l.list_complete ? null : l.cursor });
      }
      if (req.method === 'GET' && ruta === 'img' && /^[\w-]{10,40}$/.test(arg)) {
        const img = await env.MURO.get('i:' + arg, 'arrayBuffer');
        if (!img) return new Response('no existe', { status: 404, headers: cors(req) });
        return new Response(img, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable', ...cors(req) } });
      }
      if (req.method === 'POST' && ruta === 'posts') return await publicar(req, env);
      if (req.method === 'POST' && ruta === 'denunciar' && arg) return await denunciar(req, env, arg);
      if (req.method === 'DELETE' && ruta === 'posts' && arg) {
        if (!env.ADMIN || req.headers.get('authorization') !== 'Bearer ' + env.ADMIN) return json(req, { error: 'no autorizado' }, 401);
        return json(req, { borrado: await borrar(env, arg) });
      }
      return json(req, { error: 'ruta desconocida' }, 404);
    } catch (e) {
      console.error(e);
      return json(req, { error: 'fallo del servidor' }, 500);
    }
  },
};

async function publicar(req, env) {
  const ip = req.headers.get('cf-connecting-ip') || 'local', dia = new Date().toISOString().slice(0, 10);
  const claveCupo = `q:${dia}:${await huella(ip)}`, usados = +(await env.MURO.get(claveCupo) || 0);
  if (usados >= POSTS_POR_DIA) return json(req, { error: 'Has llegado al máximo de fotos por hoy. ¡Mañana más!' }, 429);
  const form = await req.formData(), foto = form.get('foto');
  const escena = String(form.get('escena') || '');
  if (!(foto instanceof File) || !foto.size) return json(req, { error: 'falta la foto' }, 400);
  if (foto.size > MAX_IMG) return json(req, { error: 'foto demasiado grande' }, 413);
  if (!ESCENA.test(escena)) return json(req, { error: 'escena no válida' }, 400);
  const bytes = new Uint8Array(await foto.arrayBuffer());
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return json(req, { error: 'solo JPEG' }, 400);
  const ts = Date.now(), id = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  // Lo que se lista va en los metadatos de la clave (≤ 1 KB) para no leer cada post por separado
  const meta = { id, ts, escena, lugar: limpio(form.get('lugar'), 60), nombre: limpio(form.get('nombre'), 24) || 'Campista',
    texto: limpio(form.get('texto'), 200), verificado: form.get('verificado') === '1' };
  await env.MURO.put('i:' + id, bytes, { metadata: { clave: claveDe(ts, id) } });
  await env.MURO.put(claveDe(ts, id), '', { metadata: meta });
  await env.MURO.put(claveCupo, String(usados + 1), { expirationTtl: 60 * 60 * 26 });
  return json(req, { ok: true, post: meta }, 201);
}

async function denunciar(req, env, id) {
  if (!/^[\w-]{10,40}$/.test(id)) return json(req, { error: 'id no válido' }, 400);
  const ip = req.headers.get('cf-connecting-ip') || 'local';
  const ya = `d:${id}:${await huella(ip)}`;
  if (await env.MURO.get(ya)) return json(req, { ok: true });
  await env.MURO.put(ya, '1', { expirationTtl: 60 * 60 * 26 });
  const n = +(await env.MURO.get('n:' + id) || 0) + 1;
  // Con pocas denuncias ya se oculta: mejor quitar de más que dejar algo feo a la vista
  if (n >= DENUNCIAS_PARA_OCULTAR) { await borrar(env, id); return json(req, { ok: true, oculto: true }); }
  await env.MURO.put('n:' + id, String(n), { expirationTtl: 60 * 60 * 24 * 30 });
  return json(req, { ok: true });
}

async function borrar(env, id) {
  const { metadata } = await env.MURO.getWithMetadata('i:' + id);
  if (!metadata) return false;
  await env.MURO.delete(metadata.clave);
  await env.MURO.delete('i:' + id);
  return true;
}
