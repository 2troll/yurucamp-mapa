// Recorre la app como un usuario en un móvil de gama media (CPU 4× más lenta) y falla si hay
// errores de JavaScript, si algo no abre o si se pasa del presupuesto de fluidez.  →  node tests/e2e.mjs [carpeta]
// Sin carpeta prueba la web; con «app/www» prueba exactamente lo que va dentro de las apps.
import { servir, abrirChrome, comoMovil, dormir, RAIZ } from './cdp.mjs';
import { join } from 'node:path';

const carpeta = process.argv[2] ? join(RAIZ, process.argv[2]) : RAIZ;
// Probando app/www se imita la app nativa (sin service worker, como dentro de Capacitor)
const COMO_APP = process.argv[2] ? `window.Capacitor = { isNativePlatform: () => true, Plugins: {} };` : '';
// Presupuestos (ms). Medidos con CPU ×4; si una mejora los baja mucho, bajarlos aquí también.
const PRESUPUESTO = { arranque: 4000, tareaLarga: 600, bloqueoTotal: 4000, fotogramasLentos: 0.25 };

const fallos = [], medidas = {};
const fallar = m => { fallos.push(m); console.error('  ✗ ' + m); };
const bien = m => console.log('  ✓ ' + m);

// Cuenta tareas largas y fotogramas desde el primer byte de la página
const SONDA = `
  window.__yc = { largas: [], errores: [] };
  new PerformanceObserver(l => l.getEntries().forEach(e => __yc.largas.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true });
  addEventListener('error', e => __yc.errores.push(String(e.message)));
  addEventListener('unhandledrejection', e => __yc.errores.push('promesa: ' + (e.reason?.message || e.reason)));
  window.__fotogramas = ms => new Promise(ok => { const t = []; const t0 = performance.now();
    const f = now => { t.push(now); now - t0 < ms ? requestAnimationFrame(f) : ok(t.slice(1).map((x, i) => x - t[i])); }; requestAnimationFrame(f); });
`;

async function recorrer(idioma, completo) {
  console.log(`\n▶ ${idioma}${completo ? ' (recorrido completo)' : ''}`);
  const { url, cerrar: cerrarSrv } = await servir(carpeta);
  const { pagina, cerrar } = await abrirChrome();
  const errores = [];
  pagina.on('Runtime.exceptionThrown', p => errores.push(p.exceptionDetails.exception?.description || p.exceptionDetails.text));
  pagina.on('Log.entryAdded', p => { if (p.entry.level === 'error' && !/favicon|tile|arcgisonline|open-meteo|jma\.go|Failed to load resource/.test(p.entry.text + (p.entry.url || ''))) errores.push('consola: ' + p.entry.text); });
  try {
    await comoMovil(pagina, { idioma });
    await pagina.cdp('Page.addScriptToEvaluateOnNewDocument', { source: SONDA + COMO_APP + `try { localStorage.setItem('yc_idioma', '${idioma}') } catch {}` });
    const t0 = Date.now();
    await pagina.cdp('Page.navigate', { url });
    await pagina.esperar(`document.querySelectorAll('#lista .item').length > 0`, 20000);
    const arranque = Date.now() - t0; medidas[`arranque_${idioma}`] = arranque;
    arranque < PRESUPUESTO.arranque ? bien(`arranca en ${arranque} ms`) : fallar(`arranque lento: ${arranque} ms (presupuesto ${PRESUPUESTO.arranque})`);

    if (idioma === 'ar') (await pagina.evaluar(`document.documentElement.dir`)) === 'rtl' ? bien('árabe en RTL') : fallar('el árabe no está en RTL');
    const sinTraducir = await pagina.evaluar(`[...document.querySelectorAll('#dock button')].map(b => b.textContent.trim())`);
    if (idioma !== 'es' && sinTraducir.some(t => /Palabras|Sellos|Viaje/.test(t))) fallar(`dock sin traducir en ${idioma}: ${sinTraducir.join(', ')}`);

    // Abrir la ficha del primer camping
    await pagina.evaluar(`document.querySelector('#lista .item').click()`);
    await pagina.esperar(`document.querySelector('#ficha.abierta')`); bien('ficha de camping abre');

    if (completo) {
      // Marcar visitado → sello en el pasaporte
      await pagina.evaluar(`document.querySelector('#f-visto').click()`);
      await dormir(300);
      // Fluidez: mover el mapa y contar fotogramas lentos (> 2 fotogramas de 60 Hz)
      await pagina.evaluar(`cerrarFicha()`);
      const [tiempos] = await Promise.all([pagina.evaluar(`__fotogramas(2500)`), pagina.evaluar(`(async () => { for (let i = 0; i < 6; i++) { mapa.panBy([i % 2 ? 260 : -260, 140], { duration: .35 }); await new Promise(r => setTimeout(r, 400)); } })()`)]);
      const lentos = tiempos.filter(t => t > 34).length / tiempos.length; medidas.fotogramasLentos = +lentos.toFixed(3);
      lentos <= PRESUPUESTO.fotogramasLentos ? bien(`mapa fluido: ${(lentos * 100).toFixed(1)} % fotogramas lentos`) : fallar(`mapa a tirones: ${(lentos * 100).toFixed(1)} % fotogramas lentos`);

      for (const vista of ['palabras', 'quiz', 'mochila', 'personajes', 'pasaporte', 'mapa']) {
        await pagina.evaluar(`document.querySelector('#dock [data-vista="${vista}"]').click()`);
        if (vista !== 'mapa') await pagina.esperar(`document.querySelector('#hoja-${vista}.abierta')`);
        bien(`vista ${vista}`);
      }
      // Palabras: se pintan tarjetas y el segmento de diálogos abre
      await pagina.evaluar(`irA('palabras')`);
      await pagina.esperar(`document.querySelectorAll('#palabras .tarjeta').length > 10`);
      await pagina.evaluar(`document.querySelector('#seg-palabras [data-s="dialogos"]').click()`); await dormir(200);
      // Quiz: jugar una partida entera acertando siempre
      await pagina.evaluar(`irA('quiz')`);
      const modos = await pagina.evaluar(`[...document.querySelectorAll('.modo')].map(b => b.dataset.m)`);
      for (const m of modos) {
        await pagina.evaluar(`document.querySelector('.modo[data-m="${m}"]').click()`);
        await pagina.esperar(`document.querySelector('.opcion') || document.querySelector('#quiz .vacio, #quiz p')`);
        await pagina.evaluar(`pintarMenuQuiz()`);
      }
      bien(`${modos.length} modos de quiz arrancan`);
      await pagina.evaluar(`empezarQuiz('${modos[0]}')`);
      for (let n = 0; n < 10; n++) {
        await pagina.esperar(`document.querySelector('.opcion') && !document.querySelector('.opciones[data-hecho]')`, 8000);
        await pagina.evaluar(`document.querySelector('.opcion').click()`);
      }
      await pagina.esperar(`document.querySelector('#otra')`, 8000); bien('partida de quiz de 10 preguntas termina');
      // Pasaporte refleja el sello
      await pagina.evaluar(`irA('pasaporte')`);
      (await pagina.evaluar(`visitados.size`)) >= 1 ? bien('el sello se guarda') : fallar('el sello no se guardó');
      // Persistencia: recargar y seguir teniendo el sello
      await pagina.cdp('Page.reload'); await pagina.esperar(`document.querySelectorAll('#lista .item').length > 0`, 20000);
      (await pagina.evaluar(`visitados.size`)) >= 1 ? bien('el sello sobrevive a recargar') : fallar('el sello se pierde al recargar');
      if (await pagina.evaluar(`typeof Sorpresas !== 'undefined'`)) {
        await pagina.esperar(`Sorpresas.listo`, 5000);
        await pagina.evaluar(`Sorpresas.probar()`); bien('sorpresas: todas se disparan sin errores');
      }
    }
    await dormir(800);
    const { largas, errores: errPag } = await pagina.evaluar(`__yc`);
    errores.push(...errPag);
    const peor = Math.max(0, ...largas), total = largas.reduce((a, b) => a + b, 0);
    medidas[`tareaLarga_${idioma}`] = peor; medidas[`bloqueo_${idioma}`] = total;
    peor <= PRESUPUESTO.tareaLarga ? bien(`tarea más larga ${peor} ms`) : fallar(`una tarea bloquea ${peor} ms (presupuesto ${PRESUPUESTO.tareaLarga})`);
    total <= PRESUPUESTO.bloqueoTotal ? bien(`bloqueo total ${total} ms`) : fallar(`bloqueo total ${total} ms (presupuesto ${PRESUPUESTO.bloqueoTotal})`);
    errores.length ? errores.forEach(e => fallar('error JS: ' + e.split('\n')[0])) : bien('sin errores de JavaScript');
  } catch (e) { fallar(`${idioma}: ${e.message}`); }
  finally { cerrar(); cerrarSrv(); }
}

await recorrer('es', true);
for (const k of ['ar', 'ja', 'en']) await recorrer(k, false);
console.log('\nMedidas:', JSON.stringify(medidas));
if (fallos.length) { console.error(`\n✗ ${fallos.length} fallos`); process.exit(1); }
console.log('\n✓ e2e: todo bien');
process.exit(0);
