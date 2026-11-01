// «Vive el anime»: guía por episodios, revivir un episodio, el episodio en el mapa, modo peregrino (GPS) y diario.
// Todo sale de los datos reales de la app (lugares.js con su episodio y captura, campings.js): no se inventa nada del anime.
(() => {
  const $v = s => document.querySelector(s);
  const ORDEN_TEMP = ['T1', 'T2', 'T3', 'Película', 'Heya Camp'];

  /* ---------- Índice de episodios ---------- */
  const tempDe = ep => ep.startsWith('Película') ? 'Película' : ep.split(' · ')[0];
  const numDe = ep => +(ep.match(/ep\. (\d+)/)?.[1] || 0);
  const claveEp = (t, n) => t === 'Película' ? 'Película' : `${t} · ep. ${n}`;
  // «T1 · ep. 3 y 11-12» → [3, 11, 12]
  const numsCamping = ep => {
    const m = ep.match(/ep\. (.+)$/); if (!m) return [];
    return m[1].split(/\s*y\s*|,\s*/).flatMap(p => { const [a, b] = p.split('-').map(Number); return b ? Array.from({ length: b - a + 1 }, (_, k) => a + k) : [a]; });
  };
  const EPISODIOS = new Map();
  const ep = clave => { if (!EPISODIOS.has(clave)) EPISODIOS.set(clave, { clave, temp: tempDe(clave), n: numDe(clave), lugares: [], campings: [] }); return EPISODIOS.get(clave); };
  LUGARES.forEach((l, i) => l.ep && ep(l.ep).lugares.push(i));
  CAMPINGS.forEach((c, i) => { const t = tempDe(c.ep); (t === 'Película' ? ['Película'] : numsCamping(c.ep).map(n => claveEp(t, n))).forEach(k => ep(k).campings.push(i)); });
  const lista = [...EPISODIOS.values()].sort((a, b) => ORDEN_TEMP.indexOf(a.temp) - ORDEN_TEMP.indexOf(b.temp) || a.n - b.n);
  const escenasDe = e => [...e.campings.flatMap(i => CAMPINGS[i].fotos.slice(0, 2)), ...e.lugares.map(i => LUGARES[i].f).filter(Boolean)];
  const tituloEp = e => e.temp === 'Película' ? tr('🎬 La película') : e.temp === 'Heya Camp' ? `Heya Camp · ${tr('ep. {n}', { n: e.n })}` : `${e.temp} · ${tr('ep. {n}', { n: e.n })}`;

  /* ---------- Fechas de lo vivido (para el diario) ---------- */
  const fechas = guardado.leer('fechas', {});
  const vivido = e => e.lugares.filter(i => lugaresVistos.has(i) || (LUGARES[i].f && window.Fotos?.hechas.has(LUGARES[i].f))).length + e.campings.filter(i => visitados.has(i)).length;
  const total = e => e.lugares.length + e.campings.length;
  function fecha(tipo, i, si) {
    const k = tipo + ':' + i;
    if (si) fechas[k] = Date.now(); else delete fechas[k];
    guardado.escribir('fechas', fechas);
  }

  /* ---------- Hoja «Anime»: segmentos ---------- */
  let seccion = guardado.leer('seccionAnime', 'episodios'), tempSel = 'T1', abierto = null;
  function pintar() {
    document.querySelectorAll('#seg-anime button').forEach(b => b.classList.toggle('activo', b.dataset.s === seccion));
    ['episodios', 'diario', 'personajes'].forEach(id => { $v('#' + id).hidden = id !== seccion; });
    $v('#anime-sub').textContent = seccion === 'personajes' ? tr('Toca a una para oírla · cada tema de palabras lo dice una chica distinta')
      : tr('{v} de {t} momentos del anime vividos en la vida real', { v: lista.reduce((s, e) => s + vivido(e), 0), t: lista.reduce((s, e) => s + total(e), 0) });
    if (seccion === 'episodios') abierto ? detalle(abierto) : pintarEpisodios();
    else if (seccion === 'diario') pintarDiario();
    else pintarPersonajes();
  }
  document.querySelectorAll('#seg-anime button').forEach(b => b.onclick = () => { seccion = b.dataset.s; guardado.escribir('seccionAnime', seccion); abierto = null; pintar(); });

  function pintarEpisodios() {
    const caja = $v('#episodios'), temps = ORDEN_TEMP.filter(t => lista.some(e => e.temp === t));
    caja.innerHTML = `<div class="pestañas fino">${temps.map(t => `<button class="chip ${t === tempSel ? 'activo' : ''}" data-t="${t}">${esc(t === 'Película' ? tr('🎬 Película') : t === 'Heya Camp' ? '🏠 Heya Camp' : tr('Temporada {n}', { n: t.slice(1) }))}</button>`).join('')}</div>
      <div class="rejilla-ep"></div>`;
    caja.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tempSel = b.dataset.t; pintarEpisodios(); });
    const rej = caja.querySelector('.rejilla-ep');
    lista.filter(e => e.temp === tempSel).forEach(e => {
      const fotos = escenasDe(e).slice(0, 3), v = vivido(e), t = total(e);
      const b = document.createElement('button'); b.className = 'tarj-ep' + (v && v === t ? ' completo' : '');
      b.innerHTML = `<div class="mosaico">${fotos.map(f => `<img src="${f}" alt="" loading="lazy" decoding="async">`).join('') || '<div class="sinfoto">🎬</div>'}</div>
        <div class="ep-pie"><b>${esc(tituloEp(e))}</b><small class="sub">${esc(tr('{n} sitios reales', { n: t }))}${e.campings.length ? ' · ⛺ ' + e.campings.map(i => esc(CAMPINGS[i].nombre)).join(', ') : ''}</small>
        <div class="progreso"><i style="width:${t ? v / t * 100 : 0}%"></i></div><small>${v ? (v === t ? '💮 ' + esc(tr('¡Episodio vivido entero!')) : esc(tr('{v}/{t} vividos', { v, t }))) : ''}</small></div>`;
      b.onclick = () => detalle(e); rej.appendChild(b);
    });
  }

  function detalle(e) {
    abierto = e;
    const caja = $v('#episodios'), escenas = escenasDe(e);
    caja.innerHTML = `<button class="chip" data-a="volver">${esc(tr('← Episodios'))}</button>
      <h2 class="ep-titulo">${esc(tituloEp(e))}</h2>
      <div class="carrusel fino">${escenas.map(f => { const l = LUGARES.find(x => x.f === f); return `<figure><img src="${f}" alt="" loading="lazy" decoding="async" data-grande><figcaption class="jp">${esc(l ? l.n : CAMPINGS.find(c => c.fotos.includes(f))?.nombre || '')}</figcaption></figure>`; }).join('')}</div>
      <div class="acciones ep-acciones">
        <button class="boton grande recrear" data-a="revivir">${esc(tr('📽️ Revivir el episodio'))}</button>
        <button class="boton" data-a="mapa">${esc(tr('🗺️ Verlo en el mapa'))}</button>
        <button class="boton" data-a="foto">${esc(tr('📸 Recrear sus escenas'))}</button>
      </div>
      ${e.campings.map(i => { const c = CAMPINGS[i]; return `<div class="bloque ep-camping"><h4>⛺ ${esc(c.nombre)} <span class="jp sub">${esc(c.ja)}</span></h4>
        <p>${esc(c.porque)}</p><p class="sub">💡 ${esc(c.leccion)}</p>${c.comida !== '—' ? `<p class="jp sub">🍲 ${esc(c.comida)}</p>` : ''}
        <button class="chip" data-c="${i}">${esc(visitados.has(i) ? tr('💮 Sellado') : tr('🗺️ Ir al camping'))}</button></div>`; }).join('')}
      <h4 class="ep-h">${esc(tr('📍 Los sitios reales de este episodio'))}</h4>
      <div class="ep-lugares">${e.lugares.map(i => { const l = LUGARES[i], cat = CATEGORIAS_LUGAR[l.c], hecho = lugaresVistos.has(i) || window.Fotos?.hechas.has(l.f);
        return `<button class="reto ${hecho ? 'hecho' : ''}" data-l="${i}">${l.f ? `<img src="${l.f}" alt="" loading="lazy" decoding="async">` : `<span class="ico-l">${cat.emoji}</span>`}
          <span><b class="jp">${esc(l.n)}</b><small class="sub">${cat.emoji} ${esc(cat.titulo)}${l.nota?.trim() ? ' · ' + esc(l.nota) : ''}</small></span>${hecho ? '<i>💮</i>' : ''}</button>`; }).join('')}</div>
      ${window.tarjetaTony?.(tituloEp(e)) || ''}`;
    caja.scrollTop = 0; $v('#hoja-personajes .contenido').scrollTop = 0;
    caja.querySelector('[data-a="volver"]').onclick = () => { abierto = null; pintarEpisodios(); };
    caja.querySelector('[data-a="revivir"]').onclick = () => revivir(e);
    caja.querySelector('[data-a="mapa"]').onclick = () => verEnMapa(e);
    caja.querySelector('[data-a="foto"]').onclick = () => escenas.length ? window.Fotos?.abrir(escenas) : avisar(tr('Este episodio no tiene capturas'));
    caja.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { irA('mapa'); abrirFicha(+b.dataset.c); });
    caja.querySelectorAll('[data-l]').forEach(b => b.onclick = () => { irA('mapa'); abrirLugar(+b.dataset.l, true); });
    caja.querySelectorAll('[data-grande]').forEach(img => img.onclick = () => verGrande(img.src));
  }

  /* ---------- El episodio en el mapa: solo sus sitios ---------- */
  function verEnMapa(e) {
    window.epFiltro = e.clave;
    irA('mapa'); ponerCapasLugar(true);
    const pts = [...e.lugares.map(i => [LUGARES[i].lat, LUGARES[i].lng]), ...e.campings.map(i => [CAMPINGS[i].lat, CAMPINGS[i].lng])];
    if (pts.length) mapa.flyToBounds(pts, { paddingTopLeft: esMovil() ? [30, 110] : [420, 80], paddingBottomRight: esMovil() ? [30, 260] : [80, 140], maxZoom: 15, duration: .8 });
    let chip = $v('#chip-ep');
    if (!chip) { chip = document.createElement('button'); chip.id = 'chip-ep'; chip.className = 'cristal'; document.body.appendChild(chip); }
    chip.innerHTML = `📺 ${esc(tituloEp(e))} · ${esc(tr('{n} sitios', { n: pts.length }))} <b>✕</b>`; chip.hidden = false;
    chip.onclick = () => { window.epFiltro = null; chip.hidden = true; ponerCapasLugar(true); };
  }

  /* ---------- Revivir: pase de capturas con zoom lento y el nombre dicho en japonés ---------- */
  const pase = document.createElement('div'); pase.id = 'revivir'; pase.hidden = true;
  pase.innerHTML = `<div class="rv-fotos"></div><div class="rv-barras"></div>
    <header><b class="rv-titulo"></b><button class="redondo" data-r="voz" aria-label="${esc(tr('Voz'))}">🔊</button><button class="redondo" data-r="cerrar" aria-label="${esc(tr('Cerrar'))}">✕</button></header>
    <div class="rv-pie"><b class="jp rv-nombre"></b><small class="rv-nota"></small></div>
    <button class="rv-zona izq" data-r="atras" aria-label="${esc(tr('Anterior'))}"></button><button class="rv-zona dch" data-r="siguiente" aria-label="${esc(tr('Siguiente'))}"></button>
    <div class="rv-fin" hidden></div>`;
  document.body.appendChild(pase);
  let rv = null;
  const conVoz = () => guardado.leer('revivirVoz', true);
  function revivir(e) {
    const escenas = escenasDe(e).map(f => { const l = LUGARES.find(x => x.f === f), c = CAMPINGS.find(x => x.fotos.includes(f));
      return { f, nombre: l ? l.n : c?.ja || '', nota: l ? (l.nota || '').trim() : c?.nombre || '', voz: l ? CATEGORIAS_LUGAR[l.c].voz : c?.quien[0] }; });
    if (!escenas.length) return avisar(tr('Este episodio no tiene capturas'));
    rv = { e, escenas, k: -1, t: null };
    pase.querySelector('.rv-titulo').textContent = tituloEp(e);
    pase.querySelector('.rv-barras').innerHTML = escenas.map(() => '<i><b></b></i>').join('');
    pase.querySelector('.rv-fotos').innerHTML = ''; pase.querySelector('.rv-fin').hidden = true;
    pase.querySelector('[data-r="voz"]').textContent = conVoz() ? '🔊' : '🔇';
    pase.hidden = false; document.body.classList.add('con-revivir');
    mostrar(0);
  }
  const DURA = 4200;
  function mostrar(k) {
    if (!rv) return;
    clearTimeout(rv.t);
    if (k >= rv.escenas.length) return fin();
    rv.k = Math.max(0, k);
    const s = rv.escenas[rv.k], fotos = pase.querySelector('.rv-fotos');
    const img = new Image(); img.src = s.f; img.alt = ''; img.className = 'rv-img ' + ['kb1', 'kb2', 'kb3'][rv.k % 3];
    img.decode().catch(() => {}).finally(() => {
      fotos.appendChild(img); requestAnimationFrame(() => img.classList.add('ver'));
      while (fotos.children.length > 2) fotos.firstChild.remove();
    });
    pase.querySelector('.rv-nombre').textContent = s.nombre; pase.querySelector('.rv-nota').textContent = s.nota;
    pase.querySelectorAll('.rv-barras i').forEach((b, j) => b.className = j < rv.k ? 'lleno' : j === rv.k ? 'ahora' : '');
    if (conVoz() && s.nombre) Voz.decir(s.nombre.replace(/（.*?）|\(.*?\)/g, ''), s.voz);
    // Precarga la siguiente para que el cambio no dé tirón
    const sig = rv.escenas[rv.k + 1]; if (sig) { const p = new Image(); p.src = sig.f; }
    rv.t = setTimeout(() => mostrar(rv.k + 1), DURA);
  }
  function fin() {
    const e = rv.e, f = pase.querySelector('.rv-fin');
    f.innerHTML = `<h2>${esc(tr('Fin del episodio'))}</h2><p>${esc(tr('Todos estos sitios existen. ¿Vamos de verdad?'))}</p>
      <div class="acciones"><button class="boton grande recrear" data-f="mapa">${esc(tr('🗺️ Verlo en el mapa'))}</button>
      <button class="boton" data-f="otra">${esc(tr('🔁 Otra vez'))}</button><button class="boton" data-f="salir">${esc(tr('✓ Listo'))}</button></div>`;
    f.hidden = false;
    f.querySelector('[data-f="mapa"]').onclick = () => { cerrarRevivir(); verEnMapa(e); };
    f.querySelector('[data-f="otra"]').onclick = () => revivir(e);
    f.querySelector('[data-f="salir"]').onclick = cerrarRevivir;
    Voz.reaccionar(e.campings.length ? CAMPINGS[e.campings[0]].quien[0] : 'nadeshiko', 'bien');
  }
  function cerrarRevivir() { if (!rv) return false; clearTimeout(rv.t); rv = null; Voz.parar(); pase.hidden = true; document.body.classList.remove('con-revivir'); return true; }
  pase.querySelector('[data-r="cerrar"]').onclick = cerrarRevivir;
  pase.querySelector('[data-r="siguiente"]').onclick = () => rv && mostrar(rv.k + 1);
  pase.querySelector('[data-r="atras"]').onclick = () => rv && mostrar(rv.k - 1);
  pase.querySelector('[data-r="voz"]').onclick = e => { const v = !conVoz(); guardado.escribir('revivirVoz', v); e.currentTarget.textContent = v ? '🔊' : '🔇'; if (!v) Voz.parar(); };
  addEventListener('keydown', e => { if (!rv) return; if (e.key === 'ArrowRight') mostrar(rv.k + 1); if (e.key === 'ArrowLeft') mostrar(rv.k - 1); if (e.key === 'Escape') cerrarRevivir(); });

  /* ---------- Modo peregrino: el GPS te avisa cuando pisas una escena ---------- */
  const PUNTOS = [
    ...LUGARES.map((l, i) => ({ tipo: 'l', i, lat: l.lat, lng: l.lng, radio: .15, nombre: l.n, ep: l.ep, f: l.f, voz: CATEGORIAS_LUGAR[l.c].voz })),
    ...CAMPINGS.map((c, i) => ({ tipo: 'c', i, lat: c.lat, lng: c.lng, radio: .6, nombre: c.nombre, ep: c.ep, f: c.fotos[0], voz: c.quien[0] })),
  ];
  let vigia = null, avisados = new Set(), ultimo = null;
  const banda = document.createElement('div'); banda.id = 'peregrino'; banda.className = 'cristal'; banda.hidden = true; document.body.appendChild(banda);
  const rumbo = (a, b) => { const r = x => x * Math.PI / 180, y = Math.sin(r(b[1] - a[1])) * Math.cos(r(b[0])), x = Math.cos(r(a[0])) * Math.sin(r(b[0])) - Math.sin(r(a[0])) * Math.cos(r(b[0])) * Math.cos(r(b[1] - a[1]));
    return ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'][Math.round(((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360 / 45) % 8]; };
  const yaHecho = p => p.tipo === 'c' ? visitados.has(p.i) : lugaresVistos.has(p.i);
  function alPosicion(pos) {
    const yo = [pos.coords.latitude, pos.coords.longitude];
    miPosicion = yo;
    let mejor = null, d = Infinity;
    for (const p of PUNTOS) { const x = km(yo, [p.lat, p.lng]); if (x < d && (!yaHecho(p) || x < p.radio)) { d = x; mejor = p; } }
    if (!mejor) return;
    ultimo = mejor;
    const aqui = d < mejor.radio, dist = d < 1 ? Math.round(d * 1000) + ' m' : (d < 10 ? d.toFixed(1) : Math.round(d)) + ' km';
    banda.classList.toggle('aqui', aqui);
    banda.innerHTML = `${mejor.f ? `<img src="${mejor.f}" alt="">` : '<span class="ico-l">⛺</span>'}
      <div><small>${aqui ? esc(tr('📍 ¡Estás en la escena!')) : esc(tr('🚶 Escena más cercana · {d} al {r}', { d: dist, r: rumbo(yo, [mejor.lat, mejor.lng]) }))}</small>
      <b class="jp">${esc(mejor.nombre)}</b><small class="sub">${esc(mejor.ep)}</small></div>
      <div class="pg-acc">${aqui ? `${mejor.f ? `<button class="chip" data-p="foto">📸</button>` : ''}<button class="chip" data-p="sello">💮</button>` : `<button class="chip" data-p="ver">🗺️</button>`}<button class="chip" data-p="parar">✕</button></div>`;
    banda.hidden = false;
    banda.querySelector('[data-p="parar"]').onclick = parar;
    banda.querySelector('[data-p="ver"]')?.addEventListener('click', () => { irA('mapa'); mejor.tipo === 'c' ? abrirFicha(mejor.i) : abrirLugar(mejor.i, true); });
    banda.querySelector('[data-p="foto"]')?.addEventListener('click', () => window.Fotos?.abrir(mejor.f));
    banda.querySelector('[data-p="sello"]')?.addEventListener('click', () => sellar(mejor));
    const clave = mejor.tipo + mejor.i;
    if (aqui && !avisados.has(clave)) {
      avisados.add(clave);
      navigator.vibrate?.([80, 60, 80]); window.Capacitor?.Plugins?.Haptics?.notification?.({ type: 'SUCCESS' });
      Voz.decir(`ここ、${mejor.nombre.replace(/（.*?）|\(.*?\)/g, '')}だよ！`, mejor.voz, { traduccion: tr('¡Es aquí! Sale en {ep}', { ep: mejor.ep }) });
      confeti(['📍', '✨', '🏕️']);
    }
  }
  function sellar(p) {
    if (p.tipo === 'c') { if (!visitados.has(p.i)) alternarVisita(p.i); }
    else if (!lugaresVistos.has(p.i)) {
      lugaresVistos.add(p.i); guardado.escribir('lugaresVistos', [...lugaresVistos]); fecha('l', p.i, true);
      marcasLugar[p.i].options.visto = true; marcasLugar[p.i].redraw(); confeti(['💮', '✨']); avisar(tr('💮 ¡Escena vivida!'));
    }
    if (ultimo) alPosicion({ coords: { latitude: miPosicion[0], longitude: miPosicion[1] } });
  }
  function empezar() {
    if (!navigator.geolocation) return avisar(tr('Este navegador no da tu ubicación'));
    if (vigia !== null) return;
    vigia = navigator.geolocation.watchPosition(alPosicion, err => { avisar(tr('No he podido saber tu ubicación') + ': ' + tr(err.code === 1 ? 'permiso denegado' : 'sin señal')); if (err.code === 1) parar(); },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 30000 });
    $v('#peregrino-btn')?.classList.add('activo');
    banda.hidden = false; banda.innerHTML = `<div><b>${esc(tr('🚶 Modo peregrino'))}</b><small class="sub">${esc(tr('Buscando dónde estás…'))}</small></div>`;
    guardado.escribir('peregrino', true);
  }
  function parar() {
    if (vigia !== null) navigator.geolocation.clearWatch(vigia);
    vigia = null; banda.hidden = true; $v('#peregrino-btn')?.classList.remove('activo'); guardado.escribir('peregrino', false);
  }
  // Ahorra batería: el GPS solo mientras la app está a la vista
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && vigia !== null) { navigator.geolocation.clearWatch(vigia); vigia = null; }
    else if (!document.hidden && guardado.leer('peregrino', false) && vigia === null) empezar();
  });
  const btn = document.createElement('button'); btn.id = 'peregrino-btn'; btn.className = 'redondo'; btn.textContent = '🚶';
  btn.title = btn.ariaLabel = tr('Modo peregrino: te aviso cuando estés en una escena');
  btn.onclick = () => vigia !== null ? parar() : (empezar(), avisar(tr('🚶 Modo peregrino: te aviso al pisar una escena del anime')));
  $v('#herramientas')?.appendChild(btn);
  if (guardado.leer('peregrino', false)) empezar();

  /* ---------- Mi viaje: lo vivido, con fechas ---------- */
  async function pintarDiario() {
    const caja = $v('#diario');
    let fotos = []; try { fotos = await window.Fotos?.album.todas() || []; } catch {}
    const hechos = [
      ...[...visitados].map(i => ({ ts: fechas['c:' + i] || 0, ico: '💮', txt: tr('Sellaste {n}', { n: CAMPINGS[i].nombre }), sub: CAMPINGS[i].ep, f: CAMPINGS[i].fotos[0], ir: () => { irA('mapa'); abrirFicha(i); } })),
      ...[...lugaresVistos].map(i => ({ ts: fechas['l:' + i] || 0, ico: '📍', txt: tr('Estuviste en {n}', { n: LUGARES[i].n }), sub: LUGARES[i].ep, f: LUGARES[i].f, ir: () => { irA('mapa'); abrirLugar(i, true); } })),
      ...fotos.map(f => ({ ts: f.ts, ico: '📸', txt: tr('Recreaste {n}', { n: f.lugar }), sub: f.verificado ? tr('📍 in situ') : '', blob: f.real })),
    ].sort((a, b) => b.ts - a.ts);
    const vividos = lista.filter(e => vivido(e) > 0), completos = lista.filter(e => vivido(e) && vivido(e) === total(e));
    caja.innerHTML = `<div class="diario-cifras">
        <div><b>${visitados.size}</b><small>${esc(tr('campings sellados'))}</small></div>
        <div><b>${lugaresVistos.size}</b><small>${esc(tr('sitios pisados'))}</small></div>
        <div><b>${fotos.length}</b><small>${esc(tr('escenas recreadas'))}</small></div>
        <div><b>${vividos.length}</b><small>${esc(tr('episodios vividos'))}${completos.length ? ` · ${completos.length} 💮` : ''}</small></div></div>
      <div class="diario-lista"></div>${window.tarjetaTony?.(tr('Mi viaje')) || ''}`;
    const l = caja.querySelector('.diario-lista');
    if (!hechos.length) { l.innerHTML = `<div class="vacio">📔<p>${esc(tr('Tu viaje empieza aquí. Activa 🚶 en el mapa y te aviso cuando pises una escena del anime.'))}</p></div>`; return; }
    let dia = null;
    hechos.forEach(h => {
      const d = h.ts ? new Date(h.ts).toLocaleDateString(document.documentElement.lang || 'es', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : tr('Antes');
      if (d !== dia) { dia = d; const t = document.createElement('h4'); t.className = 'diario-dia'; t.textContent = d; l.appendChild(t); }
      const b = document.createElement('button'); b.className = 'reto';
      const src = h.blob ? URL.createObjectURL(h.blob) : h.f;
      b.innerHTML = `${src ? `<img src="${src}" alt="" loading="lazy" decoding="async">` : `<span class="ico-l">${h.ico}</span>`}<span><b class="jp">${h.ico} ${esc(h.txt)}</b><small class="sub">${esc(h.sub || '')}</small></span>`;
      b.onclick = h.ir || (() => { irA('fotos'); });
      l.appendChild(b);
    });
  }

  window.cerrarRevivir = cerrarRevivir;
  window.Vivir = { pintar, fecha, revivir, verEnMapa, EPISODIOS: lista };
})();
