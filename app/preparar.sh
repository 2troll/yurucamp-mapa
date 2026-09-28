#!/bin/sh
# Copia la web dentro de la app (www/) con Leaflet incluido, para que funcione sin servidor ni CDN.
set -e
cd "$(dirname "$0")"
rm -rf www && mkdir -p www/vendor vendor
for f in index.html campings.js vocabulario.js voces.js anime.js lugares.js audios.js casting.js extras.js manifest.json; do cp "../$f" www/; done
cp -R ../iconos ../voces ../lugares ../fotos-web www/
CDN=https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4
[ -s vendor/leaflet.min.js ] || curl -sfL -o vendor/leaflet.min.js "$CDN/leaflet.min.js"
[ -s vendor/leaflet.min.css ] || curl -sfL -o vendor/leaflet.min.css "$CDN/leaflet.min.css"
cp vendor/leaflet.min.* www/vendor/
sed -i '' "s#$CDN/#vendor/#g" www/index.html
grep -q 'cdnjs' www/index.html && { echo "Quedan enlaces al CDN en www/index.html" >&2; exit 1; }
echo "www listo: $(du -sh www | cut -f1)"
