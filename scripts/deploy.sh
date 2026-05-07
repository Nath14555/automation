#!/usr/bin/env bash
###############################################################################
# louna-agent — Deploy / update the running stack on the VPS
#
# Usage (from the repo root, on the VPS):
#   ./scripts/deploy.sh
#
# What it does:
#   1. git pull (fast-forward only — fails if there are local changes)
#   2. docker compose pull (fetch latest images)
#   3. docker compose up -d (recreate any changed services)
#   4. docker compose ps (status check)
#   5. wait for healthchecks
###############################################################################

set -Eeuo pipefail

cd "$(dirname "$0")/.."

log()  { printf '\033[1;36m[deploy]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$*" >&2; exit 1; }

[[ -f .env ]] || die ".env not found. Copy .env.example to .env and fill in values first."

log "Pulling latest code…"
git fetch --all --prune
git pull --ff-only

log "Pulling latest images…"
docker compose pull

log "Recreating containers (changed services only)…"
docker compose up -d --remove-orphans

log "Waiting for healthchecks…"
sleep 5
docker compose ps

log "Done. Tail logs with: docker compose logs -f"
