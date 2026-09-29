// Integridad de los datos: todo lo que la app referencia existe, está en Japón y está traducido.
// Sin dependencias: carga los .js de datos en un contexto aislado de Node.  →  node tests/datos.mjs
import { readFileSync, existsSync, statSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const fallos = [];
const mal = (m) => fallos.push(m);
let comprobaciones = 0;
const ok = (cond, m) => { comprobaciones++; if (!cond) mal(m); };

// Los datos son `const X = …` sueltos: se juntan en un solo script para que queden en el mismo ámbito
const ctx = { console, window: {}, navigator: { languages: ['es'] }, document: { documentElement: {}, write() {} }, localStorage: { getItem: () => null } };
const fuente = ['campings.js', 'vocabulario.js', 'anime.js', 'lugares.js', 'audios.js', 'casting.js']
  .map(f => readFileSync(join(RAIZ, f), 'utf8')).join('\n;\n')
  + '\n;this.D = { CAMPINGS, VOCABULARIO, DIALOGOS, LUGARES, CATEGORIAS_LUGAR, AUDIOS };';
runInNewContext(fuente, ctx);
const { CAMPINGS, VOCABULARIO, DIALOGOS, LUGARES, CATEGORIAS_LUGAR, AUDIOS } = ctx.D;

const enJapon = (lat, lng) => lat > 24 && lat < 46 && lng > 122 && lng < 146;
const existe = (ruta) => existsSync(join(RAIZ, ruta.split('?')[0]));

// --- Campings
ok(CAMPINGS.length >= 20, `solo hay ${CAMPINGS.length} campings`);
const nombres = new Set();
for (const c of CAMPINGS) {
  ok(enJapon(c.lat, c.lng), `camping fuera de Japón: ${c.nombre} (${c.lat}, ${c.lng})`);
  ok(c.nombre && c.ja && c.kana && c.ep, `camping sin nombre/ja/kana/ep: ${c.nombre}`);
  ok(!nombres.has(c.nombre), `camping repetido: ${c.nombre}`); nombres.add(c.nombre);
  for (const f of c.fotos || []) ok(existe(f), `falta la foto ${f} de ${c.nombre}`);
}

// --- Lugares
for (const l of LUGARES) {
  ok(enJapon(l.lat, l.lng), `lugar fuera de Japón: ${l.n}`);
  ok(CATEGORIAS_LUGAR[l.c], `lugar con categoría desconocida «${l.c}»: ${l.n}`);
  if (l.f) ok(existe(l.f), `falta la foto ${l.f} de ${l.n}`);
}

// --- Vocabulario: formato y sin duplicados dentro de un tema
for (const cat of VOCABULARIO) {
  const vistas = new Set();
  for (const p of cat.palabras) {
    ok(p.length >= 4 && p.every((x, i) => i > 4 || typeof x === 'string' && x.trim()), `palabra mal formada en ${cat.id}: ${JSON.stringify(p)}`);
    ok(!vistas.has(p[0]), `palabra repetida en ${cat.id}: ${p[0]}`); vistas.add(p[0]);
  }
}

// --- Diálogos
for (const d of DIALOGOS) for (const l of d.lineas) ok(l.length === 4 && l.every(Boolean), `línea incompleta en el diálogo ${d.id}`);

// --- Audios grabados: cada clip existe y no está vacío
const clips = Object.values(AUDIOS);
ok(clips.length > 500, `solo hay ${clips.length} clips de voz`);
for (const a of clips) ok(existe(a) && statSync(join(RAIZ, a)).size > 1000, `clip de voz ausente o vacío: ${a}`);

// --- Traducciones: cada idioma tiene todos los textos que tiene el inglés (el más completo)
const idiomas = ['en', 'ja', 'zh', 'ko', 'fr', 'ar'];
const trad = Object.fromEntries(idiomas.map(k => {
  const c = {}; runInNewContext(readFileSync(join(RAIZ, `i18n/${k}.js`), 'utf8') + ';this.T = TRAD;', c); return [k, c.T];
}));
for (const k of idiomas) {
  const faltanUi = Object.keys(trad.en.ui).filter(s => !trad[k].ui[s]);
  ok(faltanUi.length === 0, `${k}: faltan ${faltanUi.length} textos de interfaz (p. ej. «${faltanUi[0]}»)`);
  const vacios = Object.entries(trad[k].ui).filter(([, v]) => !String(v).trim());
  ok(vacios.length === 0, `${k}: ${vacios.length} traducciones vacías`);
}
// Cada tr('…') literal del código debe estar traducido
const codigo = ['index.html', 'extras.js', 'voces.js', 'sorpresas.js'].filter(f => existsSync(join(RAIZ, f))).map(f => readFileSync(join(RAIZ, f), 'utf8')).join('\n');
const literales = [...codigo.matchAll(/\btr\('((?:[^'\\]|\\.)+)'/g)].map(m => m[1].replace(/\\'/g, "'"));
const sinTraducir = [...new Set(literales)].filter(s => !trad.en.ui[s]);
ok(sinTraducir.length === 0, `${sinTraducir.length} textos tr() sin traducir: ${sinTraducir.slice(0, 5).map(s => `«${s}»`).join(', ')} → node i18n/traducir.mjs`);

// --- Nada de hebreo en lo que se publica (regla del proyecto)
const hebreo = /[֐-׿]/;
for (const f of ['index.html', 'extras.js', 'voces.js', 'privacidad.html', ...idiomas.map(k => `i18n/${k}.js`)])
  if (existsSync(join(RAIZ, f))) ok(!hebreo.test(readFileSync(join(RAIZ, f), 'utf8')), `hay caracteres hebreos en ${f}`);

// --- Referencias de index.html (scripts, iconos) apuntan a archivos que existen
const html = readFileSync(join(RAIZ, 'index.html'), 'utf8');
for (const [, src] of html.matchAll(/(?:src|href)="(?!https?:|#|data:|mailto:)([^"$]+)"/g)) ok(existe(src), `index.html enlaza a ${src}, que no existe`);
const manifest = JSON.parse(readFileSync(join(RAIZ, 'manifest.json'), 'utf8'));
for (const i of manifest.icons) ok(existe(i.src), `manifest: falta el icono ${i.src}`);

if (fallos.length) {
  console.error(`✗ ${fallos.length} fallos de ${comprobaciones} comprobaciones:`);
  for (const f of fallos.slice(0, 40)) console.error('  - ' + f);
  if (fallos.length > 40) console.error(`  … y ${fallos.length - 40} más`);
  process.exit(1);
}
console.log(`✓ datos: ${comprobaciones} comprobaciones (${CAMPINGS.length} campings, ${LUGARES.length} lugares, ${clips.length} clips, ${idiomas.length + 1} idiomas)`);
