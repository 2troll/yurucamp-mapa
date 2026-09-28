"""Saca del mapa de fans los lugares del anime que no son campings (casas, instituto,
bancos de Nadeshiko, estaciones, onsen, miradores…) con su captura, y genera lugares.js.
Las capturas se guardan reducidas a 520 px en lugares/ (Google no deja enlazar las originales)."""
import xml.etree.ElementTree as ET, re, json, os, sys, html, subprocess, urllib.request
from concurrent.futures import ThreadPoolExecutor

K = '{http://www.opengis.net/kml/2.2}'
# Contenido halal: fuera la tienda de bebidas alcohólicas y la taberna
EXCLUIR = re.compile(r'酒|ドリンクショップ|みつえもん')
# Las propias acampadas ya están en campings.js
YA_ESTAN = re.compile(r'キャンプ場|キャンプサイト|オートサイト')
# Puntos de paso sin interés propio (flechas de trayecto en el mapa de fans)
TRAYECTO = re.compile(r'移動|出発|徒歩|走破|分岐|交差点|標識|看板|駐車場|駐輪|踏切|カーブミラー|電柱|ライブカメラ|道路|国道|'
                      r'上り坂|ヘアピン|まで|道のり|遠影|遠景|車窓|中継所|ドリフト|路面|バテる|自販機|配達中|業務中|ストリートビュー|LINE|'
                      r'エイプ|原付で|合流|お別れ|お昼|スタンプ|入口|事務所|管理棟|風が強い|止まってる|河川敷|寝転がる|拝む|見上げる|ガーター|先っちょ')

# (clave, regex del nombre, emoji, nombre en español, palabra japonesa [kanji, kana, español], quién la dice)
CATEGORIAS = [
    ('comida', r'茶屋|食堂|売店|うなぎ|cafe|カフェ|コーヒー|物産|処|道の駅|うえまる|しず花|藤田屋|身延屋|きみくら|梅月|EXPASA|PA', '🍡', 'Comida y paradas', ['食べ物', 'たべもの', 'comida'], 'nadeshiko'),
    ('casa', r'家|自宅|ハイツ|帰宅', '🏠', 'Casas de los personajes', ['家', 'いえ', 'casa'], 'nadeshiko'),
    ('escuela', r'高校|小学校|中学校', '🏫', 'El instituto', ['学校', 'がっこう', 'escuela'], 'toba'),
    ('banco', r'ベンチ', '🪑', 'Bancos donde duerme Nadeshiko', ['ベンチ', 'べんち', 'banco'], 'nadeshiko'),
    ('estacion', r'駅', '🚉', 'Estaciones', ['駅', 'えき', 'estación'], 'rin'),
    ('onsen', r'温泉|の湯|足湯|湯彩香|片倉館', '♨️', 'Onsen y baños', ['温泉', 'おんせん', 'baños termales'], 'sakura'),
    ('templo', r'寺|神社|天神|稲荷|思親閣|報恩閣|本殿|手水舎|大杉|碑', '⛩️', 'Templos y monumentos', ['お寺', 'おてら', 'templo'], 'aoi'),
    ('tienda', r'店|書店|コメリ|オギノ|キャンパル|モリパーク|郵便局|くるみや', '🛒', 'Tiendas', ['店', 'みせ', 'tienda'], 'chiaki'),
    ('fuji', r'富士|展望|パノラマ|見える|夜景|見返|中ノ倉|みはらし|山頂', '🗻', 'Miradores y vistas', ['景色', 'けしき', 'paisaje'], 'rin'),
    ('puente', r'橋', '🌉', 'Puentes', ['橋', 'はし', 'puente'], 'ena'),
    ('naturaleza', r'湖|ダム|峡|海岸|浜|岬|灯台|公園|高原|峰|峠|トンネル|氷穴|牧場|城|山', '🏞️', 'Naturaleza', ['自然', 'しぜん', 'naturaleza'], 'ena'),
]
ESCENA = ('escena', None, '🎬', 'Otras escenas', ['場面', 'ばめん', 'escena'], 'chiaki')
DIGITOS = str.maketrans('０１２３４５６７８９－', '0123456789-')

def episodio(carpeta, codigo):
    if 'へやキャン' in carpeta:
        return 'Heya Camp' + (f' · ep. {codigo[1:]}' if codigo else '')
    if '映画' in carpeta:
        return 'Película'
    t, _, e = (codigo or '').translate(DIGITOS).partition('-')
    return f'T{t} · ep. {e}' if e else f'T{t}'

def reducir(ruta):
    # Google ignora el tamaño pedido: se reduce aquí a 480 px y JPEG ligero para publicar
    if os.path.getsize(ruta) > 70_000:
        subprocess.run(['sips', '-Z', '480', '-s', 'format', 'jpeg', '-s', 'formatOptions', '62', ruta], check=True, capture_output=True)

def bajar(url):
    destino = 'lugares/' + re.sub(r'\W', '', url[-28:]) + '.jpg'
    if not os.path.exists(destino):
        with urllib.request.urlopen(url + '?fife=s520', timeout=40) as r:
            datos = r.read()
        if len(datos) < 1000:
            raise ValueError(f'imagen vacía: {url}')
        open(destino, 'wb').write(datos)
        reducir(destino)
    return destino

raiz = ET.parse('fuente-fan.kml').getroot()
lugares, vistos = [], set()
for carpeta in raiz.iter(K + 'Folder'):
    nombre_carpeta = carpeta.findtext(K + 'name', '')
    for p in carpeta.iter(K + 'Placemark'):
        crudo = p.findtext(K + 'name', '').strip()
        m = re.match(r'[（(]([^）)]+)[）)]\s*(.*)', crudo)
        codigo, nombre = (m.group(1), m.group(2)) if m else (None, crudo)
        if EXCLUIR.search(nombre) or YA_ESTAN.search(nombre) or TRAYECTO.search(nombre):
            continue
        coord = (p.findtext(f'.//{K}coordinates') or '').strip().split(',')
        if len(coord) < 2:
            continue
        lng, lat = float(coord[0]), float(coord[1])
        cat = next((c for c in CATEGORIAS if re.search(c[1], nombre)), ESCENA)
        d = p.findtext(K + 'description') or ''
        fotos = [u.split('?')[0] for u in re.findall(r'src="(https://mymaps[^"]+)"', d)]
        nota = html.unescape(re.sub(r'<[^>]+>', ' ', d)).strip()
        clave = (nombre, round(lat, 4), round(lng, 4))
        if clave in vistos:
            continue
        vistos.add(clave)
        lugares.append({'n': nombre, 'c': cat[0], 'ep': episodio(nombre_carpeta, codigo), 'lat': round(lat, 6), 'lng': round(lng, 6),
                        'nota': nota[:160], 'url': fotos[0] if fotos else None})

os.makedirs('lugares', exist_ok=True)
def con_foto(l):
    try:
        l['f'] = bajar(l['url']) if l['url'] else None
    except Exception as e:
        print(f'⚠️  sin foto: {l["n"]} ({e})', file=sys.stderr)
        l['f'] = None
    del l['url']
    return l
with ThreadPoolExecutor(8) as ex:
    lugares = list(ex.map(con_foto, lugares))

cats = {c[0]: {'emoji': c[2], 'titulo': c[3], 'palabra': c[4], 'voz': c[5]} for c in CATEGORIAS + [ESCENA]}
with open('lugares.js', 'w') as f:
    f.write('// Generado por lugares.py a partir del mapa de fans de Yuru Camp. No editar a mano.\n')
    f.write('const CATEGORIAS_LUGAR = ' + json.dumps(cats, ensure_ascii=False) + ';\n')
    f.write('const LUGARES = ' + json.dumps(lugares, ensure_ascii=False, separators=(',', ':')) + ';\n')

from collections import Counter
print(len(lugares), 'lugares ·', sum(1 for l in lugares if l['f']), 'con foto')
for k, n in Counter(l['c'] for l in lugares).most_common():
    print(f'  {cats[k]["emoji"]} {k}: {n}')
