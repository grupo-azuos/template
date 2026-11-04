#!/bin/sh
set -eu

test "$APP_ENV" = "$1"
test "$NODE_ENV" = production
: "${PUBLIC_DOMAIN:?}" "${DEPLOY_DOMAIN:?}"
test "$PUBLIC_DOMAIN" = "template.$DEPLOY_DOMAIN"
: "${DATABASE_URL:?}" "${VALKEY_URL:?}" "${DATABASE_MIGRATION_URL:?}" "${DEPLOY_DOMAIN:?}" "${APP_EDGE_VPN_IP:?}"
test "$VALKEY_KEY_PREFIX" = "template:$APP_ENV:"
jq -e ' .stage != "mvp" and .database == "postgresql" and .production_deploy_enabled == true ' ../production.json >/dev/null

export APP_NAME=template DEPLOY_ENV="$2"
DEPLOY_NODE_ID="$(docker node inspect self --format '{{.ID}}')"
APP_REVISION="$(git rev-parse --short=12 HEAD)"
export DEPLOY_NODE_ID APP_REVISION
export APP_IMAGE="azuos/template:$DEPLOY_ENV-$APP_REVISION"
export BUILDX_CONFIG=/etc/komodo/buildx BUILDX_BUILDER=azuos-local

docker stack config -c docker/compose.yml >/dev/null
sh docker/build.sh
sh docker/migrate.sh
docker stack deploy --detach=false --resolve-image never -c docker/compose.yml "$APP_NAME-$DEPLOY_ENV"
