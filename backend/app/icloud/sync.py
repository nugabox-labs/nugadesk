"""Bidirectional iCloud Reminders sync for mapped categories.

Conflict policy (2026-07-09): latest `updated_at` wins on each todo. For deletions the
effective timestamp is `max(updated_at, deleted_at)` on the local side.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..models import Category, Todo
from .caldav_client import (
    IcloudCalDavError,
    RemoteReminder,
    ReminderListInfo,
    create_client,
    create_remote_reminder,
    delete_remote_reminder,
    ensure_aware,
    fetch_list_reminders,
    probe_icloud_reminders,
    update_remote_reminder,
)


@dataclass
class SyncStats:
    pulled: int = 0
    pushed: int = 0
    updated: int = 0
    deleted: int = 0
    skipped: int = 0


def _is_mapped(category: Category) -> bool:
    return bool(category.icloud_list_uid or category.icloud_list_name)


def _find_list_for_category(category: Category, lists: list[ReminderListInfo]) -> ReminderListInfo | None:
    if category.icloud_list_uid:
        for item in lists:
            if item.uid == category.icloud_list_uid:
                return item
    if category.icloud_list_name:
        for item in lists:
            if item.name == category.icloud_list_name:
                return item
    return None


def _local_effective_updated_at(todo: Todo) -> datetime:
    updated = ensure_aware(todo.updated_at)
    if todo.deleted_at is not None:
        deleted = ensure_aware(todo.deleted_at)
        if deleted > updated:
            return deleted
    return updated


def _apply_remote_to_local(todo: Todo, remote: RemoteReminder, now: datetime) -> None:
    todo.title = remote.title[:255]
    todo.notes = remote.notes
    todo.due_date = remote.due_date
    todo.priority = remote.priority
    todo.status = remote.status
    todo.completed_at = remote.completed_at if remote.status == "done" else None
    todo.deleted_at = None
    todo.icloud_todo_uid = remote.uid
    todo.last_synced_at = now
    todo.updated_at = remote.updated_at.replace(tzinfo=None)


def _local_payload(todo: Todo) -> dict:
    return {
        "title": todo.title,
        "notes": todo.notes,
        "due_date": todo.due_date,
        "priority": todo.priority,
        "status": "done" if todo.deleted_at is not None or todo.status == "done" else "todo",
        "completed_at": todo.completed_at if todo.status == "done" or todo.deleted_at else None,
    }


def _sync_category(
    db: Session,
    client,
    category: Category,
    list_info: ReminderListInfo,
    stats: SyncStats,
    now: datetime,
) -> None:
    if category.icloud_list_uid != list_info.uid or category.icloud_list_name != list_info.name:
        category.icloud_list_uid = list_info.uid
        category.icloud_list_name = list_info.name

    remote_items = fetch_list_reminders(client, list_info)
    remote_by_uid = {item.uid: item for item in remote_items}

    local_todos = db.scalars(select(Todo).where(Todo.category_id == category.id)).all()
    local_by_uid: dict[str, Todo] = {
        todo.icloud_todo_uid: todo for todo in local_todos if todo.icloud_todo_uid
    }

    for remote in remote_items:
        local = local_by_uid.get(remote.uid)
        if local is None:
            todo = Todo(
                category_id=category.id,
                icloud_todo_uid=remote.uid,
                title=remote.title[:255],
                notes=remote.notes,
                due_date=remote.due_date,
                priority=remote.priority,
                status=remote.status,
                completed_at=remote.completed_at if remote.status == "done" else None,
                last_synced_at=now,
                updated_at=remote.updated_at.replace(tzinfo=None),
            )
            db.add(todo)
            stats.pulled += 1
            continue

        local_ts = _local_effective_updated_at(local)
        if remote.updated_at > local_ts:
            _apply_remote_to_local(local, remote, now)
            stats.pulled += 1
        elif local_ts > remote.updated_at:
            if local.deleted_at is not None:
                delete_remote_reminder(client, remote.href)
                stats.deleted += 1
            else:
                payload = _local_payload(local)
                update_remote_reminder(client, remote.href, **payload)
                local.last_synced_at = now
                stats.pushed += 1
        else:
            local.last_synced_at = now
            stats.skipped += 1

    for local in local_todos:
        if not local.icloud_todo_uid:
            if local.deleted_at is not None:
                continue
            payload = _local_payload(local)
            created = create_remote_reminder(client, list_info, **payload)
            local.icloud_todo_uid = created.uid
            local.last_synced_at = now
            stats.pushed += 1
            continue

        if local.icloud_todo_uid in remote_by_uid:
            continue

        local_ts = _local_effective_updated_at(local)
        last_synced = ensure_aware(local.last_synced_at) if local.last_synced_at else None
        if local.deleted_at is not None:
            local.last_synced_at = now
            stats.skipped += 1
            continue

        if last_synced is not None and local_ts > last_synced:
            payload = _local_payload(local)
            created = create_remote_reminder(client, list_info, **payload)
            local.icloud_todo_uid = created.uid
            local.last_synced_at = now
            stats.pushed += 1
        else:
            local.deleted_at = now.replace(tzinfo=None)
            local.last_synced_at = now
            stats.deleted += 1


def run_icloud_sync(
    db: Session,
    apple_id: str,
    app_password: str,
    *,
    category_id: uuid.UUID | None = None,
) -> tuple[SyncStats, str]:
    client = create_client(apple_id, app_password)
    lists = probe_icloud_reminders(apple_id, app_password)

    if category_id is not None:
        category = db.get(Category, category_id)
        if category is None or category.deleted_at is not None or not _is_mapped(category):
            return SyncStats(), "동기화할 iCloud 연결 분류가 없습니다."
        mapped_categories = [category]
    else:
        mapped_categories = db.scalars(
            select(Category).where(
                Category.deleted_at.is_(None),
                or_(Category.icloud_list_uid.isnot(None), Category.icloud_list_name.isnot(None)),
            )
        ).all()

    stats = SyncStats()
    now = datetime.now(timezone.utc)
    missing_lists: list[str] = []

    for category in mapped_categories:
        list_info = _find_list_for_category(category, lists)
        if list_info is None:
            label = category.icloud_list_name or category.icloud_list_uid or category.name
            missing_lists.append(label)
            continue
        try:
            _sync_category(db, client, category, list_info, stats, now)
        except IcloudCalDavError:
            raise

    db.commit()

    if not mapped_categories:
        message = "iCloud와 연결된 분류가 없습니다. 분류 설정에서 미리알림 리스트를 연결해 주세요."
    elif missing_lists:
        message = (
            f"동기화 완료 — 가져옴 {stats.pulled}, 보냄 {stats.pushed}, "
            f"삭제 {stats.deleted}, 변경 없음 {stats.skipped}. "
            f"다음 리스트를 찾지 못했습니다: {', '.join(missing_lists)}"
        )
    else:
        message = (
            f"동기화 완료 — 가져옴 {stats.pulled}, 보냄 {stats.pushed}, "
            f"삭제 {stats.deleted}, 변경 없음 {stats.skipped}."
        )

    return stats, message
