import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import TaskCategory
from ..schemas import TaskCategoryCreate, TaskCategoryOut, TaskCategoryUpdate
from ..security import require_session
from .workspaces import _get_workspace_or_404

router = APIRouter(tags=["task-categories"], dependencies=[Depends(require_session)])


def _get_category_or_404(db: Session, category_id: uuid.UUID) -> TaskCategory:
    category = db.get(TaskCategory, category_id)
    if category is None or category.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Task category not found")
    return category


@router.get("/api/workspaces/{workspace_id}/task-categories", response_model=list[TaskCategoryOut])
def list_task_categories(workspace_id: uuid.UUID, db: Session = Depends(get_db)):
    _get_workspace_or_404(db, workspace_id)
    stmt = (
        select(TaskCategory)
        .where(TaskCategory.workspace_id == workspace_id, TaskCategory.deleted_at.is_(None))
        .order_by(TaskCategory.sort_order)
    )
    return db.scalars(stmt).all()


@router.post("/api/workspaces/{workspace_id}/task-categories", response_model=TaskCategoryOut, status_code=201)
def create_task_category(workspace_id: uuid.UUID, payload: TaskCategoryCreate, db: Session = Depends(get_db)):
    _get_workspace_or_404(db, workspace_id)
    category = TaskCategory(workspace_id=workspace_id, **payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/api/task-categories/{category_id}", response_model=TaskCategoryOut)
def update_task_category(category_id: uuid.UUID, payload: TaskCategoryUpdate, db: Session = Depends(get_db)):
    category = _get_category_or_404(db, category_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/api/task-categories/{category_id}", status_code=204)
def delete_task_category(category_id: uuid.UUID, db: Session = Depends(get_db)):
    category = _get_category_or_404(db, category_id)
    category.deleted_at = datetime.now(timezone.utc)
    db.commit()
