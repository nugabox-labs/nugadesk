import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import BookmarkLink
from ..schemas import BookmarkLinkCreate, BookmarkLinkOut, BookmarkLinkUpdate, NavReorderRequest
from ..security import require_session

router = APIRouter(prefix="/api/links", tags=["links"], dependencies=[Depends(require_session)])


def _get_link_or_404(db: Session, link_id: uuid.UUID) -> BookmarkLink:
    link = db.get(BookmarkLink, link_id)
    if link is None:
        raise HTTPException(status_code=404, detail="링크를 찾을 수 없습니다.")
    return link


@router.get("", response_model=list[BookmarkLinkOut])
def list_links(db: Session = Depends(get_db)):
    stmt = select(BookmarkLink).order_by(BookmarkLink.sort_order)
    return list(db.scalars(stmt).all())


@router.post("", response_model=BookmarkLinkOut, status_code=201)
def create_link(payload: BookmarkLinkCreate, db: Session = Depends(get_db)):
    link = BookmarkLink(**payload.model_dump())
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.patch("/{link_id}", response_model=BookmarkLinkOut)
def update_link(link_id: uuid.UUID, payload: BookmarkLinkUpdate, db: Session = Depends(get_db)):
    link = _get_link_or_404(db, link_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(link, field, value)
    db.commit()
    db.refresh(link)
    return link


@router.delete("/{link_id}", status_code=204)
def delete_link(link_id: uuid.UUID, db: Session = Depends(get_db)):
    link = _get_link_or_404(db, link_id)
    db.delete(link)
    db.commit()


@router.put("/reorder", response_model=list[BookmarkLinkOut])
def reorder_links(payload: NavReorderRequest, db: Session = Depends(get_db)):
    for order, link_id in enumerate(payload.ids):
        link = _get_link_or_404(db, link_id)
        link.sort_order = order
    db.commit()
    stmt = select(BookmarkLink).order_by(BookmarkLink.sort_order)
    return list(db.scalars(stmt).all())
