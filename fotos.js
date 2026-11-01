// «Foto real»: recrea una escena del anime en el sitio real con la cámara, compárala, guárdala y compártela en el muro.
// El muro (muro/worker.js) solo guarda la foto real; la escena del anime la pone la app desde sus propios archivos.
(() => {
  const MURO = (() => { try { return localStorage.getItem('yc_muro') || ''; } catch { return ''; } })() || 'https://yurucamp-muro.2troll-p.workers.dev';
  const CREDITO = '©あfろ・芳文社／野外活動委員会';
  const $f = s => document.querySelector(s);

  /* ---------- Catálogo de escenas: cada captura del anime que se puede recrear ---------- */
  const ESCENAS = [
    ...CAMPINGS.flatMap((c, i) => c.fotos.map(f => ({ escena: f, lugar: c.nombre, ja: c.ja, lat: c.lat, lng: c.lng, ep: c.ep, camping: i }))),
    ...LUGARES.map((l, i) => l.f && { escena: l.f, lugar: l.n, ja: l.n, lat: l.lat, lng: l.lng, ep: l.ep, lugarI: i }).filter(Boolean),
  ];
  const porEscena = new Map(ESCENAS.map(e => [e.escena, e]));
  const nombreDe = e => e.ja && e.ja !== e.lugar ? `${e.lugar} · ${e.ja}` : e.lugar;

  /* ---------- Álbum local (IndexedDB): las fotos no salen del móvil salvo que las publiques ---------- */
  const db = new Promise((ok, ko) => {
    const r = indexedDB.open('yc-fotos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('album', { keyPath: 'id' });
    r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error);
  });
  const tx = async (modo, f) => { const d = await db; return new Promise((ok, ko) => {
    const t = d.transaction('album', modo), s = t.objectStore('album'), r = f(s);
    t.oncomplete = () => ok(r?.result); t.onerror = () => ko(t.error);
  }); };
  const album = {
    todas: async () => ((await tx('readonly', s => s.getAll())) || []).sort((a, b) => b.ts - a.ts),
    poner: foto => tx('readwrite', s => s.put(foto)),
    quitar: id => tx('readwrite', s => s.delete(id)),
  };
  // Qué escenas ya recreó: rápido de consultar sin abrir IndexedDB
  const hechas = new Set(guardado.leer('escenasHechas', []));

  /* ---------- Utilidades de imagen ---------- */
  const cargarImg = src => new Promise((ok, ko) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = () => ko(new Error('No se pudo cargar ' + src)); i.src = src; });
  const aBlob = (canvas, q = .85) => new Promise((ok, ko) => canvas.toBlob(b => b ? ok(b) : ko(new Error('No se pudo crear la imagen')), 'image/jpeg', q));
  // Recorta la fuente (vídeo o imagen) al encuadre de la escena, como object-fit: cover
  function recortar(fuente, w0, h0, aspecto, ancho = 1280) {
    const c = document.createElement('canvas'); c.width = ancho; c.height = Math.round(ancho / aspecto);
    let sw = w0, sh = w0 / aspecto; if (sh > h0) { sh = h0; sw = h0 * aspecto; }
    c.getContext('2d').drawImage(fuente, (w0 - sw) / 2, (h0 - sh) / 2, sw, sh, 0, 0, c.width, c.height);
    return c;
  }
  // Imagen para compartir: escena arriba, foto real abajo y un pie con el sitio
  async function componer(escenaSrc, realBlob, titulo) {
    const [a, r] = await Promise.all([cargarImg(escenaSrc), cargarImg(URL.createObjectURL(realBlob))]);
    const W = 1080, ha = Math.round(W * a.naturalHeight / a.naturalWidth), hr = Math.round(W * r.naturalHeight / r.naturalWidth), pie = 96;
    const c = document.createElement('canvas'); c.width = W; c.height = ha + hr + pie + 6;
    const g = c.getContext('2d');
    g.fillStyle = '#111'; g.fillRect(0, 0, W, c.height);
    g.drawImage(a, 0, 0, W, ha); g.drawImage(r, 0, ha + 6, W, hr);
    const etiqueta = (txt, y) => { g.font = '700 30px system-ui, sans-serif'; const w = g.measureText(txt).width + 32;
      g.fillStyle = 'rgba(0,0,0,.55)'; g.beginPath(); g.roundRect(20, y, w, 48, 24); g.fill(); g.fillStyle = '#fff'; g.fillText(txt, 36, y + 34); };
    etiqueta('🎬 ' + tr('Anime'), 20); etiqueta('📷 ' + tr('Real'), ha + 26);
    const rtl = document.documentElement.dir === 'rtl'; g.direction = rtl ? 'rtl' : 'ltr'; const x = rtl ? W - 28 : 28;
    g.fillStyle = '#fff'; g.font = '800 34px system-ui, "Hiragino Sans", sans-serif'; g.fillText('⛺ ' + titulo.slice(0, 48), x, ha + hr + 52);
    g.direction = 'ltr'; g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '500 22px system-ui, sans-serif'; g.fillText('ゆるキャン△ 聖地巡礼 · ' + CREDITO, 28, ha + hr + 86);
    URL.revokeObjectURL(r.src);
    return aBlob(c, .88);
  }
  // Compartir: en la app nativa por el plugin (el WebView de Android no tiene Web Share); en el navegador, Web Share o descarga
  async function compartir(blob, texto) {
    const nombre = `yurucamp-${Date.now()}.jpg`, P = window.Capacitor?.Plugins;
    if (window.Capacitor?.isNativePlatform?.() && P?.Share && P?.Filesystem) {
      const b64 = await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.readAsDataURL(blob); });
      const { uri } = await P.Filesystem.writeFile({ path: nombre, data: b64, directory: 'CACHE' });
      return P.Share.share({ title: 'ゆるキャン△', text: texto, files: [uri] });
    }
    const archivo = new File([blob], nombre, { type: 'image/jpeg' });
    if (navigator.canShare?.({ files: [archivo] })) return navigator.share({ files: [archivo], text: texto }).catch(e => { if (e.name !== 'AbortError') throw e; });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000); avisar(tr('💾 Imagen descargada'));
  }

  /* ---------- Comparador «antes/después» que se arrastra ---------- */
  function comparador(animeSrc, realSrc, aspecto) {
    const d = document.createElement('div'); d.className = 'comparar'; d.style.aspectRatio = aspecto || '16 / 9';
    d.innerHTML = `<img class="real" alt="${esc(tr('Foto real'))}" decoding="async" loading="lazy">
      <img class="anime" alt="${esc(tr('Escena del anime'))}" decoding="async" loading="lazy">
      <i class="raya"></i><span class="etq-c izq">🎬</span><span class="etq-c dch">📷</span>
      <input type="range" dir="ltr" min="0" max="100" value="50" aria-label="${esc(tr('Comparar anime y foto real'))}">`;
    d.querySelector('.real').src = realSrc; d.querySelector('.anime').src = animeSrc;
    const r = d.querySelector('input'); r.oninput = () => d.style.setProperty('--x', r.value + '%');
    return d;
  }

  /* ---------- Cámara con la escena superpuesta ---------- */
  let flujo = null, camaraTrasera = true, actual = null, cerca = false;
  const capa = document.createElement('div'); capa.id = 'camara'; capa.hidden = true;
  capa.innerHTML = `
    <header><button class="redondo" data-c="cerrar" aria-label="${esc(tr('Cerrar'))}">✕</button>
      <div class="cam-titulo"><b id="cam-lugar"></b><small id="cam-ayuda">${esc(tr('Encaja el paisaje con la escena y dispara'))}</small></div>
      <button class="redondo" data-c="modo" aria-label="${esc(tr('Cambiar guía'))}">👻</button></header>
    <div class="cam-visor"><div class="cam-marco"><video playsinline muted autoplay></video><img class="cam-fantasma" alt=""><img class="cam-mini" alt=""></div>
      <p class="cam-girar">📱↔ ${esc(tr('Gira el móvil para encuadrar mejor'))}</p><p class="cam-error" hidden></p></div>
    <div class="cam-escenas fino"></div>
    <footer><label class="cam-op" dir="ltr">📷<input type="range" dir="ltr" min="0" max="90" value="45" aria-label="${esc(tr('Transparencia de la escena'))}">🎬</label>
      <div class="cam-botones"><label class="redondo" aria-label="${esc(tr('Elegir de la galería'))}">🖼️<input type="file" accept="image/*" hidden></label>
        <button class="disparador" data-c="disparar" aria-label="${esc(tr('Hacer la foto'))}"></button>
        <button class="redondo" data-c="girar" aria-label="${esc(tr('Cambiar de cámara'))}">🔄</button></div></footer>
    <div class="cam-resultado fino" hidden></div>`;
  document.body.appendChild(capa);
  const video = capa.querySelector('video'), fantasma = capa.querySelector('.cam-fantasma'), mini = capa.querySelector('.cam-mini'), marco = capa.querySelector('.cam-marco');
  const opacidad = capa.querySelector('.cam-op input');
  opacidad.oninput = () => marco.style.setProperty('--op', opacidad.value / 100);
  marco.style.setProperty('--op', .45);
  capa.querySelector('[data-c="modo"]').onclick = e => { const m = marco.classList.toggle('modo-mini'); e.currentTarget.textContent = m ? '▣' : '👻'; };

  async function encenderCamara() {
    apagarCamara();
    const err = capa.querySelector('.cam-error'); err.hidden = true;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('sin cámara');
      flujo = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: camaraTrasera ? 'environment' : 'user', width: { ideal: 1920 }, height: { ideal: 1080 } } });
      video.srcObject = flujo; await video.play().catch(() => {});
    } catch (e) {
      console.warn('[fotos] cámara:', e);
      err.textContent = tr('No puedo abrir la cámara. Da permiso o elige una foto de la galería con 🖼️.'); err.hidden = false;
    }
  }
  function apagarCamara() { flujo?.getTracks().forEach(t => t.stop()); flujo = null; video.srcObject = null; }

  function ponerEscena(e) {
    actual = e;
    $f('#cam-lugar').textContent = nombreDe(e);
    fantasma.src = mini.src = e.escena;
    fantasma.onload = () => marco.style.setProperty('--aspecto', `${fantasma.naturalWidth} / ${fantasma.naturalHeight}`);
    capa.querySelectorAll('.cam-escenas img').forEach(i => i.classList.toggle('sel', i.dataset.e === e.escena));
  }
  // Si estás a menos de 1,5 km del sitio, la foto lleva el sello «📍 in situ»
  function comprobarSitio(e) {
    cerca = false;
    navigator.geolocation?.getCurrentPosition(p => { cerca = km([p.coords.latitude, p.coords.longitude], [e.lat, e.lng]) < 1.5;
      if (cerca) $f('#cam-ayuda').textContent = tr('📍 ¡Estás en el sitio real!'); }, () => {}, { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 });
  }

  function abrir(escenas) {
    const lista = (Array.isArray(escenas) ? escenas : [escenas]).map(s => porEscena.get(s)).filter(Boolean);
    if (!lista.length) return avisar(tr('Este sitio no tiene escena del anime para recrear'));
    const tira = capa.querySelector('.cam-escenas');
    tira.innerHTML = lista.length > 1 ? lista.map(e => `<img src="${e.escena}" data-e="${e.escena}" alt="" decoding="async">`).join('') : '';
    tira.querySelectorAll('img').forEach(i => i.onclick = () => ponerEscena(porEscena.get(i.dataset.e)));
    capa.querySelector('.cam-resultado').hidden = true;
    capa.hidden = false; document.body.classList.add('con-camara');
    ponerEscena(lista[0]); comprobarSitio(lista[0]); encenderCamara();
  }
  function cerrar() {
    apagarCamara(); capa.hidden = true; document.body.classList.remove('con-camara');
    if ($f('#hoja-fotos')?.classList.contains('abierta')) pintar();
  }
  capa.querySelector('[data-c="cerrar"]').onclick = cerrar;
  capa.querySelector('[data-c="girar"]').onclick = () => { camaraTrasera = !camaraTrasera; encenderCamara(); };
  let disparando = false;
  capa.querySelector('[data-c="disparar"]').onclick = async () => {
    if (!video.videoWidth) return avisar(tr('La cámara aún no está lista'));
    if (disparando) return; disparando = true; setTimeout(() => { disparando = false; }, 1200);
    const aspecto = fantasma.naturalWidth / fantasma.naturalHeight || 16 / 9;
    capa.querySelector('.disparador').classList.add('flash'); setTimeout(() => capa.querySelector('.disparador').classList.remove('flash'), 300);
    window.Capacitor?.Plugins?.Haptics?.impact?.({ style: 'MEDIUM' });
    resultado(await aBlob(recortar(video, video.videoWidth, video.videoHeight, aspecto)));
  };
  capa.querySelector('input[type=file]').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      const img = await cargarImg(URL.createObjectURL(f)), aspecto = fantasma.naturalWidth / fantasma.naturalHeight || 16 / 9;
      URL.revokeObjectURL(img.src);
      resultado(await aBlob(recortar(img, img.naturalWidth, img.naturalHeight, aspecto)));
    } catch (err) { console.error(err); avisar(tr('No he podido abrir esa imagen')); }
  };

  async function resultado(real) {
    const e = actual, foto = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), escena: e.escena, lugar: nombreDe(e), ts: Date.now(), real, verificado: cerca };
    try { await album.poner(foto); } catch (err) { console.error(err); avisar(tr('No he podido guardar la foto en el álbum')); }
    const primera = !hechas.size;
    hechas.add(e.escena); guardado.escribir('escenasHechas', [...hechas]);
    confeti(primera ? ['📸', '⛺', '🗻', '✨'] : ['📸', '✨']);
    apagarCamara();
    const r = capa.querySelector('.cam-resultado'); r.hidden = false; r.innerHTML = '';
    const caja = document.createElement('div'); caja.className = 'res-caja';
    caja.innerHTML = `<h3>${esc(tr('¡Escena recreada!'))} ${foto.verificado ? `<span class="etq">${esc(tr('📍 in situ'))}</span>` : ''}</h3>
      <p class="sub">${esc(tr('Arrastra para comparar. Ya está en tu álbum.'))}</p>`;
    caja.appendChild(comparador(e.escena, URL.createObjectURL(real), fantasma.naturalWidth ? `${fantasma.naturalWidth} / ${fantasma.naturalHeight}` : ''));
    const acc = document.createElement('div'); acc.className = 'acciones';
    acc.innerHTML = `<button class="boton grande" data-r="publicar">${esc(tr('🌍 Publicar en el muro'))}</button>
      <button class="boton" data-r="compartir">${esc(tr('📤 Compartir'))}</button><button class="boton" data-r="otra">${esc(tr('🔁 Repetir'))}</button>
      <button class="boton grande" data-r="listo">${esc(tr('✓ Listo'))}</button>`;
    caja.appendChild(acc); r.appendChild(caja);
    acc.querySelector('[data-r="publicar"]').onclick = e => { if (foto.publicado) return avisar(tr('✓ En el muro')); formularioPublicar(foto, caja, e.currentTarget); };
    acc.querySelector('[data-r="compartir"]').onclick = () => compartirFoto(foto);
    acc.querySelector('[data-r="otra"]').onclick = () => { r.hidden = true; encenderCamara(); };
    acc.querySelector('[data-r="listo"]').onclick = cerrar;
  }
  async function compartirFoto(foto) {
    try { await compartir(await componer(foto.escena, foto.real, foto.lugar), `${foto.lugar} — ゆるキャン△ 聖地巡礼 📸`); }
    catch (e) { console.error(e); avisar(tr('No he podido compartir la foto')); }
  }

  /* ---------- Publicar en el muro ---------- */
  function formularioPublicar(foto, dentro, boton) {
    dentro.querySelector('.publicar')?.remove();
    const f = document.createElement('form'); f.className = 'publicar bloque';
    const aceptadas = guardado.leer('normasMuro', false);
    f.innerHTML = `<h4>${esc(tr('🌍 Publicar en el muro'))}</h4>
      <input name="nombre" maxlength="24" placeholder="${esc(tr('Tu nombre o apodo'))}" value="${esc(guardado.leer('nombreMuro', ''))}">
      <textarea name="texto" maxlength="200" rows="2" placeholder="${esc(tr('Cuéntalo (opcional): cuándo fuiste, qué tal…'))}"></textarea>
      ${aceptadas ? '' : `<label class="normas"><input type="checkbox" name="normas" required> ${esc(tr('Es mi foto, no sale nadie sin su permiso y no hay nada ofensivo. Las fotos denunciadas se borran.'))}</label>`}
      <button class="boton grande" type="submit">${esc(tr('Publicar'))}</button>`;
    f.onsubmit = async ev => {
      ev.preventDefault();
      const b = f.querySelector('[type=submit]'); b.disabled = true; b.textContent = tr('Subiendo…');
      const nombre = f.nombre.value.trim(); guardado.escribir('nombreMuro', nombre); guardado.escribir('normasMuro', true);
      try {
        const fd = new FormData();
        fd.append('foto', foto.real, 'real.jpg'); fd.append('escena', foto.escena); fd.append('lugar', foto.lugar);
        fd.append('nombre', nombre); fd.append('texto', f.texto.value.trim()); fd.append('verificado', foto.verificado ? '1' : '0');
        const r = await fetch(MURO + '/posts', { method: 'POST', body: fd, signal: AbortSignal.timeout(30000) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.codigo === 'rafaga' ? tr('Espera un minuto antes de publicar otra foto') : j.codigo === 'cupo' ? tr('Has llegado al máximo de fotos por hoy. ¡Mañana más!') : tr('El muro no ha aceptado la foto. Inténtalo más tarde.'));
        foto.publicado = j.post.id; await album.poner(foto).catch(() => {});
        f.innerHTML = `<p>✅ ${esc(tr('¡Publicada! Ya la puede ver todo el mundo en Fotos → Muro.'))}</p>`;
        if (boton) { boton.disabled = true; boton.textContent = tr('✓ En el muro'); }
        confeti(['🌍', '📸', '🏕️']);
        // El muro se sirve con un minuto de caché: tu foto se ve al momento aunque la lista aún no la traiga
        misPosts.unshift(j.post); guardado.escribir('misPosts', misPosts.slice(0, 30)); muroCache = null;
      } catch (e) {
        console.error('[fotos] publicar:', e);
        b.disabled = false; b.textContent = tr('Reintentar');
        avisar(/Failed to fetch|time|NetworkError|abort/i.test(e.name + e.message) ? tr('Sin conexión: se queda en tu álbum, publícala luego') : e.message);
      }
    };
    dentro.appendChild(f); f.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---------- Hoja «Fotos»: muro, álbum y retos ---------- */
  let seccion = 'muro', muroCache = null, muroCursor = null, turno = 0, urlsAlbum = [];
  const misPosts = guardado.leer('misPosts', []);
  const ocultos = new Set(guardado.leer('muroOcultos', []));
  const fecha = ts => new Date(ts).toLocaleDateString(document.documentElement.lang || 'es', { day: 'numeric', month: 'short', year: 'numeric' });

  function tarjeta(p, realSrc, extra) {
    const e = porEscena.get(p.escena), t = document.createElement('article'); t.className = 'foto-tarj';
    p = { ...p, lugar: e ? nombreDe(e) : p.lugar };
    t.appendChild(comparador(p.escena, realSrc));
    const pie = document.createElement('div'); pie.className = 'foto-pie';
    pie.innerHTML = `<div class="foto-quien"><b>${esc(p.nombre || tr('Campista'))}</b> ${p.verificado ? `<span class="etq">${esc(tr('📍 in situ'))}</span>` : ''}<small class="sub">${fecha(p.ts)}</small></div>
      <div class="jp foto-lugar">⛺ ${esc(p.lugar)}${e?.ep ? ` · <span class="sub">${esc(e.ep)}</span>` : ''}</div>
      ${p.texto ? `<p>${esc(p.texto)}</p>` : ''}<div class="foto-acc"></div>`;
    const acc = pie.querySelector('.foto-acc');
    if (e) { const b = document.createElement('button'); b.className = 'chip'; b.textContent = tr('🗺️ Ver en el mapa'); b.onclick = () => verEnMapa(e); acc.appendChild(b);
      const c = document.createElement('button'); c.className = 'chip'; c.textContent = tr('📸 Recrearla yo'); c.onclick = () => abrir(e.escena); acc.appendChild(c); }
    extra?.(acc);
    t.appendChild(pie); return t;
  }
  function verEnMapa(e) {
    irA('mapa');
    if (e.camping !== undefined) abrirFicha(e.camping);
    else if (e.lugarI !== undefined) window.abrirLugar?.(e.lugarI, true);
  }

  async function pintarMuro(caja, mas) {
    const yo = ++turno;
    if (!mas) { caja.innerHTML = `<p class="sub">${esc(tr('Cargando el muro…'))}</p>`; }
    try {
      if (!muroCache || mas) {
        const r = await fetch(MURO + '/posts' + (mas && muroCursor ? '?cursor=' + encodeURIComponent(muroCursor) : ''), { signal: AbortSignal.timeout(12000) });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const j = await r.json(); muroCursor = j.cursor;
        muroCache = mas ? [...(muroCache || []), ...j.posts] : j.posts;
      }
    } catch (e) {
      console.warn('[fotos] muro:', e);
      if (yo !== turno) return;
      caja.innerHTML = `<p class="sub">${esc(tr('No se puede cargar el muro ahora (¿sin conexión?). Tus fotos siguen en «Mi álbum».'))}</p>`;
      const b = document.createElement('button'); b.className = 'boton grande'; b.textContent = tr('Reintentar'); b.onclick = () => pintarMuro(caja); caja.appendChild(b);
      return;
    }
    if (yo !== turno) return;
    caja.innerHTML = '';
    // Solo escenas que existen en la app; las tuyas recién publicadas, aunque la caché del muro aún no las traiga
    const vistos = new Set(muroCache.map(p => p.id));
    const posts = [...misPosts.filter(p => !vistos.has(p.id)), ...muroCache]
      .filter(p => porEscena.has(p.escena) && !ocultos.has(p.id) && !(p.autor && ocultos.has('a:' + p.autor)));
    if (!posts.length) caja.innerHTML = `<div class="vacio">📸<p>${esc(tr('Aún no hay fotos. ¡Sé la primera persona en recrear una escena!'))}</p></div>`;
    const rej = document.createElement('div'); rej.className = 'rejilla-fotos'; caja.appendChild(rej);
    posts.forEach(p => rej.appendChild(tarjeta(p, `${MURO}/img/${p.id}`, acc => {
      const d = document.createElement('button'); d.className = 'chip'; d.textContent = tr('⚑ Denunciar'); d.title = tr('Denunciar u ocultar');
      d.onclick = async () => {
        ocultos.add(p.id); guardado.escribir('muroOcultos', [...ocultos]); pintarMuro(caja);
        avisar(tr('Gracias. Foto ocultada y denunciada.'));
        fetch(`${MURO}/denunciar/${p.id}`, { method: 'POST' }).catch(() => {});
      };
      const o = document.createElement('button'); o.className = 'chip'; o.textContent = tr('🙈 Ocultar a esta persona');
      o.onclick = () => { ocultos.add('a:' + p.autor); guardado.escribir('muroOcultos', [...ocultos]); pintarMuro(caja); };
      if (misPosts.some(m => m.id === p.id)) acc.append(d); else acc.append(d, ...(p.autor ? [o] : []));
    })));
    if (muroCursor) { const b = document.createElement('button'); b.className = 'boton grande'; b.textContent = tr('Ver más fotos'); b.onclick = () => pintarMuro(caja, true); caja.appendChild(b); }
  }

  async function pintarAlbum(caja) {
    const yo = ++turno;
    let fotos = [];
    try { fotos = await album.todas(); } catch (e) { console.error(e); }
    if (yo !== turno) return;
    urlsAlbum.forEach(u => URL.revokeObjectURL(u)); urlsAlbum = [];
    caja.innerHTML = '';
    if (!fotos.length) { caja.innerHTML = `<div class="vacio">📒<p>${esc(tr('Tu álbum está vacío. Abre un sitio del mapa y pulsa «📸 Recrear escena».'))}</p></div>`; return; }
    const rej = document.createElement('div'); rej.className = 'rejilla-fotos'; caja.appendChild(rej);
    fotos.forEach(f => {
      const url = URL.createObjectURL(f.real); urlsAlbum.push(url);
      const t = tarjeta({ ...f, nombre: tr('Tú') }, url, acc => {
        const c = document.createElement('button'); c.className = 'chip'; c.textContent = tr('📤 Compartir'); c.onclick = () => compartirFoto(f);
        const p = document.createElement('button'); p.className = 'chip'; p.textContent = f.publicado ? tr('✓ En el muro') : tr('🌍 Publicar');
        p.disabled = !!f.publicado; p.onclick = () => formularioPublicar(f, t);
        const b = document.createElement('button'); b.className = 'chip'; b.textContent = tr('🗑️ Borrar');
        b.onclick = async () => { if (b.dataset.seguro) { await album.quitar(f.id); pintarAlbum(caja); } else { b.dataset.seguro = 1; b.textContent = tr('¿Seguro? Toca otra vez'); } };
        acc.append(c, p, b);
      });
      rej.appendChild(t);
    });
  }

  function pintarRetos(caja) {
    turno++;
    // Las más cercanas primero si sabemos dónde estás; si no, los campings primero
    const yo = typeof miPosicion !== 'undefined' && miPosicion;
    const lista = [...ESCENAS].sort((a, b) => yo ? km(yo, [a.lat, a.lng]) - km(yo, [b.lat, b.lng]) : (a.camping === undefined) - (b.camping === undefined));
    const n = ESCENAS.filter(e => hechas.has(e.escena)).length;
    caja.innerHTML = `<p class="sub">${esc(tr('{n} de {t} escenas recreadas', { n, t: ESCENAS.length }))}${yo ? ' · ' + esc(tr('ordenadas por cercanía')) : ''}</p>
      <div class="progreso"><i style="width:${(n / ESCENAS.length * 100).toFixed(1)}%"></i></div><div class="retos"></div>`;
    const r = caja.querySelector('.retos'); let pintadas = 0;
    const mas = () => {
      lista.slice(pintadas, pintadas + 40).forEach(e => {
        const b = document.createElement('button'); b.className = 'reto' + (hechas.has(e.escena) ? ' hecho' : '');
        b.innerHTML = `<img src="${e.escena}" alt="" loading="lazy" decoding="async"><span><b class="jp">${esc(e.lugar)}</b><small class="sub">${esc(e.ep || '')}${yo ? ' · ' + Math.round(km(yo, [e.lat, e.lng])) + ' km' : ''}</small></span>${hechas.has(e.escena) ? '<i>💮</i>' : ''}`;
        b.onclick = () => abrir(e.escena); r.appendChild(b);
      });
      pintadas += 40;
      if (pintadas < lista.length) { const m = document.createElement('button'); m.className = 'boton grande'; m.textContent = tr('Ver más'); m.onclick = () => { m.remove(); mas(); }; r.appendChild(m); }
    };
    mas();
  }

  function pintar() {
    const caja = $f('#fotos'); if (!caja) return;
    document.querySelectorAll('#seg-fotos button').forEach(b => b.classList.toggle('activo', b.dataset.s === seccion));
    $f('#fotos-sub').textContent = tr('{n} escenas recreadas · encaja el anime con la realidad', { n: hechas.size });
    caja.scrollTop = 0;
    if (seccion === 'muro') pintarMuro(caja); else if (seccion === 'album') pintarAlbum(caja); else pintarRetos(caja);
  }
  document.querySelectorAll('#seg-fotos button').forEach(b => b.onclick = () => { seccion = b.dataset.s; pintar(); });

  // Botón «atrás» de Android y Escape
  window.cerrarCamara = () => { if (capa.hidden) return false; cerrar(); return true; };
  addEventListener('keydown', e => { if (e.key === 'Escape') window.cerrarCamara(); });
  window.Fotos = { abrir, pintar, hechas, escenasDe: lugar => ESCENAS.filter(e => e.lugar === lugar).map(e => e.escena) };
})();
