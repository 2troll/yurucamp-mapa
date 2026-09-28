// Extras que no hacen falta para pintar el mapa: se cargan con «defer», después de la app,
// así el arranque no se hace más lento por añadir cosas. Usan las variables globales de index.html.
(() => {
const FUJI = [35.3606, 138.7274];
const DIA = () => Math.floor((Date.now() + 9 * 3600e3) / 864e5); // día en hora de Japón
const css = document.createElement('style');
css.textContent = `
  #radar { position: fixed; top: 16px; right: 76px; z-index: 1010; width: 290px; padding: 14px 16px 16px; border-radius: 26px;
    opacity: 0; transform: scale(.94); transform-origin: top right; pointer-events: none; transition: opacity .2s, transform .2s, box-shadow .3s; }
  /* Sin cristal borroso: con la aguja girando, el blur se recalculaba en cada fotograma (medido: saltos de 0,5 s) */
  #radar { backdrop-filter: none; -webkit-backdrop-filter: none; background: linear-gradient(135deg, rgba(40,46,58,.95), rgba(18,22,30,.93)); }
  #radar.alineado { box-shadow: 0 0 0 2px var(--oro), 0 12px 40px rgba(0,0,0,.35); }
  body.ficha-abierta #radar { right: calc(min(520px, 100vw - 408px) + 92px); }
  #radar.abierto { opacity: 1; transform: none; pointer-events: auto; }
  #radar header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  #radar .objetivos { display: flex; gap: 4px; justify-content: center; margin-bottom: 6px; flex-wrap: wrap; }
  #radar .objetivos .chip { padding: 4px 10px; font-size: 12px; }
  .brujula { position: relative; width: 200px; height: 200px; margin: 2px auto 8px; }
  .brujula svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .brujula .dial { will-change: transform; }
  .brujula .aguja { position: absolute; inset: 0; will-change: transform; }
  .brujula .aguja i { position: absolute; left: 50%; top: 6px; transform: translateX(-50%); font-size: 26px; font-style: normal; line-height: 1; }
  .brujula .centro { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); text-align: center; line-height: 1.15; pointer-events: none; }
  .brujula .centro b { font-size: 22px; font-variant-numeric: tabular-nums; }
  .brujula .centro small { display: block; color: var(--suave); font-size: 12px; }
  .brujula .yo { position: absolute; left: 50%; top: -6px; transform: translateX(-50%); width: 0; height: 0;
    border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 12px solid #fff; }
  #radar .dato { text-align: center; font-size: 14px; line-height: 1.45; min-height: 64px; }
  #radar .dato .gran { font-size: 21px; font-weight: 800; }
  #radar .consejo { font-size: 12px; color: var(--suave); text-align: center; margin-top: 6px; }
  #radar .fila { display: flex; gap: 6px; justify-content: center; margin-top: 8px; flex-wrap: wrap; }
  #menu-idioma { position: fixed; z-index: 1800; padding: 8px; border-radius: 20px; display: none; min-width: 180px; }
  #menu-idioma.abierto { display: block; }
  #menu-idioma button { display: flex; gap: 10px; width: 100%; align-items: center; border: 0; background: transparent; padding: 10px 12px; border-radius: 14px; font-size: 15px; cursor: pointer; text-align: start; }
  #menu-idioma button:hover, #menu-idioma button.activo { background: rgba(255,255,255,.16); }
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
    #radar, body.ficha-abierta #radar { top: var(--arriba); right: 62px; width: min(290px, calc(100vw - 74px)); }
    #hoy { top: var(--arriba); }
  }
  @media (prefers-reduced-motion: reduce) { #radar, #hoy { transition: none; } }
`;
document.head.appendChild(css);

/* ================= 🌐 Idioma ================= */
const botonIdioma = $('#idioma');
botonIdioma.textContent = `🌐 ${IDIOMA.toUpperCase()}`;
const menuIdioma = document.createElement('div');
menuIdioma.id = 'menu-idioma'; menuIdioma.className = 'cristal';
menuIdioma.innerHTML = Object.entries(IDIOMAS).map(([k, l]) => `<button data-idioma="${k}" class="${k === IDIOMA ? 'activo' : ''}" lang="${k}">${l.bandera} ${l.nombre}</button>`).join('');
document.body.appendChild(menuIdioma);
botonIdioma.onclick = e => {
  e.stopPropagation();
  const r = botonIdioma.getBoundingClientRect(), abrir = !menuIdioma.classList.contains('abierto');
  menuIdioma.classList.toggle('abierto', abrir);
  if (!abrir) return;
  // Se abre hacia arriba si el botón está abajo (panel del móvil) y hacia abajo si está arriba
  const alto = menuIdioma.offsetHeight;
  menuIdioma.style.left = Math.max(8, Math.min(r.left, innerWidth - menuIdioma.offsetWidth - 8)) + 'px';
  menuIdioma.style.top = (r.bottom + alto + 8 < innerHeight ? r.bottom + 6 : Math.max(8, r.top - alto - 6)) + 'px';
};
menuIdioma.onclick = e => { const b = e.target.closest('[data-idioma]'); if (b && b.dataset.idioma !== IDIOMA) cambiarIdioma(b.dataset.idioma); };
addEventListener('click', e => { if (!menuIdioma.contains(e.target)) menuIdioma.classList.remove('abierto'); });

/* ================= 🧭 Brújula: hacia dónde queda el Fuji (o un camping) y a cuántos km ================= */
const RUMBOS = [['北', 'きた', 'norte'], ['北東', 'ほくとう', 'noreste'], ['東', 'ひがし', 'este'], ['南東', 'なんとう', 'sureste'],
  ['南', 'みなみ', 'sur'], ['南西', 'なんせい', 'suroeste'], ['西', 'にし', 'oeste'], ['北西', 'ほくせい', 'noroeste']];
const rumboDe = g => RUMBOS[Math.round(g / 45) % 8];
function rumbo(a, b) {
  const r = Math.PI / 180, [la1, lo1, la2, lo2] = [a[0] * r, a[1] * r, b[0] * r, b[1] * r];
  const y = Math.sin(lo2 - lo1) * Math.cos(la2), x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(lo2 - lo1);
  return (Math.atan2(y, x) / r + 360) % 360;
}
// Diferencia más corta entre dos ángulos, en (-180, 180]
const giroCorto = (a, b) => ((b - a + 540) % 360) - 180;

// Dial dibujado una sola vez en SVG: 72 marcas y los cuatro puntos cardinales en kanji
const dial = (() => {
  let s = '<circle cx="100" cy="100" r="96" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.35)"/>';
  for (let g = 0; g < 360; g += 5) {
    const largo = g % 90 === 0 ? 14 : g % 30 === 0 ? 10 : 5, a = g * Math.PI / 180;
    const [x1, y1, x2, y2] = [100 + 94 * Math.sin(a), 100 - 94 * Math.cos(a), 100 + (94 - largo) * Math.sin(a), 100 - (94 - largo) * Math.cos(a)];
    s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${g === 0 ? '#ff453a' : 'rgba(255,255,255,.55)'}" stroke-width="${g % 30 ? 1 : 2}"/>`;
  }
  [['北', 0, '#ff6b5f'], ['東', 90, '#fff'], ['南', 180, '#fff'], ['西', 270, '#fff']].forEach(([k, g, c]) => {
    const a = g * Math.PI / 180;
    s += `<text x="${(100 + 64 * Math.sin(a)).toFixed(1)}" y="${(100 - 64 * Math.cos(a) + 6).toFixed(1)}" text-anchor="middle" font-size="17" font-weight="800" fill="${c}" font-family="Hiragino Sans, Noto Sans JP, sans-serif">${k}</text>`;
  });
  return s;
})();

const boton = document.createElement('button');
boton.className = 'redondo'; boton.id = 'fuji-radar'; boton.textContent = '🧭';
boton.title = tr('Brújula: hacia dónde queda el Fuji'); boton.setAttribute('aria-label', boton.title);
$('#herramientas').appendChild(boton);
const panel = document.createElement('section');
panel.id = 'radar'; panel.className = 'cristal';
panel.innerHTML = `<header><b>🧭 ${tr('Brújula')} · <span class="jp">方位磁石</span></b><button class="redondo pequeno" id="radar-cerrar" aria-label="${tr('Cerrar')}">✕</button></header>
  <div class="objetivos" id="radar-objetivos"></div>
  <div class="brujula"><div class="yo"></div>
    <svg class="dial" viewBox="0 0 200 200" aria-hidden="true">${dial}</svg>
    <div class="aguja"><svg viewBox="0 0 200 200" aria-hidden="true"><path d="M100 30 L108 100 L100 92 L92 100 Z" fill="#ffd60a"/></svg><i id="radar-emoji">🗻</i></div>
    <div class="centro"><b id="radar-grados">—</b><small class="jp" id="radar-mira"></small></div></div>
  <div class="dato" id="radar-dato"></div>
  <div class="consejo" id="radar-consejo"></div>
  <div class="fila"><button class="chip" id="radar-voz">🔊 ${tr('Dilo')}</button><button class="chip" id="radar-linea">📏 ${tr('Línea en el mapa')}</button></div>`;
document.body.appendChild(panel);
const $dial = panel.querySelector('.dial'), $aguja = panel.querySelector('.aguja');

let desde = null, origen = '', objetivo = 'fuji', destino = FUJI, nombreDestino = '富士山';
let rumboDestino = 0, frase = '', linea = null, vigia = null;
// Brújula suavizada: se promedian seno y coseno (así 359° → 1° no da la vuelta entera)
let rumboMovil = null, sx = 0, cx = 1, mostrado = 0, animando = false, ultimaLectura = 0, alineado = false, ultimoAviso = 0;

function pintarObjetivos() {
  const opciones = [['fuji', '🗻 ' + tr('Fuji')], ['cerca', '⛺ ' + tr('Camping más cercano')]];
  if (seleccionado !== null) opciones.push(['elegido', '📍 ' + CAMPINGS[seleccionado].nombre]);
  $('#radar-objetivos').innerHTML = opciones.map(([k, t]) => `<button class="chip ${objetivo === k ? 'activo' : ''}" data-objetivo="${k}">${esc(t)}</button>`).join('');
}
$('#radar-objetivos').onclick = e => { const b = e.target.closest('[data-objetivo]'); if (b) { objetivo = b.dataset.objetivo; calcular(); } };

function elegirDestino() {
  if (objetivo === 'elegido' && seleccionado !== null) { const c = CAMPINGS[seleccionado]; return [[c.lat, c.lng], c.ja.split(' ')[0], '⛺']; }
  if (objetivo === 'cerca' && desde) {
    const i = CAMPINGS.map((c, i) => i).sort((a, b) => km(desde, [CAMPINGS[a].lat, CAMPINGS[a].lng]) - km(desde, [CAMPINGS[b].lat, CAMPINGS[b].lng]))[0];
    return [[CAMPINGS[i].lat, CAMPINGS[i].lng], CAMPINGS[i].ja.split(' ')[0], '⛺'];
  }
  objetivo = 'fuji'; return [FUJI, '富士山', '🗻'];
}
function calcular() {
  if (!desde) return;
  let emoji; [destino, nombreDestino, emoji] = elegirDestino();
  rumboDestino = rumbo(desde, destino);
  const d = km(desde, destino), [kanji, kana, es] = rumboDe(rumboDestino);
  frase = `${nombreDestino}は${kanji}に${d < 10 ? d.toFixed(1) : Math.round(d)}キロです`;
  $('#radar-emoji').textContent = emoji;
  const pista = objetivo !== 'fuji' ? '' : d < 60 ? tr('見えるかも！ Muy cerca: busca la cumbre') : d < 150 ? tr('Con el día despejado puede verse') : tr('Lejos: habrá que ir hacia él 🛵');
  $('#radar-dato').innerHTML = `<div class="gran"><span class="jp">${esc(nombreDestino)}</span> · ${d < 10 ? d.toFixed(1) : Math.round(d)} km</div>
    <div><b class="jp">${kanji}</b> <span class="jp sub">${kana}</span> = ${tr(es)} · ${Math.round(rumboDestino)}°</div>
    <div class="sub">${tr('desde')} ${origen}</div>${pista ? `<div class="sub jp" style="margin-top:2px">${pista}</div>` : ''}`;
  pintarObjetivos();
  empujar();
  if (linea) ponerLinea(false);
}
function ponerLinea(encuadrar = true) {
  if (linea) mapa.removeLayer(linea);
  linea = L.polyline([desde, destino], { renderer: renderLugares, color: '#fff', weight: 3, dashArray: '2 8', opacity: .9 }).addTo(mapa);
  if (encuadrar) mapa.fitBounds(linea.getBounds(), { padding: [60, 60], animate: !esMovil() });
}

// Un fotograma por cambio: se acerca con suavidad al rumbo real y se para al llegar (no gasta batería quieto)
function empujar() { if (!animando) { animando = true; requestAnimationFrame(pintar); } }
function pintar() {
  const objetivoGiro = rumboMovil ?? 0, paso = giroCorto(mostrado, objetivoGiro);
  mostrado = (mostrado + paso * .25 + 360) % 360;
  $dial.style.transform = `rotate(${-mostrado}deg)`;
  const relativo = giroCorto(mostrado, rumboDestino);
  $aguja.style.transform = `rotate(${relativo}deg)`;
  if (rumboMovil !== null) {
    const [k] = rumboDe(mostrado);
    $('#radar-grados').textContent = `${Math.round(mostrado)}°`;
    $('#radar-mira').textContent = k;
    // Mirando al destino (±10°): borde dorado, vibración corta y alguien lo celebra de vez en cuando
    const ahora = Math.abs(relativo) < 10;
    if (ahora !== alineado) {
      alineado = ahora; panel.classList.toggle('alineado', ahora);
      if (ahora) { navigator.vibrate?.(35); if (Date.now() - ultimoAviso > 20000) { ultimoAviso = Date.now(); Voz.reaccionar('rin', 'bien'); } }
    }
  }
  if (Math.abs(paso) > .15) requestAnimationFrame(pintar); else animando = false;
}
function alOrientar(e) {
  let h = e.webkitCompassHeading ?? (e.absolute && e.alpha != null ? 360 - e.alpha : null);
  if (h == null) return;
  h = (h + (screen.orientation?.angle || 0)) % 360; // el móvil en horizontal gira el marco de referencia
  const r = h * Math.PI / 180;
  sx = sx * .8 + Math.sin(r) * .2; cx = cx * .8 + Math.cos(r) * .2;
  rumboMovil = (Math.atan2(sx, cx) * 180 / Math.PI + 360) % 360;
  ultimaLectura = Date.now();
  const precision = e.webkitCompassAccuracy;
  $('#radar-consejo').textContent = precision > 25 || precision < 0 ? tr('📳 Brújula imprecisa: mueve el móvil dibujando un 8') : tr('Pon el móvil plano y gira hasta que la flecha apunte arriba');
  empujar();
}
const eventoBrujula = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';

async function abrirRadar(abrir) {
  panel.classList.toggle('abierto', abrir); boton.classList.toggle('activo', abrir);
  if (!abrir) {
    removeEventListener(eventoBrujula, alOrientar);
    if (vigia !== null) navigator.geolocation?.clearWatch(vigia); vigia = null;
    if (linea) { mapa.removeLayer(linea); linea = null; }
    return;
  }
  abrirCapas(false); if (esMovil()) cerrarFicha(); // en el móvil la ficha lo taparía
  if (seleccionado !== null) objetivo = 'elegido';
  // iOS pide permiso para la brújula dentro del toque
  try { if (typeof DeviceOrientationEvent?.requestPermission === 'function') await DeviceOrientationEvent.requestPermission(); } catch {}
  rumboMovil = null; ultimaLectura = 0;
  addEventListener(eventoBrujula, alOrientar);
  $('#radar-grados').textContent = '—'; $('#radar-mira').textContent = '';
  $('#radar-consejo').textContent = tr('Buscando la brújula…');
  setTimeout(() => { if (panel.classList.contains('abierto') && !ultimaLectura) $('#radar-consejo').textContent = tr('Este aparato no tiene brújula: el norte queda arriba, como en el mapa'); }, 1500);
  const centro = mapa.getCenter();
  desde = miPosicion || [centro.lat, centro.lng]; origen = tr(miPosicion ? 'donde estás 📍' : 'el centro del mapa');
  calcular();
  // Se sigue la posición mientras el panel está abierto (andando o en coche la distancia se actualiza)
  vigia = navigator.geolocation?.watchPosition(p => {
    if (!panel.classList.contains('abierto')) return;
    desde = [p.coords.latitude, p.coords.longitude]; origen = tr('donde estás 📍'); calcular();
  }, () => {}, { enableHighAccuracy: false, maximumAge: 15000, timeout: 20000 }) ?? null;
}
boton.onclick = () => abrirRadar(!panel.classList.contains('abierto'));
$('#radar-cerrar').onclick = () => abrirRadar(false);
$('#radar-voz').onclick = () => hablar(frase, objetivo === 'fuji' ? 'rin' : 'nadeshiko');
$('#radar-linea').onclick = () => { if (desde) ponerLinea(); };
// Al abrir otra vista o las capas, la brújula se cierra sola
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
    veredicto = nota > .55 ? `✨ <b class="jp">星空がきれい！</b> ${tr('Noche de estrellas: saca la esterilla')}`
      : nota > .25 ? `⭐ <b class="jp">少し見える</b> ${tr('Algunas estrellas entre nubes o luna')}`
      : `☁️ <b class="jp">星は見えないかも</b> ${tr('Hoy toca hoguera y mirar el fuego')}`;
  }
  return `<div class="cielo"><div class="luna">${l.emoji}</div><div style="flex:1">
    <b class="jp">${l.kanji}</b> <span class="jp sub">${l.kana}</span> — ${tr(l.es)} · 月齢 ${l.edad.toFixed(1)}<br>
    <small class="sub">${puesta ? `🌇 ${tr('Puesta de sol')} <b>${puesta}</b> · ` : ''}${nubes !== null ? tr('nubes a las 22:00: {n} %', { n: nubes }) : ''}</small>
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
MODOS.repaso = { emoji: '🧠', titulo: tr('Repaso del día'), get desc() {
  const { vencidas } = pendientes(), dominadas = Object.values(repaso).filter(r => r.caja >= 5).length;
  return `${vencidas.length ? tr('{n} por repasar hoy', { n: vencidas.length }) : tr('Nada vencido: palabras nuevas')} · ${tr('{n}/{total} dominadas', { n: dominadas, total: TODAS_PALABRAS.length })}`;
}, pregunta() {
  const { vencidas, nuevas } = pendientes();
  const bien = baraja(vencidas)[0] || nuevas[0] || baraja(TODAS_PALABRAS)[0];
  const ops = baraja([bien, ...baraja(TODAS_PALABRAS.filter(p => p.es !== bien.es)).slice(0, 3)]);
  const q = vozPalabra(bien.cat), caja = repaso[bien.w]?.caja || 0;
  return { quien: q, decir: bien.w, explica: `${bien.w} · ${bien.kana} · ${bien.romaji} — ${bien.es}`,
    enunciado: `<div class="grande jp">${esc(bien.w)}</div><div class="sub jp" style="font-size:16px">${bien.kana !== bien.w ? esc(bien.kana) : ''}</div>
      <div class="srs" title="${tr('Caja de repaso')}">${INTERVALOS.slice(1).map((_, k) => `<i class="${k < caja ? 'si' : ''}"></i>`).join('')}</div>`,
    ops: ops.map(p => ({ txt: esc(p.es), ok: p === bien })),
    alResponder(ok) {
      const nueva = ok ? Math.min(caja + 1, 5) : 1;
      // Si falla vuelve mañana; si acierta, cada vez tarda más en volver
      repaso[bien.w] = { caja: nueva, proxima: DIA() + (ok ? INTERVALOS[nueva] : 1) };
      guardado.escribir('repaso', repaso);
      if (nueva === 5 && !aprendidas.has(bien.w)) { aprendidas.add(bien.w); guardado.escribir('aprendidas', [...aprendidas]); avisar(tr('⭐ {w} ya es tuya: pasa a «aprendidas»', { w: bien.w })); }
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
  tarjeta.innerHTML = `<div class="kanji jp">${esc(p.w)}</div><div><small>📅 ${tr('Palabra del día')} · ${racha.dias > 1 ? tr('🔥 {n} días seguidos', { n: racha.dias }) : tr('toca para oírla')}</small>
    <b class="jp">${esc(p.kana)}</b> — ${esc(p.es)} ${p.emoji || ''}</div>`;
  document.body.appendChild(tarjeta);
  const quitar = () => { tarjeta.classList.remove('visible'); setTimeout(() => tarjeta.remove(), 400); };
  tarjeta.onclick = () => { hablar(p.w, q); if (racha.dias > 0 && racha.dias % 7 === 0) confeti(['🔥', '📅', '⭐']); setTimeout(quitar, 1800); };
  // Aparece cuando el mapa ya está pintado y el móvil está libre
  (window.requestIdleCallback || setTimeout)(() => requestAnimationFrame(() => tarjeta.classList.add('visible')), { timeout: 1500 });
  setTimeout(quitar, 9000);
}
})();
