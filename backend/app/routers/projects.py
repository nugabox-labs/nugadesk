import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Project
from ..schemas import ProjectCreate, ProjectOut, ProjectUpdate
from ..security import require_session
from .task_categories import _get_category_or_404

router = APIRouter(tags=["projects"], dependencies=[Depends(require_session)])


def _get_project_or_404(db: Session, project_id: uuid.UUID) -> Project:
    project = db.get(Project, project_id)
    if project is None or project.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/api/task-categories/{category_id}/projects", response_model=list[ProjectOut])
def list_projects(category_id: uuid.UUID, db: Session = Depends(get_db)):
    _get_category_or_404(db, category_id)
    stmt = (
        select(Project)
        .where(Project.task_category_id == category_id, Project.deleted_at.is_(None))
        .order_by(Project.sort_order)
    )
    return db.scalars(stmt).all()


@router.post("/api/task-categories/{category_id}/projects", response_model=ProjectOut, status_code=201)
def create_project(category_id: uuid.UUID, payload: ProjectCreate, db: Session = Depends(get_db)):
    _get_category_or_404(db, category_id)
    project = Project(task_category_id=category_id, **payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/api/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: uuid.UUID, db: Session = Depends(get_db)):
    return _get_project_or_404(db, project_id)


@router.patch("/api/projects/{project_id}", response_model=ProjectOut)
def update_project(project_id: uuid.UUID, payload: ProjectUpdate, db: Session = Depends(get_db)):
    project = _get_project_or_404(db, project_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/api/projects/{project_id}", status_code=204)
def delete_project(project_id: uuid.UUID, db: Session = Depends(get_db)):
    project = _get_project_or_404(db, project_id)
    project.deleted_at = datetime.now(timezone.utc)
    db.commit()
