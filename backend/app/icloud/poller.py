"""Background periodic iCloud sync (CalDAV poll)."""

from __future__ import annotations

import asyncio
import logging

from sqlalchemy import or_, select, text

from ..config import get_settings
from ..database import ICLOUD_SYNC_LOCK_KEY, SessionLocal, engine
from ..models import Category
from .caldav_client import IcloudCalDavError
from .service import execute_icloud_sync, get_icloud_connection, record_icloud_sync_error

logger = logging.getLogger(__name__)

_poller_task: asyncio.Task | None = None


async def start_icloud_poller() -> None:
    global _poller_task
    settings = get_settings()
    if not settings.icloud_poll_enabled:
        return
    if _poller_task is None or _poller_task.done():
        _poller_task = asyncio.create_task(_poll_loop())


async def stop_icloud_poller() -> None:
    global _poller_task
    if _poller_task is not None:
        _poller_task.cancel()
        try:
            await _poller_task
        except asyncio.CancelledError:
            pass
        _poller_task = None


async def _poll_loop() -> None:
    settings = get_settings()
    interval = max(60, settings.icloud_poll_interval_seconds)
    while True:
        await asyncio.sleep(interval)
        await asyncio.to_thread(_run_poll_sync)


def _has_mapped_categories(db) -> bool:
    return (
        db.scalar(
            select(Category.id)
            .where(
                Category.deleted_at.is_(None),
                or_(Category.icloud_list_uid.isnot(None), Category.icloud_list_name.isnot(None)),
            )
            .limit(1)
        )
        is not None
    )


def _run_poll_sync() -> None:
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
                if get_icloud_connection(db) is None:
                    return
                if not _has_mapped_categories(db):
                    return
                execute_icloud_sync(db, refresh_list_count=False)
            except IcloudCalDavError as exc:
                logger.warning("iCloud poll sync failed: %s", exc)
                record_icloud_sync_error(db, str(exc))
            finally:
                db.close()
        finally:
            conn.execute(text("SELECT pg_advisory_unlock(:key)"), {"key": ICLOUD_SYNC_LOCK_KEY})
