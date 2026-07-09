from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..models import AppUser
from ..schemas import AvatarUpdateRequest, LoginRequest, MeOut, PasswordChangeRequest
from ..security import (
    SESSION_COOKIE,
    create_session_token,
    hash_password,
    require_session,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _get_user_or_401(db: Session, username: str) -> AppUser:
    user = db.scalar(select(AppUser).where(AppUser.username == username))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user


@router.post("/login")
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(AppUser).where(AppUser.username == payload.username))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    token, max_age = create_session_token(user.username, payload.remember_me)
    settings = get_settings()
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        max_age=max_age,
        httponly=True,
        samesite="lax",
        secure=settings.app_mode == "prod",
        path="/",
    )
    return {"ok": True}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True}


@router.get("/me", response_model=MeOut)
def me(session: dict = Depends(require_session), db: Session = Depends(get_db)):
    user = _get_user_or_401(db, session["sub"])
    return MeOut(username=user.username, remember=session.get("remember", False), avatar_url=user.avatar_url)


@router.patch("/avatar", response_model=MeOut)
def update_avatar(
    payload: AvatarUpdateRequest,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    user = _get_user_or_401(db, session["sub"])
    user.avatar_url = payload.avatar_url
    db.commit()
    db.refresh(user)
    return MeOut(username=user.username, remember=session.get("remember", False), avatar_url=user.avatar_url)


@router.patch("/password")
def change_password(
    payload: PasswordChangeRequest,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    user = _get_user_or_401(db, session["sub"])
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="현재 비밀번호가 올바르지 않습니다.")
    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"ok": True}
