# Publicar en App Store y Google Play

Todo lo que piden las dos tiendas, ya preparado. Lo único que tienes que hacer tú está marcado con 👤.

## 0. Antes de subir: pruebas (2 min)

```sh
cd ~/projects/yurucamp-mapa
npm test            # datos + recorrido completo como móvil lento en ES/AR/JA/EN
npm run test:app    # lo mismo, pero con exactamente lo que va dentro de la app
node tests/capturas.mjs   # regenera las 64 capturas de tienda/capturas/ (no van al repo)
```

## 1. Google Play

| Requisito | Estado |
|---|---|
| AAB firmado, targetSdk 36 | `cd app && JAVA_HOME=/opt/homebrew/opt/openjdk@21 npm run aab` → `app/android/app/build/outputs/bundle/release/app-release.aab` |
| Clave de subida | `~/.claves/yurucamp/yurucamp.jks` (👤 cópiala al SSD: si la pierdes, no podrás actualizar la app) |
| Icono 512×512 | `iconos/icono-512.png` (original, no usa imágenes del anime) |
| Gráfico destacado 1024×500 | `tienda/capturas/android/grafico-destacado-1024x500.png` |
| Capturas de teléfono (2-8) | `tienda/capturas/android/{es,en,ja}/` 1080×2160 |
| Política de privacidad | https://2troll.github.io/yurucamp-mapa/privacidad.html |
| Versión | versionCode 3 · 1.2 |

👤 **Cuenta personal nueva:** Google exige una prueba cerrada con **12 testers durante 14 días seguidos** antes de poder pedir producción. Sube el AAB a «Prueba cerrada», añade 12 correos (amigos, familia) y espera 14 días.

### Seguridad de los datos (Data safety)
- ¿Recoge o comparte datos de usuario? **No.**
- ¿Cifrado en tránsito? **Sí** (todo va por HTTPS).
- ¿Puede el usuario pedir que se borren? **No aplica** (no se recoge nada; todo vive en el teléfono).
- Ubicación, micrófono y movimiento se usan **solo en el dispositivo** → Google no los cuenta como «recogidos».

### Clasificación de contenido (IARC)
Categoría **Referencia / Educación**. Violencia: no. Sexo: no. Lenguaje soez: no. Drogas/alcohol/tabaco: no. Apuestas: no. Interacción entre usuarios: no. Compras: no. Comparte ubicación con otros: no. → sale **PEGI 3 / Todos**.

### Otros formularios
- Anuncios: **No**. · Acceso a la app: **sin restricciones** (no hay login).
- Público objetivo: **13+** (evita el programa «Diseñado para familias», que exige revisión extra).
- Categoría: **Viajes y guías** (alternativa: Educación).

## 2. App Store

| Requisito | Estado |
|---|---|
| Proyecto Xcode | `app/ios/App/App.xcodeproj` · solo iPhone · iOS 16+ · 1.2 (3) |
| Manifiesto de privacidad | `app/ios/App/App/PrivacyInfo.xcprivacy` (sin rastreo, sin datos) |
| Cifrado | `ITSAppUsesNonExemptEncryption = false` (no hay que rellenar exportación) |
| Textos de permisos | ubicación, micrófono y movimiento en Info.plist |
| Icono 1024 | ya en Assets.xcassets |
| Capturas 6,9" y 6,5" | `tienda/capturas/ios-6.9/` (1320×2868) y `ios-6.5/` (1284×2778) |

👤 **Firmar y subir** (necesita tu Apple Developer, una vez):
```sh
cd ~/projects/yurucamp-mapa/app && npm run ios
open ios/App/App.xcodeproj
# Xcode → target App → Signing & Capabilities → Team: el tuyo
# Product → Archive → Distribute App → App Store Connect → Upload
```

### Privacidad de la app (App Privacy)
«**Data Not Collected**». No hay rastreo.

### Clasificación por edad
Todo «None» → **4+**.

### Notas para el revisor (App Review → Notes)
> Offline guide and Japanese-vocabulary trainer for the real campsites that appear in the anime Yuru Camp△. No login required. Everything works offline except map tiles and weather. Location is optional (sort by distance, Mt. Fuji compass). Microphone is optional (record your own voice clips, stored on device only). Unofficial fan app, free, no ads, no in-app purchases.

## ⚠️ Riesgo aceptado: propiedad intelectual
Se sube con el nombre ゆるキャン△, capturas de escenas del anime y los personajes. Apple (norma **5.2.1**) suele rechazar apps de fans sin permiso del titular, y Google puede retirarla si Houbunsha reclama. Si Apple la rechaza por 5.2, la salida es una versión con nombre propio (p. ej. «Kyanpu: Japan Camp Map»), sin fotogramas y con guías originales.

---

## Textos de la ficha

Límites: nombre 30 · subtítulo 30 · palabras clave 100 · descripción breve (Play) 80 · texto promocional 170.

### Español
- **Nombre:** ゆるキャン△ Mapa
- **Subtítulo (iOS):** Campings del anime y japonés
- **Descripción breve (Play):** Los campings reales del anime, con mapa, japonés para acampar, quiz y sellos.
- **Palabras clave (iOS):** camping,japón,fuji,anime,japonés,vocabulario,peregrinación,yamanashi,mapa,tienda,hoguera
- **Texto promocional (iOS):** Nuevo: logros secretos, estrellas fugaces de noche y el 🎲 que elige tu próximo camping. ¡Agita el móvil!
- **Descripción:**

Recorre los campings reales que aparecen en el anime ゆるキャン△ y aprende el japonés que vas a necesitar allí.

⛺ 21 CAMPINGS Y 451 LUGARES
Del lago Motosu a Izu: cada camping con episodio, qué comen, qué pasó allí, cómo es el sitio real y el tiempo que hace ahora mismo.

🎌 JAPONÉS PARA ACAMPAR
200 palabras con kanji, lectura y audio en voz natural, diálogos de recepción, tienda y onsen, y un repaso diario que te pregunta justo lo que estás a punto de olvidar.

🎯 9 JUEGOS DE QUIZ
Reconoce el camping por la escena, lee el kanji, escucha y elige… con récords y rachas.

🗻 BRÚJULA DEL FUJI
Apunta con el teléfono y te dice hacia dónde queda el Fuji y a cuántos km está.

🏅 PASAPORTE DE SELLOS
Marca los campings que visitas y sube de rango. Y hay logros secretos que no te vamos a contar…

✨ SORPRESAS
Estrellas fugaces por la noche, un dado que elige tu próximo destino (o agita el móvil), sonido de hoguera, hojas que caen según la estación y mucho más.

🔒 Todo funciona sin conexión salvo el mapa de fondo y el tiempo. Sin anuncios, sin cuentas y sin recoger datos.
🌍 En español, inglés, japonés, chino, coreano, francés y árabe.

App de fans no oficial. ゆるキャン△ es obra de あfろ / 芳文社; esta app no tiene relación con los titulares.

### English
- **Name:** Yuru Camp△ Map — ゆるキャン△
- **Subtitle (iOS):** Anime campsites & Japanese
- **Short description (Play):** The real campsites from the anime: map, camping Japanese, quizzes and stamps.
- **Keywords (iOS):** camping,japan,fuji,anime,japanese,vocabulary,pilgrimage,yamanashi,map,tent,campfire,seichi
- **Promotional text (iOS):** New: secret achievements, shooting stars at night and a 🎲 that picks your next campsite. Shake your phone!
- **Description:**

Visit the real campsites from the anime Yuru Camp△ and learn the Japanese you’ll need once you’re there.

⛺ 21 CAMPSITES & 451 PLACES
From Lake Motosu to Izu: each campsite with its episode, what they eat, what happened there, what the real place is like and the weather right now.

🎌 CAMPING JAPANESE
200 words with kanji, reading and natural-voice audio, dialogues for check-in, shops and onsen, and a daily review that asks you exactly what you’re about to forget.

🎯 9 QUIZ GAMES
Guess the campsite from the scene, read the kanji, listen and choose… with high scores and streaks.

🗻 MT. FUJI COMPASS
Point your phone and it tells you where Fuji is and how many km away.

🏅 STAMP PASSPORT
Mark the campsites you visit and rank up. And there are secret achievements we won’t tell you about…

✨ SURPRISES
Shooting stars at night, a die that picks your next destination (or shake your phone), campfire sounds, seasonal falling leaves and more.

🔒 Everything works offline except the base map and weather. No ads, no accounts, no data collected.
🌍 In English, Spanish, Japanese, Chinese, Korean, French and Arabic.

Unofficial fan app. Yuru Camp△ is the work of Afro / Houbunsha; this app is not affiliated with the rights holders.

### 日本語
- **名前:** ゆるキャン△ マップ
- **サブタイトル (iOS):** 聖地のキャンプ場と日本語
- **簡単な説明 (Play):** アニメに登場した実在のキャンプ場を地図で。キャンプの日本語、クイズ、スタンプ帳つき。
- **キーワード (iOS):** キャンプ,聖地巡礼,富士山,アニメ,山梨,地図,キャンプ場,焚き火,ソロキャン,日本語
- **プロモーションテキスト (iOS):** 新機能：ひみつの実績、夜の流れ星、次のキャンプ場を決めるサイコロ🎲。スマホを振ってみて！
- **説明:**

『ゆるキャン△』に登場した実在のキャンプ場をめぐる、非公式ファンアプリです。

⛺ キャンプ場21か所・聖地451か所
本栖湖から伊豆まで。登場話数、食べたもの、その場所の今の天気まで。

🎌 キャンプの日本語
漢字・読み・音声つきの200語と、受付・お店・温泉での会話。忘れかけた言葉を毎日の復習で。

🎯 クイズ9種類 ／ 🗻 富士山コンパス ／ 🏅 スタンプ帳とひみつの実績

✨ 夜の流れ星、行き先を決めるサイコロ（スマホを振ってもOK）、焚き火の音、季節の落ち葉。

🔒 背景地図と天気以外はオフラインで使えます。広告なし・アカウントなし・データ収集なし。

非公式のファンアプリです。『ゆるキャン△』はあfろ／芳文社の作品であり、本アプリは権利者とは関係ありません。
