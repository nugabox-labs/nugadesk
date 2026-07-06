import hmac
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Cookie, HTTPException, status

from .config import get_settings

SESSION_COOKIE = "nugadesk_session"
ALGORITHM = "HS256"


def verify_credentials(username: str, password: str) -> bool:
    settings = get_settings()
    return hmac.compare_digest(username, settings.auth_username) and hmac.compare_digest(
        password, settings.auth_password
    )


def create_session_token(username: str, remember_me: bool) -> tuple[str, int]:
    settings = get_settings()
    if remember_me:
        max_age = settings.session_remember_days * 24 * 3600
    else:
        max_age = settings.session_short_hours * 3600

    expire = datetime.now(timezone.utc) + timedelta(seconds=max_age)
    payload = {"sub": username, "exp": expire, "remember": remember_me}
    token = jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)
    return token, max_age


def decode_session_token(token: str) -> dict:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session") from exc


def require_session(nugadesk_session: str | None = Cookie(default=None, alias=SESSION_COOKIE)) -> dict:
    if not nugadesk_session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return decode_session_token(nugadesk_session)
