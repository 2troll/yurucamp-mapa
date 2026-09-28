// Diálogos para practicar japonés de acampada con las voces de los personajes.
// Son escenas originales de esta web, al estilo del anime (no son diálogos copiados de los episodios).
// Cada línea: [quién, japonés, lectura en kana, español]. «staff» es el personal del sitio (camping, tienda…).
const DIALOGOS = [
  { id: 'recepcion', emoji: '🏕️', titulo: 'En la recepción del camping', ja: 'キャンプ場の受付', lineas: [
    ['staff', 'いらっしゃいませ。ご予約のお名前は？', 'いらっしゃいませ。ごよやくのおなまえは？', 'Bienvenida. ¿A nombre de quién es la reserva?'],
    ['rin', '志摩です。一人で一泊お願いします。', 'しまです。ひとりでいっぱくおねがいします。', 'Shima. Una noche, yo sola.'],
    ['staff', '一泊千五百円です。薪はどうしますか？', 'いっぱくせんごひゃくえんです。まきはどうしますか？', 'Son 1.500 ¥ la noche. ¿Quiere leña?'],
    ['rin', '一束ください。', 'ひとたばください。', 'Un haz, por favor.'],
    ['staff', 'ゴミは分別してくださいね。', 'ごみはぶんべつしてくださいね。', 'Separe la basura, por favor.'],
    ['rin', 'はい、わかりました。', 'はい、わかりました。', 'Sí, entendido.'],
    ['staff', '消灯は九時です。ごゆっくりどうぞ。', 'しょうとうはくじです。ごゆっくりどうぞ。', 'Las luces se apagan a las nueve. Que disfrute.'],
  ] },
  { id: 'konbini', emoji: '🏪', titulo: 'Comprando en el konbini', ja: 'コンビニで買い物', lineas: [
    ['staff', 'いらっしゃいませ。', 'いらっしゃいませ。', 'Bienvenida.'],
    ['nadeshiko', 'すみません、このお弁当をください。', 'すみません、このおべんとうをください。', 'Perdone, quiero este bentō.'],
    ['staff', '温めますか？', 'あたためますか？', '¿Se lo caliento?'],
    ['nadeshiko', 'はい、お願いします！', 'はい、おねがいします！', '¡Sí, por favor!'],
    ['staff', 'お箸は何膳お付けしますか？', 'おはしはなんぜんおつけしますか？', '¿Cuántos pares de palillos le pongo?'],
    ['nadeshiko', '二膳お願いします。友達の分も！', 'にぜんおねがいします。ともだちのぶんも！', 'Dos, por favor. ¡Uno es para mi amiga!'],
    ['staff', 'レジ袋はご利用ですか？', 'れじぶくろはごりようですか？', '¿Quiere bolsa?'],
    ['nadeshiko', 'いりません、エコバッグがあります。', 'いりません、えこばっぐがあります。', 'No, traigo bolsa propia.'],
  ] },
  { id: 'gasolinera', emoji: '⛽', titulo: 'En la gasolinera', ja: 'ガソリンスタンド', lineas: [
    ['staff', 'いらっしゃいませ！レギュラーですか？', 'いらっしゃいませ！れぎゅらーですか？', '¡Bienvenida! ¿Normal?'],
    ['rin', 'はい、満タンでお願いします。', 'はい、まんたんでおねがいします。', 'Sí, lleno, por favor.'],
    ['staff', 'お支払いは現金ですか、カードですか？', 'おしはらいはげんきんですか、かーどですか？', '¿Paga en efectivo o con tarjeta?'],
    ['rin', '現金でお願いします。', 'げんきんでおねがいします。', 'En efectivo.'],
    ['rin', 'あの、この近くにキャンプ場はありますか？', 'あの、このちかくにきゃんぷじょうはありますか？', 'Oiga, ¿hay algún camping cerca?'],
    ['staff', 'この道をまっすぐ行って、二つ目の信号を右です。', 'このみちをまっすぐいって、ふたつめのしんごうをみぎです。', 'Siga recto por esta calle y en el segundo semáforo, a la derecha.'],
    ['rin', '助かります。ありがとうございます。', 'たすかります。ありがとうございます。', 'Me salva la vida. Gracias.'],
  ] },
  { id: 'navi', emoji: '🧭', titulo: 'Discutiendo con el GPS', ja: 'ナビと道案内', lineas: [
    ['chiaki', '次の交差点を左だ！', 'つぎのこうさてんをひだりだ！', '¡En el próximo cruce, a la izquierda!'],
    ['aoi', 'ナビは右って言うてるで。', 'なびはみぎっていうてるで。', 'El GPS dice que a la derecha.'],
    ['chiaki', 'えっ、マジで！？', 'えっ、まじで！？', '¿¡Eh, en serio!?'],
    ['aoi', 'うそやで〜。左で合うてる。', 'うそやで〜。ひだりであうてる。', 'Es broma. A la izquierda está bien.'],
    ['chiaki', 'おい！心臓に悪いわ！', 'おい！しんぞうにわるいわ！', '¡Oye! ¡Casi me da algo!'],
    ['aoi', 'あと三キロで到着やって。', 'あとさんきろでとうちゃくやって。', 'Dice que llegamos en tres kilómetros.'],
  ] },
  { id: 'montaje', emoji: '⛺', titulo: 'Montando las tiendas', ja: 'テントの設営', lineas: [
    ['chiaki', 'よし、テント張るぞ！', 'よし、てんとはるぞ！', '¡Venga, a montar la tienda!'],
    ['nadeshiko', 'ペグ、どこに打てばいい？', 'ぺぐ、どこにうてばいい？', '¿Dónde clavo las piquetas?'],
    ['chiaki', '風上の方からしっかりな！', 'かざかみのほうからしっかりな！', '¡Bien fuertes, empezando por donde sopla el viento!'],
    ['aoi', 'ハンマー、ここに置いとくで。', 'はんまー、ここにおいとくで。', 'Te dejo el martillo aquí.'],
    ['nadeshiko', 'できた〜！', 'できた〜！', '¡Terminado!'],
    ['chiaki', '野クル、設営完了！', 'のくる、せつえいかんりょう！', '¡Club de acampada: campamento montado!'],
  ] },
  { id: 'hoguera', emoji: '🔥', titulo: 'Junto a la hoguera', ja: '焚き火の夜', lineas: [
    ['nadeshiko', '寒くなってきたね。', 'さむくなってきたね。', 'Empieza a hacer frío.'],
    ['rin', '火、もう少し強くしようか。', 'ひ、もうすこしつよくしようか。', '¿Avivamos un poco el fuego?'],
    ['nadeshiko', '薪、足そうか？', 'まき、たそうか？', '¿Echo más leña?'],
    ['rin', 'うん。細いのから入れて。', 'うん。ほそいのからいれて。', 'Sí. Empieza por las ramas finas.'],
    ['nadeshiko', 'わぁ、あったかい〜。星もきれいだね。', 'わぁ、あったかい〜。ほしもきれいだね。', '¡Qué calentito! Y qué estrellas.'],
    ['rin', '…うん。来てよかった。', '…うん。きてよかった。', '…Sí. Me alegro de haber venido.'],
  ] },
  { id: 'tiempo', emoji: '📱', titulo: 'Mensajes sobre el tiempo', ja: '天気の話', lineas: [
    ['ena', 'リン、明日の天気どう？', 'りん、あしたのてんきどう？', 'Rin, ¿qué tiempo hará mañana?'],
    ['rin', '晴れのち曇り。夜は氷点下だって。', 'はれのちくもり。よるはひょうてんかだって。', 'Sol y luego nubes. Por la noche, bajo cero.'],
    ['ena', 'え〜、寒そう。カイロ持った？', 'え〜、さむそう。かいろもった？', '¡Uf, qué frío! ¿Llevas calentadores?'],
    ['rin', '持った。寝袋も冬用。', 'もった。ねぶくろもふゆよう。', 'Sí. Y el saco es de invierno.'],
    ['ena', 'じゃあ、ちくわの写真送るね〜。', 'じゃあ、ちくわのしゃしんおくるね〜。', 'Pues te mando fotos de Chikuwa.'],
    ['rin', 'いらない。…やっぱり送って。', 'いらない。…やっぱりおくって。', 'No hace falta. …Bueno, mándalas.'],
  ] },
  { id: 'onsen', emoji: '♨️', titulo: 'Parada en el onsen', ja: '帰りに温泉', lineas: [
    ['nadeshiko', 'お姉ちゃん、帰りに温泉寄ろうよ！', 'おねえちゃん、かえりにおんせんよろうよ！', '¡Hermana, paremos en un onsen a la vuelta!'],
    ['sakura', 'いいよ。タオルは持ってる？', 'いいよ。たおるはもってる？', 'Vale. ¿Llevas toalla?'],
    ['nadeshiko', '持ってる！入浴料っていくらかな？', 'もってる！にゅうよくりょうっていくらかな？', '¡Sí! ¿Cuánto costará la entrada?'],
    ['staff', '大人七百円です。券売機でお買い求めください。', 'おとなななひゃくえんです。けんばいきでおかいもとめください。', 'Adultos, 700 ¥. Compre el tique en la máquina.'],
    ['sakura', '湯船にタオルは入れちゃだめだよ。', 'ゆぶねにたおるはいれちゃだめだよ。', 'La toalla no se mete en el agua, ¿eh?'],
    ['nadeshiko', 'はーい！', 'はーい！', '¡Vaaale!'],
  ] },
];

// El tiempo, con la palabra japonesa que lo describe (códigos WMO de Open-Meteo)
function tiempoDe(codigo) {
  if (codigo === 0) return ['☀️', '快晴', 'かいせい', 'despejado'];
  if (codigo <= 2) return ['🌤️', '晴れ', 'はれ', 'soleado'];
  if (codigo === 3) return ['☁️', '曇り', 'くもり', 'nublado'];
  if (codigo <= 48) return ['🌫️', '霧', 'きり', 'niebla'];
  if (codigo <= 57) return ['🌦️', '霧雨', 'きりさめ', 'llovizna'];
  if (codigo <= 67 || (codigo >= 80 && codigo <= 82)) return ['🌧️', '雨', 'あめ', 'lluvia'];
  if (codigo <= 86) return ['❄️', '雪', 'ゆき', 'nieve'];
  return ['⛈️', '雷雨', 'らいう', 'tormenta'];
}
