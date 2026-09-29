// Capturas para las tiendas, a los tamaños exactos que piden, en ES/EN/JA.  →  node tests/capturas.mjs
// App Store: 6,9" (1320×2868) y 6,5" (1284×2778). Google Play: 1080×1920 (9:16 exacto) y gráfico destacado 1024×500.
import { servir, abrirChrome, dormir, RAIZ } from './cdp.mjs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const SALIDA = join(RAIZ, 'tienda', 'capturas');
const PANTALLAS = { 'ios-6.9': [440, 956, 3], 'ios-6.5': [428, 926, 3], 'android': [360, 640, 3] };
const IDIOMAS = process.argv[2] === 'grafico' ? [] : (process.argv[2] || 'es,en,ja').split(',');
// Un progreso creíble: 7 sellos, algunas palabras y logros
const ESTADO = { visitados: [0, 1, 2, 3, 5, 8, 12], logros: ['deseo', 'dado', 'manta', 'perfecto'], aprendidas: [], records: {} };

const ESCENAS = [
  ['01-mapa', `irA('mapa'); window.panelMovil?.poner('mini'); mapa.setView([35.42, 138.62], 9, { animate: false })`],
  ['02-camping', `irA('mapa'); abrirFicha(0)`],
  ['03-palabras', `irA('palabras')`],
  ['04-dialogo', `irA('palabras'); document.querySelector('#seg-palabras [data-s="dialogos"]').click(); setTimeout(() => document.querySelector('.escena')?.click(), 50)`],
  ['05-quiz', `irA('quiz'); empezarQuiz(document.querySelector('.modo').dataset.m)`],
  ['06-sellos', `irA('pasaporte')`],
  ['07-voces', `irA('personajes')`],
];

const { url, cerrar: cerrarSrv } = await servir();
const { pagina, cerrar } = await abrirChrome();
let n = 0;
try {
  for (const idioma of IDIOMAS) for (const [plataforma, [ancho, alto, dpr]] of Object.entries(PANTALLAS)) {
    await pagina.cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: dpr, mobile: true });
    await pagina.cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    const semilla = Object.entries({ ...ESTADO, idioma }).map(([k, v]) => `localStorage.setItem('yc_${k}', ${JSON.stringify(typeof v === 'string' ? v : JSON.stringify(v))});`).join('');
    const { identifier } = await pagina.cdp('Page.addScriptToEvaluateOnNewDocument', { source: `try { ${semilla} } catch {}` });
    await pagina.cdp('Page.navigate', { url });
    await pagina.esperar(`document.querySelectorAll('#lista .item').length > 0 && typeof Sorpresas !== 'undefined'`, 20000);
    // Sin avisos flotantes ni la palabra del día tapando la captura
    await pagina.evaluar(`document.head.insertAdjacentHTML('beforeend', '<style>#aviso,#hoy,.confeti,#bocadillo{display:none!important}</style>')`);
    const dir = join(SALIDA, plataforma, idioma); await mkdir(dir, { recursive: true });
    for (const [nombre, accion] of ESCENAS) {
      await pagina.evaluar(`(() => { ${accion} })()`); await dormir(nombre === '01-mapa' || nombre === '02-camping' ? 3500 : 900);
      await pagina.captura(join(dir, nombre + '.png')); n++;
    }
    await pagina.cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier });
  }
  // Gráfico destacado de Google Play: icono, nombre y lema sobre el cielo del icono
  await pagina.cdp('Emulation.setDeviceMetricsOverride', { width: 1024, height: 500, deviceScaleFactor: 1, mobile: false });
  await pagina.cdp('Page.navigate', { url: url + 'iconos/icono.svg' }); await dormir(400);
  await pagina.evaluar(`document.documentElement.outerHTML.length`);
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;width:1024px;height:500px;display:flex;align-items:center;gap:40px;padding:0 48px;box-sizing:border-box;
    background:linear-gradient(180deg,#1b1f4b 0%,#6a3f8f 45%,#f08a5d 78%,#ffc56b 100%);font-family:-apple-system,'Hiragino Sans',sans-serif;color:#fff">
    <img src="data:image/png;base64,${(await readFile(join(RAIZ, 'tienda/icono-play-512.png'))).toString('base64')}" style="width:280px;height:280px;flex-shrink:0;border-radius:66px;box-shadow:0 20px 60px rgba(0,0,0,.35)">
    <div><div style="font-size:60px;font-weight:800;white-space:nowrap">ゆるキャン△ Mapa</div>
    <div style="font-size:28px;margin-top:14px;opacity:.95;white-space:nowrap">Campings del anime · 日本語 · 7 idiomas</div>
    <div style="font-size:24px;margin-top:10px;opacity:.85;white-space:nowrap">⛺ 21 campings · 🗻 451 lugares · 🎌 200 palabras</div></div></body>`;
  await pagina.cdp('Page.navigate', { url: 'data:text/html;base64,' + Buffer.from(html).toString('base64') }); await dormir(800);
  await mkdir(join(SALIDA, 'android'), { recursive: true });
  await pagina.captura(join(SALIDA, 'android', 'grafico-destacado-1024x500.png')); n++;
} finally { cerrar(); cerrarSrv(); }
console.log(`✓ ${n} capturas en tienda/capturas/`);
process.exit(0);
