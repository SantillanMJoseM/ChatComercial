#!/usr/bin/env bash
set -Eeuo pipefail
CONTAINER="${1:-chatcomercial-db}"
OUT_DIR="${2:-/opt/chatcomercial/backups}"
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/chatcomercial_$(date +%Y%m%d_%H%M%S).sql"
docker exec "$CONTAINER" pg_dump -U chat -d chatcomercial > "$FILE"
echo "Backup created: $FILE"