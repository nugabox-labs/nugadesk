import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Cookie, HTTPException, status

from .config import get_settings

SESSION_COOKIE = "nugadesk_session"
ALGORITHM = "HS256"

PBKDF2_ALGORITHM = "sha256"
PBKDF2_ITERATIONS = 200_000


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac(PBKDF2_ALGORITHM, password.encode(), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_{PBKDF2_ALGORITHM}${PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algo, iterations, salt_hex, digest_hex = stored_hash.split("$")
        algo = algo.removeprefix("pbkdf2_")
        computed = hashlib.pbkdf2_hmac(algo, password.encode(), bytes.fromhex(salt_hex), int(iterations))
        return hmac.compare_digest(computed.hex(), digest_hex)
    except (ValueError, AttributeError):
        return False


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
