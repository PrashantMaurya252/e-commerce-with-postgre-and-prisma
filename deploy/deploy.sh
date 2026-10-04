#!/usr/bin/env bash
set -Eeuo pipefail
cd /opt/desimarket
exec 9>deploy.lock
flock -n 9 || { echo 'Another deployment is active'; exit 1; }

MODE=${2:-auto}
case "$MODE" in
  auto)
    if [ -f deployment-paused ]; then
      echo 'Automatic deployment is paused. Resume latest using the manual workflow.'
      exit 1
    fi
    NEW_SHA=${1:?Pass the full release SHA}
    ;;
  pin)
    NEW_SHA=${1:?Pass the full release SHA}
    # Fail closed: leave automation paused even if the selected release fails.
    touch deployment-paused
    ;;
  resume)
    test -f latest-release || { echo 'No latest release recorded'; exit 1; }
    NEW_SHA=$(cat latest-release)
    ;;
  *) echo 'Mode must be auto, pin, or resume'; exit 1 ;;
esac
[[ "$NEW_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid release SHA'; exit 1; }
test -f backend.env
test -f settings.env

PREVIOUS_SHA=''
if [ -f current-release ]; then
  PREVIOUS_SHA=$(cat current-release)
  [[ "$PREVIOUS_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid current-release'; exit 1; }
  docker image inspect "desimarket-backend:$PREVIOUS_SHA" >/dev/null
  docker image inspect "desimarket-frontend:$PREVIOUS_SHA" >/dev/null
fi

# Automatic deployment loads newly uploaded images. Manual switching reuses
# retained images without requiring the archive deleted after a successful run.
if [ "$MODE" = auto ]; then
  gzip -dc "incoming/$NEW_SHA/images.tar.gz" | docker load
fi
docker image inspect "desimarket-backend:$NEW_SHA" >/dev/null
docker image inspect "desimarket-frontend:$NEW_SHA" >/dev/null

compose() {
  local sha=$1
  shift
  RELEASE_SHA="$sha" docker compose --env-file settings.env \
    -p desimarket -f compose.prod.yml "$@"
}

check_release() {
  local sha=$1 service cid state health restarts actual_image wanted_image body target
  for service in redis backend frontend; do
    cid=$(compose "$sha" ps -q "$service")
    [ -n "$cid" ] || return 1
    state=$(docker inspect -f '{{.State.Status}}' "$cid")
    health=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{end}}' "$cid")
    [ "$state" = running ] && [ "$health" = healthy ] || return 1
    if [ "$service" != redis ]; then
      restarts=$(docker inspect -f '{{.RestartCount}}' "$cid")
      [ "$restarts" = 0 ] || return 1
      actual_image=$(docker inspect -f '{{.Image}}' "$cid")
      wanted_image=$(docker image inspect -f '{{.Id}}' "desimarket-$service:$sha")
      [ "$actual_image" = "$wanted_image" ] || return 1
    fi
  done
  # Check through published local ports and verify release identity.
  # Replace the public URLs if your domain differs. They must return this release.
  for target in \
    'http://127.0.0.1:5001/health' \
    'http://127.0.0.1:3001/api/health' \
    'https://api.shop.prashantmaurya.online/health' \
    'https://shop.prashantmaurya.online/api/health'; do
    body=$(curl --fail --silent --show-error --max-time 5 "$target") || return 1
    printf '%s' "$body" | python3 -c \
      'import json,sys; d=json.load(sys.stdin); sys.exit(0 if d.get("release")==sys.argv[1] and d.get("status")=="ok" else 1)' \
      "$sha" || return 1
  done
}

rollback() {
  local failure=$?
  trap - ERR INT TERM HUP
  echo 'Deployment failed; restoring the previous healthy images.'
  if [ -n "$PREVIOUS_SHA" ]; then
    if compose "$PREVIOUS_SHA" up -d --no-build --wait --wait-timeout 180 \
      && check_release "$PREVIOUS_SHA"; then
      echo "Rollback healthy: $PREVIOUS_SHA"
    else
      echo 'ROLLBACK FAILED: inspect containers immediately.' >&2
    fi
  else
    echo 'No previous release recorded: automatic rollback is unavailable.' >&2
    # Remove failed app containers, preserving Redis and its volume.
    compose "$NEW_SHA" stop frontend backend || true
  fi
  # Preserve the previous current-release even if rollback itself fails.
  exit "${failure:-1}"
}
trap rollback ERR
trap 'false' INT TERM HUP

compose "$NEW_SHA" up -d --no-build --wait --wait-timeout 180

# Observe for two minutes; a crash/restart or incorrect image fails the release.
for i in {1..12}; do
  check_release "$NEW_SHA"
  sleep 10
done
check_release "$NEW_SHA"

# Atomic last-known-good update, only after health checks pass.
if [ "$MODE" = auto ]; then
  printf '%s\n' "$NEW_SHA" > latest-release.tmp
  mv latest-release.tmp latest-release
fi
if [ -n "$PREVIOUS_SHA" ] && [ "$PREVIOUS_SHA" != "$NEW_SHA" ]; then
  printf '%s\n' "$PREVIOUS_SHA" > previous-release.tmp
  mv previous-release.tmp previous-release
fi
printf '%s\n' "$NEW_SHA" > current-release.tmp
mv current-release.tmp current-release
if [ "$MODE" = resume ]; then
  rm -f deployment-paused
fi
trap - ERR INT TERM HUP
rm -f "incoming/$NEW_SHA/images.tar.gz"
echo "Deployment healthy: $NEW_SHA (mode=$MODE)"
