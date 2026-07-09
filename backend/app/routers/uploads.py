import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..security import require_session
from ..uploads import AVATAR_DIR, WORKSPACE_ICON_DIR

router = APIRouter(prefix="/api/uploads", tags=["uploads"], dependencies=[Depends(require_session)])

ALLOWED_CONTENT_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_UPLOAD_BYTES = 4 * 1024 * 1024


@router.post("/workspace-icon")
async def upload_workspace_icon(file: UploadFile = File(...)):
    ext = ALLOWED_CONTENT_TYPES.get(file.content_type or "")
    if ext is None:
        raise HTTPException(status_code=400, detail="PNG/JPEG/WEBP/GIF 이미지만 업로드할 수 있습니다.")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="이미지 용량은 4MB 이하여야 합니다.")

    WORKSPACE_ICON_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    (WORKSPACE_ICON_DIR / filename).write_bytes(contents)

    return {"url": f"/api/uploads/workspace-icons/{filename}"}


@router.post("/avatar")
async def upload_avatar(file: UploadFile = File(...)):
    ext = ALLOWED_CONTENT_TYPES.get(file.content_type or "")
    if ext is None:
        raise HTTPException(status_code=400, detail="PNG/JPEG/WEBP/GIF 이미지만 업로드할 수 있습니다.")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="이미지 용량은 4MB 이하여야 합니다.")

    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    (AVATAR_DIR / filename).write_bytes(contents)

    return {"url": f"/api/uploads/avatars/{filename}"}
