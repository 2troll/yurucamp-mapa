// Graba de antemano todo lo que dicen los personajes con AivisSpeech (o VOICEVOX) y genera audios.js.
// Así el móvil, que no tiene motor de voz, suena igual de natural que el Mac.
// Uso: arranca los motores (`aivis` y/o `voicevox`) y ejecuta:  node grabar_voces.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

// ---------- Cargar los datos de la web tal cual ----------
const ctx = vm.createContext({ window: {}, console, AbortSignal, URL, setTimeout, clearTimeout });
for (const f of ['campings.js', 'vocabulario.js', 'voces.js', 'anime.js', 'lugares.js']) {
  // `const` de nivel superior no se ve desde fuera del contexto: se expone con var
  vm.runInContext(fs.readFileSync(f, 'utf8').replace(/^const (\w+) =/gm, 'var $1 ='), ctx, { filename: f });
}
const html = fs.readFileSync('index.html', 'utf8');
for (const nombre of ['MOCHILA', 'VOZ_CATEGORIA']) {
  const m = html.match(new RegExp(`const ${nombre} = ([\\s\\S]*?\\n?[\\]}]);\\n`));
  if (!m) throw new Error(`No encuentro ${nombre} en index.html`);
  vm.runInContext(`var ${nombre} = ${m[1]};`, ctx);
}
const { CAMPINGS, VOCABULARIO, FICHAS_PJ, VOCES_EXTRA, DIALOGOS, LUGARES, CATEGORIAS_LUGAR, MOCHILA, VOZ_CATEGORIA, MOTORES, ajustarConsulta } = ctx;

// ---------- Lista de (quién, texto) que la web puede pedir ----------
const pedidos = new Map();
const pedir = (quien, texto) => { if (texto && quien) pedidos.set(quien + '|' + texto, { quien, texto }); };
for (const [q, f] of Object.entries(FICHAS_PJ)) {
  Object.values(f.frases).flat().forEach(([ja]) => pedir(q, ja));
  pedir(q, 'よろしくね！');
}
pedir('nadeshiko', '富士山だ〜！きれい〜！');
DIALOGOS.forEach(d => d.lineas.forEach(([q, ja]) => pedir(q, ja)));
VOCABULARIO.forEach(c => c.palabras.forEach(p => pedir(VOZ_CATEGORIA[c.id], p[0])));
MOCHILA.forEach(s => s.cosas.forEach(([w]) => pedir(s.voz, w)));
CAMPINGS.forEach(c => c.quien.forEach(q => { pedir(q, c.kana); pedir(q, c.palabra[1]); }));
Object.values(CATEGORIAS_LUGAR).forEach(c => pedir(c.voz, c.palabra[0]));
LUGARES.forEach(l => pedir(CATEGORIAS_LUGAR[l.c].voz, l.n.replace(/（.*?）|\(.*?\)/g, '')));

// ---------- Elegir la voz de cada personaje ----------
const listas = {};
for (const m of MOTORES) {
  try {
    const r = await fetch(m.url + '/speakers', { signal: AbortSignal.timeout(3000) });
    listas[m.id] = (await r.json()).flatMap(s => s.styles.map(st => ({ nombre: s.name, estilo: st.name, id: st.id })));
  } catch { console.log(`· ${m.nombre} apagado`); }
}
if (!Object.keys(listas).length) throw new Error('No hay ningún motor encendido: ejecuta `aivis` o `voicevox`');
const hablante = {};
for (const [q, f] of Object.entries({ ...FICHAS_PJ, ...VOCES_EXTRA })) {
  const cands = [...(f.aivis || []).map(c => ['aivis', ...c]), ...(f.vv || []).map(c => ['voicevox', ...c])];
  for (const [motor, nombre, estilo] of cands) {
    const v = listas[motor]?.find(x => x.nombre === nombre && x.estilo === estilo);
    if (v) { hablante[q] = { motor, ...v }; break; }
  }
  if (!hablante[q]) throw new Error(`Ninguna voz instalada para ${q}`);
  console.log(`${q.padEnd(10)} → ${hablante[q].motor}: ${hablante[q].nombre} (${hablante[q].estilo})`);
}

// ---------- Sintetizar y comprimir (AAC en .m4a: lo reproducen Safari, Chrome y Firefox) ----------
fs.mkdirSync('voces', { recursive: true });
const tmp = fs.mkdtempSync('/tmp/voces-');
const AUDIOS = {};
let hechos = 0, nuevos = 0, fallos = 0;
const cola = [...pedidos.values()];
async function trabajar() {
  for (let p; (p = cola.shift());) {
    const h = hablante[p.quien], f = FICHAS_PJ[p.quien] || VOCES_EXTRA[p.quien];
    const huella = crypto.createHash('sha1').update(`${h.motor}|${h.id}|${p.texto}|${f.aivisVel}|${f.vvVel}`).digest('hex').slice(0, 14);
    const destino = `voces/${huella}.m4a`;
    try {
      if (!fs.existsSync(destino)) {
        const url = MOTORES.find(m => m.id === h.motor).url;
        const q = await (await fetch(`${url}/audio_query?speaker=${h.id}&text=${encodeURIComponent(p.texto)}`, { method: 'POST' })).json();
        ajustarConsulta(q, h.motor, f);
        const r = await fetch(`${url}/synthesis?speaker=${h.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q) });
        if (!r.ok) throw new Error(`síntesis ${r.status}`);
        const wav = `${tmp}/${huella}.wav`;
        fs.writeFileSync(wav, Buffer.from(await r.arrayBuffer()));
        execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '48000', '-c', '1', wav, destino]);
        fs.unlinkSync(wav); nuevos++;
      }
      AUDIOS[p.quien + '|' + p.texto] = destino;
    } catch (e) { fallos++; console.error(`✗ ${p.quien}: ${p.texto} (${e.message})`); }
    if (++hechos % 50 === 0) console.log(`${hechos}/${pedidos.size}…`);
  }
}
await Promise.all([trabajar(), trabajar()]);

const creditos = [...new Set(Object.values(hablante).map(h => `${h.motor === 'aivis' ? 'AivisSpeech' : 'VOICEVOX'}:${h.nombre}`))];
fs.writeFileSync('audios.js', '// Generado por grabar_voces.mjs. No editar a mano.\n'
  + `const CREDITOS_VOZ = ${JSON.stringify(creditos)};\n`
  + `const AUDIOS = ${JSON.stringify(AUDIOS, null, 0)};\n`);
console.log(`✓ ${Object.keys(AUDIOS).length} audios (${nuevos} nuevos, ${fallos} fallos) · créditos: ${creditos.join(', ')}`);
if (fallos) process.exit(1);
