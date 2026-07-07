# AGENTS.md

Read before working on NUGADESK. Skip anything inferable from the code — this file only holds
context that isn't visible there: product intent, external constraints, infra facts, gotchas,
and open decisions.

## Product

Personal task manager (Notion-style free memos + Jira-style kanban), desktop-first, single user,
no signup/multi-user support planned.

Fixed hierarchy, don't restructure: **Workspace → Task Category (1:1 with an iCloud Reminders
list) → Project (internal only, no iCloud concept) → Todo (1:1 with an iCloud Reminders item)**.
The iCloud mapping isn't implemented yet (see below) but the hierarchy is designed around it.

Status: workspace/category/project/todo CRUD + kanban/list views done. Not started: workspace
memo kanban, iCloud sync, cross-workspace dashboard aggregate view.

## Constraints

- Never install the actual Toss Design System npm package (private scope, App-in-Toss-partner
  license only). Only its public design tokens may be reused (`#3182f6` primary, 8/10/14/16px
  radii, 32/38/48/56px button heights) inside our own Tailwind theme.
- Font is Pretendard (Toss Product Sans is private). No dark mode.
- Header badge (`{version} Dev` red / `{version}` black) is fetched at runtime from
  `GET /api/version` — never bake version/mode into the frontend build.

## iCloud Reminders sync — not implemented (next major phase)

No official REST API exists. Only path is CalDAV (RFC 4791) + iCalendar VTODO (RFC 5545) against
`https://caldav.icloud.com`, auth via an App-Specific Password (not the normal Apple ID password).
Conflict-resolution policy (iCloud-wins vs system-wins vs timestamp) is undecided — ask before
starting this.

## Infra

- Deploy: Synology NAS via self-hosted GitHub Actions runner (labels
  `[self-hosted, linux, x64, nugacloud]`), checked out at `/volume1/Develop/Sites/nugadesk`.
  See `.github/workflows/deploy.yml` — it shells out to `./compose.sh restart`, not raw
  `docker compose`, because `compose.sh` injects `VERSION`/git-commit env vars the container
  can't see on its own (backend only mounts `backend/`, not the repo root).
- Single `compose.yaml`, no dev/prod split (removed on purpose — don't reintroduce
  `compose.dev.yaml`/`compose.prod.yaml` or a `--dev` flag on `compose.sh`). Local dev without
  Docker: `npm run dev` + `uvicorn app.main:app --reload`. Docker is only for running/testing the
  actual deployed shape.
- All host ports `compose.yaml` publishes must stay in **7090-7097** (2026-07-07 decision, avoids
  colliding with other services on the NAS) — pick the next free number in that range for any new
  published port. Currently: frontend/nginx `7090`, backend `7091` (container still listens on
  `8000` internally, only the host-side mapping changed), Postgres `7097`.
  `https://work.nugabox.com` reverse-proxies to the NAS's `localhost:7090` (proxy config lives
  outside this repo). This range only applies to `compose.yaml`; native local dev
  (`npm run dev` on `5173`, `uvicorn --reload` on `8000`) isn't a compose-published port and isn't
  constrained by it.
- `CORS_ORIGINS` in `.env` must list browser-facing frontend origins, not the backend's own URL:
  `http://localhost:5173` (native `npm run dev`) and `http://localhost:7090` (local
  `compose.sh up`) for dev, `https://work.nugabox.com` for prod. In every real workflow here the
  browser only ever talks to one of these origins (nginx or Vite's dev proxy forwards `/api`
  server-side), so this rarely actually gets exercised — but keep it correct anyway.
- DB target is chosen via `.env`'s `DB_HOST`/`DB_PORT` (used to build `DATABASE_URL` in
  `compose.yaml`). Current intent: both local dev and the NAS deployment point at the same
  externally-reachable instance, `nugacloud.synology.me:7097`, not each at their own local `db`
  container — when that's set, a locally-started `db` container just sits unused, which is
  expected, not a bug.
- Single `.env` for both local and NAS use — no `.env.dev`/`.env.prod`, copy the same file
  everywhere. `.env.example` documents every key; only that file is committed.

## Gotchas

- **Multi-worker schema race**: backend runs `uvicorn --workers 2`; each worker independently
  ran `Base.metadata.create_all()` on boot, and two workers racing on a fresh DB caused a
  duplicate-key crash. Fixed with a Postgres advisory lock in `database.py::init_schema()` —
  keep it if you touch schema init.
- **Static file 403 on the NAS**: the self-hosted runner's checkout umask can leave newly added
  static files root-only-readable; `COPY --from=build` preserves that, and non-root nginx then
  403s on just that one file. Fixed with `chmod -R a+rX` after the copy in
  `frontend/Dockerfile` — keep it.

## Version bump procedure

On "bump version and commit": bump `VERSION`'s minor only (major only if explicitly asked), add
a row to README's version-history table, commit both together. Ask before creating a `git tag`
(not done by default).

## Open questions

- CalDAV conflict-resolution policy (needed before starting iCloud sync).
- Whether to tag releases with `git tag`.
