// Safari < 16 no tiene AbortSignal.timeout (se usa al pedir el tiempo y el radar de lluvia)
if (!AbortSignal.timeout) AbortSignal.timeout = ms => { const c = new AbortController(); setTimeout(() => c.abort(), ms); return c.signal; };

// Idiomas de la interfaz. El español es el original: las demás lenguas viven en i18n/xx.js
// (generadas por i18n/traducir.mjs) y solo se descarga la que se usa, para no frenar el arranque.
const IDIOMAS = {
  es: { nombre: 'Español', bandera: '🇪🇸' },
  en: { nombre: 'English', bandera: '🇬🇧' },
  ja: { nombre: '日本語', bandera: '🇯🇵' },
  zh: { nombre: '中文', bandera: '🇨🇳' },
  ko: { nombre: '한국어', bandera: '🇰🇷' },
  fr: { nombre: 'Français', bandera: '🇫🇷' },
  ar: { nombre: 'العربية', bandera: '🇸🇦', rtl: true },
};
const IDIOMA = (() => {
  try { const g = localStorage.getItem('yc_idioma'); if (IDIOMAS[g]) return g; } catch {}
  // Primera vez: el idioma del teléfono; si no lo tenemos, inglés
  for (const l of navigator.languages || [navigator.language || 'en']) { const k = l.slice(0, 2).toLowerCase(); if (IDIOMAS[k]) return k; }
  return 'en';
})();
document.documentElement.lang = IDIOMA;
document.documentElement.dir = IDIOMAS[IDIOMA].rtl ? 'rtl' : 'ltr';
// Script bloqueante a propósito: los textos tienen que estar antes de pintar nada
if (IDIOMA !== 'es') document.write(`<script src="i18n/${IDIOMA}.js?v=1"><\/script>`);

// tr('texto en español', { n: 3 }) → el texto en el idioma elegido, con {n} sustituido
function tr(es, vars) {
  let s = (typeof TRAD !== 'undefined' && TRAD.ui[es]) || es;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
  return s;
}
// Para textos de datos definidos dentro de index.html (la mochila): van con los significados, no con la interfaz
const td = s => (typeof TRAD !== 'undefined' && TRAD.datos[s]) || s;
function cambiarIdioma(k) { try { localStorage.setItem('yc_idioma', k); } catch {} location.reload(); }

// Traduce los datos (campings, vocabulario, diálogos, personajes…) una sola vez al arrancar
function traducirDatos() {
  if (typeof TRAD === 'undefined') return;
  const d = TRAD.datos, x = s => (typeof s === 'string' && d[s]) || s;
  CAMPINGS.forEach(c => { for (const k of ['nombre', 'porque', 'leccion', 'real', 'ep']) c[k] = x(c[k]); if (c.comida !== '—') c.comida = x(c.comida); c.palabra[2] = x(c.palabra[2]); });
  VOCABULARIO.forEach(c => { c.titulo = x(c.titulo); c.palabras.forEach(p => { p[3] = x(p[3]); }); });
  DIALOGOS.forEach(g => { g.titulo = x(g.titulo); g.lineas.forEach(l => { l[3] = x(l[3]); }); });
  Object.values(FICHAS_PJ).forEach(f => { f.rasgo = x(f.rasgo); Object.values(f.frases).forEach(fs => fs.forEach(fr => { fr[1] = x(fr[1]); })); });
  Object.values(VOCES_EXTRA).forEach(v => { v.nombre = x(v.nombre); });
  Object.values(CATEGORIAS_LUGAR).forEach(c => { c.titulo = x(c.titulo); c.palabra[2] = x(c.palabra[2]); });
  LUGARES.forEach(l => { l.ep = x(l.ep); });
  for (const k in MOMENTOS) MOMENTOS[k] = x(MOMENTOS[k]);
  if (typeof CASTING !== 'undefined') Object.values(CASTING).forEach(c => { c.es = x(c.es); });
}

// El HTML fijo (dock, cabeceras, botones) se traduce una vez al arrancar, antes de pintar lo dinámico
function traducirPagina(raiz = document.body) {
  if (typeof TRAD === 'undefined') return;
  const ui = TRAD.ui, w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    const s = n.nodeValue.trim();
    if (s && ui[s] && n.parentElement.tagName !== 'SCRIPT') n.nodeValue = n.nodeValue.replace(s, ui[s]);
  }
  raiz.querySelectorAll('[title],[aria-label],[placeholder]').forEach(el => {
    for (const a of ['title', 'aria-label', 'placeholder']) { const v = el.getAttribute(a); if (v && ui[v]) el.setAttribute(a, ui[v]); }
  });
  if (ui[document.title]) document.title = ui[document.title];
}
