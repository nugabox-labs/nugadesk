import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import NavPrimaryItem, NavSecondaryItem
from ..schemas import (
    NavPrimaryItemCreate,
    NavPrimaryItemOut,
    NavPrimaryItemUpdate,
    NavReorderRequest,
    NavSecondaryItemCreate,
    NavSecondaryItemOut,
    NavSecondaryItemUpdate,
)
from ..security import require_session

router = APIRouter(prefix="/api/nav", tags=["nav"], dependencies=[Depends(require_session)])

VALID_SECONDARY_TYPES = {"link", "heading", "categories"}


def _validate_secondary_payload(item_type: str, route_path: str | None) -> None:
    if item_type not in VALID_SECONDARY_TYPES:
        raise HTTPException(status_code=400, detail="유효하지 않은 2차 메뉴 유형입니다.")
    if item_type == "link" and not route_path:
        raise HTTPException(status_code=400, detail="링크 유형은 경로가 필요합니다.")
    if item_type in {"heading", "categories"} and route_path:
        raise HTTPException(status_code=400, detail="이 유형은 경로를 설정할 수 없습니다.")


def _get_primary_or_404(db: Session, primary_id: uuid.UUID) -> NavPrimaryItem:
    item = db.get(NavPrimaryItem, primary_id)
    if item is None:
        raise HTTPException(status_code=404, detail="1차 메뉴를 찾을 수 없습니다.")
    return item


def _get_secondary_or_404(db: Session, item_id: uuid.UUID) -> NavSecondaryItem:
    item = db.get(NavSecondaryItem, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="2차 메뉴를 찾을 수 없습니다.")
    return item


@router.get("", response_model=list[NavPrimaryItemOut])
def list_nav(db: Session = Depends(get_db)):
    stmt = (
        select(NavPrimaryItem)
        .options(selectinload(NavPrimaryItem.secondary_items))
        .order_by(NavPrimaryItem.sort_order)
    )
    return list(db.scalars(stmt).all())


@router.post("/primary", response_model=NavPrimaryItemOut, status_code=201)
def create_primary(payload: NavPrimaryItemCreate, db: Session = Depends(get_db)):
    item = NavPrimaryItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/primary/{item_id}", response_model=NavPrimaryItemOut)
def update_primary(item_id: uuid.UUID, payload: NavPrimaryItemUpdate, db: Session = Depends(get_db)):
    item = _get_primary_or_404(db, item_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/primary/{item_id}", status_code=204)
def delete_primary(item_id: uuid.UUID, db: Session = Depends(get_db)):
    item = _get_primary_or_404(db, item_id)
    db.delete(item)
    db.commit()


@router.put("/primary/reorder", response_model=list[NavPrimaryItemOut])
def reorder_primary(payload: NavReorderRequest, db: Session = Depends(get_db)):
    for order, item_id in enumerate(payload.ids):
        item = _get_primary_or_404(db, item_id)
        item.sort_order = order
    db.commit()
    stmt = (
        select(NavPrimaryItem)
        .options(selectinload(NavPrimaryItem.secondary_items))
        .order_by(NavPrimaryItem.sort_order)
    )
    return list(db.scalars(stmt).all())


@router.post("/secondary", response_model=NavSecondaryItemOut, status_code=201)
def create_secondary(payload: NavSecondaryItemCreate, db: Session = Depends(get_db)):
    _get_primary_or_404(db, payload.primary_id)
    _validate_secondary_payload(payload.item_type, payload.route_path)
    if payload.item_type == "categories":
        existing = db.scalar(
            select(NavSecondaryItem.id)
            .where(
                NavSecondaryItem.primary_id == payload.primary_id,
                NavSecondaryItem.item_type == "categories",
            )
            .limit(1)
        )
        if existing:
            raise HTTPException(status_code=400, detail="분류 목록은 1차 메뉴당 하나만 추가할 수 있습니다.")
    item = NavSecondaryItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/secondary/{item_id}", response_model=NavSecondaryItemOut)
def update_secondary(item_id: uuid.UUID, payload: NavSecondaryItemUpdate, db: Session = Depends(get_db)):
    item = _get_secondary_or_404(db, item_id)
    updates = payload.model_dump(exclude_unset=True)
    item_type = updates.get("item_type", item.item_type)
    route_path = updates.get("route_path", item.route_path)
    _validate_secondary_payload(item_type, route_path)
    for field, value in updates.items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/secondary/{item_id}", status_code=204)
def delete_secondary(item_id: uuid.UUID, db: Session = Depends(get_db)):
    item = _get_secondary_or_404(db, item_id)
    db.delete(item)
    db.commit()


@router.put("/secondary/reorder", response_model=list[NavSecondaryItemOut])
def reorder_secondary(payload: NavReorderRequest, primary_id: uuid.UUID, db: Session = Depends(get_db)):
    _get_primary_or_404(db, primary_id)
    for order, item_id in enumerate(payload.ids):
        item = _get_secondary_or_404(db, item_id)
        if item.primary_id != primary_id:
            raise HTTPException(status_code=400, detail="해당 1차 메뉴에 속하지 않는 2차 메뉴입니다.")
        item.sort_order = order
    db.commit()
    stmt = (
        select(NavSecondaryItem)
        .where(NavSecondaryItem.primary_id == primary_id)
        .order_by(NavSecondaryItem.sort_order)
    )
    return list(db.scalars(stmt).all())
