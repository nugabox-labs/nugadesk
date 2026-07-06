# AGENTS.md — NUGADESK 프로젝트 지침

이 문서는 NUGADESK를 다루는 모든 에이전트(Claude Code 등)가 매번 세션 시작 시 숙지해야 하는
원본 요구사항과 확정된 의사결정을 담는다. 코드에서 파악 가능한 내용(파일 구조, 실제 구현 방식)은
여기 다시 적지 않고 코드를 직접 확인한다.

## 0. 프로젝트 개요

- 프로젝트명: `nugadesk` / 화면 타이틀: `NUGADESK` (항상 대문자)
- 목적: Notion(자유로운 메모/블록형 구조)과 Jira(칸반/이슈 트래킹)의 장점을 결합한 **개인 업무 관리 웹앱**
- 주 사용 환경: 맥/아이패드에서 대시보드를 상시 띄워두는 **와이드 스크린 우선(desktop-first)** 레이아웃. 모바일은 반응형으로 동일 기능 제공
- 핵심 차별점: iCloud 미리알림과의 실시간 연동(예정) + Toss 스타일 디자인 시스템(자체 구현)

## 1. 정보 구조 (변경 금지 — 핵심 설계)

```
워크스페이스 (Workspace)
 └─ 업무 분류 (Task Category) ── iCloud 미리알림 "리스트"와 1:1 매칭 예정
      └─ 프로젝트 (Project)   ── 시스템 내부 전용 개념 (iCloud와 무관)
           └─ 할 일 (Todo)     ── iCloud 미리알림 "항목"과 1:1 매칭 예정
```

- 워크스페이스 초기 4개(사용자 예시): `가민정보시스템`, `조선이공대학교`, `광주새백성교회`, `개인 작업` — 실제 시드 데이터는 아니며 사용자가 직접 생성
- 업무 분류는 iCloud 리스트와 최초 1회 수동 매칭 후 자동 동기화 (아직 미구현, 4단계)
- 프로젝트는 순수 내부 개념, iCloud에는 존재하지 않음
- 할 일은 CRUD/완료 처리가 iCloud와 양방향 동기화되어야 함 (아직 미구현). 완료 예정일 = iCloud `DUE`, 완료 여부 = iCloud `STATUS:COMPLETED`, 우선순위/메모 필드 매핑

## 2. 워크스페이스별 메모 칸반 (미구현 — 3단계)

각 워크스페이스 상세 화면 최상단에 카드 형태 자유 메모 영역(Notion 스타일, 드래그 정렬 가능). iCloud와 무관한 순수 내부 데이터. 아직 구현하지 않음.

## 3. 화면 요구사항 요약

- 상단 헤더: 로고(`NUGADESK`, appicon.png 기반) + 버전/모드 뱃지 + 검색 + 사용자 메뉴
- 좌측 사이드바: 워크스페이스 목록 + 메뉴, 접기/펼치기 가능
- **헤더 버전/모드 뱃지**: dev = 진한 빨간 배경 `{version} Dev`, prod = 검은 배경 `{version}`. 값은 프론트 빌드 타임이 아니라 **런타임에 `GET /api/version` 호출**로 결정 (`{ version, mode, gitCommit }`)
- 대시보드(`/`): 워크스페이스 바로가기, 전체 할 일 통합 뷰(미구현), 프로젝트 진행률/임박 마감일(미구현) 등
- 워크스페이스 상세(`/workspace/:id`): 메모 칸반(미구현) + 업무 분류별 칸반/리스트
- 프로젝트 상세(`/workspace/:id/project/:id`): 할 일 칸반(To Do/In Progress/Done) 또는 리스트, 완료 항목 숨김 토글
- 모든 계층에서 칸반 ↔ 리스트 뷰 토글 UI 패턴 통일
- 반응형 브레이크포인트(제안): ≥1200px 사이드바 고정 3~4컬럼, 768~1199px 접힘 가능 2~3컬럼, <768px 하단탭/슬라이드 메뉴 + 칸반 가로 스크롤 또는 단일 컬럼

## 4. 디자인 시스템 — 중요 제약

- **Toss Design System(TDS) 패키지는 절대 설치하지 않는다.** 비공개 npm 스코프 + 앱인토스 파트너 전용 라이선스이므로 개인 프로젝트에 설치/사용 불가.
- 대신 TDS의 공개 문서에 나온 디자인 토큰(색상, 타이포, 컴포넌트 치수)만 참고해 **자체 디자인 토큰 + 컴포넌트를 새로 구현**한다 (Tailwind 커스텀 테마 기반).
  - Primary Blue `#3182f6`, 버튼 라운드 8/10/14/16px, 버튼 높이 32/38/48/56px(sm/md/lg/xl), 본문 폰트 굵기 500~600, 강조 700
- 폰트: Toss Product Sans는 비공개이므로 **Pretendard**(오픈소스, 한국어 지원) 사용
- 다크모드는 1차 개발 범위 제외 (TDS 자체도 미지원)

## 5. iCloud 미리알림 연동 — 중요 제약 (미구현, 4단계 예정)

- Apple은 미리알림 공식 REST API를 제공하지 않는다. **CalDAV(RFC 4791) + iCalendar VTODO(RFC 5545)** 만 유일한 방법.
- 엔드포인트 `https://caldav.icloud.com`, 인증은 **앱 지정 암호(App-Specific Password)** 필수 (일반 Apple ID 비밀번호 불가)
- Node면 `tsdav`/`dav` + `ical.js`, Python이면 `caldav` + `icalendar`/`vobject` 사용 권장
- 앱 지정 암호는 평문 DB 저장 금지 — 환경변수/시크릿 스토어 + 애플리케이션 레벨 암호화 필요
- 리스트가 CalDAV상 "캘린더"로 노출되므로 실제 일정과 미리알림 리스트를 구분하는 필터링 로직 필요
- 충돌 해결 정책(iCloud 우선/시스템 우선/타임스탬프 비교)은 **아직 미확정** — 4단계 착수 전 사용자에게 재확인할 것

## 6. 확정된 기술 스택 (2026-07-06 결정)

- 프론트엔드: React 19 + TypeScript + Vite + Tailwind CSS v4 (커스텀 디자인 토큰), TanStack Query(서버 상태) + Zustand(클라이언트 상태), `@dnd-kit`(드래그앤드롭 칸반), react-router-dom
- 백엔드: **FastAPI** (Node.js 대안 검토했으나 확정) + SQLAlchemy 2.0 + Pydantic v2
- DB: PostgreSQL 17, 마이그레이션은 `Base.metadata.create_all`로 단순화(MVP 단계, alembic 미도입)
- 인증: **아이디/비밀번호 로그인 + httpOnly 쿠키 세션(JWT)**. "로그인 상태 유지" 체크 시 장기 세션(기본 180일), 미체크 시 단기 세션(기본 12시간). 환경변수 `AUTH_USERNAME`/`AUTH_PASSWORD`로 단일 사용자 자격 증명 관리 (멀티유저/회원가입 없음)
- 삭제 정책: **소프트 삭제, 30일 보관 후 자동 완전 삭제** (백엔드 기동 시 만료분 정리)
- 배포: Docker Compose(dev/prod 분리) + `compose.sh`

## 7. 개발 우선순위 및 현재 진행 상태

1. ✅ 워크스페이스 CRUD + 기본 레이아웃(헤더/사이드바) + 디자인 토큰 정의
2. ✅ 업무 분류/프로젝트/할 일 CRUD (iCloud 연동 없이 순수 내부 데이터로 구현) — 칸반/리스트 뷰 토글, 드래그앤드롭 상태 변경, 완료 숨김 토글 포함
3. ⬜ 워크스페이스 메모 칸반 기능
4. ⬜ CalDAV 연동 모듈 (읽기 전용 동기화 → 양방향 확장)
5. ⬜ 대시보드 통합 뷰(전체 워크스페이스 할 일 한눈에 보기, 완료율 그래프 등) + 반응형 마무리

## 8. 아직 확인이 필요한 미결정 사항

- [ ] 배포 환경 (Synology NAS 등 기존 인프라 재사용 여부) — 아직 미확인
- [ ] CalDAV 양방향 동기화 시 충돌 해결 규칙 — 아직 미확인
- [ ] `git tag` 버전 태그 생성 여부 — 아직 미확인 (현재는 태그 없이 커밋만 진행)

이미 확정된 사항(재질문 금지):
- 워크스페이스/업무분류/프로젝트 삭제 정책 → 소프트 삭제 30일 보관
- 인증 방식 → 아이디/비밀번호 + 로그인 상태 유지 체크박스
- 백엔드 스택 → FastAPI

## 9. 버전 관리 규칙 (항상 준수)

- 저장소 루트 `VERSION` 파일 하나로 버전 관리. 형식은 `Major.Minor` (패치 버전 없음)
- `README.md`에 "버전 이력" 표를 두고 버전이 올라갈 때마다 한 줄씩 추가
- **"버전 업 하고 커밋해" 류의 요청을 받으면:**
  1. 마지막 버전업 커밋 이후 변경 내용을 `git log`로 확인해 요약
  2. `VERSION`의 **마이너 버전만 1 증가** (예: 1.0 → 1.1). 메이저 버전 증가는 사용자가 명시적으로 요청할 때만
  3. `README.md` 버전 이력 표에 새 행 추가 (버전/날짜/주요 변경 사항)
  4. `VERSION`, `README.md`를 포함해 커밋 (예: `chore: bump version to 1.1`)
  5. `git tag` 생성 여부는 매번 사용자에게 확인 (기본은 생성하지 않음 — 위 8번 미결정 사항 참고)
- 헤더 버전 뱃지는 `GET /api/version`이 런타임에 `VERSION` 파일 + git 커밋을 읽으므로, 버전업 후 프론트 코드 수정 불필요. 단, **백엔드 컨테이너는 리포 루트를 마운트하지 않으므로** `compose.sh up`/`restart` 실행 시 스크립트가 호스트에서 `VERSION`/`git rev-parse`를 읽어 `APP_VERSION`/`APP_GIT_COMMIT` 환경변수로 주입한다 (`compose.sh`의 `compute_version_env` 참고). 이 메커니즘을 건드릴 때는 반드시 유지할 것.

## 10. compose.sh 사용 규칙

```
./compose.sh --dev up          # 개발 모드 기동 (핫리로드, 볼륨 마운트)
./compose.sh up                # 운영 모드 기동 (기본값)
./compose.sh --dev restart     # 개발 모드 재기동
./compose.sh restart           # 운영 모드 재기동
./compose.sh down              # 전체 중단 (모드 무관)
./compose.sh logs [service] -f # 로그 확인 (모드 무관)
./compose.sh reset             # 볼륨 포함 초기화 — 반드시 y/N 확인 프롬프트 통과 필요, 임의로 우회 금지
./compose.sh ps                # 상태 확인
./compose.sh version           # "version : X.Y (commit)" 형식 출력
```

- `.env.dev`/`.env.prod`는 gitignore 대상 (실제 값), `.env.dev.example`/`.env.prod.example`만 커밋
- 로컬 검증 시 Python 3.14 등 너무 최신 버전에서는 `pydantic-core`/`psycopg` 빌드가 실패할 수 있음 → **로컬 venv보다 Docker(`python:3.12-slim` 기반 이미지)로 검증하는 것을 우선**할 것

## 11. 로고/파비콘

- `appicon.png`(리포 루트)가 유일한 브랜드 아이콘 소스. `frontend/public/`에 `favicon.png`, `favicon-32.png`, `apple-touch-icon.png`, `logo-192.png`로 리사이즈되어 있으며(`sips` 사용), 헤더 로고와 로그인 화면 로고는 `logo-192.png`를 사용한다. 아이콘을 교체할 때는 이 파생 파일들을 전부 다시 생성해야 한다.
