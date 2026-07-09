import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..icloud.auto_sync import schedule_icloud_sync
from ..models import Category
from ..schemas import CategoryCreate, CategoryOut, CategoryUpdate
from ..security import require_session

router = APIRouter(prefix="/api/categories", tags=["categories"], dependencies=[Depends(require_session)])


def _get_category_or_404(db: Session, category_id: uuid.UUID) -> Category:
    category = db.get(Category, category_id)
    if category is None or category.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


def _is_mapped(category: Category) -> bool:
    return bool(category.icloud_list_uid or category.icloud_list_name)


def _has_children(db: Session, category_id: uuid.UUID) -> bool:
    stmt = select(Category.id).where(Category.parent_id == category_id, Category.deleted_at.is_(None)).limit(1)
    return db.scalar(stmt) is not None


@router.get("/{category_id}", response_model=CategoryOut)
def get_category(category_id: uuid.UUID, db: Session = Depends(get_db)):
    return _get_category_or_404(db, category_id)


@router.post("", response_model=CategoryOut, status_code=201)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    if payload.parent_id is not None:
        parent = _get_category_or_404(db, payload.parent_id)
        if _is_mapped(parent):
            raise HTTPException(
                status_code=400,
                detail="iCloud 미리알림 리스트와 연결된 분류 아래에는 하위 분류를 만들 수 없습니다.",
            )
    category = Category(**payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    if _is_mapped(category):
        schedule_icloud_sync(category.id)
    return category


@router.patch("/{category_id}", response_model=CategoryOut)
def update_category(category_id: uuid.UUID, payload: CategoryUpdate, db: Session = Depends(get_db)):
    category = _get_category_or_404(db, category_id)
    updates = payload.model_dump(exclude_unset=True)

    wants_mapping = updates.get("icloud_list_uid") or updates.get("icloud_list_name")
    if wants_mapping and not _is_mapped(category) and _has_children(db, category_id):
        raise HTTPException(
            status_code=400,
            detail="하위 분류가 있는 분류는 iCloud 미리알림 리스트와 연결할 수 없습니다.",
        )

    for field, value in updates.items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)
    if _is_mapped(category):
        schedule_icloud_sync(category.id)
    return category


@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: uuid.UUID, db: Session = Depends(get_db)):
    category = _get_category_or_404(db, category_id)
    category.deleted_at = datetime.now(timezone.utc)
    db.commit()
