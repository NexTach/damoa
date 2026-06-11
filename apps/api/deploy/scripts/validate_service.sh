#!/usr/bin/env bash
set -euo pipefail
export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH

# 부팅 대기: 어떤 HTTP 응답이든(401/404 포함) 오면 앱이 떴다고 본다.
for i in $(seq 1 40); do
  code="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:10102/ 2>/dev/null || true)"
  if [ -n "$code" ] && [ "$code" != "000" ]; then
    echo "[validate_service] damoa-app responding (HTTP $code)"
    exit 0
  fi
  sleep 3
done

echo "[validate_service] damoa-app did not respond in time" >&2
docker logs --tail 80 damoa-app 2>&1 || true
exit 1
