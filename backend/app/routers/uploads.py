import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import UploadedFile
from ..security import require_session

router = APIRouter(prefix="/api/uploads", tags=["uploads"], dependencies=[Depends(require_session)])

ALLOWED_CONTENT_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_UPLOAD_BYTES = 4 * 1024 * 1024


def _store_upload(db: Session, contents: bytes, content_type: str) -> str:
    row = UploadedFile(content_type=content_type, data=contents)
    db.add(row)
    db.commit()
    db.refresh(row)
    return f"/api/uploads/files/{row.id}"


@router.get("/files/{file_id}")
def get_uploaded_file(file_id: uuid.UUID, db: Session = Depends(get_db)):
    """DB에 저장된 업로드 이미지 — 환경 간 공유 DB에서도 동일 URL로 로드."""
    row = db.get(UploadedFile, file_id)
    if row is None:
        raise HTTPException(status_code=404, detail="File not found")
    return Response(content=row.data, media_type=row.content_type)


@router.post("/workspace-icon")
async def upload_workspace_icon(file: UploadFile = File(...), db: Session = Depends(get_db)):
    ext = ALLOWED_CONTENT_TYPES.get(file.content_type or "")
    if ext is None:
        raise HTTPException(status_code=400, detail="PNG/JPEG/WEBP/GIF 이미지만 업로드할 수 있습니다.")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="이미지 용량은 4MB 이하여야 합니다.")

    return {"url": _store_upload(db, contents, file.content_type or "application/octet-stream")}


@router.post("/avatar")
async def upload_avatar(file: UploadFile = File(...), db: Session = Depends(get_db)):
    ext = ALLOWED_CONTENT_TYPES.get(file.content_type or "")
    if ext is None:
        raise HTTPException(status_code=400, detail="PNG/JPEG/WEBP/GIF 이미지만 업로드할 수 있습니다.")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="이미지 용량은 4MB 이하여야 합니다.")

    return {"url": _store_upload(db, contents, file.content_type or "application/octet-stream")}
