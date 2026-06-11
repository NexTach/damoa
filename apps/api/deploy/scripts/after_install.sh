#!/usr/bin/env bash
set -euo pipefail
export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH

DEPLOY_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DEPLOY_DIR"

echo "[after_install] building image damoa-app:latest from $DEPLOY_DIR"
docker build -t damoa-app:latest "$DEPLOY_DIR"
