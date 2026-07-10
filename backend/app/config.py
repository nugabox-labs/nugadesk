from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_mode: str = "dev"  # dev | prod
    database_url: str = "postgresql+psycopg://nugadesk:nugadesk@localhost:5432/nugadesk"
    secret_key: str = "change-me-in-env"
    auth_username: str = "admin"
    auth_password: str = "change-me"
    cors_origins: str = "http://localhost:5173"

    session_short_hours: int = 12
    session_remember_days: int = 180

    # Sign in with Apple (웹 Services ID). 비어 있으면 Apple 로그인 버튼 비활성.
    apple_client_id: str = ""
    # Apple Developer에 등록한 Return URL (HTTPS 도메인만 허용, localhost 불가).
    apple_redirect_uri: str = ""

    icloud_poll_enabled: bool = True
    icloud_poll_interval_seconds: int = 300
    icloud_auto_sync_debounce_seconds: int = 3

    # Injected at container start by compose.sh, since the backend container
    # only mounts backend/ and cannot see the repo-root VERSION file or .git.
    version_override: str | None = None
    git_commit_override: str | None = None

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


def read_version() -> str:
    version_file = REPO_ROOT / "VERSION"
    try:
        return version_file.read_text().strip()
    except FileNotFoundError:
        return "0.0"
