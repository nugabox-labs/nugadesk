from datetime import datetime, timedelta, timezone

from sqlalchemy import delete
from sqlalchemy.orm import Session

from .models import Project, TaskCategory, Todo, Workspace

RETENTION_DAYS = 30


def purge_expired_soft_deletes(db: Session) -> None:
    """Hard-delete rows that were soft-deleted more than RETENTION_DAYS ago."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
    for model in (Todo, Project, TaskCategory, Workspace):
        db.execute(delete(model).where(model.deleted_at.is_not(None), model.deleted_at < cutoff))
    db.commit()
