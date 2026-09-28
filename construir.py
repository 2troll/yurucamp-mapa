"""Genera un KML limpio (sin capturas) y un CSV con todas las localizaciones de Yuru Camp,
a partir del mapa de fans 'アニメ「ゆるキャン」聖地巡礼 超コンプリートマップ'."""
import xml.etree.ElementTree as ET, re, csv, html
from xml.sax.saxutils import escape

K = '{http://www.opengis.net/kml/2.2}'
FUENTE = 'https://www.google.com/maps/d/viewer?mid=1WnbLDezcJzN_PuP5mXbFdTAL-6fURms'
CAPAS = {'第1期': ('Temporada 1', 'ff0080ff'), '第2期': ('Temporada 2', 'ffb0279c'),
         '第3期': ('Temporada 3', 'ffd18802'), 'へやキャン': ('Heya Camp', 'ff00d7ff'),
         '映画': ('Película (2022)', 'ff3c7d55')}

def capa(nombre_folder):
    for k, v in CAPAS.items():
        if nombre_folder.startswith(k):
            return v
    raise SystemExit(f'Carpeta desconocida: {nombre_folder}')

def texto_limpio(desc):
    desc = re.sub(r'<img[^>]*>', '', desc or '')
    desc = re.sub(r'<br\s*/?>', '\n', desc)
    desc = html.unescape(re.sub(r'<[^>]+>', '', desc))
    return ' '.join(l.strip() for l in desc.splitlines() if l.strip())

filas, carpetas = [], []
for f in ET.parse('fuente-fan.kml').getroot().iter(K + 'Folder'):
    nombre_capa, color = capa(f.findtext(K + 'name'))
    marcas = []
    for p in f.findall(K + 'Placemark'):
        c = p.find('.//' + K + 'coordinates')
        if c is None:
            continue
        lng, lat = map(float, c.text.strip().split()[0].split(',')[:2])
        nombre = p.findtext(K + 'name', '').strip()
        en = texto_limpio(p.findtext(K + 'description'))
        gmaps = f'https://www.google.com/maps/search/?api=1&query={lat:.6f},{lng:.6f}'
        filas.append([nombre_capa, nombre, en, f'{lat:.6f}', f'{lng:.6f}', gmaps])
        desc = (escape(en) + '<br>' if en else '') + f'<a href="{gmaps}">Abrir en Google Maps</a>'
        marcas.append(f'<Placemark><name>{escape(nombre)}</name><description><![CDATA[{desc}]]></description>'
                      f'<styleUrl>#{color}</styleUrl><Point><coordinates>{lng},{lat},0</coordinates></Point></Placemark>')
    carpetas.append(f'<Folder><name>{nombre_capa} ({len(marcas)})</name>{"".join(marcas)}</Folder>')

estilos = ''.join(f'<Style id="{c}"><IconStyle><color>{c}</color><Icon><href>https://maps.google.com/mapfiles/kml/paddle/wht-blank.png</href></Icon></IconStyle></Style>'
                  for _, c in CAPAS.values())
kml = ('<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>'
       '<name>Yuru Camp△ — localizaciones reales</name>'
       f'<description>Temporadas 1-3, Heya Camp y película. Fuente: mapa de fans {FUENTE}</description>'
       f'{estilos}{"".join(carpetas)}</Document></kml>')
open('yurucamp-localizaciones.kml', 'w', encoding='utf-8').write(kml)
with open('yurucamp-localizaciones.csv', 'w', newline='', encoding='utf-8-sig') as fh:
    w = csv.writer(fh); w.writerow(['capa', 'nombre', 'nombre_en', 'lat', 'lng', 'google_maps']); w.writerows(filas)
ET.parse('yurucamp-localizaciones.kml')  # falla en voz alta si el KML no es válido
print(len(filas), 'puntos;', {c: sum(1 for r in filas if r[0] == c) for c, _ in CAPAS.values()})
