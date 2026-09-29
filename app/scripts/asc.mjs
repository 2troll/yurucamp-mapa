// Cliente mínimo de la API de App Store Connect (JWT ES256 con la clave .p8; sin dependencias).
// Credenciales fuera del repo: ~/.claves/halal-kansai/asc-api.properties (misma cuenta de Apple).
import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { homedir } from 'node:os';

const props = Object.fromEntries(readFileSync(`${homedir()}/.claves/halal-kansai/asc-api.properties`, 'utf8')
  .split('\n').filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
function token() {
  const ahora = Math.floor(Date.now() / 1000);
  const cuerpo = `${b64({ alg: 'ES256', kid: props.keyId, typ: 'JWT' })}.${b64({ iss: props.issuerId, iat: ahora, exp: ahora + 1100, aud: 'appstoreconnect-v1' })}`;
  const firma = createSign('SHA256').update(cuerpo).sign({ key: readFileSync(props.keyPath.replace('~', homedir())), dsaEncoding: 'ieee-p1363' });
  return `${cuerpo}.${firma.toString('base64url')}`;
}
export async function asc(metodo, ruta, datos) {
  const r = await fetch(`https://api.appstoreconnect.apple.com${ruta}`, { method: metodo,
    headers: { authorization: `Bearer ${token()}`, 'content-type': 'application/json' }, body: datos ? JSON.stringify(datos) : undefined });
  const texto = await r.text(); const json = texto ? JSON.parse(texto) : {};
  if (!r.ok) throw new Error(`${metodo} ${ruta} → ${r.status}: ${json.errors?.map(e => e.detail).join('; ') || texto.slice(0, 300)}`);
  return json;
}
export const equipo = props.teamId;
