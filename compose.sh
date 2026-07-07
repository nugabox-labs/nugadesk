#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PROJECT_NAME="nugadesk"
STATE_FILE=".compose_state"

usage() {
  cat <<EOF
사용법: $0 [--dev] <command> [args]

명령어:
  up              기동 (기본값: 운영 모드, --dev 시 핫리로드 개발 모드)
  restart         재기동 (기본값: 운영 모드, --dev 시 개발 모드)
  down            전체 중단 (모드 무관)
  logs [service] [-f]   로그 확인 (모드 무관)
  reset           볼륨 포함 초기화 (확인 프롬프트)
  ps              현재 상태 확인
  version         버전 + git 커밋 해시 출력

--dev는 compose.yaml에 compose.dev.yaml을 얹어 소스 볼륨 마운트 + 핫리로드로
띄우는 것뿐이고, DB는 dev/prod 모두 .env의 DB_HOST/DB_PORT를 그대로 씁니다.
EOF
}

compose_files() {
  local mode="$1"
  if [[ "$mode" == "dev" ]]; then
    COMPOSE_ARGS=(-f compose.yaml -f compose.dev.yaml --env-file .env)
  else
    COMPOSE_ARGS=(-f compose.yaml --env-file .env)
  fi
}

save_state() {
  echo "$1" > "$STATE_FILE"
}

load_state() {
  if [[ -f "$STATE_FILE" ]]; then
    cat "$STATE_FILE"
  else
    echo "prod"
  fi
}

dc() {
  local mode="$1"
  shift
  compose_files "$mode"
  docker compose -p "$PROJECT_NAME" "${COMPOSE_ARGS[@]}" "$@"
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

MODE=""
if [[ "${1:-}" == "--dev" ]]; then
  MODE="dev"
  shift
fi

CMD="${1:-}"
[[ $# -gt 0 ]] && shift

case "$CMD" in
  up)
    MODE="${MODE:-prod}"
    save_state "$MODE"
    compute_version_env
    dc "$MODE" up -d --build
    ;;
  restart)
    MODE="${MODE:-prod}"
    save_state "$MODE"
    compute_version_env
    dc "$MODE" up -d --build --force-recreate
    ;;
  down)
    dc "$(load_state)" down
    ;;
  logs)
    dc "$(load_state)" logs "$@"
    ;;
  reset)
    read -r -p "정말로 모든 데이터(볼륨 포함)를 삭제할까요? [y/N] " ans
    if [[ "$ans" == "y" || "$ans" == "Y" ]]; then
      dc "$(load_state)" down -v
      echo "초기화 완료"
    else
      echo "취소되었습니다"
    fi
    ;;
  ps)
    dc "$(load_state)" ps
    ;;
  version)
    print_version
    ;;
  *)
    usage
    exit 1
    ;;
esac
