#!/usr/bin/env bash
set -euo pipefail
export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH

# 기존 컨테이너 정리 (없어도 무시)
docker rm -f damoa-app 2>/dev/null || true
echo "[application_stop] removed old damoa-app (if any)"
