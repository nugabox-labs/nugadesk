from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import get_settings

settings = get_settings()

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Arbitrary fixed key for a Postgres session-level advisory lock, used to
# serialize schema creation across the multiple uvicorn worker processes
# started in prod (each runs the FastAPI lifespan independently on boot).
SCHEMA_INIT_LOCK_KEY = 727272001


class Base(DeclarativeBase):
    pass


def init_schema() -> None:
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        conn.execute(text("SELECT pg_advisory_lock(:key)"), {"key": SCHEMA_INIT_LOCK_KEY})
        try:
            Base.metadata.create_all(bind=conn)
        finally:
            conn.execute(text("SELECT pg_advisory_unlock(:key)"), {"key": SCHEMA_INIT_LOCK_KEY})


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
