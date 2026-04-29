#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

BACKUP_FILE="${1:-}"
if [[ -z "${BACKUP_FILE}" ]]; then
  echo "Usage: DATABASE_URL=postgresql://... $0 backups/ilead-YYYYMMDD.dump" >&2
  exit 1
fi

if [[ -f "${BACKUP_FILE}.sha256" ]]; then
  sha256sum --check "${BACKUP_FILE}.sha256"
fi

pg_restore "${BACKUP_FILE}" \
  --dbname="${DATABASE_URL}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl

echo "Restore completed from ${BACKUP_FILE}"
