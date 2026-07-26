#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  source "$SCRIPT_DIR/.env"
  set +a
fi

if [ -z "${LOGFIRE_TOKEN:-}" ]; then
  echo "⚠️  LOGFIRE_TOKEN is not set. Logfire exporter will be disabled."
  echo "   Set it in $SCRIPT_DIR/.env or export it before running."
fi

docker compose -f "$SCRIPT_DIR/docker-compose.yml" up -d

echo "✅ OTel Collector started"
