// Prueba la tarjeta de lugar con zoom y el flujo de «Foto real» con cámara falsa y un muro local (wrangler dev en :8787).
//   (cd muro && npx wrangler dev --port 8787 --ip 127.0.0.1) &  node tests/fotos.mjs [carpeta-capturas]
process.env.CHROME_ARGS = '--use-fake-device-for-media-stream --use-fake-ui-for-media-stream';
import { servir, abrirChrome, comoMovil, dormir } from './cdp.mjs';
import { writeFile } from 'node:fs/promises';
const OUT = process.argv[2], MURO = process.env.MURO || 'http://127.0.0.1:8787';
const { url, cerrar: c1 } = await servir();
const { pagina, cerrar } = await abrirChrome();
const fallos = [], ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos.push(m); };
const shot = async n => { if (!OUT) return; const r = await pagina.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 60 }); await writeFile(`${OUT}/${n}.jpg`, Buffer.from(r.data, 'base64')); };
const errores = []; pagina.on('Runtime.exceptionThrown', p => errores.push(p.exceptionDetails.exception?.description || p.exceptionDetails.text));
try {
  await comoMovil(pagina);
  await pagina.cdp('Browser.grantPermissions', { permissions: ['videoCapture', 'geolocation'] }).catch(() => {});
  await pagina.cdp('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem('yc_muro', '${MURO}') } catch {}` });
  await pagina.cdp('Page.navigate', { url });
  await pagina.esperar(`window.Fotos && document.querySelectorAll('#lista .item').length > 0`, 20000);
  await dormir(1200);
  // 1) Tarjeta de lugar: sobrevive a acercar y alejar
  const i = await pagina.evaluar(`(() => { const i = LUGARES.findIndex(l => l.f && capasLugar.has(l.c)); const l = LUGARES[i];
    mapa.setView([l.lat, l.lng], 12, { animate: false }); ponerCapasLugar(); marcasLugar[i].fire('click'); return i; })()`);
  await dormir(500); await shot('1-tarjeta');
  for (const z of [14, 10.5, 8, 7]) { await pagina.evaluar(`void mapa.setZoom(${z})`); await dormir(700); }
  ok(await pagina.evaluar(`$('#tarjeta-lugar').classList.contains('abierta') && mapa.hasLayer(marcasLugar[${i}])`), 'la tarjeta y su punto siguen tras acercar/alejar hasta zoom 7');
  const r = await pagina.evaluar(`JSON.stringify($('#tarjeta-lugar').getBoundingClientRect())`); const b = JSON.parse(r);
  ok(b.top >= 0 && b.bottom <= 915 && b.width > 300, 'la tarjeta cabe en pantalla ' + r);
  await shot('2-tarjeta-zoom7');
  // 2) Cámara desde la tarjeta
  await pagina.evaluar(`document.querySelector('#tarjeta-lugar [data-recrear]').click()`);
  await pagina.esperar(`document.querySelector('#camara video').videoWidth > 0`, 10000);
  ok(true, 'la cámara se abre con la escena encima'); await dormir(400); await shot('3-camara');
  await pagina.evaluar(`document.querySelector('[data-c="disparar"]').click()`);
  await pagina.esperar(`!document.querySelector('.cam-resultado').hidden && document.querySelector('.cam-resultado .comparar')`, 8000);
  ok(true, 'foto hecha y comparador visible'); await dormir(500); await shot('4-resultado');
  ok(await pagina.evaluar(`(async () => (await indexedDB.databases()).some(d => d.name === 'yc-fotos'))()`), 'guardada en el álbum (IndexedDB)');
  // 3) Publicar
  await pagina.evaluar(`document.querySelector('[data-r="publicar"]').click()`);
  await pagina.evaluar(`(() => { const f = document.querySelector('form.publicar'); f.nombre.value = 'Prueba'; f.texto.value = 'Hola desde el lago'; f.normas.checked = true; f.requestSubmit(); })()`);
  await pagina.esperar(`/Publicada|publicada/.test(document.querySelector('form.publicar')?.textContent || '')`, 15000);
  ok(true, 'publicada en el muro'); await shot('5-publicada');
  // 4) Muro
  await pagina.evaluar(`document.querySelector('[data-r="listo"]').click(); irA('fotos')`);
  await pagina.esperar(`document.querySelectorAll('#fotos .foto-tarj').length > 0`, 10000);
  await dormir(800);
  ok(await pagina.evaluar(`document.querySelector('#fotos .foto-tarj .real').naturalWidth > 0`), 'el muro muestra la foto real servida por el Worker');
  await shot('6-muro');
  await pagina.evaluar(`document.querySelector('#seg-fotos [data-s="album"]').click()`); await dormir(600); await shot('7-album');
  ok(await pagina.evaluar(`document.querySelectorAll('#fotos .foto-tarj').length`) >= 1, 'el álbum tiene la foto');
  await pagina.evaluar(`document.querySelector('#seg-fotos [data-s="retos"]').click()`); await dormir(600); await shot('8-retos');
  ok(await pagina.evaluar(`/^1 /.test(document.querySelector('#fotos > p.sub').textContent) && Fotos.hechas.size === 1`), 'el reto cuenta como hecho');
  ok(!errores.length, 'sin errores de JavaScript ' + errores.join(' | '));
} catch (e) { ok(false, e.message); await shot('error'); }
finally { await cerrar(); c1(); }
console.log(fallos.length ? `\n${fallos.length} fallo(s)` : '\nTodo bien'); process.exit(fallos.length ? 1 : 0);
