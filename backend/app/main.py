from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .cleanup import purge_expired_soft_deletes
from .config import get_settings
from .database import SessionLocal, init_schema
from .routers import auth, categories, dashboard, nav, todos, uploads, version
from .uploads import AVATAR_DIR, UPLOAD_ROOT, WORKSPACE_ICON_DIR


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_schema()
    db = SessionLocal()
    try:
        purge_expired_soft_deletes(db)
    finally:
        db.close()
    yield


settings = get_settings()

app = FastAPI(title="NUGADESK API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(version.router)
app.include_router(dashboard.router)
app.include_router(categories.router)
app.include_router(nav.router)
app.include_router(todos.router)
app.include_router(uploads.router)

WORKSPACE_ICON_DIR.mkdir(parents=True, exist_ok=True)
AVATAR_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_ROOT)), name="uploads")


@app.get("/api/health")
def health():
    return {"status": "ok"}
