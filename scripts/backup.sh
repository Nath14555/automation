#!/usr/bin/env bash
###############################################################################
# louna-agent — Encrypted backup of Postgres + Qdrant + n8n data
#
# Backs up:
#   - Postgres dump (pg_dump)
#   - Qdrant snapshot (HTTP API)
#   - n8n credentials/workflows volume
#
# Encrypts with openssl (AES-256-GCM) using BACKUP_ENCRYPTION_KEY from .env,
# uploads to S3-compatible storage (Backblaze B2 by default), keeps last 30 days.
#
# Usage (typically via cron, daily at 02:00):
#   0 2 * * * /home/lounaops/louna-agent/scripts/backup.sh >> /var/log/louna-backup.log 2>&1
###############################################################################

set -Eeuo pipefail

cd "$(dirname "$0")/.."

# Load .env
set -a
# shellcheck disable=SC1091
source .env
set +a

: "${POSTGRES_DB:?missing}"
: "${POSTGRES_USER:?missing}"
: "${POSTGRES_PASSWORD:?missing}"
: "${BACKUP_ENCRYPTION_KEY:?missing}"
: "${BACKUP_S3_BUCKET:?missing}"
: "${BACKUP_S3_ENDPOINT:?missing}"
: "${BACKUP_S3_ACCESS_KEY:?missing}"
: "${BACKUP_S3_SECRET_KEY:?missing}"

DATE_TAG="$(date -u +%Y%m%dT%H%M%SZ)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

log() { printf '\033[1;36m[backup %s]\033[0m %s\n' "$DATE_TAG" "$*"; }

# -----------------------------------------------------------------------------
# Postgres
# -----------------------------------------------------------------------------
log "Dumping Postgres…"
docker compose exec -T postgres \
  pg_dump --clean --if-exists --no-owner --no-privileges \
    -U "$POSTGRES_USER" "$POSTGRES_DB" \
  > "$TMP_DIR/postgres-${DATE_TAG}.sql"

# -----------------------------------------------------------------------------
# Qdrant snapshot (per-collection, then bundled)
# -----------------------------------------------------------------------------
log "Snapshotting Qdrant…"
QDRANT_SNAPSHOT_DIR="$TMP_DIR/qdrant"
mkdir -p "$QDRANT_SNAPSHOT_DIR"
# Trigger a snapshot for the main collection (no-op if collection doesn't exist yet)
docker compose exec -T qdrant \
  sh -c "wget -qO- --header='api-key: ${QDRANT_API_KEY:-}' \
    --post-data='' http://localhost:6333/snapshots" \
  > "$QDRANT_SNAPSHOT_DIR/snapshots-${DATE_TAG}.json" || true

# -----------------------------------------------------------------------------
# n8n volume (rsync-style)
# -----------------------------------------------------------------------------
log "Archiving n8n data volume…"
docker run --rm \
  -v louna-agent_n8n-data:/source:ro \
  -v "$TMP_DIR":/dest \
  alpine sh -c "tar -czf /dest/n8n-${DATE_TAG}.tar.gz -C /source ."

# -----------------------------------------------------------------------------
# Bundle + encrypt
# -----------------------------------------------------------------------------
log "Encrypting backup bundle…"
BUNDLE="$TMP_DIR/louna-agent-${DATE_TAG}.tar.gz"
tar -czf "$BUNDLE" -C "$TMP_DIR" \
  "postgres-${DATE_TAG}.sql" \
  "n8n-${DATE_TAG}.tar.gz" \
  qdrant

ENCRYPTED="${BUNDLE}.enc"
openssl enc -aes-256-gcm -salt -pbkdf2 -iter 200000 \
  -in "$BUNDLE" -out "$ENCRYPTED" \
  -pass pass:"$BACKUP_ENCRYPTION_KEY"

# -----------------------------------------------------------------------------
# Upload to S3-compatible storage (Backblaze B2 etc.)
# -----------------------------------------------------------------------------
log "Uploading to s3://${BACKUP_S3_BUCKET}/…"
docker run --rm \
  -e AWS_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY" \
  -e AWS_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_KEY" \
  -v "$TMP_DIR":/data:ro \
  amazon/aws-cli:latest \
  --endpoint-url "$BACKUP_S3_ENDPOINT" \
  s3 cp "/data/$(basename "$ENCRYPTED")" "s3://${BACKUP_S3_BUCKET}/daily/$(basename "$ENCRYPTED")"

# -----------------------------------------------------------------------------
# Retention: delete encrypted bundles older than 30 days
# -----------------------------------------------------------------------------
log "Pruning bundles older than 30 days…"
docker run --rm \
  -e AWS_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY" \
  -e AWS_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_KEY" \
  amazon/aws-cli:latest \
  --endpoint-url "$BACKUP_S3_ENDPOINT" \
  s3 ls "s3://${BACKUP_S3_BUCKET}/daily/" \
  | awk -v cutoff="$(date -u -d '30 days ago' +%Y-%m-%d)" '$1 < cutoff {print $4}' \
  | while read -r key; do
      [[ -z "$key" ]] && continue
      docker run --rm \
        -e AWS_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY" \
        -e AWS_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_KEY" \
        amazon/aws-cli:latest \
        --endpoint-url "$BACKUP_S3_ENDPOINT" \
        s3 rm "s3://${BACKUP_S3_BUCKET}/daily/$key"
    done

log "Backup complete: $(basename "$ENCRYPTED")"
