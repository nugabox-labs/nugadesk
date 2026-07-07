# NUGADESK

Notion의 자유로운 메모/블록형 구조와 Jira의 칸반/이슈 트래킹 장점을 결합한 개인 업무 관리 웹앱입니다.

## 정보 구조

```
워크스페이스 → 업무 분류(iCloud 미리알림 리스트와 매칭 예정) → 프로젝트(내부 전용) → 할 일(iCloud 미리알림 항목과 매칭 예정)
```

현재 버전은 iCloud 연동 이전의 순수 내부 데이터 모델(1~2단계)까지 구현되어 있습니다.

## 기술 스택

- 프론트엔드: React 19 + TypeScript + Vite + Tailwind CSS v4, TanStack Query, Zustand, @dnd-kit
- 백엔드: FastAPI + SQLAlchemy 2.0 + PostgreSQL 17
- 인증: 아이디/비밀번호 로그인, httpOnly 쿠키 기반 세션 (로그인 상태 유지 체크 시 장기 세션)
- 배포: Docker Compose — 기본은 `compose.yaml` 하나(정적 nginx + uvicorn 멀티워커, 실제 배포 형태 그대로), `--dev` 플래그를 주면 `compose.dev.yaml`을 얹어 소스 볼륨 마운트 + 핫리로드(vite dev server, `uvicorn --reload`)로 기동

## 환경 변수

```bash
cp .env.example .env   # 값 수정 후 사용. 이후 이 .env 파일을 그대로 운영 서버에도 복사해서 씁니다.
```

`DB_HOST`/`DB_PORT`로 백엔드가 어느 Postgres에 붙을지 고를 수 있습니다. 비워두면 `compose.yaml`이 함께 띄우는 로컬 `db` 서비스(`db:5432`)를 쓰고, `nugacloud.synology.me`/`7097`처럼 지정하면 그 주소로 연결합니다. Postgres는 `compose.yaml`에서 `7097:5432`로도 열려 있어 외부에서 바로 접근할 수 있습니다.

## 실행

```bash
./compose.sh --dev up   # 개발: 소스 볼륨 마운트 + 핫리로드
./compose.sh up         # 운영과 동일한 빌드로 기동
```

- 프론트엔드(정적 서빙 또는 vite dev server + API 리버스 프록시): http://localhost:7090 (`https://work.nugabox.com` → `http://localhost:7090` 리버스 프록시로 서비스)
- 백엔드: http://localhost:7091/api/health

`compose.yaml`이 호스트에 여는 포트는 다른 서비스와 겹치지 않도록 전부 `7090`~`7097` 범위 안에서만 고릅니다: 프론트엔드 `7090`, 백엔드 `7091`, Postgres `7097`. 포트를 새로 열 일이 있으면 이 범위 안에서 고르세요. `--dev`도 같은 포트를 그대로 씁니다(내부 프로세스만 nginx/uvicorn-멀티워커 대신 vite dev server/`uvicorn --reload`로 바뀜).

DB는 `--dev`/기본 모드 구분 없이 `.env`의 `DB_HOST`/`DB_PORT`를 그대로 씁니다 — 원격 DB를 쓰도록 설정해뒀다면 로컬 `db` 컨테이너는 뜨긴 하지만 실제로는 안 쓰이는 상태로 남습니다 (의도된 동작).

## compose.sh 명령어

```
./compose.sh --dev up          # 개발 모드 기동 (핫리로드)
./compose.sh up                # 운영과 동일한 빌드로 기동 (기본값)
./compose.sh --dev restart     # 개발 모드 재기동
./compose.sh restart           # 재기동 (재빌드 포함)
./compose.sh down              # 중단 (모드 무관)
./compose.sh logs [service] -f # 로그 확인 (모드 무관)
./compose.sh reset             # 볼륨 포함 초기화 (확인 프롬프트)
./compose.sh ps                # 상태 확인
./compose.sh version           # 버전 + git 커밋 해시 출력
```

## 소프트 삭제 정책

워크스페이스/업무 분류/프로젝트/할 일 삭제 시 `deleted_at`만 기록되는 소프트 삭제로 처리되며, 30일이 지난 항목은 백엔드 기동 시 자동으로 완전 삭제됩니다.

## 버전 이력

| 버전 | 날짜 | 주요 변경 사항 |
|---|---|---|
| 1.0 | 2026-07-06 | 초기 릴리스: 로그인/세션, 워크스페이스·업무분류·프로젝트·할 일 CRUD, 칸반/리스트 뷰, 헤더 버전 뱃지, appicon 기반 로고/파비콘 |
