// «Vive el anime»: episodios, revivir, episodio en el mapa, modo peregrino con GPS simulado y diario.  →  node tests/vivir.mjs [capturas]
import { servir, abrirChrome, comoMovil, dormir } from './cdp.mjs';
import { writeFile } from 'node:fs/promises';
const OUT = process.argv[2];
const { url, cerrar: c1 } = await servir(); const { pagina, cerrar } = await abrirChrome();
const fallos = [], ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fallos.push(m); };
const shot = async n => { if (!OUT) return; const r = await pagina.cdp('Page.captureScreenshot', { format: 'jpeg', quality: 60 }); await writeFile(`${OUT}/${n}.jpg`, Buffer.from(r.data, 'base64')); };
const errores = []; pagina.on('Runtime.exceptionThrown', p => errores.push(p.exceptionDetails.exception?.description || p.exceptionDetails.text));
try {
  await comoMovil(pagina);
  await pagina.cdp('Browser.grantPermissions', { permissions: ['geolocation'] }).catch(() => {});
  await pagina.cdp('Page.navigate', { url });
  await pagina.esperar(`window.Vivir && document.querySelectorAll('#lista .item').length > 0`, 20000); await dormir(800);
  await pagina.evaluar(`irA('personajes')`); await dormir(500);
  ok(await pagina.evaluar(`document.querySelectorAll('#episodios .tarj-ep').length`) >= 10, 'lista de episodios de la T1'); await shot('v1-episodios');
  await pagina.evaluar(`document.querySelector('#episodios .tarj-ep').click()`); await dormir(500);
  ok(await pagina.evaluar(`document.querySelectorAll('#episodios .carrusel img').length > 3 && document.querySelector('.ep-camping') !== null`), 'detalle del T1 ep.1 con capturas e historia del camping'); await shot('v2-detalle');
  await pagina.evaluar(`document.querySelector('[data-a="revivir"]').click()`); await dormir(1500);
  ok(await pagina.evaluar(`!$('#revivir').hidden && $('#revivir .rv-img.ver') !== null && $('.rv-nombre').textContent.length > 0`), 'revivir muestra la escena con su nombre'); await shot('v3-revivir');
  await pagina.evaluar(`for (let k = 0; k < 40; k++) document.querySelector('[data-r="siguiente"]').click()`); await dormir(400);
  ok(await pagina.evaluar(`!$('.rv-fin').hidden`), 'al acabar ofrece ir al sitio real'); await shot('v4-fin');
  await pagina.evaluar(`document.querySelector('[data-f="mapa"]').click()`); await dormir(1500);
  const r = await pagina.evaluar(`JSON.stringify({ chip: !$('#chip-ep').hidden, n: marcasLugar.filter(m => mapa.hasLayer(m)).length, todosDelEp: marcasLugar.every((m, i) => !mapa.hasLayer(m) || LUGARES[i].ep === window.epFiltro) })`);
  ok(JSON.parse(r).chip && JSON.parse(r).n > 3 && JSON.parse(r).todosDelEp, 'en el mapa solo los sitios del episodio ' + r); await shot('v5-mapa-ep');
  await pagina.evaluar(`$('#chip-ep').click()`);
  // Peregrino: me pongo en el 見返橋 (T1 ep.1)
  const l = await pagina.evaluar(`JSON.stringify(LUGARES[0])`), L0 = JSON.parse(l);
  await pagina.cdp('Emulation.setGeolocationOverride', { latitude: L0.lat, longitude: L0.lng, accuracy: 10 });
  await pagina.evaluar(`$('#peregrino-btn').click()`);
  await pagina.esperar(`$('#peregrino').classList.contains('aqui')`, 10000);
  ok(true, 'el modo peregrino detecta que estás en la escena'); await dormir(400); await shot('v6-peregrino');
  await pagina.evaluar(`$('#peregrino [data-p="sello"]').click()`); await dormir(300);
  ok(await pagina.evaluar(`lugaresVistos.size >= 1`), 'escena sellada desde el aviso');
  await pagina.evaluar(`irA('personajes'); document.querySelector('#seg-anime [data-s="diario"]').click()`); await dormir(600);
  ok(await pagina.evaluar(`document.querySelectorAll('#diario .reto').length >= 1 && !/Antes/.test(document.querySelector('#diario .diario-dia').textContent)`), 'el diario lo apunta con fecha'); await shot('v7-diario');
  await pagina.evaluar(`document.querySelector('#seg-anime [data-s="personajes"]').click()`); await dormir(600);
  ok(await pagina.evaluar(`!$('#personajes').hidden && $('#personajes').children.length > 0`), 'las voces siguen dentro de Anime');
  ok(!errores.length, 'sin errores de JavaScript ' + errores.join(' | '));
} catch (e) { ok(false, e.message); await shot('v-error'); }
finally { await cerrar(); c1(); }
process.exit(fallos.length ? 1 : 0);
