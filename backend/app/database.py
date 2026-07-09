import uuid

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import get_settings
from .security import hash_password

settings = get_settings()

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Arbitrary fixed key for a Postgres session-level advisory lock, used to
# serialize schema creation across the multiple uvicorn worker processes
# started in prod (each runs the FastAPI lifespan independently on boot).
SCHEMA_INIT_LOCK_KEY = 727272001


class Base(DeclarativeBase):
    pass


# Small, idempotent column widenings for databases created before a model
# change. We don't use Alembic at this stage, so these run on every boot
# (guarded by IF EXISTS) instead of a proper migration.
SCHEMA_PATCHES: list[str] = []


def _migrate_legacy_hierarchy(conn) -> None:
    """One-time upgrade from the old fixed Workspace > TaskCategory > Project > Todo
    schema (2026-07-08 and earlier) to the recursive `categories` self-join
    (2026-07-08 분류 redesign). No-ops on a fresh install (no `workspaces` table)
    or once already migrated (`todos.category_id` already exists).

    Deliberately additive/non-destructive: old tables and the old
    `todos.project_id` column are left in place as an inert backup rather than
    dropped, since this runs unattended against the only copy of production
    data and there's no Alembic/rollback tooling in this project yet.
    """
    has_legacy = conn.execute(text("SELECT to_regclass('public.workspaces')")).scalar()
    if has_legacy is None:
        return

    already_migrated = conn.execute(
        text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name = 'todos' AND column_name = 'category_id'"
        )
    ).scalar()
    if already_migrated:
        return

    conn.execute(
        text(
            "INSERT INTO categories "
            "(id, parent_id, name, icon, color, icloud_list_uid, icloud_list_name, "
            " sort_order, created_at, updated_at, deleted_at) "
            "SELECT id, NULL, name, icon, color, NULL, NULL, "
            "       sort_order, created_at, updated_at, deleted_at "
            "FROM workspaces "
            "ON CONFLICT (id) DO NOTHING"
        )
    )
    conn.execute(
        text(
            "INSERT INTO categories "
            "(id, parent_id, name, icon, color, icloud_list_uid, icloud_list_name, "
            " sort_order, created_at, updated_at, deleted_at) "
            "SELECT id, workspace_id, name, NULL, NULL, icloud_list_uid, icloud_list_name, "
            "       sort_order, created_at, updated_at, deleted_at "
            "FROM task_categories "
            "ON CONFLICT (id) DO NOTHING"
        )
    )
    conn.execute(
        text(
            "INSERT INTO categories "
            "(id, parent_id, name, icon, color, icloud_list_uid, icloud_list_name, "
            " sort_order, created_at, updated_at, deleted_at) "
            "SELECT id, task_category_id, name, NULL, NULL, NULL, NULL, "
            "       sort_order, created_at, updated_at, deleted_at "
            "FROM projects "
            "ON CONFLICT (id) DO NOTHING"
        )
    )
    conn.execute(text("ALTER TABLE todos ADD COLUMN IF NOT EXISTS category_id UUID"))
    conn.execute(text("UPDATE todos SET category_id = project_id WHERE category_id IS NULL"))
    conn.execute(text("ALTER TABLE todos ALTER COLUMN category_id SET NOT NULL"))
    conn.execute(
        text(
            "ALTER TABLE todos ADD CONSTRAINT todos_category_id_fkey "
            "FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE"
        )
    )


def _seed_nav_menus(conn) -> None:
    """First-boot seed of default 1차/2차 메뉴 — matches the pre-DB hardcoded nav."""
    has_nav = conn.execute(text("SELECT 1 FROM nav_primary_items LIMIT 1")).scalar()
    if has_nav:
        return

    home_id = uuid.uuid4()
    tasks_id = uuid.uuid4()
    assets_id = uuid.uuid4()
    info_id = uuid.uuid4()

    conn.execute(
        text(
            "INSERT INTO nav_primary_items (id, label, icon, route_path, path_prefixes, sort_order) "
            "VALUES "
            "(:home_id, '홈', 'house', '/', NULL, 0), "
            "(:tasks_id, '작업', 'folder-open', '/tasks', '/category', 1), "
            "(:assets_id, '자산', 'sack-dollar', '/assets', NULL, 2), "
            "(:info_id, '정보', 'book-open', '/info', NULL, 3)"
        ),
        {
            "home_id": home_id,
            "tasks_id": tasks_id,
            "assets_id": assets_id,
            "info_id": info_id,
        },
    )

    conn.execute(
        text(
            "INSERT INTO nav_secondary_items (id, primary_id, item_type, label, route_path, sort_order) "
            "VALUES "
            "(:id1, :home_id, 'link', '대시보드', '/', 0), "
            "(:id2, :tasks_id, 'link', '작업 관리', '/tasks', 0), "
            "(:id3, :tasks_id, 'heading', '분류', NULL, 1), "
            "(:id4, :tasks_id, 'categories', '분류 목록', NULL, 2), "
            "(:id5, :assets_id, 'link', '자산 관리', '/assets', 0), "
            "(:id6, :info_id, 'link', '정보 관리', '/info', 0)"
        ),
        {
            "id1": uuid.uuid4(),
            "id2": uuid.uuid4(),
            "id3": uuid.uuid4(),
            "id4": uuid.uuid4(),
            "id5": uuid.uuid4(),
            "id6": uuid.uuid4(),
            "home_id": home_id,
            "tasks_id": tasks_id,
            "assets_id": assets_id,
            "info_id": info_id,
        },
    )


def _seed_app_user(conn) -> None:
    """First-boot seed of the single app_users row from .env AUTH_USERNAME/AUTH_PASSWORD.
    No-ops once any row exists — from then on the DB row (not .env) is the source of truth for
    login, so an in-app password change persists across restarts even though .env doesn't change.
    """
    has_user = conn.execute(text("SELECT 1 FROM app_users LIMIT 1")).scalar()
    if has_user:
        return
    conn.execute(
        text(
            "INSERT INTO app_users (id, username, password_hash) "
            "VALUES (:id, :username, :password_hash)"
        ),
        {
            "id": uuid.uuid4(),
            "username": settings.auth_username,
            "password_hash": hash_password(settings.auth_password),
        },
    )


def init_schema() -> None:
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        conn.execute(text("SELECT pg_advisory_lock(:key)"), {"key": SCHEMA_INIT_LOCK_KEY})
        try:
            for patch in SCHEMA_PATCHES:
                conn.execute(text(patch))
            Base.metadata.create_all(bind=conn)
            # Real transaction (not the AUTOCOMMIT connection above, which
            # can't provide atomicity across statements) so the multi-step
            # data migration is all-or-nothing.
            with engine.begin() as txn_conn:
                _migrate_legacy_hierarchy(txn_conn)
                _seed_nav_menus(txn_conn)
                _seed_app_user(txn_conn)
        finally:
            conn.execute(text("SELECT pg_advisory_unlock(:key)"), {"key": SCHEMA_INIT_LOCK_KEY})


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
