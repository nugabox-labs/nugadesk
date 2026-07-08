# AGENTS.md

Read before working on NUGADESK. Skip anything inferable from the code — this file only holds
context that isn't visible there: product intent, external constraints, infra facts, gotchas,
and open decisions.

## Product

Personal task manager (Notion-style free memos + Jira-style kanban), desktop-first, single user,
no signup/multi-user support planned.

**Hierarchy (2026-07-08 redesign, supersedes the earlier fixed 4-level Workspace > Task Category
> Project > Todo model — that model is gone, don't resurrect it):** a single recursive **분류
(Category)** node — self-referential (`parent_id`), unbounded depth — plus a leaf **할일 (Todo)**.
Modeled after Apple Reminders' List Group / List split:
- A 분류 can have child 분류 nodes (nesting freely), **unless** it's mapped to an iCloud Reminders
  list (`icloud_list_uid`/`icloud_list_name` set) — a mapped 분류 becomes a leaf and cannot have
  child 분류, mirroring the fact that a real iCloud list can't contain sub-lists. Enforced in
  `backend/app/routers/categories.py` (`create_category` rejects nesting under a mapped parent;
  `update_category` rejects mapping a 분류 that already has children), mirrored client-side in
  `CategoryFormModal.tsx` (disables the iCloud field with an explanation when the 분류 has
  children) so the user never hits the 400 in normal use.
- A 할일 can be created directly inside **any** 분류 — mapped or not, leaf or not, top-level or
  nested. `Todo.category_id` points at whichever 분류 it was added to.
- Top-level 분류 (`parent_id IS NULL`) carry `icon`/`color` for visual identity (replaces the old
  Workspace concept 1:1 — same rows, just renamed/reparented in the 2026-07-08 migration).
- The iCloud list field is currently a **free-text name input**, not a real select — the user
  asked for a select-from-your-actual-lists dropdown, but that requires the CalDAV integration
  below (still not started), so there's nothing to populate a real select with yet. Revisit once
  that lands.

Status: 분류/할일 CRUD done, no kanban status columns anymore (dropped in the 2026-07-08 redesign
in favor of a flat Reminders-style checklist — a single done/not-done circular checkbox per todo,
`.checkbox-circle` in `index.css`). Dashboard (`/`) renders the full recursive tree for every
top-level 분류 at once (2026-07-08 decision: user wants everything visible at a glance, not
click-through per level) via one `GET /api/dashboard` call — two flat queries (all categories, all
todos) assembled into a tree + bottom-up `todo_count`/`done_count` rollup in Python
(`backend/app/routers/dashboard.py`), not a recursive CTE. `/category/:id` is a focused view of
one subtree (breadcrumb + same recursive renderer, `components/CategoryNode.tsx`) reusing the same
`['dashboard']` query rather than a separate fetch. Any mutation touching categories/todos must
invalidate `['dashboard']` — see `frontend/src/hooks/use{Categories,Todos}.ts` — since it's the
only cache holding this data (no more per-level list endpoints/queries).

**Legacy schema migration:** `backend/app/database.py::_migrate_legacy_hierarchy()` runs once on
boot (idempotent, guarded by an existence check) to convert an old
workspaces/task_categories/projects/todos DB into the new `categories` table + `todos.category_id`
— see the function's docstring. Deliberately additive/non-destructive: old tables and the old
`todos.project_id` column are **not dropped**, kept as an inert backup since there's no
Alembic/rollback tooling in this project and it runs unattended against the only copy of
production data. Safe to drop them by hand later once the migrated data is confirmed correct in
prod — not done automatically.

Not started: workspace memo kanban, iCloud sync.

## Constraints

- Never install the actual Toss Design System npm package (private scope, App-in-Toss-partner
  license only). Only its public design tokens may be reused (`#3182f6` primary, 8/10/14/16px
  radii, 32/38/48/56px button heights) inside our own Tailwind theme.
- Font is Pretendard (Toss Product Sans is private).
- Dark mode (2026-07-07 decision): system/light/dark toggle in `Header.tsx`, state in
  `store/theme.ts`, persisted to `localStorage['nugadesk-theme']`. Implemented by overriding
  Tailwind's own CSS variables (`--color-white`, `--color-gray-*`) under an `html.dark` selector
  in `index.css` — existing `bg-white`/`text-gray-*`/`border-gray-*` utilities re-theme
  automatically, no per-component `dark:` classes needed. Dark surfaces use Toss Gray `#202632`
  (brand charcoal, not pure black). `index.html` has an inline pre-hydration script that reads the
  same localStorage key to set the `dark` class before first paint (avoids a flash) — keep it in
  sync with `store/theme.ts` if the storage key or fallback logic changes.
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
- Deploy is selective (2026-07-08 decision, was rebuilding+restarting every service on every
  push regardless of what changed): the deploy job diffs `git diff --name-only` between the
  previously-deployed commit and the new one and only rebuilds the affected side —
  `frontend/**` → `./compose.sh restart frontend`, `backend/**` or `VERSION` →
  `... restart backend`, both → both. Changes to `compose.yaml`/`compose.sh`/`compose.dev.yaml`/
  `.env.example`/the deploy workflow itself fall back to a full `./compose.sh restart` (no args)
  since those can affect the whole stack. `compose.sh restart` now takes an optional service-name
  list forwarded to `docker compose up -d --build --force-recreate` — keep that plumbing if you
  touch either file.
- `compose.yaml` is the single source of truth for the deployed shape (used as-is for
  `compose.sh up`, i.e. prod). `compose.dev.yaml` (2026-07-07, reintroduced) is a *thin* overlay
  loaded only via `compose.sh --dev` — it only adds source bind-mounts + swaps the run command
  (`uvicorn --reload`, `vite dev`) via `frontend/Dockerfile`'s `dev` build stage. It deliberately
  does **not** touch `ports:` (Vite is told to run on `--port 80` inside the container so the
  existing `7090:80` mapping still applies — don't add a second `ports:` entry for frontend/backend
  in `compose.dev.yaml`, Compose appends port lists across files instead of replacing them and two
  bindings for the same host port will fail). There is intentionally no `compose.prod.yaml` — prod
  is just `compose.yaml` alone. Native dev without Docker at all (`npm run dev` on `5173`,
  `uvicorn --reload` on `8000` directly) still works too and is even lighter than `--dev`.
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
- **No Alembic**: schema changes are hand-written idempotent SQL in `database.py::init_schema()`
  (`SCHEMA_PATCHES` for simple column tweaks, `_migrate_legacy_hierarchy()` for the one-off
  2026-07-08 hierarchy migration) run on every boot behind the advisory lock above, not a real
  migration framework. If you change `models.py` in a way that isn't a fresh `CREATE TABLE`
  (renaming/dropping a column on a table that already exists in prod), you need to hand-write the
  same kind of additive, idempotent, existence-checked SQL — don't assume `create_all()` will
  handle it, it only creates tables that don't exist yet and never alters existing ones.

## Version bump procedure

On "bump version and commit": bump `VERSION`'s minor only (major only if explicitly asked), add
a row to README's version-history table, commit both together. Ask before creating a `git tag`
(not done by default).

## Open questions

- CalDAV conflict-resolution policy (needed before starting iCloud sync).
- Whether to tag releases with `git tag`.
