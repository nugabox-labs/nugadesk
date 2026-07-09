"""Thin CalDAV helpers for iCloud Reminders discovery and VTODO sync.

Apple exposes Reminders through the same CalDAV endpoint as Calendar
(`caldav.icloud.com`, RFC 4791 + VTODO in RFC 5545). There is no JSON REST API.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timezone

import caldav
from icalendar import vDatetime

ICLOUD_CALDAV_URL = "https://caldav.icloud.com"

# iOS 13+ upgraded lists may expose these placeholder VTODOs instead of real reminders.
PLACEHOLDER_SUMMARIES = frozenset(
    {
        "Where are my reminders?",
        "The creator of this list has upgraded these reminders.",
    }
)


@dataclass(frozen=True)
class ReminderListInfo:
    uid: str
    name: str
    url: str


@dataclass(frozen=True)
class RemoteReminder:
    uid: str
    href: str
    title: str
    notes: str | None
    due_date: datetime | None
    priority: int  # NUGADESK scale: 0=보통, 1=긴급
    status: str  # todo | done
    completed_at: datetime | None
    updated_at: datetime


class IcloudCalDavError(Exception):
    pass


def ensure_aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _parse_ical_datetime(value) -> datetime | None:
    if value is None:
        return None
    if hasattr(value, "dt"):
        value = value.dt
    if isinstance(value, date) and not isinstance(value, datetime):
        return datetime.combine(value, time.min, tzinfo=timezone.utc)
    if isinstance(value, datetime):
        return ensure_aware(value)
    return None


def _icloud_priority_to_local(value) -> int:
    try:
        priority = int(value)
    except (TypeError, ValueError):
        return 0
    return 1 if priority == 1 else 0


def _local_priority_to_icloud(value: int) -> int:
    return 1 if value == 1 else 0


def _calendar_supports_vtodo(calendar: caldav.objects.Calendar) -> bool:
    try:
        return "VTODO" in calendar.get_supported_components()
    except Exception:
        return False


def create_client(apple_id: str, app_password: str) -> caldav.DAVClient:
    try:
        return caldav.DAVClient(url=ICLOUD_CALDAV_URL, username=apple_id, password=app_password)
    except Exception as exc:
        raise IcloudCalDavError(
            "iCloud에 연결할 수 없습니다. Apple ID와 앱 전용 암호를 확인해 주세요."
        ) from exc


def probe_icloud_reminders(apple_id: str, app_password: str) -> list[ReminderListInfo]:
    """Authenticate against iCloud CalDAV and return VTODO-capable reminder lists."""
    client = create_client(apple_id, app_password)
    try:
        principal = client.principal()
        calendars = principal.calendars()
    except Exception as exc:
        raise IcloudCalDavError(
            "iCloud에 연결할 수 없습니다. Apple ID와 앱 전용 암호를 확인해 주세요."
        ) from exc

    lists: list[ReminderListInfo] = []
    for calendar in calendars:
        if not _calendar_supports_vtodo(calendar):
            continue
        name = getattr(calendar, "name", None) or "이름 없음"
        url = str(getattr(calendar, "url", "") or "")
        uid = url.rstrip("/").split("/")[-1] if url else name
        lists.append(ReminderListInfo(uid=uid, name=name, url=url))

    return lists


def _parse_remote_todo(todo_obj: caldav.objects.Todo) -> RemoteReminder | None:
    comp = todo_obj.icalendar_component
    title = str(comp.get("summary", "") or "").strip()
    if not title or title in PLACEHOLDER_SUMMARIES:
        return None

    uid = str(comp.get("uid", "") or "").strip()
    if not uid:
        return None

    href = str(getattr(todo_obj, "url", "") or "")
    notes_raw = comp.get("description")
    notes = str(notes_raw).strip() if notes_raw else None

    due_date = _parse_ical_datetime(comp.get("due") or comp.get("dtstart"))
    priority = _icloud_priority_to_local(comp.get("priority", 0))

    status_raw = str(comp.get("status", "") or "").upper()
    status = "done" if status_raw == "COMPLETED" else "todo"
    completed_at = _parse_ical_datetime(comp.get("completed")) if status == "done" else None

    updated_at = (
        _parse_ical_datetime(comp.get("last-modified"))
        or _parse_ical_datetime(comp.get("dtstamp"))
        or datetime.now(timezone.utc)
    )

    return RemoteReminder(
        uid=uid,
        href=href,
        title=title,
        notes=notes,
        due_date=due_date,
        priority=priority,
        status=status,
        completed_at=completed_at,
        updated_at=updated_at,
    )


def fetch_list_reminders(client: caldav.DAVClient, list_info: ReminderListInfo) -> list[RemoteReminder]:
    calendar = caldav.objects.Calendar(client, url=list_info.url)
    try:
        raw_todos = calendar.search(todo=True, include_completed=True)
    except Exception as exc:
        raise IcloudCalDavError(f"미리알림 리스트를 읽을 수 없습니다: {list_info.name}") from exc

    reminders: list[RemoteReminder] = []
    for raw in raw_todos:
        parsed = _parse_remote_todo(raw)
        if parsed is not None:
            reminders.append(parsed)
    return reminders


def _apply_fields_to_component(comp, *, title: str, notes: str | None, due_date: datetime | None, priority: int, status: str, completed_at: datetime | None, now: datetime):
    comp["summary"] = title
    if notes:
        comp["description"] = notes
    elif "description" in comp:
        del comp["description"]

    if due_date is not None:
        comp["due"] = vDatetime(ensure_aware(due_date))
    elif "due" in comp:
        del comp["due"]
    if "dtstart" in comp:
        del comp["dtstart"]

    ical_priority = _local_priority_to_icloud(priority)
    if ical_priority:
        comp["priority"] = ical_priority
    elif "priority" in comp:
        del comp["priority"]

    if status == "done":
        comp["status"] = "COMPLETED"
        comp["completed"] = vDatetime(completed_at or now)
    else:
        if "status" in comp:
            del comp["status"]
        if "completed" in comp:
            del comp["completed"]

    comp["last-modified"] = vDatetime(now)


def create_remote_reminder(
    client: caldav.DAVClient,
    list_info: ReminderListInfo,
    *,
    title: str,
    notes: str | None,
    due_date: datetime | None,
    priority: int,
    status: str,
    completed_at: datetime | None,
) -> RemoteReminder:
    calendar = caldav.objects.Calendar(client, url=list_info.url)
    now = datetime.now(timezone.utc)
    try:
        todo_obj = calendar.add_todo(summary=title)
    except Exception as exc:
        raise IcloudCalDavError(f"미리알림을 생성할 수 없습니다: {title}") from exc

    comp = todo_obj.icalendar_component
    _apply_fields_to_component(
        comp,
        title=title,
        notes=notes,
        due_date=due_date,
        priority=priority,
        status=status,
        completed_at=completed_at,
        now=now,
    )
    try:
        todo_obj.save()
    except Exception as exc:
        raise IcloudCalDavError(f"미리알림을 저장할 수 없습니다: {title}") from exc

    parsed = _parse_remote_todo(todo_obj)
    if parsed is None:
        raise IcloudCalDavError(f"생성한 미리알림을 읽을 수 없습니다: {title}")
    return parsed


def update_remote_reminder(
    client: caldav.DAVClient,
    href: str,
    *,
    title: str,
    notes: str | None,
    due_date: datetime | None,
    priority: int,
    status: str,
    completed_at: datetime | None,
) -> RemoteReminder:
    now = datetime.now(timezone.utc)
    try:
        todo_obj = client.todo(url=href)
        comp = todo_obj.icalendar_component
        _apply_fields_to_component(
            comp,
            title=title,
            notes=notes,
            due_date=due_date,
            priority=priority,
            status=status,
            completed_at=completed_at,
            now=now,
        )
        todo_obj.save()
    except Exception as exc:
        raise IcloudCalDavError(f"미리알림을 수정할 수 없습니다: {title}") from exc

    parsed = _parse_remote_todo(todo_obj)
    if parsed is None:
        raise IcloudCalDavError(f"수정한 미리알림을 읽을 수 없습니다: {title}")
    return parsed


def delete_remote_reminder(client: caldav.DAVClient, href: str) -> None:
    try:
        todo_obj = client.todo(url=href)
        todo_obj.delete()
    except Exception as exc:
        raise IcloudCalDavError("iCloud 미리알림을 삭제할 수 없습니다.") from exc
