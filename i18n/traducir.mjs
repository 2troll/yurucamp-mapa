// Genera i18n/<idioma>.js con Gemini (clave gratuita de AI Studio en ~/.claves/gemini.env).
//   node i18n/traducir.mjs            → todos los idiomas
//   node i18n/traducir.mjs en ja      → solo esos
//   node i18n/traducir.mjs --listar   → solo enseña qué textos se traducirían
// Guarda una caché por idioma (i18n/cache-xx.json): al añadir textos solo se traduce lo nuevo.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const leer = f => fs.readFileSync(path.join(RAIZ, f), 'utf8');
const NOMBRES = { en: 'English', ja: 'Japanese', zh: 'Simplified Chinese', ko: 'Korean', fr: 'French', ar: 'Modern Standard Arabic' };

/* ---------- 1. Textos de la interfaz ---------- */
const ui = new Set();
const literales = trozo => [...trozo.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)].map(m => m[1].replace(/\\'/g, "'"));
const conLetras = s => /[A-Za-zÀ-ÿ]{2}/.test(s) && !/^https?:|^[#.]|\$\{/.test(s);
const empiezaConEmoji = s => /^\P{L}/u.test(s) && !/^[\s\d]/.test(s);
const html = leer('index.html'), extras = leer('extras.js') + '\n' + leer('sorpresas.js');
const js = html.slice(html.indexOf('<script>\nif (typeof CAMPINGS')) + extras;

// a) Todo literal dentro de tr( … ), también en ternarios; se salta el objeto de variables
for (const m of js.matchAll(/\btr\(/g)) {
  let i = m.index + 3, nivel = 1, llaves = 0, trozo = '';
  for (; i < js.length && nivel; i++) {
    const c = js[i];
    if (c === "'") { const f = js.indexOf("'", i + 1); if (!llaves) trozo += js.slice(i, f + 1); i = f; continue; }
    if (c === '(') nivel++; else if (c === ')') nivel--; else if (c === '{') llaves++; else if (c === '}') llaves--;
  }
  literales(trozo).filter(conLetras).forEach(s => ui.add(s));
}
// b) Constantes con etiquetas que se traducen al usarlas (filtros, estilos, rangos, rutas…)
for (const nombre of ['ESTILOS', 'EXTRAS', 'GRUPOS', 'PAISAJES', 'ESTACIONES', 'RANGOS', 'PRESETS', 'MOCHILA']) {
  const ini = js.indexOf(`const ${nombre} = `), fin = js.indexOf(';\n', ini);
  if (ini < 0) throw new Error(`No encuentro const ${nombre}`);
  for (const s of literales(js.slice(ini, fin)).filter(s => empiezaConEmoji(s) && conLetras(s))) {
    if (nombre === 'MOCHILA') { if (/^\S+ \S/.test(s)) ui.add(s); continue; }
    ui.add(s);
    if (nombre === 'ESTILOS') ui.add(s.split(' ').slice(1).join(' ')); // se traduce sin el emoji
  }
}
for (const m of js.matchAll(/(?:titulo|desc): '([^']+)'/g)) if (conLetras(m[1])) ui.add(m[1]); // MODOS
for (const m of js.matchAll(/(?:nombre|pista): '([^']+)'/g)) if (conLetras(m[1])) ui.add(m[1]); // logros secretos
for (const m of extras.matchAll(/, '([a-záéíóúñ ]+)'\]/g)) ui.add(m[1]); // lunas y rumbos
for (const m of leer('anime.js').matchAll(/return \['[^']*', '[^']*', '[^']*', '([^']+)'\]/g)) ui.add(m[1]); // tiempo
// c) HTML fijo: textos, title, aria-label y placeholder
const cuerpo = html.slice(html.indexOf('<body>'), html.indexOf('<script>', html.indexOf('<body>')));
for (const m of cuerpo.matchAll(/>([^<>]+)</g)) { const s = m[1].trim(); if (conLetras(s)) ui.add(s); }
for (const m of cuerpo.matchAll(/(?:title|aria-label|placeholder)="([^"]+)"/g)) if (conLetras(m[1])) ui.add(m[1]);
ui.add(html.match(/<title>(.*?)<\/title>/)[1]);

/* ---------- 2. Datos: descripciones (al idioma) y significados de palabras japonesas ---------- */
// Entorno mínimo de navegador: voces.js lee ajustes y voces al cargarse
const ctx = { console, localStorage: { getItem: () => null, setItem() {} }, navigator: {}, addEventListener() {}, setTimeout, clearTimeout };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['campings.js', 'vocabulario.js', 'voces.js', 'anime.js', 'lugares.js', 'casting.js'])
  vm.runInContext(leer(f).replace(/^const /gm, 'var '), ctx, { filename: f });
const datos = new Set(), significados = new Set();
const d = s => { if (typeof s === 'string' && conLetras(s) && s !== '—') datos.add(s); };
const sig = s => { if (typeof s === 'string' && conLetras(s)) significados.add(s); };
ctx.CAMPINGS.forEach(c => { ['nombre', 'porque', 'leccion', 'real', 'ep', 'comida'].forEach(k => d(c[k])); sig(c.palabra[2]); });
ctx.VOCABULARIO.forEach(c => { d(c.titulo); c.palabras.forEach(p => sig(p[3])); });
ctx.DIALOGOS.forEach(g => { d(g.titulo); g.lineas.forEach(l => sig(l[3])); });
Object.values(ctx.FICHAS_PJ).forEach(f => { d(f.rasgo); Object.values(f.frases).forEach(fs => fs.forEach(fr => sig(fr[1]))); });
Object.values(ctx.VOCES_EXTRA).forEach(v => d(v.nombre));
Object.values(ctx.CATEGORIAS_LUGAR).forEach(c => { d(c.titulo); sig(c.palabra[2]); });
ctx.LUGARES.forEach(l => d(l.ep));
Object.values(ctx.MOMENTOS).forEach(d);
Object.values(ctx.CASTING || {}).forEach(c => sig(c.es));
const moch = js.slice(js.indexOf('const MOCHILA = '), js.indexOf(';\n', js.indexOf('const MOCHILA = ')));
for (const m of moch.matchAll(/\['[^']+', '([^']+)'\]/g)) sig(m[1]);

if (process.argv.includes('--listar')) {
  console.log([...ui].join('\n'));
  console.log(`\nInterfaz: ${ui.size} · datos: ${datos.size} · significados: ${significados.size}`);
  process.exit(0);
}

/* ---------- 3. Gemini ---------- */
const clave = process.env.GEMINI_API_KEY || fs.readFileSync(path.join(os.homedir(), '.claves/gemini.env'), 'utf8').match(/GEMINI_API_KEY=(.+)/)?.[1]?.trim();
if (!clave) throw new Error('Falta GEMINI_API_KEY en ~/.claves/gemini.env');
// Si uno está saturado (503) o sin cupo (429), se pasa al siguiente
const MODELOS = process.env.GEM_MODELO ? [process.env.GEM_MODELO] : ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
const espera = ms => new Promise(r => setTimeout(r, ms));

async function gemini(prompt) {
  for (let ronda = 0; ronda < 4; ronda++) for (const modelo of MODELOS) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': clave },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: .2 } }),
    }).catch(e => ({ ok: false, status: 0, text: async () => String(e) }));
    if (r.ok) {
      const j = await r.json();
      try { return JSON.parse(j.candidates[0].content.parts[0].text); } catch { console.warn(`  ${modelo}: respuesta no es JSON`); continue; }
    }
    if (r.status && r.status !== 429 && r.status < 500) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 300)}`);
    console.warn(`  ${modelo} ${r.status || 'sin red'}: pruebo otro`);
    await espera(3000);
  }
  throw new Error('Gemini no responde con ningún modelo (saturado o sin cupo): vuelve a lanzarlo más tarde, la caché guarda lo hecho');
}

const CONTEXTO = `You translate a mobile app about the real campsites of the anime "Yuru Camp△" (Laid-Back Camp) in Japan: a map, Japanese camping vocabulary, quizzes and a pilgrimage passport.
Rules:
- Return ONLY a JSON object with the same keys and the translated strings as values.
- Keep emojis exactly where they are (especially a leading emoji followed by a space).
- Keep placeholders like {n}, {total}, {nombre} untouched.
- Keep HTML tags and any Japanese text (kanji/kana) exactly as they are.
- Character names: Rin, Nadeshiko, Chiaki, Aoi, Ena, Ayano, Sakura, Toba-sensei (in Japanese use 志摩リン etc. only if the source already has them; otherwise the usual katakana names).
- UI text must be short and natural, like a polished app. Keep the friendly tone.
- In interface strings, "español" means "the translation text shown under the Japanese" — translate it as "translation", not as "Spanish".
- "野クル" is the camping club's name; "へやキャン" is the anime's short spin-off; leave both in Japanese.`;

const conMarcadores = s => (s.match(/\{\w+\}/g) || []).sort().join();
const emojiInicial = s => s.match(/^(\P{L}+?)\s/u)?.[1];

async function traducir(lista, idioma, tipo, alGuardar) {
  const destino = tipo === 'significados' && idioma === 'ja' ? 'English' : NOMBRES[idioma];
  const nota = tipo === 'ui' ? 'These are interface strings.' : tipo === 'datos' ? 'These are descriptions of places and scenes.'
    : `These are short meanings of Japanese words or phrases, used as translations under the Japanese text${idioma === 'ja' ? ' (Japanese users learn the English meaning here)' : ''}.`;
  const salida = {};
  for (let a = 0; a < lista.length; a += 110) {
    const lote = lista.slice(a, a + 110), entrada = Object.fromEntries(lote.map((s, i) => [String(i), s]));
    process.stdout.write(`  ${idioma} ${tipo} ${a + 1}-${a + lote.length}/${lista.length}… `);
    const r = await gemini(`${CONTEXTO}\n${nota}\nTranslate from Spanish to ${destino}.\n\n${JSON.stringify(entrada, null, 1)}`);
    let malos = 0;
    lote.forEach((s, i) => {
      let t = r[String(i)];
      if (typeof t !== 'string' || !t.trim() || conMarcadores(t) !== conMarcadores(s)) { malos++; return; }
      // Si la etiqueta empezaba con emoji y la traducción lo perdió, se le devuelve (los estilos del mapa lo quitan)
      const e = emojiInicial(s); if (e && !t.startsWith(e)) t = `${e} ${t.replace(/^\P{L}+?\s/u, '')}`;
      salida[s] = t.trim();
    });
    console.log(malos ? `${malos} sin traducir` : 'ok');
    alGuardar(salida);
    await espera(4500); // cupo gratuito: pocas peticiones por minuto
  }
  return salida;
}

const pedidos = process.argv.slice(2).filter(a => NOMBRES[a]);
for (const idioma of pedidos.length ? pedidos : Object.keys(NOMBRES)) {
  const rutaCache = path.join(RAIZ, 'i18n', `cache-${idioma}.json`);
  const cache = fs.existsSync(rutaCache) ? JSON.parse(fs.readFileSync(rutaCache, 'utf8')) : { ui: {}, datos: {}, significados: {} };
  for (const [tipo, conjunto] of [['ui', ui], ['datos', datos], ['significados', significados]]) {
    const faltan = [...conjunto].filter(s => !cache[tipo][s]);
    const guardar = hecho => { Object.assign(cache[tipo], hecho); fs.writeFileSync(rutaCache, JSON.stringify(cache, null, 1)); };
    if (faltan.length) await traducir(faltan, idioma, tipo, guardar);
  }
  // Solo lo que se usa hoy (la caché guarda también lo antiguo por si vuelve)
  const solo = (tipo, conjunto) => Object.fromEntries([...conjunto].filter(s => cache[tipo][s]).map(s => [s, cache[tipo][s]]));
  const TRAD = { ui: solo('ui', ui), datos: { ...solo('datos', datos), ...solo('significados', significados) } };
  const faltan = [...ui].filter(s => !cache.ui[s]).length + [...datos].filter(s => !cache.datos[s]).length + [...significados].filter(s => !cache.significados[s]).length;
  fs.writeFileSync(path.join(RAIZ, 'i18n', `${idioma}.js`), `// Generado por i18n/traducir.mjs (${NOMBRES[idioma]}). No editar a mano: corrige en cache-${idioma}.json.\nconst TRAD = ${JSON.stringify(TRAD)};\n`);
  console.log(`✓ i18n/${idioma}.js · ${Object.keys(TRAD.ui).length} de interfaz, ${Object.keys(TRAD.datos).length} de datos${faltan ? ` · ⚠️ ${faltan} sin traducir (vuelve a lanzarlo)` : ''}`);
}
