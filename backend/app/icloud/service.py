"""Shared iCloud sync execution — used by API routes, auto-sync, and background poller."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import IcloudConnection
from .caldav_client import IcloudCalDavError, probe_icloud_reminders
from .credentials import decrypt_secret
from .sync import SyncStats, run_icloud_sync


def get_icloud_connection(db: Session) -> IcloudConnection | None:
    return db.scalar(select(IcloudConnection).limit(1))


def execute_icloud_sync(
    db: Session,
    *,
    category_id: uuid.UUID | None = None,
    refresh_list_count: bool = False,
) -> tuple[SyncStats, str]:
    conn = get_icloud_connection(db)
    if conn is None:
        raise IcloudCalDavError("iCloud가 연결되어 있지 않습니다.")

    app_password = decrypt_secret(conn.app_password_encrypted)
    stats, message = run_icloud_sync(
        db,
        conn.apple_id_email,
        app_password,
        category_id=category_id,
    )
    conn.last_sync_at = datetime.now(timezone.utc)
    conn.last_sync_error = None
    if refresh_list_count or category_id is None:
        conn.reminder_list_count = len(probe_icloud_reminders(conn.apple_id_email, app_password))
    db.commit()
    return stats, message


def record_icloud_sync_error(db: Session, error: str) -> None:
    conn = get_icloud_connection(db)
    if conn is None:
        return
    conn.last_sync_error = error
    db.commit()
