#!/usr/bin/env bash
set -euo pipefail
export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH

# 시크릿: CD 가 GitHub Secret(DAMOA_ENV)으로부터 함께 배포한 app.env 를 사용한다.
# (구버전 호환: 그게 없으면 서버에 수동 생성해 둔 파일로 폴백)
DEPLOY_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$DEPLOY_DIR/app.env"
if [ ! -f "$ENV_FILE" ]; then
  ENV_FILE="${DAMOA_ENV_FILE:-/Users/snowykte0426/deploy/secrets/damoa.env}"
fi
if [ ! -f "$ENV_FILE" ]; then
  echo "[application_start] ERROR: env file not found: $ENV_FILE" >&2
  exit 1
fi

# 호스트 docker 의 mysql(3306)/redis(6379)에 host.docker.internal 로 접속.
docker run -d --name damoa-app --restart unless-stopped \
  -p 10102:8080 \
  --add-host host.docker.internal:host-gateway \
  --env-file "$ENV_FILE" \
  damoa-app:latest

echo "[application_start] started damoa-app on host port 10102"
