from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Project, TaskCategory, Todo, Workspace
from ..schemas import WorkspaceTreeOut
from ..security import require_session

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"], dependencies=[Depends(require_session)])


@router.get("", response_model=list[WorkspaceTreeOut])
def get_dashboard_tree(db: Session = Depends(get_db)):
    """Workspace -> task category -> project -> todo, fully nested in one query.

    Backs the main-page overview so the frontend doesn't need a query per
    workspace/category/project (previously an N+1 waterfall of requests).
    """
    stmt = (
        select(Workspace)
        .where(Workspace.deleted_at.is_(None))
        .order_by(Workspace.sort_order)
        .options(
            selectinload(Workspace.task_categories.and_(TaskCategory.deleted_at.is_(None))).options(
                selectinload(TaskCategory.projects.and_(Project.deleted_at.is_(None))).options(
                    selectinload(Project.todos.and_(Todo.deleted_at.is_(None)))
                )
            )
        )
    )
    return db.scalars(stmt).unique().all()
