// Voces de los personajes. Tres motores, del mejor al más básico:
//   1. Tu propio clip (grabado o subido en «Personajes»), guardado solo en este navegador (IndexedDB).
//   2. VOICEVOX, motor libre y gratuito de voces anime que corre en el Mac (localhost:50021).
//   3. La voz japonesa del navegador, con tono y velocidad distintos para cada personaje.
// No se usan audios del anime: son de sus actrices de doblaje y no se pueden publicar.

const FICHAS_PJ = {
  rin: {
    color: '#5e9bff', rasgo: 'Tranquila y de pocas palabras. Acampa sola, lee junto al fuego y viaja en su scooter.',
    tono: .95, vel: .92, vv: [['冥鳴ひまり', 'ノーマル'], ['雨晴はう', 'ノーマル']], vvTono: -.02, vvVel: .95,
    frases: {
      hola: [['ここ、静かでいいな', 'Aquí se está tranquila.'], ['ソロキャン日和だね', 'Día perfecto para acampar sola.'], ['…ふぅ。火、つけようか', 'Uf… ¿encendemos el fuego?']],
      bien: [['やるじゃん', 'No está nada mal.'], ['うん、正解', 'Sí, correcto.']],
      mal: [['ドンマイ', 'No pasa nada.'], ['まあ、次があるよ', 'Bueno, hay otra.']],
    },
  },
  nadeshiko: {
    color: '#ff8fb1', rasgo: 'Alegre, come muchísimo y se ilusiona con todo. Fue Rin quien la enganchó a acampar.',
    tono: 1.45, vel: 1.08, vv: [['満別花丸', '元気'], ['春日部つむぎ', 'ノーマル']], vvTono: .04, vvVel: 1.08,
    frases: {
      hola: [['わぁ〜！富士山見えるかな？', '¡Guau! ¿Se verá el Fuji?'], ['お腹すいた〜！何食べよう？', '¡Tengo hambre! ¿Qué comemos?'], ['キャンプだ〜！', '¡De acampada!']],
      bien: [['すごいすごい！', '¡Increíble, increíble!'], ['やったぁ〜！', '¡Bieeen!']],
      mal: [['あれれ〜？', '¿Eh? ¿Y eso?'], ['もう一回やろう！', '¡Otra vez!']],
    },
  },
  chiaki: {
    color: '#ffb340', rasgo: 'Presidenta del 野クル: ruidosa, llena de planes y siempre buscando equipo barato.',
    tono: 1.25, vel: 1.2, vv: [['四国めたん', 'ツンツン'], ['ずんだもん', 'ノーマル']], vvTono: .02, vvVel: 1.15,
    frases: {
      hola: [['野クル、出動だ！', '¡El club de acampada entra en acción!'], ['よっしゃ、キャンプだ！', '¡Vamos, a acampar!']],
      bien: [['さすが我が部員！', '¡Así se hace, miembro del club!'], ['よっしゃー！', '¡Toma ya!']],
      mal: [['ぬおお…惜しい！', '¡Aaah… por poco!'], ['ドンマイドンマイ！', '¡Tranqui, tranqui!']],
    },
  },
  aoi: {
    color: '#c79bff', rasgo: 'Cocinera del grupo, habla en dialecto de Kansai y suelta mentiras de broma: «うそやで».',
    tono: 1.12, vel: .86, vv: [['九州そら', 'あまあま'], ['四国めたん', 'あまあま']], vvTono: 0, vvVel: .92,
    frases: {
      hola: [['ええとこやなぁ', 'Qué sitio más bonito.'], ['ご飯はうちにまかせて', 'La comida déjamela a mí.']],
      bien: [['ほんまにすごいなぁ', 'De verdad, qué bien.'], ['ええやん', '¡Muy bien!']],
      mal: [['あらら、残念やなぁ', 'Vaya, qué pena.'], ['…うそやで〜', '…¡Es broma!']],
    },
  },
  ena: {
    color: '#7bdcb5', rasgo: 'La amiga relajada de Rin. Le manda fotos de su perro Chikuwa mientras Rin acampa.',
    tono: 1.05, vel: .95, vv: [['雨晴はう', 'ノーマル'], ['春日部つむぎ', 'ノーマル']], vvTono: .01, vvVel: .95,
    frases: {
      hola: [['やっほー', '¡Holaaa!'], ['ちくわも来たがってたよ', 'Chikuwa también quería venir.']],
      bien: [['おー、いいね〜', '¡Oh, qué bien!']],
      mal: [['ありゃ、惜しいね〜', 'Uy, casi.']],
    },
  },
  ayano: {
    color: '#ff6b6b', rasgo: 'Amiga de la infancia de Nadeshiko en Hamamatsu. Llega a todas partes en moto.',
    tono: 1.18, vel: 1.05, vv: [['WhiteCUL', 'たのしい'], ['春日部つむぎ', 'ノーマル']], vvTono: 0, vvVel: 1.05,
    frases: {
      hola: [['バイクで来ちゃった', 'He venido en moto.'], ['なでしこ、久しぶり〜', '¡Nadeshiko, cuánto tiempo!']],
      bien: [['やるね〜', '¡Qué máquina!']],
      mal: [['まあまあ、気にしない', 'Bah, no te preocupes.']],
    },
  },
  sakura: {
    color: '#9aa7b8', rasgo: 'Hermana mayor de Nadeshiko: seria, protectora y la que conduce a todas.',
    tono: .85, vel: .93, vv: [['No.7', 'ノーマル'], ['九州そら', 'ノーマル']], vvTono: -.03, vvVel: .95,
    frases: {
      hola: [['運転は任せて', 'Yo conduzco.'], ['ちゃんと防寒してきた？', '¿Vienes bien abrigada?']],
      bien: [['よくできました', 'Bien hecho.']],
      mal: [['落ち着いて、もう一回', 'Tranquila, otra vez.']],
    },
  },
  toba: {
    color: '#ffd166', rasgo: 'La profesora que acompaña al club con su furgoneta. En clase, muy formal.',
    tono: 1, vel: .9, vv: [['もち子さん', 'ノーマル'], ['四国めたん', 'ノーマル']], vvTono: 0, vvVel: .95,
    frases: {
      hola: [['みなさん、安全第一ですよ', 'Todas: la seguridad es lo primero.'], ['先生も一緒に行きますね', 'Yo también os acompaño.']],
      bien: [['正解です、素晴らしい', 'Correcto, estupendo.']],
      mal: [['惜しいですね、復習しましょう', 'Casi. Vamos a repasar.']],
    },
  },
};
const VOCES_SISTEMA = {
  rin: ['Kyoko', 'O-Ren', 'Google'], nadeshiko: ['Flo', 'Sandy', 'Google'], chiaki: ['Sandy', 'Shelley', 'Google'],
  aoi: ['Shelley', 'Kyoko'], ena: ['Google', 'Flo'], ayano: ['Sandy', 'Flo'], sakura: ['Kyoko', 'Shelley'], toba: ['Shelley', 'Kyoko'],
};
const MOMENTOS = { hola: '👋 Saludo', bien: '✅ Acierto', mal: '❌ Fallo' };

const Voz = (() => {
  const VV = 'http://127.0.0.1:50021';
  const ajustes = (() => { try { return JSON.parse(localStorage.getItem('yc_voz')) || {}; } catch { return {}; } })();
  const guardarAjustes = () => { try { localStorage.setItem('yc_voz', JSON.stringify(ajustes)); } catch {} };
  const estado = { voicevox: false, hablantes: {}, creditos: new Set() };
  const cacheAudio = new Map();
  let audioActual = null, alHablar = () => {};

  // ---------- Voz del navegador ----------
  let vocesJa = [];
  function cargarVoces() {
    const todas = speechSynthesis.getVoices().filter(v => v.lang.replace('_', '-').startsWith('ja'));
    // Primero las femeninas: casi todo el reparto son chicas
    const masculinas = /otoya|hattori|ichiro|keita|eddy|grandpa|grandma|reed|rocko|男/i;
    vocesJa = [...todas.filter(v => !masculinas.test(v.name)), ...todas.filter(v => masculinas.test(v.name))];
  }
  if ('speechSynthesis' in window) { cargarVoces(); speechSynthesis.addEventListener?.('voiceschanged', cargarVoces); }

  function perfil(quien) {
    const base = FICHAS_PJ[quien] || FICHAS_PJ.nadeshiko, a = ajustes[quien] || {};
    return { tono: a.tono ?? base.tono, vel: a.vel ?? base.vel };
  }
  function hablarNavegador(texto, quien) {
    if (!('speechSynthesis' in window)) throw new Error('Tu navegador no puede leer en voz alta');
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto), p = perfil(quien);
    u.lang = 'ja-JP'; u.pitch = p.tono; u.rate = p.vel;
    // Una voz del sistema distinta para cada chica si existe (macOS/iOS traen Kyoko, Flo, Sandy, Shelley…)
    const pref = (VOCES_SISTEMA[quien] || []).map(n => vocesJa.find(v => v.name.startsWith(n))).find(Boolean);
    if (pref || vocesJa.length) u.voice = pref || vocesJa[0];
    speechSynthesis.speak(u);
  }

  // ---------- VOICEVOX ----------
  async function detectarVoicevox() {
    try {
      const r = await fetch(VV + '/speakers', { signal: AbortSignal.timeout(1500) });
      if (!r.ok) throw 0;
      const lista = await r.json();
      const buscar = (nombre, estilo) => lista.find(s => s.name === nombre)?.styles.find(st => st.name === estilo);
      for (const [quien, f] of Object.entries(FICHAS_PJ)) {
        for (const [nombre, estiloNombre] of f.vv) {
          const st = buscar(nombre, estiloNombre);
          if (st) { estado.hablantes[quien] = { id: st.id, nombre }; break; }
        }
        // Si ninguno de los preferidos está instalado, la primera voz disponible
        if (!estado.hablantes[quien] && lista[0]) estado.hablantes[quien] = { id: lista[0].styles[0].id, nombre: lista[0].name };
      }
      estado.voicevox = true;
    } catch { estado.voicevox = false; }
    return estado.voicevox;
  }
  async function audioVoicevox(texto, quien) {
    const h = estado.hablantes[quien] || estado.hablantes.nadeshiko, f = FICHAS_PJ[quien] || FICHAS_PJ.nadeshiko, a = ajustes[quien] || {};
    const clave = `${h.id}|${texto}|${a.tono ?? ''}|${a.vel ?? ''}`;
    if (cacheAudio.has(clave)) return cacheAudio.get(clave);
    const q = await (await fetch(`${VV}/audio_query?speaker=${h.id}&text=${encodeURIComponent(texto)}`, { method: 'POST' })).json();
    // Los deslizadores del navegador (0,5–2) se trasladan con suavidad a la escala de VOICEVOX
    q.pitchScale = f.vvTono + ((a.tono ?? f.tono) - f.tono) * .1;
    q.speedScale = f.vvVel * ((a.vel ?? f.vel) / f.vel);
    const wav = await (await fetch(`${VV}/synthesis?speaker=${h.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) })).blob();
    const url = URL.createObjectURL(wav);
    cacheAudio.set(clave, url); estado.creditos.add(h.nombre);
    return url;
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

  function tocar(url) {
    if (audioActual) audioActual.pause();
    audioActual = new Audio(url);
    return audioActual.play();
  }
  function parar() { if (audioActual) audioActual.pause(); if ('speechSynthesis' in window) speechSynthesis.cancel(); }

  // Dice un texto con la voz del personaje. `momento` (hola/bien/mal) permite usar un clip propio.
  async function decir(texto, quien = ajustes.guia || 'nadeshiko', { momento, traduccion } = {}) {
    parar();
    alHablar({ texto, quien, traduccion });
    try {
      if (momento) {
        const propio = await clips.leer(`${quien}:${momento}`);
        if (propio) return await tocar(URL.createObjectURL(propio));
      }
      if (estado.voicevox) return await tocar(await audioVoicevox(texto, quien));
    } catch (e) { console.warn('[voces] se usa la voz del navegador:', e); }
    hablarNavegador(texto, quien);
  }
  // Una frase al azar del personaje para ese momento
  function reaccionar(quien, momento) {
    const lista = FICHAS_PJ[quien]?.frases[momento]; if (!lista) return;
    const [ja, es] = lista[Math.floor(Math.random() * lista.length)];
    return decir(ja, quien, { momento, traduccion: es });
  }

  return {
    decir, reaccionar, parar, clips, detectarVoicevox, estado, ajustes,
    get guia() { return ajustes.guia || 'nadeshiko'; },
    set guia(q) { ajustes.guia = q; guardarAjustes(); },
    ajustar(quien, campo, valor) { (ajustes[quien] ||= {})[campo] = valor; guardarAjustes(); },
    restablecer(quien) { delete ajustes[quien]; guardarAjustes(); },
    opcion(clave, valor) { ajustes[clave] = valor; guardarAjustes(); },
    perfil, set alHablar(fn) { alHablar = fn; },
  };
})();
