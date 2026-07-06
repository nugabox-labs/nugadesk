import subprocess

from fastapi import APIRouter

from ..config import REPO_ROOT, get_settings, read_version
from ..schemas import VersionOut

router = APIRouter(prefix="/api", tags=["version"])


def get_git_commit(settings) -> str:
    if settings.git_commit_override:
        return settings.git_commit_override
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=5,
            check=True,
        )
        return result.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError, OSError):
        return "no-git"


@router.get("/version", response_model=VersionOut)
def get_version():
    settings = get_settings()
    version = settings.version_override or read_version()
    return VersionOut(version=version, mode=settings.app_mode, gitCommit=get_git_commit(settings))
