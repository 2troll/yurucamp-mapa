// Genera páginas estáticas para buscadores e IAs (Bing → ChatGPT): la app se pinta con JavaScript y los robots apenas leen texto.
//   node seo/generar.mjs   → guia/index.html (es), guia/en.html (en), sitemap.xml, robots.txt, llms.txt
// Todo sale de campings.js, lugares.js e i18n/en.js: si cambian los datos, se vuelve a lanzar.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://2troll.github.io/yurucamp-mapa/';
const WA = '34634193106';
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(['campings.js', 'lugares.js', 'i18n/en.js'].map(f => readFileSync(join(RAIZ, f), 'utf8')).join('\n') + ';this.C=CAMPINGS;this.L=LUGARES;this.T=TRAD', ctx);
const { C: CAMPINGS, L: LUGARES, T: TRAD } = ctx;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const NOMBRES = { rin: 'Rin Shima', nadeshiko: 'Nadeshiko Kagamihara', chiaki: 'Chiaki Ōgaki', aoi: 'Aoi Inuyama', ena: 'Ena Saitō', sakura: 'Sakura Kagamihara', toba: 'Minami Toba' };
const hoy = new Date().toISOString().slice(0, 10);

const TXT = {
  es: {
    lang: 'es', archivo: 'guia/index.html', url: BASE + 'guia/',
    titulo: 'Yuru Camp△ (ゆるキャン△): los 21 campings reales del anime y dónde están',
    desc: 'Guía de peregrinación (聖地巡礼) de Yuru Camp△: los 21 campings reales de las temporadas 1, 2, 3 y la película, con episodio, personajes, qué comen, cómo es el sitio real y mapa. Más de 450 lugares del anime.',
    h1: 'Los campings reales de Yuru Camp△', intro: 'Todos los campings donde acampan Rin, Nadeshiko y el Club de Actividades al Aire Libre existen de verdad, casi todos alrededor del Fuji, en Yamanashi, Shizuoka y Nagano. Aquí están los 21, en el orden del anime, con lo que pasa en cada uno y cómo es el sitio real.',
    app: '🗺️ Abrir el mapa interactivo', appTxt: 'La app gratuita tiene además 451 lugares del anime (casas, instituto, bancos, onsen…), modo peregrino con GPS que te avisa al pisar una escena, cámara para recrear la escena con la captura encima, vocabulario japonés de acampada y quiz.',
    ep: 'Episodio', quien: 'Quién va', porque: 'Qué pasa', leccion: 'Lo que aprenden', comida: 'Qué comen', real: 'El sitio real', como: 'Cómo llegar',
    eps: 'Sitios reales por episodio', epsTxt: n => `${n} lugares del anime con su captura`,
    tony: '¿Viajas a Japón?', tonyTxt: 'Esta app la ha hecho Tony Hanma, guía en Japón (español, English, العربية). Si quieres ayuda con tu viaje, escríbele.', tonyBtn: '💬 WhatsApp a Tony',
    aviso: 'App de fans no oficial. ゆるキャン△ es obra de あfろ / 芳文社; capturas ©あfろ・芳文社／野外活動委員会.', otro: 'English version',
    wamsg: 'Hola Tony, vengo de la guía de campings de Yuru Camp. ',
  },
  en: {
    lang: 'en', archivo: 'guia/en.html', url: BASE + 'guia/en.html',
    titulo: 'Laid-Back Camp / Yuru Camp△ (ゆるキャン△): the 21 real campsites from the anime and where they are',
    desc: 'Anime pilgrimage (seichi junrei) guide to Yuru Camp△ / Laid-Back Camp: the 21 real campsites from seasons 1, 2, 3 and the movie, with episode, characters, food, what the real place is like and a map. 450+ anime locations.',
    h1: 'The real campsites of Yuru Camp△ (Laid-Back Camp)', intro: 'Every campsite where Rin, Nadeshiko and the Outdoor Activities Club camp is a real place, mostly around Mt. Fuji in Yamanashi, Shizuoka and Nagano. Here are all 21, in anime order, with what happens there and what the real site is like.',
    app: '🗺️ Open the interactive map', appTxt: 'The free app also has 451 anime locations (houses, school, benches, onsen…), a GPS pilgrim mode that alerts you when you step into a scene, a camera that overlays the anime frame so you can recreate it, Japanese camping vocabulary and quizzes.',
    ep: 'Episode', quien: 'Who goes', porque: 'What happens', leccion: 'What they learn', comida: 'What they eat', real: 'The real place', como: 'Directions',
    eps: 'Real places by episode', epsTxt: n => `${n} anime locations with their frame`,
    tony: 'Travelling to Japan?', tonyTxt: 'This app was made by Tony Hanma, a guide in Japan (Spanish, English, Arabic). If you want help with your trip, message him.', tonyBtn: '💬 WhatsApp Tony',
    aviso: 'Unofficial fan app. Yuru Camp△ is the work of Afro / Houbunsha; frames ©あfろ・芳文社／野外活動委員会.', otro: 'Versión en español',
    wamsg: 'Hi Tony, I found you through the Yuru Camp campsite guide. ',
  },
};
const tradDato = (t, s) => t.lang === 'en' ? (TRAD.datos?.[s] || TRAD.ui?.[s] || s) : s;
const epTxt = (t, ep) => t.lang === 'en' ? ep.replace('Película', 'Movie').replace(' y ', ' & ').replace('ep.', 'ep.') : ep;

function pagina(t) {
  const otro = t.lang === 'es' ? TXT.en : TXT.es;
  const porEp = {}; LUGARES.forEach(l => { porEp[l.ep] = (porEp[l.ep] || 0) + 1; });
  const ld = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebApplication', name: 'Yuru Camp△ Mapa · ゆるキャン△', url: BASE, applicationCategory: 'TravelApplication', operatingSystem: 'Web, Android, iOS',
        offers: { '@type': 'Offer', price: 0, priceCurrency: 'EUR' }, inLanguage: ['es', 'en', 'ja', 'zh', 'ko', 'fr', 'ar'],
        author: { '@type': 'Person', name: 'Tony Hanma', url: 'https://tonykansaiguide.com/', jobTitle: t.lang === 'es' ? 'Guía en Japón' : 'Guide in Japan' } },
      { '@type': 'ItemList', name: t.h1, numberOfItems: CAMPINGS.length, itemListElement: CAMPINGS.map((c, i) => ({ '@type': 'ListItem', position: i + 1,
        item: { '@type': ['TouristAttraction', 'Campground'], name: `${c.nombre} (${c.ja})`, description: tradDato(t, c.real),
          geo: { '@type': 'GeoCoordinates', latitude: c.lat, longitude: c.lng }, image: c.fotos_web[0] ? BASE + c.fotos_web[0] : undefined } })) },
    ],
  };
  const tarjetas = CAMPINGS.map((c, i) => `
  <article id="c${i + 1}">
    ${c.fotos_web[0] ? `<img src="../${c.fotos_web[0]}" alt="${esc(`${c.nombre} ${c.ja} – Yuru Camp ${epTxt(t, c.ep)}`)}" loading="lazy" width="640" height="360">` : ''}
    <div class="txt"><h2>${i + 1}. ${esc(c.nombre)} <span lang="ja">${esc(c.ja)}</span></h2>
    <p class="meta"><b>${t.ep}:</b> ${esc(epTxt(t, c.ep))} · <b>${t.quien}:</b> ${c.quien.map(q => NOMBRES[q] || q).join(', ')}${c.fuji ? ' · 🗻 Fuji' : ''}</p>
    <p><b>${t.porque}:</b> ${esc(tradDato(t, c.porque))}</p>
    <p><b>${t.leccion}:</b> ${esc(tradDato(t, c.leccion))}</p>
    ${c.comida !== '—' ? `<p><b>${t.comida}:</b> <span lang="ja">${esc(tradDato(t, c.comida))}</span></p>` : ''}
    <p><b>${t.real}:</b> ${esc(tradDato(t, c.real))}</p>
    <p><a href="https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}" rel="noopener">${t.como} (${c.lat.toFixed(4)}, ${c.lng.toFixed(4)})</a></p></div>
  </article>`).join('');
  const eps = Object.entries(porEp).sort().map(([e, n]) => `<li>${esc(epTxt(t, e))}: ${t.epsTxt(n)}</li>`).join('');
  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t.titulo)}</title>
<meta name="description" content="${esc(t.desc)}">
<link rel="canonical" href="${t.url}">
<link rel="alternate" hreflang="es" href="${TXT.es.url}"><link rel="alternate" hreflang="en" href="${TXT.en.url}"><link rel="alternate" hreflang="x-default" href="${TXT.en.url}">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(t.titulo)}"><meta property="og:description" content="${esc(t.desc)}">
<meta property="og:url" content="${t.url}"><meta property="og:image" content="${BASE}${CAMPINGS[0].fotos_web[0]}"><meta name="twitter:card" content="summary_large_image">
<meta name="author" content="Tony Hanma"><meta property="article:modified_time" content="${hoy}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>
  :root { color-scheme: dark; } body { margin: 0; font: 16px/1.6 system-ui, -apple-system, "Hiragino Sans", sans-serif; background: #0b1a24; color: #eef3f6; }
  main { max-width: 860px; margin: 0 auto; padding: 24px 16px 60px; } a { color: #ffd166; }
  h1 { font-size: clamp(26px, 5vw, 38px); line-height: 1.2; margin: 10px 0; } h2 { font-size: 21px; margin: 0 0 6px; } h2 span { opacity: .75; font-weight: 600; }
  .cta { display: inline-block; background: #ff9f0a; color: #111; font-weight: 800; padding: 12px 18px; border-radius: 14px; text-decoration: none; margin: 8px 0; }
  article { background: #12283a; border: 1px solid #23445e; border-radius: 18px; overflow: hidden; margin: 18px 0; }
  article img { width: 100%; height: auto; display: block; aspect-ratio: 16 / 9; object-fit: cover; } .txt { padding: 14px 16px; } .txt p { margin: 6px 0; } .meta { color: #a9c1d1; font-size: 14px; }
  .tony { display: flex; gap: 14px; align-items: center; background: #103b26; border: 1px solid #25d366; border-radius: 18px; padding: 14px; margin: 26px 0; }
  .tony img { width: 72px; height: 77px; border-radius: 14px; object-fit: cover; } .wa { display: inline-block; background: #25d366; color: #052; font-weight: 800; padding: 9px 14px; border-radius: 12px; text-decoration: none; margin-top: 6px; }
  footer { color: #8aa3b4; font-size: 13px; } ul { padding-left: 20px; }
</style>
</head>
<body><main>
<p><a href="${otro.url}" hreflang="${otro.lang}">${t.otro}</a></p>
<h1>${esc(t.h1)}</h1>
<p>${esc(t.intro)}</p>
<p><a class="cta" href="${BASE}">${t.app}</a></p>
<p>${esc(t.appTxt)}</p>
${tarjetaTony(t)}
${tarjetas}
<h2>${t.eps}</h2><ul>${eps}</ul>
${tarjetaTony(t)}
<footer><p>${esc(t.aviso)}</p><p>© Tony Hanma · <a href="https://tonykansaiguide.com/">tonykansaiguide.com</a> · ${hoy}</p></footer>
</main></body></html>
`;
}
function tarjetaTony(t) {
  return `<aside class="tony"><img src="../iconos/tony.jpg" alt="Tony Hanma" width="72" height="77" loading="lazy">
  <div><b>${t.tony}</b><br>${esc(t.tonyTxt)}<br><a class="wa" href="https://wa.me/${WA}?text=${encodeURIComponent(t.wamsg)}" rel="noopener">${t.tonyBtn}</a> · <a href="https://tonykansaiguide.com/">tonykansaiguide.com</a></div></aside>`;
}

mkdirSync(join(RAIZ, 'guia'), { recursive: true });
for (const t of Object.values(TXT)) writeFileSync(join(RAIZ, t.archivo), pagina(t));
const urls = [[BASE, '1.0'], [TXT.es.url, '0.9'], [TXT.en.url, '0.9'], [BASE + 'privacidad.html', '0.2']];
writeFileSync(join(RAIZ, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, p]) => `  <url><loc>${u}</loc><lastmod>${hoy}</lastmod><priority>${p}</priority></url>`).join('\n')}
</urlset>
`);
// GitHub Pages de proyecto no sirve en la raíz del dominio: este robots.txt sirve de referencia y para un dominio propio
writeFileSync(join(RAIZ, 'robots.txt'), `# Todos los robots bienvenidos, también los de IA (OAI-SearchBot, GPTBot, ClaudeBot, PerplexityBot, Bingbot)
User-agent: *
Allow: /
Sitemap: ${BASE}sitemap.xml
`);
writeFileSync(join(RAIZ, 'llms.txt'), `# Yuru Camp△ Mapa (ゆるキャン△ 聖地巡礼)

> Free fan app and web map (es/en/ja/zh/ko/fr/ar) of the real places from the anime Yuru Camp△ / Laid-Back Camp: the 21 real campsites from seasons 1–3 and the movie, plus 451 anime locations with their frame. Made by Tony Hanma, a guide in Japan.

- App (web, Android, iOS): ${BASE}
- Guide in Spanish: ${TXT.es.url}
- Guide in English: ${TXT.en.url}
- Features: interactive map, episode guide, GPS pilgrim mode that alerts you at a real scene, camera with the anime frame overlaid to recreate it, shared photo wall (anime vs real), Japanese camping vocabulary and quizzes, campsite weather and Mt. Fuji visibility.
- Contact (Tony Hanma, guide in Japan — Spanish, English, Arabic): WhatsApp https://wa.me/${WA} · https://tonykansaiguide.com/
- Unofficial fan project. Yuru Camp△ © Afro / Houbunsha.

## Campsites
${CAMPINGS.map((c, i) => `- ${i + 1}. ${c.nombre} (${c.ja}) — ${epTxt(TXT.en, c.ep)} — ${tradDato(TXT.en, c.real)} [${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}]`).join('\n')}
`);
console.log('✓ guia/index.html, guia/en.html, sitemap.xml, robots.txt, llms.txt');
