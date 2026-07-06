import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Todo
from ..schemas import TodoCreate, TodoOut, TodoUpdate
from ..security import require_session
from .projects import _get_project_or_404

router = APIRouter(tags=["todos"], dependencies=[Depends(require_session)])


def _get_todo_or_404(db: Session, todo_id: uuid.UUID) -> Todo:
    todo = db.get(Todo, todo_id)
    if todo is None or todo.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.get("/api/projects/{project_id}/todos", response_model=list[TodoOut])
def list_todos(project_id: uuid.UUID, db: Session = Depends(get_db)):
    _get_project_or_404(db, project_id)
    stmt = (
        select(Todo)
        .where(Todo.project_id == project_id, Todo.deleted_at.is_(None))
        .order_by(Todo.sort_order)
    )
    return db.scalars(stmt).all()


@router.post("/api/projects/{project_id}/todos", response_model=TodoOut, status_code=201)
def create_todo(project_id: uuid.UUID, payload: TodoCreate, db: Session = Depends(get_db)):
    _get_project_or_404(db, project_id)
    data = payload.model_dump()
    if data.get("status") == "done":
        data["completed_at"] = datetime.now(timezone.utc)
    todo = Todo(project_id=project_id, **data)
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@router.patch("/api/todos/{todo_id}", response_model=TodoOut)
def update_todo(todo_id: uuid.UUID, payload: TodoUpdate, db: Session = Depends(get_db)):
    todo = _get_todo_or_404(db, todo_id)
    updates = payload.model_dump(exclude_unset=True)
    if "status" in updates:
        if updates["status"] == "done" and todo.status != "done":
            todo.completed_at = datetime.now(timezone.utc)
        elif updates["status"] != "done":
            todo.completed_at = None
    for field, value in updates.items():
        setattr(todo, field, value)
    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/api/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: uuid.UUID, db: Session = Depends(get_db)):
    todo = _get_todo_or_404(db, todo_id)
    todo.deleted_at = datetime.now(timezone.utc)
    db.commit()
