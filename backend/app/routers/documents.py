import json
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Document
from ..schemas import DocumentCreate, DocumentListOut, DocumentOut, DocumentUpdate
from ..security import require_session

router = APIRouter(prefix="/api/documents", tags=["documents"], dependencies=[Depends(require_session)])


def _parse_content(raw: str | None) -> list[dict[str, Any]] | None:
    if not raw:
        return None
    return json.loads(raw)


def _serialize_content(content: list[dict[str, Any]] | None) -> str | None:
    if content is None:
        return None
    return json.dumps(content, ensure_ascii=False)


def _to_out(doc: Document) -> DocumentOut:
    return DocumentOut(
        id=doc.id,
        title=doc.title,
        content=_parse_content(doc.content),
        icon=doc.icon,
        sort_order=doc.sort_order,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


def _get_document_or_404(db: Session, document_id: uuid.UUID) -> Document:
    doc = db.get(Document, document_id)
    if doc is None or doc.deleted_at is not None:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
    return doc


@router.get("", response_model=list[DocumentListOut])
def list_documents(db: Session = Depends(get_db)):
    stmt = (
        select(Document)
        .where(Document.deleted_at.is_(None))
        .order_by(Document.sort_order, Document.updated_at.desc())
    )
    return list(db.scalars(stmt).all())


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(document_id: uuid.UUID, db: Session = Depends(get_db)):
    return _to_out(_get_document_or_404(db, document_id))


@router.post("", response_model=DocumentOut, status_code=201)
def create_document(payload: DocumentCreate, db: Session = Depends(get_db)):
    doc = Document(
        title=payload.title,
        content=_serialize_content(payload.content),
        icon=payload.icon,
        sort_order=payload.sort_order,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return _to_out(doc)


@router.patch("/{document_id}", response_model=DocumentOut)
def update_document(document_id: uuid.UUID, payload: DocumentUpdate, db: Session = Depends(get_db)):
    doc = _get_document_or_404(db, document_id)
    updates = payload.model_dump(exclude_unset=True)
    if "content" in updates:
        updates["content"] = _serialize_content(updates["content"])
    for field, value in updates.items():
        setattr(doc, field, value)
    db.commit()
    db.refresh(doc)
    return _to_out(doc)


@router.delete("/{document_id}", status_code=204)
def delete_document(document_id: uuid.UUID, db: Session = Depends(get_db)):
    doc = _get_document_or_404(db, document_id)
    doc.deleted_at = datetime.now(timezone.utc)
    db.commit()
