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
- 배포: Docker Compose (dev/prod 분리)

## 로컬 개발 실행

```bash
cp .env.dev.example .env.dev   # 값 수정 후 사용
./compose.sh --dev up
```

- 프론트엔드: http://localhost:5173
- 백엔드: http://localhost:8000/api/health

## 운영 배포

```bash
cp .env.prod.example .env.prod   # 값 반드시 강한 비밀번호로 교체
./compose.sh up
```

- 프론트엔드(정적 서빙 + API 리버스 프록시): http://localhost
- 백엔드: http://localhost:8000

## compose.sh 명령어

```
./compose.sh --dev up          # 개발 모드 기동
./compose.sh up                # 운영 모드 기동 (기본값)
./compose.sh --dev restart     # 개발 모드 재기동
./compose.sh restart           # 운영 모드 재기동
./compose.sh down              # 전체 중단
./compose.sh logs [service] -f # 로그 확인
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
