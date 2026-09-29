// Registra el bundle ID y crea/instala el perfil de App Store.  →  node scripts/perfil-ios.mjs
import { asc } from './asc.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
const ID = 'io.github.dostroll.yurucamp', NOMBRE = 'Yurucamp App Store';

let bundle = (await asc('GET', `/v1/bundleIds?filter[identifier]=${ID}`)).data.find(b => b.attributes.identifier === ID);
if (!bundle) bundle = (await asc('POST', '/v1/bundleIds', { data: { type: 'bundleIds', attributes: { identifier: ID, name: 'Yuru Camp Mapa', platform: 'IOS' } } })).data;
console.log('bundle ID:', bundle.id);
const certs = (await asc('GET', '/v1/certificates?filter[certificateType]=DISTRIBUTION,IOS_DISTRIBUTION')).data;
if (!certs.length) throw new Error('No hay certificado de distribución en la cuenta');
const viejos = (await asc('GET', `/v1/profiles?filter[name]=${encodeURIComponent(NOMBRE)}`)).data;
for (const p of viejos) await asc('DELETE', `/v1/profiles/${p.id}`);
const perfil = (await asc('POST', '/v1/profiles', { data: { type: 'profiles', attributes: { name: NOMBRE, profileType: 'IOS_APP_STORE' },
  relationships: { bundleId: { data: { type: 'bundleIds', id: bundle.id } }, certificates: { data: certs.map(c => ({ type: 'certificates', id: c.id })) } } } })).data;
const dir = `${homedir()}/Library/MobileDevice/Provisioning Profiles`; mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/${perfil.attributes.uuid}.mobileprovision`, Buffer.from(perfil.attributes.profileContent, 'base64'));
console.log('perfil instalado:', NOMBRE, perfil.attributes.uuid);
