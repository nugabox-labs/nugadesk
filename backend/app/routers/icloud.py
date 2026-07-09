from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from ..icloud.auto_sync import schedule_icloud_sync
from ..icloud.caldav_client import IcloudCalDavError, probe_icloud_reminders
from ..icloud.credentials import decrypt_secret, encrypt_secret
from ..icloud.service import execute_icloud_sync, record_icloud_sync_error
from ..models import AppUser, IcloudConnection
from ..schemas import (
    IcloudConnectRequest,
    IcloudConnectResponse,
    IcloudListsResponse,
    IcloudReminderListOut,
    IcloudStatusOut,
    IcloudSyncResponse,
)
from ..security import require_session

router = APIRouter(prefix="/api/icloud", tags=["icloud"])


def _get_user(db: Session, username: str) -> AppUser:
    user = db.scalar(select(AppUser).where(AppUser.username == username))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user


def _get_connection(db: Session, user_id) -> IcloudConnection | None:
    return db.scalar(select(IcloudConnection).where(IcloudConnection.user_id == user_id))


def _require_connection(db: Session, user_id) -> IcloudConnection:
    conn = _get_connection(db, user_id)
    if conn is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="iCloud가 연결되어 있지 않습니다.")
    return conn


def _decrypt_app_password(conn: IcloudConnection) -> str:
    try:
        return decrypt_secret(conn.app_password_encrypted)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc


@router.get("/status", response_model=IcloudStatusOut)
def icloud_status(session: dict = Depends(require_session), db: Session = Depends(get_db)):
    settings = get_settings()
    user = _get_user(db, session["sub"])
    conn = _get_connection(db, user.id)
    if conn is None:
        return IcloudStatusOut(
            connected=False,
            poll_enabled=settings.icloud_poll_enabled,
            poll_interval_seconds=settings.icloud_poll_interval_seconds,
            auto_sync_debounce_seconds=settings.icloud_auto_sync_debounce_seconds,
        )

    return IcloudStatusOut(
        connected=True,
        apple_id_email=conn.apple_id_email,
        connected_at=conn.connected_at,
        last_sync_at=conn.last_sync_at,
        last_sync_error=conn.last_sync_error,
        reminder_list_count=conn.reminder_list_count,
        poll_enabled=settings.icloud_poll_enabled,
        poll_interval_seconds=settings.icloud_poll_interval_seconds,
        auto_sync_debounce_seconds=settings.icloud_auto_sync_debounce_seconds,
    )


@router.get("/lists", response_model=IcloudListsResponse)
def icloud_lists(session: dict = Depends(require_session), db: Session = Depends(get_db)):
    user = _get_user(db, session["sub"])
    conn = _require_connection(db, user.id)
    app_password = _decrypt_app_password(conn)

    try:
        reminder_lists = probe_icloud_reminders(conn.apple_id_email, app_password)
    except IcloudCalDavError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return IcloudListsResponse(
        lists=[IcloudReminderListOut(uid=item.uid, name=item.name) for item in reminder_lists]
    )


@router.post("/connect", response_model=IcloudConnectResponse)
def icloud_connect(
    payload: IcloudConnectRequest,
    session: dict = Depends(require_session),
    db: Session = Depends(get_db),
):
    user = _get_user(db, session["sub"])
    apple_id = payload.apple_id_email.strip()
    app_password = payload.app_specific_password.replace(" ", "").strip()

    try:
        reminder_lists = probe_icloud_reminders(apple_id, app_password)
    except IcloudCalDavError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    conn = _get_connection(db, user.id)
    now = datetime.now(timezone.utc)
    if conn is None:
        conn = IcloudConnection(user_id=user.id)
        db.add(conn)

    conn.apple_id_email = apple_id
    conn.app_password_encrypted = encrypt_secret(app_password)
    conn.connected_at = now
    conn.last_sync_at = None
    conn.last_sync_error = None
    conn.reminder_list_count = len(reminder_lists)
    db.commit()
    db.refresh(conn)

    schedule_icloud_sync(None)

    return IcloudConnectResponse(
        connected=True,
        apple_id_email=conn.apple_id_email,
        connected_at=conn.connected_at,
        reminder_lists=[
            IcloudReminderListOut(uid=item.uid, name=item.name) for item in reminder_lists
        ],
    )


@router.delete("/disconnect")
def icloud_disconnect(session: dict = Depends(require_session), db: Session = Depends(get_db)):
    user = _get_user(db, session["sub"])
    conn = _get_connection(db, user.id)
    if conn is not None:
        db.delete(conn)
        db.commit()
    return {"ok": True}


@router.post("/sync", response_model=IcloudSyncResponse)
def icloud_sync(session: dict = Depends(require_session), db: Session = Depends(get_db)):
    _require_connection(db, _get_user(db, session["sub"]).id)

    try:
        stats, message = execute_icloud_sync(db, refresh_list_count=True)
    except IcloudCalDavError as exc:
        record_icloud_sync_error(db, str(exc))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return IcloudSyncResponse(
        ok=True,
        message=message,
        pulled=stats.pulled,
        pushed=stats.pushed,
        updated=stats.updated,
        deleted=stats.deleted,
        skipped=stats.skipped,
    )
