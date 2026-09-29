// Sorpresas: logros secretos, estrellas fugaces de noche, camping sorpresa (🎲 o agitar el móvil),
// modo manta y vibración de verdad en el móvil. Se carga con «defer», así no frena el arranque.
// Usa las globales de index.html (tr, hablar, Voz, confeti, avisar, abrirFicha, mapa, CAMPINGS, visitados…).
const Sorpresas = (() => {
const nativo = window.Capacitor?.Plugins?.Haptics;
const menosMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
const leer = (k, d) => { try { return JSON.parse(localStorage.getItem('yc_' + k)) ?? d; } catch { return d; } };
const escribir = (k, v) => { try { localStorage.setItem('yc_' + k, JSON.stringify(v)); } catch {} };

/* ---------- Vibración: el motor háptico del iPhone/Android si hay app; si no, navigator.vibrate ---------- */
function vibrar(tipo = 'suave') {
  try {
    if (nativo) {
      if (tipo === 'exito') return nativo.notification({ type: 'SUCCESS' });
      if (tipo === 'error') return nativo.notification({ type: 'ERROR' });
      return nativo.impact({ style: tipo === 'fuerte' ? 'MEDIUM' : 'LIGHT' });
    }
    navigator.vibrate?.({ exito: [18, 60, 28], error: [40, 50, 40], fuerte: 25, suave: 8 }[tipo] || 8);
  } catch {}
}

const css = document.createElement('style');
css.textContent = `
  .estrella-fugaz { position: fixed; z-index: 900; top: 0; left: 0; width: 120px; height: 3px; border-radius: 3px; cursor: pointer;
    background: linear-gradient(90deg, rgba(255,255,255,0), #fff 70%, #fff8c4); filter: drop-shadow(0 0 6px #fff8c4);
    will-change: transform, opacity; animation: fugaz 2.6s cubic-bezier(.3,.1,.4,1) forwards; }
  .estrella-fugaz::before { content: ''; position: absolute; inset: -22px -10px; } /* zona de toque más grande que la estela */
  @keyframes fugaz { 0% { opacity: 0; transform: translate(var(--x0), var(--y0)) rotate(24deg); } 12% { opacity: 1; }
    80% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--x1), var(--y1)) rotate(24deg); } }
  #manta { position: fixed; inset: 0; z-index: 890; pointer-events: none; opacity: 0; transition: opacity 1.2s;
    background: radial-gradient(ellipse at 50% 110%, rgba(255,140,40,.28), rgba(40,20,10,.35) 70%); }
  body.manta #manta { opacity: 1; }
  #dado.tirando { animation: tirar .6s cubic-bezier(.3,1.6,.5,1); }
  @keyframes tirar { 0% { transform: rotate(0) scale(1); } 50% { transform: rotate(200deg) scale(1.3); } 100% { transform: rotate(360deg) scale(1); } }
  .logros { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 10px; margin: 18px 0 8px; }
  .logro { text-align: center; padding: 12px 6px; border-radius: 18px; background: rgba(255,255,255,.08); font-size: 12px; line-height: 1.3; }
  .logro .emo { font-size: 30px; display: block; margin-bottom: 4px; }
  .logro.oculto { opacity: .45; } .logro.oculto .emo { filter: grayscale(1) blur(1px); }
  .logro.nuevo { animation: brillo 1.6s ease-out; }
  @keyframes brillo { 0% { box-shadow: 0 0 0 0 var(--oro, #ffd60a); } 100% { box-shadow: 0 0 0 14px rgba(255,214,10,0); } }
  .titulo-logros { margin-top: 22px; font-size: 17px; }
  .acerca { margin-top: 12px; font-size: 12px; line-height: 1.5; opacity: .8; }
  .acerca a { color: inherit; }
  @media (prefers-reduced-motion: reduce) { #dado.tirando, .logro.nuevo { animation: none; } }
`;
document.head.appendChild(css);

/* ---------- Logros secretos ---------- */
const LOGROS = [
  { id: 'buho', emo: '🦉', nombre: 'Búho campista', pista: 'Abre la app de madrugada' },
  { id: 'alba', emo: '🌅', nombre: 'Madrugadora', pista: 'Abre la app al amanecer' },
  { id: 'deseo', emo: '🌠', nombre: 'Un deseo', pista: 'Atrapa una estrella fugaz' },
  { id: 'dado', emo: '🎲', nombre: 'Aventurera', pista: 'Deja que el azar elija camping' },
  { id: 'manta', emo: '🧣', nombre: 'Modo manta', pista: 'Toca el título ⛺ cinco veces' },
  { id: 'perfecto', emo: '💯', nombre: 'Examen perfecto', pista: 'Saca 10/10 en un quiz' },
  { id: 'fuego', emo: '🔥', nombre: 'Guardiana del fuego', pista: 'Enciende la hoguera de noche' },
  { id: 'poliglota', emo: '🗣️', nombre: 'Políglota', pista: 'Usa la app en tres idiomas' },
  { id: 'fiel', emo: '📅', nombre: 'Campista fiel', pista: 'Vuelve en tres días distintos' },
];
const logrados = new Set(leer('logros', []));
function lograr(id) {
  if (logrados.has(id)) return false;
  const l = LOGROS.find(x => x.id === id); if (!l) return false;
  logrados.add(id); escribir('logros', [...logrados]); escribir('logro_nuevo', id);
  // Deja respirar a la acción que lo ha disparado antes de celebrar
  setTimeout(() => {
    avisar(tr('🔓 Logro secreto: {n}', { n: `${l.emo} ${tr(l.nombre)}` }));
    confeti([l.emo, '✨', '⭐']); vibrar('exito');
    if (logrados.size === LOGROS.length) setTimeout(() => { avisar(tr('👑 ¡Todos los logros secretos! Eres de verdad del 野クル')); confeti(['👑', '⛺', '🗻', '🔥']); }, 3000);
  }, 700);
  return true;
}
function pintarLogros() {
  const hoja = document.querySelector('#hoja-pasaporte .contenido'); if (!hoja) return;
  let caja = document.getElementById('logros');
  if (!caja) { caja = document.createElement('div'); caja.id = 'logros'; hoja.appendChild(caja); }
  const nuevo = leer('logro_nuevo', null); escribir('logro_nuevo', null);
  caja.innerHTML = `<h3 class="titulo-logros">${tr('🔐 Logros secretos')} · ${logrados.size}/${LOGROS.length}</h3>
    <div class="logros">${LOGROS.map(l => logrados.has(l.id)
      ? `<div class="logro${l.id === nuevo ? ' nuevo' : ''}"><span class="emo">${l.emo}</span><b>${tr(l.nombre)}</b></div>`
      : `<div class="logro oculto" title="${tr(l.pista)}"><span class="emo">❔</span>${tr(l.pista)}</div>`).join('')}</div>`;
}
const pasaporteOriginal = window.pintarPasaporte;
window.pintarPasaporte = function () { pasaporteOriginal.apply(this, arguments); pintarLogros(); };

// Hora, idiomas y días: se comprueban al abrir
function alAbrir() {
  const h = new Date().getHours();
  if (h < 4) lograr('buho'); else if (h >= 5 && h < 7) lograr('alba');
  const idiomas = new Set(leer('idiomas_vistos', [])); idiomas.add(document.documentElement.lang); escribir('idiomas_vistos', [...idiomas]);
  if (idiomas.size >= 3) lograr('poliglota');
  const hoy = new Date().toISOString().slice(0, 10), dias = new Set(leer('dias', [])); dias.add(hoy);
  escribir('dias', [...dias].slice(-30)); if (dias.size >= 3) lograr('fiel');
}

// Quiz perfecto: se mira el marcador al acabar la partida
const finOriginal = window.finQuiz;
window.finQuiz = function () { const perfecto = typeof partida !== 'undefined' && partida?.puntos === 10; finOriginal.apply(this, arguments); if (perfecto) lograr('perfecto'); };

// Hoguera encendida de noche
document.getElementById('hoguera')?.addEventListener('click', () => setTimeout(() => {
  const h = new Date().getHours(); if (typeof Hoguera !== 'undefined' && Hoguera.sonando && (h >= 19 || h < 5)) lograr('fuego');
}, 50));

// Vibración en lo que se toca a menudo: dock, respuestas del quiz, sellos
document.addEventListener('click', e => {
  if (e.target.closest('#dock button, .segmentos button, .chip')) vibrar('suave');
  const op = e.target.closest('.opcion');
  if (op) setTimeout(() => vibrar(op.classList.contains('bien') ? 'exito' : op.classList.contains('mal') ? 'error' : 'suave'), 30);
}, { passive: true });
const confetiOriginal = window.confeti;
window.confeti = function () { vibrar('exito'); return confetiOriginal.apply(this, arguments); };

/* ---------- Estrella fugaz: solo de noche, en el mapa y con la app a la vista ---------- */
const deNoche = () => { const h = new Date().getHours(); return h >= 19 || h < 5; };
const enMapa = () => document.querySelector('#dock [data-vista="mapa"]')?.classList.contains('activo');
function estrella() {
  if (document.hidden || document.querySelector('.estrella-fugaz')) return;
  const e = document.createElement('div'); e.className = 'estrella-fugaz'; e.setAttribute('role', 'button'); e.setAttribute('aria-label', tr('Estrella fugaz'));
  const x0 = innerWidth * (.05 + Math.random() * .45), y0 = innerHeight * (.06 + Math.random() * .18);
  e.style.setProperty('--x0', x0 + 'px'); e.style.setProperty('--y0', y0 + 'px');
  e.style.setProperty('--x1', x0 + innerWidth * .45 + 'px'); e.style.setProperty('--y1', y0 + innerWidth * .2 + 'px');
  e.onclick = () => {
    e.remove(); vibrar('exito'); confeti(['🌠', '✨', '⭐']);
    Voz.decir('流れ星だ！願い事しなきゃ！', 'nadeshiko', { traduccion: tr('¡Una estrella fugaz (流れ星, ながれぼし)! Pide un deseo') });
    lograr('deseo');
  };
  e.addEventListener('animationend', () => e.remove());
  document.body.appendChild(e);
}
function programarEstrella() {
  // Entre 40 y 100 s: lo bastante rara para que sorprenda
  setTimeout(() => { if (deNoche() && enMapa() && !menosMovimiento) estrella(); programarEstrella(); }, 40e3 + Math.random() * 60e3);
}

/* ---------- Camping sorpresa: botón 🎲 o agitar el móvil ---------- */
let tirando = false;
function campingSorpresa() {
  if (tirando) return; tirando = true;
  const b = document.getElementById('dado'); b?.classList.remove('tirando'); void b?.offsetWidth; b?.classList.add('tirando');
  vibrar('fuerte'); lograr('dado');
  const pendientes = CAMPINGS.map((_, i) => i).filter(i => !visitados.has(i));
  const lista = pendientes.length ? pendientes : CAMPINGS.map((_, i) => i);
  const i = lista[Math.floor(Math.random() * lista.length)];
  if (!enMapa()) irA('mapa');
  setTimeout(() => {
    abrirFicha(i);
    Voz.decir('次はここに行こう！', 'nadeshiko', { traduccion: tr('¡La próxima vez vamos aquí! → {n}', { n: CAMPINGS[i].nombre }) });
    tirando = false;
  }, 650);
}
const dado = document.createElement('button');
dado.id = 'dado'; dado.className = 'redondo'; dado.textContent = '🎲';
dado.title = dado.ariaLabel = tr('Camping sorpresa (o agita el móvil)');
dado.onclick = async () => { await pedirMovimiento(); campingSorpresa(); };
document.getElementById('herramientas')?.appendChild(dado);

let movimientoActivo = false, sacudidas = [];
function alMover(ev) {
  const a = ev.accelerationIncludingGravity; if (!a) return;
  const fuerza = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
  if (fuerza < 24) return;
  const ahora = Date.now(); sacudidas = sacudidas.filter(t => ahora - t < 900); sacudidas.push(ahora);
  if (sacudidas.length >= 3) { sacudidas = []; campingSorpresa(); }
}
async function pedirMovimiento() {
  if (movimientoActivo || !('DeviceMotionEvent' in window)) return;
  // iOS pide permiso tras un toque; se aprovecha el primer toque al 🎲
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    try { if (await DeviceMotionEvent.requestPermission() !== 'granted') return; } catch { return; }
  }
  addEventListener('devicemotion', alMover, { passive: true }); movimientoActivo = true;
}
// En Android no hace falta permiso: se escucha desde el principio (solo en móviles)
if (matchMedia('(pointer: coarse)').matches && typeof DeviceMotionEvent?.requestPermission !== 'function') pedirMovimiento();

/* ---------- Modo manta: tocar el título cinco veces ---------- */
const manta = document.createElement('div'); manta.id = 'manta'; document.body.appendChild(manta);
let toques = [];
document.querySelector('#panel h1')?.addEventListener('click', () => {
  const ahora = Date.now(); toques = toques.filter(t => ahora - t < 1500); toques.push(ahora);
  if (toques.length < 5) return vibrar('suave');
  toques = [];
  const activo = document.body.classList.toggle('manta');
  vibrar('fuerte');
  if (activo) {
    if (typeof Hoguera !== 'undefined' && !Hoguera.sonando) document.getElementById('hoguera')?.click();
    Voz.decir('ぬくぬくだね〜', 'nadeshiko', { traduccion: tr('🧣 Modo manta: calentito (ぬくぬく)… hora de ゆるキャン') });
    lograr('manta');
  } else avisar(tr('🧣 Modo manta apagado'));
});

/* ---------- Acerca de: app de fans no oficial + privacidad (lo piden las tiendas) ---------- */
const creditos = document.getElementById('creditos-mapa');
if (creditos) {
  const p = document.createElement('p'); p.className = 'acerca';
  p.innerHTML = `${tr('App de fans no oficial, gratis y sin anuncios. ゆるキャン△ es obra de あfろ / 芳文社; sin relación con los titulares.')}
    <br><a href="privacidad.html" target="_blank" rel="noopener">${tr('🔒 Privacidad: no se recoge ningún dato')}</a>`;
  creditos.after(p);
}

alAbrir();
programarEstrella();

return {
  listo: true, vibrar, lograr, logros: LOGROS,
  // Para los tests: dispara cada sorpresa una vez y comprueba que no rompe nada
  probar() {
    estrella(); document.querySelector('.estrella-fugaz')?.click();
    campingSorpresa();
    const h1 = document.querySelector('#panel h1'); for (let i = 0; i < 5; i++) h1.click();
    irA('pasaporte');
    if (!document.querySelectorAll('#logros .logro').length) throw new Error('no se pintan los logros');
    return [...logrados];
  },
};
})();
