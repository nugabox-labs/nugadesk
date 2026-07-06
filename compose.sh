#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PROJECT_NAME="nugadesk"

usage() {
  cat <<EOF
사용법: $0 <command> [args]

명령어:
  up              기동 (빌드 포함)
  restart         재기동 (재빌드 포함)
  down            중단
  logs [service] [-f]   로그 확인
  reset           볼륨 포함 초기화 (확인 프롬프트)
  ps              상태 확인
  version         버전 + git 커밋 해시 출력
EOF
}

dc() {
  docker compose -p "$PROJECT_NAME" -f compose.yaml --env-file .env "$@"
}

compute_version_env() {
  APP_VERSION="0.0"
  [[ -f VERSION ]] && APP_VERSION="$(tr -d '[:space:]' < VERSION)"
  APP_GIT_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo no-git)"
  export APP_VERSION APP_GIT_COMMIT
}

print_version() {
  compute_version_env
  echo "version : ${APP_VERSION} (${APP_GIT_COMMIT})"
}

CMD="${1:-}"
[[ $# -gt 0 ]] && shift

case "$CMD" in
  up)
    compute_version_env
    dc up -d --build
    ;;
  restart)
    compute_version_env
    dc up -d --build --force-recreate
    ;;
  down)
    dc down
    ;;
  logs)
    dc logs "$@"
    ;;
  reset)
    read -r -p "정말로 모든 데이터(볼륨 포함)를 삭제할까요? [y/N] " ans
    if [[ "$ans" == "y" || "$ans" == "Y" ]]; then
      dc down -v
      echo "초기화 완료"
    else
      echo "취소되었습니다"
    fi
    ;;
  ps)
    dc ps
    ;;
  version)
    print_version
    ;;
  *)
    usage
    exit 1
    ;;
esac
