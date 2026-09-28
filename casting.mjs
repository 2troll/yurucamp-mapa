// Casting de voces: graba la frase típica de cada chica con varias voces candidatas (A, B, C…)
// para compararlas a oído en la app. Genera voces/casting/*.m4a y casting.js.
// Uso: con `aivis` y `voicevox` encendidos →  node casting.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

const ctx = vm.createContext({ window: {}, console, AbortSignal, URL, setTimeout, clearTimeout });
vm.runInContext(fs.readFileSync('voces.js', 'utf8').replace(/^const (\w+) =/gm, 'var $1 ='), ctx);
const { FICHAS_PJ, MOTORES } = ctx;

// Candidatas elegidas por el carácter de cada una en el anime. La A es la voz actual.
const CANDIDATAS = {
  nadeshiko: [['aivis', '凛音エル', 'Happy'], ['voicevox', '春日部つむぎ', 'ノーマル'], ['aivis', '中2', 'ノーマル'], ['aivis', 'わかな', '嬉しい'], ['voicevox', '満別花丸', '元気'], ['aivis', 'まお', 'ふつー']],
  rin: [['voicevox', '冥鳴ひまり', 'ノーマル'], ['aivis', 'コハク', 'ノーマル'], ['voicevox', '雨晴はう', 'ノーマル'], ['voicevox', 'No.7', '読み聞かせ'], ['aivis', 'まお', 'おちつき']],
  chiaki: [['aivis', 'まお', 'からかい'], ['voicevox', '四国めたん', 'ツンツン'], ['voicevox', '九州そら', 'ツンツン'], ['aivis', 'みちのくあいり', '喜び'], ['aivis', 'ほのか', 'uresii_uresii']],
  aoi: [['aivis', 'まお', 'あまあま'], ['voicevox', '九州そら', 'あまあま'], ['voicevox', '四国めたん', 'あまあま'], ['aivis', 'わかな', '普通'], ['voicevox', 'もち子さん', 'ノーマル']],
  ena: [['aivis', 'コハク', 'ねむたい'], ['voicevox', 'もち子さん', 'のんびり'], ['voicevox', '雨晴はう', 'ノーマル'], ['voicevox', '春日部つむぎ', 'ノーマル'], ['aivis', 'まお', 'ふつー']],
  ayano: [['aivis', '花音', 'ノーマル'], ['voicevox', 'WhiteCUL', 'たのしい'], ['aivis', 'ほのか', 'uresii_uresii'], ['voicevox', '満別花丸', 'ノーマル']],
  sakura: [['aivis', '桜音', 'ノーマル'], ['voicevox', 'No.7', 'ノーマル'], ['voicevox', '九州そら', 'ノーマル'], ['voicevox', '四国めたん', 'ノーマル']],
  toba: [['aivis', 'るな', 'ノーマル'], ['voicevox', 'もち子さん', 'ノーマル'], ['voicevox', 'No.7', 'アナウンス'], ['aivis', 'みちのくあいり', '標準']],
};

const listas = {};
for (const m of MOTORES) {
  try { listas[m.id] = (await (await fetch(m.url + '/speakers')).json()).flatMap(s => s.styles.map(st => ({ nombre: s.name, estilo: st.name, id: st.id }))); }
  catch { throw new Error(`${m.nombre} está apagado: enciéndelo con \`${m.id === 'aivis' ? 'aivis' : 'voicevox'}\``); }
}
fs.mkdirSync('voces/casting', { recursive: true });
const CASTING = {};
for (const [quien, cands] of Object.entries(CANDIDATAS)) {
  const [frase, es] = FICHAS_PJ[quien].frases.hola[0];
  CASTING[quien] = { frase, es, voces: [] };
  for (const [n, [motor, nombre, estilo]] of cands.entries()) {
    const v = listas[motor].find(x => x.nombre.startsWith(nombre) && x.estilo === estilo);
    if (!v) throw new Error(`No está instalada: ${motor} ${nombre} (${estilo})`);
    const letra = 'ABCDEF'[n], destino = `voces/casting/${quien}-${letra}.m4a`, url = MOTORES.find(m => m.id === motor).url;
    const q = await (await fetch(`${url}/audio_query?speaker=${v.id}&text=${encodeURIComponent(frase)}`, { method: 'POST' })).json();
    q.outputSamplingRate = 44100; q.prePhonemeLength = .05; q.postPhonemeLength = .1;
    const r = await fetch(`${url}/synthesis?speaker=${v.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) });
    if (!r.ok) throw new Error(`síntesis ${r.status}: ${nombre}`);
    fs.writeFileSync('/tmp/casting.wav', Buffer.from(await r.arrayBuffer()));
    execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '48000', '-c', '1', '/tmp/casting.wav', destino]);
    CASTING[quien].voces.push({ letra, motor, nombre: v.nombre.replace(/[(（].*$/, ''), estilo, f: destino });
    console.log(`${quien} ${letra}: ${nombre} (${estilo})`);
  }
}
fs.writeFileSync('casting.js', '// Generado por casting.mjs. No editar a mano.\nconst CASTING = ' + JSON.stringify(CASTING) + ';\n');
console.log('✓ casting.js');
