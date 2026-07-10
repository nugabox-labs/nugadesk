"""Sign in with Apple — id_token 검증 (JWKS).

웹 팝업 플로우에서는 Apple JS SDK가 id_token을 직접 반환하므로, 서버 측에서는
Apple 공개키로 id_token만 검증하면 된다. (.p8 개인키는 서버-투-서버 토큰 교환 시에만 필요)
"""

from functools import lru_cache

import jwt
from fastapi import HTTPException, status
from jwt import PyJWKClient

APPLE_ISSUER = "https://appleid.apple.com"
APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"


@lru_cache
def _jwks_client() -> PyJWKClient:
    return PyJWKClient(APPLE_JWKS_URL, cache_keys=True)


def verify_apple_id_token(id_token: str, client_id: str) -> dict:
    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(id_token)
        return jwt.decode(
            id_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=client_id,
            issuer=APPLE_ISSUER,
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Apple 로그인 토큰이 유효하지 않습니다.",
        ) from exc
