import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Workspace
from ..schemas import WorkspaceCreate, WorkspaceOut, WorkspaceUpdate
from ..security import require_session

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"], dependencies=[Depends(require_session)])


def _get_workspace_or_404(db: Session, workspace_id: uuid.UUID) -> Workspace:
    workspace = db.get(Workspace, workspace_id)
    if workspace is None or workspace.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


@router.get("", response_model=list[WorkspaceOut])
def list_workspaces(db: Session = Depends(get_db)):
    stmt = select(Workspace).where(Workspace.deleted_at.is_(None)).order_by(Workspace.sort_order)
    return db.scalars(stmt).all()


@router.post("", response_model=WorkspaceOut, status_code=201)
def create_workspace(payload: WorkspaceCreate, db: Session = Depends(get_db)):
    workspace = Workspace(**payload.model_dump())
    db.add(workspace)
    db.commit()
    db.refresh(workspace)
    return workspace


@router.get("/{workspace_id}", response_model=WorkspaceOut)
def get_workspace(workspace_id: uuid.UUID, db: Session = Depends(get_db)):
    return _get_workspace_or_404(db, workspace_id)


@router.patch("/{workspace_id}", response_model=WorkspaceOut)
def update_workspace(workspace_id: uuid.UUID, payload: WorkspaceUpdate, db: Session = Depends(get_db)):
    workspace = _get_workspace_or_404(db, workspace_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(workspace, field, value)
    db.commit()
    db.refresh(workspace)
    return workspace


@router.delete("/{workspace_id}", status_code=204)
def delete_workspace(workspace_id: uuid.UUID, db: Session = Depends(get_db)):
    workspace = _get_workspace_or_404(db, workspace_id)
    workspace.deleted_at = datetime.now(timezone.utc)
    db.commit()
