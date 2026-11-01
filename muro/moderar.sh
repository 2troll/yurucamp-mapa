#!/bin/sh
# Borra un post del muro:  ADMIN=xxx ./moderar.sh <id>   (la clave ADMIN está en ~/.claves/yurucamp/muro-admin)
set -e
[ -n "$1" ] || { echo "uso: $0 <id-del-post>" >&2; exit 1; }
ADMIN=${ADMIN:-$(cat ~/.claves/yurucamp/muro-admin)}
curl -sf -X DELETE -H "authorization: Bearer $ADMIN" "${MURO:-https://yurucamp-muro.2troll-p.workers.dev}/posts/$1"; echo
