#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="${BACKUP_DIR}/ilead-${STAMP}.dump"

mkdir -p "${BACKUP_DIR}"
pg_dump "${DATABASE_URL}" --format=custom --no-owner --no-acl --file="${FILE}"
sha256sum "${FILE}" > "${FILE}.sha256"

echo "Backup written to ${FILE}"
