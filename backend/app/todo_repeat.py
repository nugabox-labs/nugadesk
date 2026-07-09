"""반복 할 일 — 완료 시 다음 주기로 due_date/status를 갱신한다."""

import calendar
from datetime import datetime, timedelta, timezone

REPEAT_RULES = frozenset({"daily", "weekly", "monthly", "yearly"})


def _add_months(dt: datetime, months: int) -> datetime:
    month_index = dt.month - 1 + months
    year = dt.year + month_index // 12
    month = month_index % 12 + 1
    day = min(dt.day, calendar.monthrange(year, month)[1])
    return dt.replace(year=year, month=month, day=day)


def next_due_date(current: datetime | None, rule: str, *, now: datetime | None = None) -> datetime:
    """현재 due_date(없으면 now) 기준으로 다음 반복 일시를 계산한다."""
    if rule not in REPEAT_RULES:
        raise ValueError(f"Unknown repeat rule: {rule}")

    base = current or (now or datetime.now(timezone.utc))
    if base.tzinfo is None:
        base = base.replace(tzinfo=timezone.utc)

    if rule == "daily":
        return base + timedelta(days=1)
    if rule == "weekly":
        return base + timedelta(weeks=1)
    if rule == "monthly":
        return _add_months(base, 1)
    return base.replace(year=base.year + 1)


def advance_recurring_todo(todo, *, now: datetime | None = None) -> bool:
    """반복 할 일 완료 처리 — 다음 주기로 되돌린다. 반복이 아니면 False."""
    rule = todo.repeat_rule
    if not rule:
        return False

    todo.due_date = next_due_date(todo.due_date, rule, now=now)
    todo.status = "todo"
    todo.completed_at = None
    return True
