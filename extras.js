// Extras que no hacen falta para pintar el mapa: se cargan con «defer», después de la app,
// así el arranque no se hace más lento por añadir cosas. Usan las variables globales de index.html.
(() => {
const FUJI = [35.3606, 138.7274];
const DIA = () => Math.floor((Date.now() + 9 * 3600e3) / 864e5); // día en hora de Japón
const css = document.createElement('style');
css.textContent = `
  #radar { position: fixed; top: 16px; right: 76px; z-index: 1010; width: 270px; padding: 16px; border-radius: 26px;
    opacity: 0; transform: scale(.94); transform-origin: top right; pointer-events: none; transition: opacity .2s, transform .2s; }
  /* Sin cristal borroso: con la aguja girando, el blur se recalculaba en cada fotograma (medido: saltos de 0,5 s) */
  #radar { backdrop-filter: none; -webkit-backdrop-filter: none; background: linear-gradient(135deg, rgba(40,46,58,.94), rgba(18,22,30,.9)); }
  body.ficha-abierta #radar { right: calc(min(520px, 100vw - 408px) + 92px); }
  #radar.abierto { opacity: 1; transform: none; pointer-events: auto; }
  #radar header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .brujula { position: relative; width: 170px; height: 170px; margin: 4px auto 10px; border-radius: 50%;
    border: 1px solid var(--borde); background: radial-gradient(circle, rgba(255,255,255,.1), rgba(0,0,0,.25)); }
  .brujula .rosa { position: absolute; inset: 0; will-change: transform; }
  .brujula .rosa span { position: absolute; left: 50%; top: 50%; width: 24px; margin: -12px 0 0 -12px; text-align: center; font-weight: 800; font-size: 14px; }
  .brujula .aguja { position: absolute; left: 50%; top: 50%; width: 0; height: 0; will-change: transform; }
  .brujula .aguja i { position: absolute; left: -14px; top: -74px; font-size: 28px; font-style: normal; }
  .brujula .aguja b { position: absolute; left: -2px; top: -46px; width: 4px; height: 46px; border-radius: 2px; background: linear-gradient(var(--oro), transparent); }
  #radar .dato { text-align: center; font-size: 15px; line-height: 1.5; }
  #radar .dato .gran { font-size: 22px; font-weight: 800; }
  #radar .fila { display: flex; gap: 6px; justify-content: center; margin-top: 10px; flex-wrap: wrap; }
  #hoy { position: fixed; left: 50%; top: 16px; z-index: 1700; transform: translate(-50%, -140%); transition: transform .35s cubic-bezier(.2,.9,.3,1.2);
    display: flex; gap: 12px; align-items: center; padding: 10px 14px; border-radius: 22px; max-width: min(440px, calc(100vw - 32px)); cursor: pointer; }
  #hoy.visible { transform: translate(-50%, 0); }
  #hoy .kanji { font-size: 30px; font-weight: 800; }
  #hoy small { color: var(--suave); display: block; }
  .cielo { display: flex; gap: 12px; align-items: center; margin-top: 10px; padding: 10px 12px; border-radius: 16px; background: rgba(0,0,0,.2); }
  .cielo .luna { font-size: 34px; line-height: 1; }
  .srs { display: flex; gap: 6px; justify-content: center; margin-top: 8px; font-size: 12px; color: var(--suave); }
  .srs i { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,.2); font-style: normal; }
  .srs i.si { background: var(--oro); }
  @media (max-width: 820px) {
    #radar, body.ficha-abierta #radar { top: var(--arriba); right: 62px; width: min(270px, calc(100vw - 74px)); }
    #hoy { top: var(--arriba); }
  }
  @media (prefers-reduced-motion: reduce) { #radar, #hoy { transition: none; } }
`;
document.head.appendChild(css);

/* ================= 🗻 Radar del Fuji: hacia dónde queda y a cuántos km ================= */
const RUMBOS = [['北', 'きた', 'norte'], ['北東', 'ほくとう', 'noreste'], ['東', 'ひがし', 'este'], ['南東', 'なんとう', 'sureste'],
  ['南', 'みなみ', 'sur'], ['南西', 'なんせい', 'suroeste'], ['西', 'にし', 'oeste'], ['北西', 'ほくせい', 'noroeste']];
function rumbo(a, b) {
  const r = Math.PI / 180, [la1, lo1, la2, lo2] = [a[0] * r, a[1] * r, b[0] * r, b[1] * r];
  const y = Math.sin(lo2 - lo1) * Math.cos(la2), x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(lo2 - lo1);
  return (Math.atan2(y, x) / r + 360) % 360;
}
const boton = document.createElement('button');
boton.className = 'redondo'; boton.id = 'fuji-radar'; boton.textContent = '🗻';
boton.title = 'Radar del Fuji: hacia dónde queda'; boton.setAttribute('aria-label', boton.title);
$('#herramientas').appendChild(boton);
const panel = document.createElement('section');
panel.id = 'radar'; panel.className = 'cristal';
panel.innerHTML = `<header><b>🗻 Radar del Fuji · <span class="jp">富士山</span></b><button class="redondo pequeno" id="radar-cerrar" aria-label="Cerrar">✕</button></header>
  <div class="brujula"><div class="rosa">${['北', '東', '南', '西'].map((k, i) => `<span class="jp" style="transform:rotate(${i * 90}deg) translateY(-70px) rotate(${-i * 90}deg)">${k}</span>`).join('')}</div>
    <div class="aguja"><b></b><i>🗻</i></div></div>
  <div class="dato" id="radar-dato">Buscando dónde estás…</div>
  <div class="fila"><button class="chip" id="radar-voz">🔊 Dilo</button><button class="chip" id="radar-linea">📏 Línea en el mapa</button></div>`;
document.body.appendChild(panel);
const rosa = panel.querySelector('.rosa'), aguja = panel.querySelector('.aguja');
let desde = null, haciaFuji = 0, orientacion = null, pendiente = false, linea = null, frase = '';

function girar() {
  pendiente = false;
  // Con brújula del móvil la rosa gira con él; sin ella, el norte queda arriba como en el mapa
  const giro = orientacion ?? 0;
  rosa.style.transform = `rotate(${-giro}deg)`;
  aguja.style.transform = `rotate(${haciaFuji - giro}deg)`;
}
function alOrientar(e) {
  const h = e.webkitCompassHeading ?? (e.absolute && e.alpha != null ? 360 - e.alpha : null);
  if (h == null) return;
  orientacion = h;
  if (!pendiente) { pendiente = true; requestAnimationFrame(girar); } // un repintado por fotograma como mucho
}
const eventoBrujula = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
function calcular(posicion, origen) {
  desde = posicion;
  haciaFuji = rumbo(desde, FUJI);
  const d = km(desde, FUJI), [kanji, kana, es] = RUMBOS[Math.round(haciaFuji / 45) % 8];
  frase = `富士山は${kanji}に${Math.round(d)}キロです`;
  $('#radar-dato').innerHTML = `<div class="jp gran">${kanji}に ${Math.round(d)} km</div>
    <div class="sub"><span class="jp">${kana}</span> = al ${es} · ${Math.round(haciaFuji)}°<br>desde ${origen}</div>
    <div class="sub jp" style="margin-top:4px">${d < 60 ? '見えるかも！ Muy cerca: busca la cumbre' : d < 150 ? 'Con el día despejado puede verse' : 'Lejos: habrá que ir hacia él 🛵'}</div>`;
  girar();
  if (linea) ponerLinea();
}
function ponerLinea() {
  if (linea) mapa.removeLayer(linea);
  linea = L.polyline([desde, FUJI], { renderer: renderLugares, color: '#fff', weight: 3, dashArray: '2 8', opacity: .9 }).addTo(mapa);
  mapa.fitBounds(linea.getBounds(), { padding: [60, 60], animate: !esMovil() });
}
async function abrirRadar(abrir) {
  panel.classList.toggle('abierto', abrir); boton.classList.toggle('activo', abrir);
  if (!abrir) { removeEventListener(eventoBrujula, alOrientar); if (linea) { mapa.removeLayer(linea); linea = null; } return; }
  abrirCapas(false); if (esMovil()) cerrarFicha(); // en el móvil la ficha lo taparía
  // iOS pide permiso para la brújula dentro del toque
  try { if (typeof DeviceOrientationEvent?.requestPermission === 'function') await DeviceOrientationEvent.requestPermission(); } catch {}
  addEventListener(eventoBrujula, alOrientar);
  const centro = mapa.getCenter();
  calcular(miPosicion || [centro.lat, centro.lng], miPosicion ? 'donde estás' : 'el centro del mapa');
  navigator.geolocation?.getCurrentPosition(p => { if (panel.classList.contains('abierto')) calcular([p.coords.latitude, p.coords.longitude], 'donde estás 📍'); },
    () => {}, { timeout: 10000, maximumAge: 120000 });
}
boton.onclick = () => abrirRadar(!panel.classList.contains('abierto'));
$('#radar-cerrar').onclick = () => abrirRadar(false);
$('#radar-voz').onclick = () => hablar(frase, 'rin');
$('#radar-linea').onclick = () => { if (desde) ponerLinea(); };
// Al abrir otra vista o las capas, el radar se cierra solo
document.querySelectorAll('#dock button, #capa').forEach(b => b.addEventListener('click', () => panel.classList.contains('abierto') && abrirRadar(false)));

/* ================= 🌙 Cielo de esta noche (la luna se calcula aquí, sin red) ================= */
const LUNAS = [[1.85, '🌑', '新月', 'しんげつ', 'luna nueva'], [5.5, '🌒', '三日月', 'みかづき', 'luna creciente'], [9.2, '🌓', '上弦の月', 'じょうげんのつき', 'cuarto creciente'],
  [12.9, '🌔', '十三夜', 'じゅうさんや', 'casi llena'], [16.6, '🌕', '満月', 'まんげつ', 'luna llena'], [20.3, '🌖', '十八夜', 'じゅうはちや', 'menguante gibosa'],
  [24, '🌗', '下弦の月', 'かげんのつき', 'cuarto menguante'], [27.7, '🌘', '有明月', 'ありあけづき', 'luna de madrugada'], [30, '🌑', '新月', 'しんげつ', 'luna nueva']];
function luna(fecha = new Date()) {
  const edad = ((fecha / 864e5 + 2440587.5 - 2451550.1) % 29.530588853 + 29.530588853) % 29.530588853;
  const [, emoji, kanji, kana, es] = LUNAS.find(l => edad < l[0]);
  return { edad, luz: (1 - Math.cos(2 * Math.PI * edad / 29.530588853)) / 2, emoji, kanji, kana, es };
}
// pintarTiempo (index.html) llama a esto con la respuesta de Open-Meteo
window.cieloDeNoche = (d, c) => {
  const l = luna(), hoy = d.daily.time[0], i = d.hourly.time.indexOf(hoy + 'T22:00');
  const nubes = i >= 0 && d.hourly.cloud_cover ? d.hourly.cloud_cover[i] : null;
  const puesta = d.daily.sunset?.[0]?.slice(11);
  let veredicto = '';
  if (nubes !== null) {
    const nota = (1 - nubes / 100) * (1 - .6 * l.luz);
    veredicto = nota > .55 ? '✨ <b class="jp">星空がきれい！</b> Noche de estrellas: saca la esterilla'
      : nota > .25 ? '⭐ <b class="jp">少し見える</b> Algunas estrellas entre nubes o luna'
      : '☁️ <b class="jp">星は見えないかも</b> Hoy toca hoguera y mirar el fuego';
  }
  return `<div class="cielo"><div class="luna">${l.emoji}</div><div style="flex:1">
    <b class="jp">${l.kanji}</b> <span class="jp sub">${l.kana}</span> — ${l.es} · 月齢 ${l.edad.toFixed(1)}<br>
    <small class="sub">${puesta ? `🌇 Puesta de sol <b>${puesta}</b> · ` : ''}${nubes !== null ? `nubes a las 22:00: ${nubes} %` : ''}</small>
    ${veredicto ? `<div style="margin-top:4px">${veredicto}</div>` : ''}</div>
    <button class="hablar" data-luna="${c.quien[0]}" data-texto="今夜は${l.kanji}です">🔊</button></div>`;
};
document.addEventListener('click', e => { const b = e.target.closest('[data-luna]'); if (b) hablar(b.dataset.texto, b.dataset.luna); });

/* ================= 🧠 Repaso espaciado: cada palabra vuelve justo antes de olvidarla ================= */
const INTERVALOS = [0, 1, 3, 7, 14, 30]; // días hasta volver a verla según la caja
const repaso = guardado.leer('repaso', {});
const pendientes = () => {
  const hoy = DIA(), vencidas = TODAS_PALABRAS.filter(p => repaso[p.w] && repaso[p.w].proxima <= hoy);
  const nuevas = TODAS_PALABRAS.filter(p => !repaso[p.w]);
  return { vencidas, nuevas };
};
MODOS.repaso = { emoji: '🧠', titulo: 'Repaso del día', get desc() {
  const { vencidas, nuevas } = pendientes(), dominadas = Object.values(repaso).filter(r => r.caja >= 5).length;
  return `${vencidas.length ? `${vencidas.length} por repasar hoy` : 'Nada vencido: palabras nuevas'} · ${dominadas}/${TODAS_PALABRAS.length} dominadas`;
}, pregunta() {
  const { vencidas, nuevas } = pendientes();
  const bien = baraja(vencidas)[0] || nuevas[0] || baraja(TODAS_PALABRAS)[0];
  const ops = baraja([bien, ...baraja(TODAS_PALABRAS.filter(p => p.es !== bien.es)).slice(0, 3)]);
  const q = vozPalabra(bien.cat), caja = repaso[bien.w]?.caja || 0;
  return { quien: q, decir: bien.w, explica: `${bien.w} · ${bien.kana} · ${bien.romaji} — ${bien.es}`,
    enunciado: `<div class="grande jp">${esc(bien.w)}</div><div class="sub jp" style="font-size:16px">${bien.kana !== bien.w ? esc(bien.kana) : ''}</div>
      <div class="srs" title="Caja de repaso">${INTERVALOS.slice(1).map((_, k) => `<i class="${k < caja ? 'si' : ''}"></i>`).join('')}</div>`,
    ops: ops.map(p => ({ txt: esc(p.es), ok: p === bien })),
    alResponder(ok) {
      const nueva = ok ? Math.min(caja + 1, 5) : 1;
      // Si falla vuelve mañana; si acierta, cada vez tarda más en volver
      repaso[bien.w] = { caja: nueva, proxima: DIA() + (ok ? INTERVALOS[nueva] : 1) };
      guardado.escribir('repaso', repaso);
      if (nueva === 5 && !aprendidas.has(bien.w)) { aprendidas.add(bien.w); guardado.escribir('aprendidas', [...aprendidas]); avisar(`⭐ ${bien.w} ya es tuya: pasa a «aprendidas»`); }
    } };
} };

/* ================= 📅 Palabra del día y racha de días seguidos ================= */
const racha = guardado.leer('racha', { dia: 0, dias: 0 });
const hoy = DIA();
if (racha.dia !== hoy) {
  racha.dias = racha.dia === hoy - 1 ? racha.dias + 1 : 1; racha.dia = hoy;
  guardado.escribir('racha', racha);
  const p = TODAS_PALABRAS[Math.floor(Date.now() / 864e5) % TODAS_PALABRAS.length], q = vozPalabra(p.cat);
  const tarjeta = document.createElement('div');
  tarjeta.id = 'hoy'; tarjeta.className = 'cristal';
  tarjeta.innerHTML = `<div class="kanji jp">${esc(p.w)}</div><div><small>📅 Palabra del día · ${racha.dias > 1 ? `🔥 ${racha.dias} días seguidos` : 'toca para oírla'}</small>
    <b class="jp">${esc(p.kana)}</b> — ${esc(p.es)} ${p.emoji || ''}</div>`;
  document.body.appendChild(tarjeta);
  const quitar = () => { tarjeta.classList.remove('visible'); setTimeout(() => tarjeta.remove(), 400); };
  tarjeta.onclick = () => { hablar(p.w, q); if (racha.dias > 0 && racha.dias % 7 === 0) confeti(['🔥', '📅', '⭐']); setTimeout(quitar, 1800); };
  // Aparece cuando el mapa ya está pintado y el móvil está libre
  (window.requestIdleCallback || setTimeout)(() => requestAnimationFrame(() => tarjeta.classList.add('visible')), { timeout: 1500 });
  setTimeout(quitar, 9000);
}
})();
