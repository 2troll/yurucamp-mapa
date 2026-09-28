"""Extrae solo los campings donde acampan en Yuru Camp, con sus capturas del anime,
y genera campings.js para el mapa (campings.html). Las imágenes se guardan en fotos/."""
import xml.etree.ElementTree as ET, re, json, math, os, urllib.request, html

K = '{http://www.opengis.net/kml/2.2}'
# (clave en el nombre del mapa de fans, nombre para mostrar, quién acampa y cuándo)
# Cada camping: claves en el mapa de fans (la 1.ª da la posición), datos del anime y del sitio real.
# Quién/por qué/lección salen de los resúmenes oficiales de cada episodio (yuru-camp.fandom.com).
CAMPINGS = [
 dict(claves=['浩庵キャンプ場'], nombre='Kōan', ja='浩庵キャンプ場', kana='こうあんキャンプじょう', temporada='T1', ep='T1 · ep. 1',
      quien=['rin','nadeshiko'], paisaje=['lago'], fuji=True, estacion='otoño', comida='カレーめん · fideos de curry instantáneos',
      porque='Rin acampa sola en noviembre; Nadeshiko, recién mudada, se duerme en un banco buscando el Fuji del billete de 1.000 ¥.',
      leccion='Un gesto pequeño (compartir unos fideos calientes) puede empezar una amistad.',
      real='Parcelas en la orilla del lago Motosu, con la misma vista del Fuji que el billete de 1.000 ¥. En invierno baja de 0 °C por la noche.',
      palabra=('湖', 'みずうみ', 'lago')),
 dict(claves=['（1－2）ふもとっぱら'], nombre='Fumotoppara', ja='ふもとっぱら', kana='ふもとっぱら', temporada='T1', ep='T1 · ep. 3 y 11-12',
      quien=['rin','nadeshiko','chiaki','aoi','ena'], paisaje=['pradera'], fuji=True, estacion='invierno', comida='鍋 · nabe (olla caliente) y すき焼き en Navidad',
      porque='Nadeshiko aparece por sorpresa para devolverle a Rin los fideos del lago Motosu con un nabe. Luego, la acampada de Navidad de todas.',
      leccion='Devolver un favor con comida hecha por ti es de lo más japonés.',
      real='Una pradera enorme con el Fuji justo delante. Sopla mucho viento: clava bien las piquetas.',
      palabra=('麓', 'ふもと', 'pie de la montaña')),
 dict(claves=['イーストウッドキャンプ場'], nombre='Eastwood', ja='イーストウッドキャンプ場', kana='イーストウッドキャンプじょう', temporada='T1', ep='T1 · ep. 4-5',
      quien=['nadeshiko','chiaki','aoi'], paisaje=['bosque'], fuji=True, estacion='invierno', comida='煮込みカレー · curry guisado',
      porque='Primera acampada de invierno del club (野クル) sin tener todo el equipo.',
      leccion='Se puede acampar barato usando cosas de casa y un poco de ingenio.',
      real='Camping de bosque en Yamanashi. La leña se compra en recepción.',
      palabra=('冬', 'ふゆ', 'invierno')),
 dict(claves=['高ボッチ高原オートサイト'], nombre='Meseta de Takabotchi', ja='高ボッチ高原', kana='たかボッチこうげん', temporada='T1', ep='T1 · ep. 5',
      quien=['rin'], paisaje=['meseta','montaña'], fuji=True, estacion='otoño', comida='スープパスタ · pasta en sopa',
      porque='Rin se va sola en moto a Nagano, el mismo día que el club acampa.',
      leccion='La comida que cocinas tú misma sabe distinta a los fideos instantáneos.',
      real='Se ven el lago Suwa y el Fuji; al amanecer suele haber mar de nubes. La carretera suele cerrarse en invierno: compruébalo.',
      palabra=('高原', 'こうげん', 'meseta')),
 dict(claves=['四尾連湖 水明荘'], nombre='Lago Shibire', ja='四尾連湖 水明荘', kana='しびれこ すいめいそう', temporada='T1', ep='T1 · ep. 6-7',
      quien=['rin','nadeshiko','sakura'], paisaje=['lago','montaña'], fuji=False, estacion='otoño', comida='焼肉 y 鱈鍋 · carne a la parrilla y nabe de bacalao',
      porque='Rin estrena una parrilla compacta y Nadeshiko quiere hacer carne a la parrilla. Sakura, su hermana, las lleva en coche.',
      leccion='La parrilla no prende y un campista veterano les ayuda: pedir ayuda está bien.',
      real='Lago pequeño escondido entre montañas, con la leyenda de un fantasma. El coche se queda en el aparcamiento.',
      palabra=('伝説', 'でんせつ', 'leyenda')),
 dict(claves=['陣馬形山キャンプ場'], nombre='Monte Jinbagata', ja='陣馬形山キャンプ場', kana='じんばがたやまキャンプじょう', temporada='T1', ep='T1 · ep. 9-10',
      quien=['rin','nadeshiko','chiaki'], paisaje=['montaña'], fuji=False, estacion='invierno', comida='—',
      porque='Nadeshiko se resfría y Rin va sola a Kamiina; Nadeshiko y Chiaki le hacen de «navegadoras» por el móvil.',
      leccion='Los planes se tuercen (carreteras cortadas), pero los amigos te guían aunque estén lejos.',
      real='Camping gratuito en la cima, sobre el valle de Ina. Se llega por una carretera de montaña estrecha.',
      palabra=('山頂', 'さんちょう', 'cima')),
 dict(claves=['竜洋海洋公園 オートキャンプ場'], nombre='Ryūyō Kaiyō Kōen', ja='竜洋海洋公園', kana='りゅうようかいようこうえん', temporada='T2', ep='T2 · ep. 2',
      quien=['rin'], paisaje=['mar'], fuji=False, estacion='invierno', comida='—',
      porque='Rin despide el año sola, acampando junto al mar en Shizuoka.',
      leccion='La soledad elegida también es un buen plan de Nochevieja.',
      real='Camping para coches junto al Pacífico, en Iwata.',
      palabra=('海', 'うみ', 'mar')),
 dict(claves=['渚園 キャンプ場'], nombre='Nagisa-en (lago Hamana)', ja='渚園キャンプ場', kana='なぎさえんキャンプじょう', temporada='T2', ep='T2 · ep. 3',
      quien=['rin','nadeshiko'], paisaje=['lago','mar'], fuji=False, estacion='invierno', comida='うなぎ · anguila del lago Hamana',
      porque='Nadeshiko, de visita en casa de su abuela, se presenta por sorpresa donde acampa Rin.',
      leccion='Acampada sorpresa y conversaciones profundas junto al fuego.',
      real='En la orilla del lago Hamana, cerca del gran torii de Bentenjima.',
      palabra=('渚', 'なぎさ', 'orilla')),
 dict(claves=['大間々岬キャンプ場入口','山中湖みさき','大間々岬キャンプ場　管理棟'], nombre='Cabo Ōmama (lago Yamanaka)', ja='大間々岬', kana='おおままみさき', temporada='T2', ep='T2 · ep. 5-6',
      quien=['chiaki','aoi','ena'], paisaje=['lago'], fuji=True, estacion='invierno', comida='—',
      porque='Chiaki, Aoi y Ena planean su propia acampada con onsen y helado.',
      leccion='Hace tanto frío que se les congelan las bebidas y la leña ya no se vende: el invierno se prepara en serio.',
      real='El Fuji al otro lado del lago Yamanaka, uno de los lagos más fríos de la zona en invierno.',
      palabra=('岬', 'みさき', 'cabo')),
 dict(claves=['野田山健康緑地公園'], nombre='Parque Nodayama', ja='野田山健康緑地公園', kana='のだやまけんこうりょくちこうえん', temporada='T2', ep='T2 · ep. 7-8',
      quien=['nadeshiko'], paisaje=['montaña','bosque'], fuji=True, estacion='invierno', comida='ホイル焼き · verduras asadas en papel de aluminio',
      porque='Primera acampada en solitario de Nadeshiko, después de que Rin le enseñe todo.',
      leccion='Estar sola no es estar aislada: acaba compartiendo su cena con dos niños.',
      real='Parque municipal de Fujikawa con zona de cocina (炊事場) cubierta.',
      palabra=('一人', 'ひとり', 'sola')),
 dict(claves=['細野高原ツリーハウス村'], nombre='Hosono Kōgen', ja='細野高原ツリーハウス村', kana='ほそのこうげんツリーハウスむら', temporada='T2', ep='T2 · ep. 10',
      quien=['nadeshiko','chiaki','aoi','ena','toba'], paisaje=['meseta','bosque'], fuji=False, estacion='invierno', comida='—',
      porque='Empieza el viaje a Izu en la furgoneta de Toba-sensei.',
      leccion='El camping previsto no se puede usar: hay que improvisar un plan B.',
      real='Meseta de Higashi-Izu, famosa en otoño por sus campos de susuki (hierba plateada).',
      palabra=('村', 'むら', 'aldea')),
 dict(claves=['キャンプ黄金崎'], nombre='Camp Koganezaki', ja='キャンプ黄金崎', kana='キャンプこがねざき', temporada='T2', ep='T2 · ep. 11',
      quien=['nadeshiko','chiaki','aoi','ena','toba','rin'], paisaje=['mar'], fuji=False, estacion='invierno', comida='Cena casera de Nadeshiko y Aoi',
      porque='El camping alternativo en Izu, después del onsen con el atardecer.',
      leccion='Un plan B puede salir mejor que el plan A.',
      real='En el oeste de Izu; el acantilado de Koganezaki se vuelve dorado al atardecer (de ahí su nombre).',
      palabra=('黄金', 'こがね', 'dorado')),
 dict(claves=['だるま山高原キャンプ場'], nombre='Darumayama Kōgen', ja='だるま山高原キャンプ場', kana='だるまやまこうげんキャンプじょう', temporada='T2', ep='T2 · ep. 12',
      quien=['nadeshiko','chiaki','aoi','ena','toba','rin'], paisaje=['meseta','mar'], fuji=True, estacion='invierno', comida='Tarta del cumpleaños sorpresa',
      porque='Última noche en Izu: cumpleaños sorpresa de Nadeshiko y Aoi.',
      leccion='Celebrar juntas en la naturaleza es el mejor regalo.',
      real='Vista del Fuji por encima de la bahía de Suruga.',
      palabra=('誕生日', 'たんじょうび', 'cumpleaños')),
 dict(claves=['精進レークサイドキャンプ場'], nombre='Shōji Lakeside', ja='精進レークサイドキャンプ場', kana='しょうじレークサイドキャンプじょう', temporada='T3', ep='T3 · ep. 1',
      quien=['rin'], paisaje=['lago'], fuji=True, estacion='primavera', comida='—',
      porque='Rin recuerda cómo su abuelo la metió en la acampada de niña.',
      leccion='Las aficiones se heredan: el abuelo le regaló su primer equipo.',
      real='El lago Shōji es el más pequeño de los Cinco Lagos del Fuji.',
      palabra=('祖父', 'そふ', 'abuelo')),
 dict(claves=['アプトいちしろキャンプ場'], nombre='Apt Ichishiro', ja='アプトいちしろキャンプ場', kana='アプトいちしろキャンプじょう', temporada='T3', ep='T3 · ep. 3-5',
      quien=['nadeshiko','rin','ayano'], paisaje=['río','montaña'], fuji=False, estacion='primavera', comida='牛まつり · festín de ternera y hoguera',
      porque='Nadeshiko espera y prepara el campamento mientras Rin y Ayano sufren la carretera de Hatanagi en moto.',
      leccion='Tener todo listo para las amigas cansadas también es cuidar de ellas.',
      real='Junto al ferrocarril del Ōigawa, donde el tren sube con cremallera (sistema Abt, アプト式).',
      palabra=('吊り橋', 'つりばし', 'puente colgante')),
 dict(claves=['みずがき山自然公園 キャンプ場'], nombre='Mizugakiyama', ja='みずがき山自然公園', kana='みずがきやましぜんこうえん', temporada='T3', ep='T3 · ep. 7-8',
      quien=['chiaki','aoi','ena'], paisaje=['montaña','bosque'], fuji=False, estacion='primavera', comida='めしテロ · «terrorismo gastronómico»',
      porque='«Bus-camp»: Chiaki, Aoi y Ena van en autobús mientras Nadeshiko está en el Ōigawa.',
      leccion='¿Verdad o exageración? Contar la acampada también forma parte de la acampada.',
      real='Bajo las rocas de granito del monte Mizugaki, uno de los 100 montes famosos de Japón.',
      palabra=('自然', 'しぜん', 'naturaleza')),
 dict(claves=['大柳川渓流 キャンプ場'], nombre='Garganta Ōyanagawa', ja='大柳川渓流キャンプ場', kana='おおやなぎがわけいりゅうキャンプじょう', temporada='T3', ep='T3 · ep. 9',
      quien=['rin'], paisaje=['río','bosque'], fuji=False, estacion='primavera', comida='—',
      porque='Rin vuelve a acampar sola después de mucho tiempo, en plena época de cerezos.',
      leccion='Volver a lo que te gusta después de una temporada sin hacerlo.',
      real='Garganta de Fujikawa con cascadas y puentes colgantes.',
      palabra=('渓流', 'けいりゅう', 'arroyo de montaña')),
 dict(claves=['佐野川河川公園'], nombre='Río Sanogawa', ja='佐野川河川公園', kana='さのがわかせんこうえん', temporada='T3', ep='T3 · ep. 10',
      quien=['chiaki'], paisaje=['río'], fuji=False, estacion='primavera', comida='—',
      porque='Chiaki prueba por fin la acampada en solitario.',
      leccion='Hasta la líder del club necesita probar a estar sola.',
      real='Orilla de río en Nanbu, el pueblo de Nadeshiko.',
      palabra=('川', 'かわ', 'río')),
 dict(claves=['夢見る河口湖'], nombre='Kawaguchiko Tozawa', ja='夢見る河口湖 コテージ戸沢センター', kana='ゆめみるかわぐちこ', temporada='Película', ep='Película (2022)',
      quien=['rin','nadeshiko','chiaki','aoi','ena'], paisaje=['lago','bosque'], fuji=True, estacion='verano', comida='—',
      porque='De mayores, las cinco se reúnen para construir un camping.',
      leccion='Los sueños de instituto pueden hacerse realidad de mayores.',
      real='Cabañas y camping junto al lago Kawaguchi.',
      palabra=('夢', 'ゆめ', 'sueño')),
 dict(claves=['みのぶ自然の里キャンプ場'], nombre='Minobu Shizen no Sato', ja='みのぶ自然の里', kana='みのぶしぜんのさと', temporada='Película', ep='Película (2022)',
      quien=['rin','nadeshiko','chiaki','aoi','ena'], paisaje=['montaña','bosque'], fuji=False, estacion='verano', comida='—',
      porque='Aparece en la película de las chicas ya adultas.',
      leccion='Volver al pueblo donde todo empezó.',
      real='Camping de montaña en Minobu.',
      palabra=('里', 'さと', 'pueblo natal')),
 dict(claves=['芦安キャンプサイト'], nombre='Ashiyasu', ja='芦安キャンプサイト', kana='あしやすキャンプサイト', temporada='Película', ep='Película (2022)',
      quien=['rin','nadeshiko','chiaki','aoi','ena'], paisaje=['montaña','río'], fuji=False, estacion='verano', comida='—',
      porque='Aparece en la película de las chicas ya adultas.',
      leccion='Los amigos de siempre siguen ahí.',
      real='Camping de montaña en Minami-Alps, puerta de los Alpes del Sur.',
      palabra=('友達', 'ともだち', 'amigos')),
]

def distancia_km(a, b):
    dy = (a[0] - b[0]) * 111
    dx = (a[1] - b[1]) * 111 * math.cos(math.radians(a[0]))
    return math.hypot(dx, dy)

marcas = []
for p in ET.parse('fuente-fan.kml').getroot().iter(K + 'Placemark'):
    c = p.find('.//' + K + 'coordinates')
    if c is None:
        continue
    lng, lat = map(float, c.text.strip().split(',')[:2])
    d = p.findtext(K + 'description') or ''
    fotos = [u.split('?')[0] for u in re.findall(r'src="(https://mymaps[^"]+)"', d)]
    ep = re.match(r'（(\S+?)）', p.findtext(K + 'name', ''))
    marcas.append({'nombre': p.findtext(K + 'name', ''), 'lat': lat, 'lng': lng,
                   'ep': ep.group(1) if ep else None, 'fotos': fotos})

os.makedirs('fotos', exist_ok=True)
def bajar(url):
    destino = 'fotos/' + re.sub(r'\W', '', url[-24:]) + '.jpg'
    if not os.path.exists(destino):
        with urllib.request.urlopen(url + '?fife=s1200', timeout=30) as r:
            open(destino, 'wb').write(r.read())
    return destino

salida = []
for c in CAMPINGS:
    principales = []
    for clave in c['claves']:
        m = next((m for m in marcas if clave in m['nombre']), None)
        if m is None:
            raise SystemExit(f'No encuentro el camping: {clave}')
        principales.append(m)
    base = principales[0]
    # Galería: capturas del camping y de escenas del mismo episodio a menos de 2 km
    fotos = [f for m in principales for f in m['fotos']]
    for m in marcas:
        if m not in principales and base['ep'] and m['ep'] == base['ep'] \
                and distancia_km((m['lat'], m['lng']), (base['lat'], base['lng'])) < 2:
            fotos += m['fotos']
    fotos = list(dict.fromkeys(fotos))[:8]
    ficha = {k: v for k, v in c.items() if k != 'claves'}
    # fotos: copias locales; fotos_web: las del mapa de fans, para la versión publicada (no se re-alojan capturas)
    ficha.update(lat=base['lat'], lng=base['lng'], fotos=[bajar(u) for u in fotos], fotos_web=[u + '?fife=s1000' for u in fotos])
    salida.append(ficha)
    print(f"{len(ficha['fotos'])} fotos · {c['nombre']}")

open('campings.js', 'w', encoding='utf-8').write('const CAMPINGS = ' + json.dumps(salida, ensure_ascii=False, indent=1) + ';\n')
