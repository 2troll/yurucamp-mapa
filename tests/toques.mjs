// Toca con el dedo (eventos táctiles reales) cada camping visible y comprueba que abre SU ficha.
// Antes del arreglo del lienzo único: 0 de 21. →  node tests/toques.mjs
import { servir, abrirChrome, comoMovil, dormir } from './cdp.mjs';
const { url, cerrar: c1 } = await servir();
let fallos = 0;
for (const [nombre, movil] of [['móvil', true], ['escritorio', false]]) {
  const { pagina, cerrar } = await abrirChrome();
  try {
    if (movil) await comoMovil(pagina); else await pagina.cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    // Con una ruta guardada (antes rompía desde el arranque)
    await pagina.cdp('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem('yc_ruta', '[0,1,2]') } catch {}` });
    await pagina.cdp('Page.navigate', { url });
    await pagina.esperar(`document.querySelectorAll('#lista .item').length > 0`, 20000);
    await dormir(1500);
    for (const z of movil ? [8.25, 10, 12] : [9, 11]) {
      let bien = 0, probados = 0;
      for (let i = 0; i < 21; i++) {
        const p = await pagina.evaluar(`(() => { cerrarFicha(); cerrarLugar(); mapa.setView([CAMPINGS[${i}].lat, CAMPINGS[${i}].lng], ${z}, { animate: false });
          const p = mapa.latLngToContainerPoint([CAMPINGS[${i}].lat, CAMPINGS[${i}].lng]), r = $('#mapa').getBoundingClientRect(); return [p.x + r.left, p.y + r.top]; })()`);
        await dormir(movil ? 700 : 250);
        if (process.env.DEPURA && i < 4) console.log(i, await pagina.evaluar(`(() => { const e = document.elementFromPoint(${p[0]}, ${p[1]}); return e.tagName + '#' + e.id + '.' + e.className })()`));
        const pulsa = movil
          ? async t => pagina.cdp('Input.dispatchTouchEvent', { type: t, touchPoints: t === 'touchEnd' ? [] : [{ x: p[0], y: p[1] }] })
          : async t => pagina.cdp('Input.dispatchMouseEvent', { type: t, x: p[0], y: p[1], button: 'left', clickCount: 1 });
        if (movil) { await pulsa('touchStart'); await pulsa('touchEnd'); } else { await pulsa('mousePressed'); await pulsa('mouseReleased'); }
        await dormir(350); probados++;
        if (await pagina.evaluar(`seleccionado === ${i} && $('#ficha').classList.contains('abierta')`)) bien++;
      }
      const ok = bien === probados; if (!ok) fallos++;
      console.log(`${ok ? '  ✓' : '  ✗'} ${nombre} zoom ${z}: ${bien} de ${probados} campings abren su ficha`);
    }
  } finally { await cerrar(); }
}
c1(); process.exit(fallos ? 1 : 0);
