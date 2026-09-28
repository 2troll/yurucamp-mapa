// Voces de los personajes. Tres motores, del mejor al más básico:
//   1. Tu propio clip (grabado o subido en «Personajes»), guardado solo en este navegador (IndexedDB).
//   2. VOICEVOX, motor libre y gratuito de voces anime que corre en el Mac (localhost:50021).
//   3. La voz japonesa del navegador, con tono y velocidad distintos para cada personaje.
// No se usan audios del anime: son de sus actrices de doblaje y no se pueden publicar.

const FICHAS_PJ = {
  rin: {
    color: '#5e9bff', rasgo: 'Tranquila y de pocas palabras. Acampa sola, lee junto al fuego y viaja en su scooter.',
    tono: .95, vel: .92, aivis: [], vv: [['冥鳴ひまり', 'ノーマル'], ['雨晴はう', 'ノーマル']], vvEntonacion: 1, vvTono: -.02, vvVel: .95,
    frases: {
      hola: [['ここ、静かでいいな', 'Aquí se está tranquila.'], ['ソロキャン日和だね', 'Día perfecto para acampar sola.'], ['…ふぅ。火、つけようか', 'Uf… ¿encendemos el fuego?']],
      bien: [['やるじゃん', 'No está nada mal.'], ['うん、正解', 'Sí, correcto.']],
      mal: [['ドンマイ', 'No pasa nada.'], ['まあ、次があるよ', 'Bueno, hay otra.']],
    },
  },
  nadeshiko: {
    color: '#ff8fb1', rasgo: 'Alegre, come muchísimo y se ilusiona con todo. Fue Rin quien la enganchó a acampar.',
    tono: 1.15, vel: 1.02, aivis: [['凛音エル', 'Happy'], ['まお', 'ノーマル']], aivisVel: 1.02, vv: [['春日部つむぎ', 'ノーマル'], ['満別花丸', 'ノーマル']], vvTono: 0, vvVel: 1,
    frases: {
      hola: [['わぁ〜！富士山見えるかな？', '¡Guau! ¿Se verá el Fuji?'], ['お腹すいた〜！何食べよう？', '¡Tengo hambre! ¿Qué comemos?'], ['キャンプだ〜！', '¡De acampada!']],
      bien: [['すごいすごい！', '¡Increíble, increíble!'], ['やったぁ〜！', '¡Bieeen!']],
      mal: [['あれれ〜？', '¿Eh? ¿Y eso?'], ['もう一回やろう！', '¡Otra vez!']],
    },
  },
  chiaki: {
    color: '#ffb340', rasgo: 'Presidenta del 野クル: ruidosa, llena de planes y siempre buscando equipo barato.',
    tono: 1.25, vel: 1.2, aivis: [['まお', 'からかい'], ['まお', 'ノーマル']], aivisVel: 1.06, vv: [['四国めたん', 'ツンツン'], ['ずんだもん', 'ノーマル']], vvTono: .02, vvVel: 1.15,
    frases: {
      hola: [['野クル、出動だ！', '¡El club de acampada entra en acción!'], ['よっしゃ、キャンプだ！', '¡Vamos, a acampar!']],
      bien: [['さすが我が部員！', '¡Así se hace, miembro del club!'], ['よっしゃー！', '¡Toma ya!']],
      mal: [['ぬおお…惜しい！', '¡Aaah… por poco!'], ['ドンマイドンマイ！', '¡Tranqui, tranqui!']],
    },
  },
  aoi: {
    color: '#c79bff', rasgo: 'Cocinera del grupo, habla en dialecto de Kansai y suelta mentiras de broma: «うそやで».',
    tono: 1.12, vel: .86, aivis: [['まお', 'あまあま']], aivisVel: .95, vv: [['九州そら', 'あまあま'], ['四国めたん', 'あまあま']], vvTono: 0, vvVel: .92,
    frases: {
      hola: [['ええとこやなぁ', 'Qué sitio más bonito.'], ['ご飯はうちにまかせて', 'La comida déjamela a mí.']],
      bien: [['ほんまにすごいなぁ', 'De verdad, qué bien.'], ['ええやん', '¡Muy bien!']],
      mal: [['あらら、残念やなぁ', 'Vaya, qué pena.'], ['…うそやで〜', '…¡Es broma!']],
    },
  },
  ena: {
    color: '#7bdcb5', rasgo: 'La amiga relajada de Rin. Le manda fotos de su perro Chikuwa mientras Rin acampa.',
    tono: 1.05, vel: .95, aivis: [['コハク', 'ねむたい'], ['コハク', 'あまあま']], aivisVel: .97, vv: [['雨晴はう', 'ノーマル'], ['春日部つむぎ', 'ノーマル']], vvTono: .01, vvVel: .95,
    frases: {
      hola: [['やっほー', '¡Holaaa!'], ['ちくわも来たがってたよ', 'Chikuwa también quería venir.']],
      bien: [['おー、いいね〜', '¡Oh, qué bien!']],
      mal: [['ありゃ、惜しいね〜', 'Uy, casi.']],
    },
  },
  ayano: {
    color: '#ff6b6b', rasgo: 'Amiga de la infancia de Nadeshiko en Hamamatsu. Llega a todas partes en moto.',
    tono: 1.18, vel: 1.05, aivis: [['花音', 'ノーマル']], aivisVel: 1.02, vv: [['WhiteCUL', 'たのしい'], ['春日部つむぎ', 'ノーマル']], vvTono: 0, vvVel: 1.05,
    frases: {
      hola: [['バイクで来ちゃった', 'He venido en moto.'], ['なでしこ、久しぶり〜', '¡Nadeshiko, cuánto tiempo!']],
      bien: [['やるね〜', '¡Qué máquina!']],
      mal: [['まあまあ、気にしない', 'Bah, no te preocupes.']],
    },
  },
  sakura: {
    color: '#9aa7b8', rasgo: 'Hermana mayor de Nadeshiko: seria, protectora y la que conduce a todas.',
    tono: .85, vel: .93, aivis: [['桜音', 'ノーマル']], aivisVel: .97, vv: [['No.7', 'ノーマル'], ['九州そら', 'ノーマル']], vvTono: -.03, vvVel: .95,
    frases: {
      hola: [['運転は任せて', 'Yo conduzco.'], ['ちゃんと防寒してきた？', '¿Vienes bien abrigada?']],
      bien: [['よくできました', 'Bien hecho.']],
      mal: [['落ち着いて、もう一回', 'Tranquila, otra vez.']],
    },
  },
  toba: {
    color: '#ffd166', rasgo: 'La profesora que acompaña al club con su furgoneta. En clase, muy formal.',
    tono: 1, vel: .9, aivis: [['るな', 'ノーマル']], aivisVel: .96, vv: [['もち子さん', 'ノーマル'], ['四国めたん', 'ノーマル']], vvTono: 0, vvVel: .95,
    frases: {
      hola: [['みなさん、安全第一ですよ', 'Todas: la seguridad es lo primero.'], ['先生も一緒に行きますね', 'Yo también os acompaño.']],
      bien: [['正解です、素晴らしい', 'Correcto, estupendo.']],
      mal: [['惜しいですね、復習しましょう', 'Casi. Vamos a repasar.']],
    },
  },
};
// Voces que no son del grupo: el personal de campings, tiendas y gasolineras
const VOCES_EXTRA = {
  staff: { emoji: '🧑‍💼', nombre: 'Personal', ja: 'スタッフ', color: '#8e9aaf', tono: .9, vel: .95,
    aivis: [['阿井田 茂', 'ノーマル']], aivisVel: 1, vv: [['玄野武宏', 'ノーマル'], ['青山龍星', 'ノーマル']], vvTono: 0, vvVel: 1 },
};
const VOZ_DE = q => FICHAS_PJ[q] || VOCES_EXTRA[q] || FICHAS_PJ.nadeshiko;
const VOCES_SISTEMA = {
  staff: ['Otoya', 'Eddy', 'Reed'],
  rin: ['Kyoko', 'O-Ren', 'Google'], nadeshiko: ['Flo', 'Sandy', 'Google'], chiaki: ['Sandy', 'Shelley', 'Google'],
  aoi: ['Shelley', 'Kyoko'], ena: ['Google', 'Flo'], ayano: ['Sandy', 'Flo'], sakura: ['Kyoko', 'Shelley'], toba: ['Shelley', 'Kyoko'],
};
const MOMENTOS = { hola: '👋 Saludo', bien: '✅ Acierto', mal: '❌ Fallo' };

// Motores locales gratuitos, del más natural al más básico. Los dos hablan la misma API.
const MOTORES = [
  { id: 'aivis', nombre: 'AivisSpeech', url: 'http://127.0.0.1:10101' },
  { id: 'voicevox', nombre: 'VOICEVOX', url: 'http://127.0.0.1:50021' },
];

const Voz = (() => {
  const ajustes = (() => { try { return JSON.parse(localStorage.getItem('yc_voz')) || {}; } catch { return {}; } })();
  const guardarAjustes = () => { try { localStorage.setItem('yc_voz', JSON.stringify(ajustes)); } catch {} };
  // listas: { aivis: [{nombre, estilo, id}], voicevox: [...] } · hablantes: { quien: {motor, id, nombre, estilo} }
  const estado = { listas: {}, hablantes: {}, get voicevox() { return Object.keys(this.listas).length > 0; } };
  const cacheAudio = new Map();
  let alHablar = () => {};

  // ---------- Voz del sistema (último recurso) ----------
  let vocesJa = [];
  const CALIDAD = /premium|enhanced|mejorad|拡張|高品質|neural|natural|siri/i;
  function cargarVoces() {
    const todas = speechSynthesis.getVoices().filter(v => v.lang.replace('_', '-').startsWith('ja'));
    // Las de más calidad primero; las voces de efectos (Grandpa, Rocko…) al final
    const raras = /eddy|grandpa|grandma|reed|rocko|bells|bubbles|jester|organ|whisper|zarvox/i;
    vocesJa = todas.sort((a, b) => (raras.test(a.name) - raras.test(b.name)) || (CALIDAD.test(b.name) - CALIDAD.test(a.name)));
  }
  if ('speechSynthesis' in window) { cargarVoces(); speechSynthesis.addEventListener?.('voiceschanged', cargarVoces); }

  function perfil(quien) {
    const base = VOZ_DE(quien), a = ajustes[quien] || {};
    return { tono: a.tono ?? base.tono, vel: a.vel ?? base.vel };
  }
  function vozSistema(quien) {
    const nombres = VOCES_SISTEMA[quien] || [];
    // Primero una versión «premium/mejorada» del nombre preferido, luego la normal
    for (const n of nombres) { const v = vocesJa.find(v => v.name.startsWith(n) && CALIDAD.test(v.name)); if (v) return v; }
    for (const n of nombres) { const v = vocesJa.find(v => v.name.startsWith(n)); if (v) return v; }
    return vocesJa[0];
  }
  function hablarNavegador(texto, quien) {
    if (!('speechSynthesis' in window)) throw new Error('Tu navegador no puede leer en voz alta');
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto), p = perfil(quien);
    // Subir mucho el tono de una voz del sistema la vuelve robótica: solo un matiz
    u.lang = 'ja-JP'; u.pitch = Math.min(1.2, Math.max(.85, 1 + (p.tono - 1) * .35)); u.rate = Math.min(1.1, Math.max(.85, p.vel));
    const v = vozSistema(quien); if (v) u.voice = v;
    return new Promise(ok => {
      const fin = setTimeout(ok, 2500 + texto.length * 250 / u.rate);
      u.onend = u.onerror = () => { clearTimeout(fin); ok(); };
      speechSynthesis.speak(u);
    });
  }

  // ---------- Motores locales (AivisSpeech / VOICEVOX) ----------
  async function detectarMotores() {
    estado.listas = {};
    await Promise.all(MOTORES.map(async m => {
      try {
        const r = await fetch(m.url + '/speakers', { signal: AbortSignal.timeout(1500) });
        if (!r.ok) return;
        estado.listas[m.id] = (await r.json()).flatMap(s => s.styles.map(st => ({ nombre: s.name, estilo: st.name, id: st.id })));
      } catch {}
    }));
    for (const [quien, f] of Object.entries({ ...FICHAS_PJ, ...VOCES_EXTRA })) estado.hablantes[quien] = elegirHablante(quien, f);
    return estado.voicevox;
  }
  function elegirHablante(quien, f) {
    const buscar = (motor, nombre, estilo) => { const v = estado.listas[motor]?.find(x => x.nombre === nombre && (!estilo || x.estilo === estilo)); return v && { motor, ...v }; };
    // 1) La que eligió el usuario en «Voces»
    const elegida = ajustes[quien]?.voz;
    if (elegida) { const [motor, id] = elegida.split(':'); const v = estado.listas[motor]?.find(x => String(x.id) === id); if (v) return { motor, ...v }; }
    // 2) Las preferidas del personaje, AivisSpeech antes que VOICEVOX
    for (const [nombre, estilo] of f.aivis || []) { const v = buscar('aivis', nombre, estilo); if (v) return v; }
    for (const [nombre, estilo] of f.vv || []) { const v = buscar('voicevox', nombre, estilo); if (v) return v; }
    const motor = Object.keys(estado.listas)[0];
    return motor ? { motor, ...estado.listas[motor][0] } : null;
  }
  async function audioMotor(texto, quien) {
    const h = estado.hablantes[quien]; if (!h) throw new Error('sin hablante');
    const f = VOZ_DE(quien), a = ajustes[quien] || {}, url = MOTORES.find(m => m.id === h.motor).url;
    const clave = `${h.motor}|${h.id}|${texto}|${a.vel ?? ''}|${a.tono ?? ''}`;
    if (cacheAudio.has(clave)) return cacheAudio.get(clave);
    const q = await (await fetch(`${url}/audio_query?speaker=${h.id}&text=${encodeURIComponent(texto)}`, { method: 'POST' })).json();
    ajustarConsulta(q, h.motor, f, a);
    const r = await fetch(`${url}/synthesis?speaker=${h.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) });
    if (!r.ok) throw new Error('síntesis ' + r.status);
    const objeto = URL.createObjectURL(await r.blob());
    cacheAudio.set(clave, objeto);
    return objeto;
  }

  // ---------- Audios ya grabados (audios.js): la misma calidad en el móvil, sin motor ----------
  function grabado(texto, quien) {
    if (typeof AUDIOS === 'undefined') return null;
    const a = ajustes[quien];
    if (a && (a.voz || a.tono != null || a.vel != null)) return null; // voz retocada: hay que sintetizarla
    return AUDIOS[quien + '|' + texto] || null;
  }

  // ---------- Clips propios (IndexedDB, solo en este navegador) ----------
  const bd = new Promise(ok => {
    try {
      const r = indexedDB.open('yurucamp-voces', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('clips');
      r.onsuccess = () => ok(r.result); r.onerror = () => ok(null);
    } catch { ok(null); }
  });
  async function op(modo, fn) {
    const db = await bd; if (!db) return null;
    return new Promise(ok => { try { const t = db.transaction('clips', modo); const r = fn(t.objectStore('clips')); r.onsuccess = () => ok(r.result); r.onerror = () => ok(null); } catch { ok(null); } });
  }
  const clips = {
    leer: k => op('readonly', s => s.get(k)),
    guardar: (k, blob) => op('readwrite', s => s.put(blob, k)),
    borrar: k => op('readwrite', s => s.delete(k)),
    claves: () => op('readonly', s => s.getAllKeys()),
  };

  // Un único reproductor, desbloqueado en el primer toque: Safari de iPhone bloquea el audio que
  // empieza tras una espera (síntesis, IndexedDB) si el elemento no se «activó» dentro de un gesto
  const reproductor = typeof Audio === 'undefined' ? null : new Audio();
  const SILENCIO = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  if (reproductor && typeof addEventListener === 'function') {
    const desbloquear = () => { if (!reproductor.src) { reproductor.src = SILENCIO; reproductor.play().catch(() => {}); } removeEventListener('pointerdown', desbloquear, true); };
    addEventListener('pointerdown', desbloquear, true);
  }
  let finActual = null;
  // Empieza a sonar (si falla, lanza el error) y devuelve una promesa que se cumple al acabar o al cortarse
  async function tocar(url) {
    finActual?.();
    reproductor.src = url;
    await reproductor.play();
    return new Promise(ok => { finActual = ok; reproductor.onended = reproductor.onpause = () => { finActual = null; ok(); }; });
  }
  function parar() { if (reproductor && !reproductor.paused) reproductor.pause(); if ('speechSynthesis' in window) speechSynthesis.cancel(); }

  // Dice un texto con la voz del personaje. `momento` (hola/bien/mal) permite usar un clip propio.
  async function decir(texto, quien = ajustes.guia || 'nadeshiko', { momento, traduccion } = {}) {
    parar();
    alHablar({ texto, quien, traduccion });
    try {
      if (momento) {
        const propio = await clips.leer(`${quien}:${momento}`);
        if (propio) return await tocar(URL.createObjectURL(propio));
      }
      const archivo = grabado(texto, quien);
      if (archivo) return await tocar(archivo);
      if (estado.voicevox) return await tocar(await audioMotor(texto, quien));
    } catch (e) { console.warn('[voces] se usa la voz del sistema:', e); }
    return hablarNavegador(texto, quien);
  }
  // Una frase al azar del personaje para ese momento
  function reaccionar(quien, momento) {
    const lista = FICHAS_PJ[quien]?.frases[momento]; if (!lista) return;
    const [ja, es] = lista[Math.floor(Math.random() * lista.length)];
    return decir(ja, quien, { momento, traduccion: es });
  }

  return {
    decir, reaccionar, parar, clips, estado, ajustes,
    detectarVoicevox: detectarMotores, detectarMotores,
    get guia() { return ajustes.guia || 'nadeshiko'; },
    set guia(q) { ajustes.guia = q; guardarAjustes(); },
    ajustar(quien, campo, valor) { (ajustes[quien] ||= {})[campo] = valor; guardarAjustes(); if (campo === 'voz') estado.hablantes[quien] = elegirHablante(quien, VOZ_DE(quien)); },
    restablecer(quien) { delete ajustes[quien]; guardarAjustes(); estado.hablantes[quien] = elegirHablante(quien, VOZ_DE(quien)); },
    opcion(clave, valor) { ajustes[clave] = valor; guardarAjustes(); },
    perfil, set alHablar(fn) { alHablar = fn; },
  };
})();

// Retoques de la consulta de síntesis; también los usa grabar_voces.mjs para que el móvil suene igual
function ajustarConsulta(q, motor, f, a = {}) {
  const vel = (motor === 'aivis' ? f.aivisVel ?? 1 : f.vvVel) * ((a.vel ?? f.vel) / f.vel);
  q.speedScale = vel;
  if (motor === 'voicevox') { q.pitchScale = f.vvTono + ((a.tono ?? f.tono) - f.tono) * .1; q.intonationScale = f.vvEntonacion ?? 1.1; }
  else { q.intonationScale = f.aivisEstilo ?? 1; } // en AivisSpeech es la fuerza de la emoción
  q.prePhonemeLength = .05; q.postPhonemeLength = .1;
  q.outputSamplingRate = 44100;
  return q;
}
