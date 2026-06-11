#!/usr/bin/env bash
set -euo pipefail
export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH

# 시크릿(.env)은 레포/소스에 두지 않고 서버에 한 번만 생성해 둔 파일을 사용한다.
ENV_FILE="${DAMOA_ENV_FILE:-/Users/snowykte0426/deploy/secrets/damoa.env}"
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
