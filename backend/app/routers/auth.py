from fastapi import APIRouter, Depends, HTTPException, Response, status

from ..config import get_settings
from ..schemas import LoginRequest
from ..security import SESSION_COOKIE, create_session_token, require_session, verify_credentials

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(payload: LoginRequest, response: Response):
    if not verify_credentials(payload.username, payload.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    token, max_age = create_session_token(payload.username, payload.remember_me)
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


@router.get("/me")
def me(session: dict = Depends(require_session)):
    return {"username": session["sub"], "remember": session.get("remember", False)}
