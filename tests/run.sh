#!/usr/bin/env bash
# 배포 전 점검: 정적 검사 + Firebase 에뮬레이터 실동작 검사 (운영 DB는 건드리지 않음)
# 사용법: bash tests/run.sh          (정적 검사만: node tests/static-check.js)
# 필요: node, python3, java(에뮬레이터), playwright(npm i -g playwright 또는 미리 설치된 것)
set -euo pipefail
cd "$(dirname "$0")/.."

node tests/static-check.js

# 앱이 CDN에서 받는 Firebase SDK를 같은 버전 로컬 사본으로 연결 (처음 한 번만 받음)
CACHE=tests/.cache/firebase
if [ ! -f "$CACHE/package/firebase-app.js" ]; then
  mkdir -p "$CACHE"
  (cd "$CACHE" && npm pack firebase@10.12.0 --silent >/dev/null && tar xzf firebase-10.12.0.tgz && rm -f firebase-10.12.0.tgz)
fi
export FIREBASE_SDK_DIR="$PWD/$CACHE/package"

PORT="${PORT:-8799}"
python3 -m http.server "$PORT" >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null || true' EXIT
export BASE_URL="http://localhost:$PORT"

npx -y firebase-tools@13.29.1 emulators:exec --only auth,database --project eng-trainer-65cac "node tests/e2e.js"
