#!/usr/bin/env bash
set -euo pipefail
umask 077

if [[ $# -ne 1 || ! "$1" =~ ^sha256:[0-9a-f]{64}$ ]]; then
  echo 'Expected an Admin image digest' >&2
  exit 1
fi

export ADMIN_IMAGE="ghcr.io/routeshare-sep392/admin-web-application@$1"
export AWS_REGION=ap-southeast-1 AWS_PAGER=''
compose=(docker compose --project-name routeshare-admin -f /etc/routeshare/admin/compose.yml)

exec 9>/run/lock/routeshare-admin-deploy.lock
flock -w 30 9
"${compose[@]}" config --quiet

DOCKER_CONFIG=$(mktemp -d)
export DOCKER_CONFIG
trap 'rm -f "$DOCKER_CONFIG/config.json"; rmdir "$DOCKER_CONFIG"' EXIT
credentials=$(aws ssm get-parameter --name /routeshare/production/ghcr-pull \
  --with-decryption --query 'Parameter.Value' --output text)
username=$(jq -er '.username | strings | select(length > 0)' <<< "$credentials")
jq -er '.token | strings | select(length > 0)' <<< "$credentials" |
  docker login ghcr.io --username "$username" --password-stdin
unset credentials

"${compose[@]}" pull admin
"${compose[@]}" up -d --pull never --wait --wait-timeout 90 admin
printf 'Admin ready: %s\n' "$ADMIN_IMAGE"
