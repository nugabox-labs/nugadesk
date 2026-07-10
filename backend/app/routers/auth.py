from fastapi import APIRouter, Depends, Form, HTTPException, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..apple_auth import verify_apple_id_token
from ..config import get_settings
from ..database import get_db
from ..models import AppUser
from ..schemas import (
    AppleAuthConfigOut,
    AppleLinkRequest,
    AppleLoginRequest,
    AvatarUpdateRequest,
    LoginRequest,
    MeOut,
    PasswordChangeRequest,
)
from ..security import (
    SESSION_COOKIE,
    create_session_token,
    hash_password,
    require_session,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _set_session_cookie(response: Response, username: str, remember_me: bool) -> None:
    token, max_age = create_session_token(username, remember_me)
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


def _get_user_or_401(db: Session, username: str) -> AppUser:
    user = db.scalar(select(AppUser).where(AppUser.username == username))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user


def _me_out(user: AppUser, remember: bool) -> MeOut:
    return MeOut(
        username=user.username,
        remember=remember,
        avatar_url=user.avatar_url,
        apple_linked=user.apple_sub is not None,
    )


def _verify_apple_sub(id_token: str) -> str:
    settings = get_settings()
    client_id = settings.apple_client_id.strip()
    if not client_id:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Apple 로그인이 설정되지 않았습니다.")

    claims = verify_apple_id_token(id_token, client_id)
    apple_sub = claims.get("sub")
    if not apple_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Apple 로그인 정보가 불완전합니다.")
    return apple_sub


@router.get("/apple/config", response_model=AppleAuthConfigOut)
def apple_config():
    settings = get_settings()
    client_id = settings.apple_client_id.strip()
    redirect_uri = settings.apple_redirect_uri.strip()
    if not client_id or not redirect_uri:
        return AppleAuthConfigOut(enabled=False)
    return AppleAuthConfigOut(
        enabled=True,
        client_id=client_id,
        redirect_uri=redirect_uri,
        login_redirect_uri=settings.apple_login_redirect_uri.strip() or None,
    )


@router.post("/login")
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(AppUser).where(AppUser.username == payload.username))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    _set_session_cookie(response, user.username, payload.remember_me)
    return {"ok": True}


@router.post("/apple/callback")
def apple_callback(
    db: Session = Depends(get_db),
    id_token: str = Form(...),
    state: str = Form(default=""),
):
    """Apple이 response_mode=form_post로 직접 POST하는 로그인 페이지 전체-리다이렉트 콜백.

    scope에 name/email이 있으면 Apple은 fragment/query가 아닌 form_post만 허용하므로,
    정적 파일만 서빙하는 nginx가 405를 내지 않도록 /api/ 하위(백엔드 프록시)로 받는다.
    로그인 성공/실패 모두 세션 쿠키만 얹고 프론트 라우트로 303 리다이렉트한다.
    """
    remember_me = state.endswith("-remember-1")

    try:
        apple_sub = _verify_apple_sub(id_token)
    except HTTPException:
        return RedirectResponse(url="/login?apple_error=invalid", status_code=status.HTTP_303_SEE_OTHER)

    user = db.scalar(select(AppUser).where(AppUser.apple_sub == apple_sub))
    if user is None:
        return RedirectResponse(url="/login?apple_error=notlinked", status_code=status.HTTP_303_SEE_OTHER)

    redirect = RedirectResponse(url="/", status_code=status.HTTP_303_SEE_OTHER)
    _set_session_cookie(redirect, user.username, remember_me)
    return redirect


@router.post("/apple/login")
def apple_login(payload: AppleLoginRequest, response: Response, db: Session = Depends(get_db)):
    apple_sub = _verify_apple_sub(payload.id_token)

    user = db.scalar(select(AppUser).where(AppUser.apple_sub == apple_sub))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Apple 로그인이 연결되지 않았습니다. 설정에서 먼저 연결해 주세요.",
        )

    _set_session_cookie(response, user.username, payload.remember_me)
    return {"ok": True}


@router.post("/apple/link", response_model=MeOut)
def apple_link(
    payload: AppleLinkRequest,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    user = _get_user_or_401(db, session["sub"])
    if user.apple_sub is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="이미 Apple 로그인이 연결되어 있습니다.")

    apple_sub = _verify_apple_sub(payload.id_token)

    existing = db.scalar(select(AppUser).where(AppUser.apple_sub == apple_sub))
    if existing is not None and existing.id != user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이 Apple 계정은 다른 사용자에 이미 연결되어 있습니다.",
        )

    user.apple_sub = apple_sub
    db.commit()
    db.refresh(user)
    return _me_out(user, session.get("remember", False))


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True}


@router.get("/me", response_model=MeOut)
def me(session: dict = Depends(require_session), db: Session = Depends(get_db)):
    user = _get_user_or_401(db, session["sub"])
    return _me_out(user, session.get("remember", False))


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
    return _me_out(user, session.get("remember", False))


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
