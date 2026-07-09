"""Debounced auto-sync after local todo/category mutations."""

from __future__ import annotations

import asyncio
import logging
import uuid

from sqlalchemy import text

from ..config import get_settings
from ..database import ICLOUD_SYNC_LOCK_KEY, SessionLocal, engine
from .caldav_client import IcloudCalDavError
from .service import execute_icloud_sync, record_icloud_sync_error

logger = logging.getLogger(__name__)

_loop: asyncio.AbstractEventLoop | None = None
_debounce_task: asyncio.Task | None = None
_pending_categories: set[uuid.UUID] = set()
_full_sync_requested = False


def init_auto_sync(loop: asyncio.AbstractEventLoop) -> None:
    global _loop
    _loop = loop


def schedule_icloud_sync(category_id: uuid.UUID | None = None) -> None:
    """Queue a debounced sync from sync HTTP handlers (thread-safe)."""
    if _loop is None:
        return
    _loop.call_soon_threadsafe(_enqueue_sync, category_id)


def _enqueue_sync(category_id: uuid.UUID | None) -> None:
    global _debounce_task
    if category_id is None:
        _request_full_sync()
    else:
        _pending_categories.add(category_id)
    if _debounce_task is None or _debounce_task.done():
        _debounce_task = asyncio.create_task(_debounced_flush())


def _request_full_sync() -> None:
    global _full_sync_requested
    _full_sync_requested = True


async def _debounced_flush() -> None:
    global _pending_categories
    debounce = get_settings().icloud_auto_sync_debounce_seconds
    await asyncio.sleep(debounce)

    categories = _pending_categories.copy()
    _pending_categories.clear()
    full_sync = _full_sync_requested
    _clear_full_sync_flag()

    await asyncio.to_thread(_run_pending_sync, categories, full_sync)


def _clear_full_sync_flag() -> None:
    global _full_sync_requested
    _full_sync_requested = False


def _run_pending_sync(categories: set[uuid.UUID], full_sync: bool) -> None:
    with engine.connect() as conn:
        locked = conn.execute(
            text("SELECT pg_try_advisory_lock(:key)"),
            {"key": ICLOUD_SYNC_LOCK_KEY},
        ).scalar()
        if not locked:
            return
        try:
            db = SessionLocal()
            try:
                if full_sync or not categories:
                    execute_icloud_sync(db, refresh_list_count=full_sync)
                    return
                for category_id in categories:
                    execute_icloud_sync(db, category_id=category_id)
            except IcloudCalDavError as exc:
                logger.warning("iCloud auto-sync failed: %s", exc)
                record_icloud_sync_error(db, str(exc))
            finally:
                db.close()
        finally:
            conn.execute(text("SELECT pg_advisory_unlock(:key)"), {"key": ICLOUD_SYNC_LOCK_KEY})
