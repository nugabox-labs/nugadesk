import uuid
from datetime import datetime

from sqlalchemy import (
    ForeignKey,
    Integer,
    LargeBinary,
    SmallInteger,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def uuid_pk():
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class AppUser(Base):
    """Single-row-in-practice user table (2026-07-09) — this app has no signup, but a real row
    lets the profile card show an avatar and support in-app password changes instead of the
    password living only in `.env`. Seeded once from `AUTH_USERNAME`/`AUTH_PASSWORD` on first boot
    by `database.py::_seed_app_user()` if the table is empty; after that the DB row is the source
    of truth for login, not `.env` (which just becomes the recovery seed for a fresh database).
    """

    __tablename__ = "app_users"

    id: Mapped[uuid.UUID] = uuid_pk()
    username: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(255))
    # Sign in with Apple — Apple이 발급한 고유 subject. 최초 Apple 로그인 시 자동 연결.
    apple_sub: Mapped[str | None] = mapped_column(String(255), unique=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    icloud_connection: Mapped["IcloudConnection | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class IcloudConnection(Base):
    """Encrypted CalDAV credentials for the single app user (phase 1 of iCloud Reminders sync)."""

    __tablename__ = "icloud_connections"

    id: Mapped[uuid.UUID] = uuid_pk()
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("app_users.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    apple_id_email: Mapped[str] = mapped_column(String(255), nullable=False)
    app_password_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    connected_at: Mapped[datetime] = mapped_column(server_default=func.now())
    last_sync_at: Mapped[datetime | None] = mapped_column(nullable=True)
    last_sync_error: Mapped[str | None] = mapped_column(Text)
    reminder_list_count: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["AppUser"] = relationship(back_populates="icloud_connection")


class UploadedFile(Base):
    """업로드 이미지 바이너리 — 로컬/배포 환경이 달라도 원격 DB만 공유하면 동일하게 로드."""

    __tablename__ = "uploaded_files"

    id: Mapped[uuid.UUID] = uuid_pk()
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    data: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class Category(Base):
    """Recursive 분류 node — mirrors Apple Reminders' List Group / List split:
    a category can nest child categories UNLESS it's mapped to an iCloud
    Reminders list (icloud_list_uid/name set), in which case it's a leaf that
    holds todos directly, just like a real iCloud list can't contain sub-lists.
    Enforced in routers/categories.py, not at the DB level.
    """

    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = uuid_pk()
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(255))  # emoji, or an uploaded image URL
    color: Mapped[str | None] = mapped_column(String(20))
    icloud_list_uid: Mapped[str | None] = mapped_column(String(255))
    icloud_list_name: Mapped[str | None] = mapped_column(String(100))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True)

    children: Mapped[list["Category"]] = relationship(
        back_populates="parent", cascade="all, delete-orphan", order_by="Category.sort_order"
    )
    parent: Mapped["Category | None"] = relationship(back_populates="children", remote_side=[id])
    todos: Mapped[list["Todo"]] = relationship(
        back_populates="category", cascade="all, delete-orphan", order_by="Todo.sort_order"
    )


class Todo(Base):
    __tablename__ = "todos"

    id: Mapped[uuid.UUID] = uuid_pk()
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"))
    icloud_todo_uid: Mapped[str | None] = mapped_column(String(255))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    due_date: Mapped[datetime | None] = mapped_column(nullable=True)
    priority: Mapped[int] = mapped_column(SmallInteger, default=0)  # 0=보통, 1=긴급
    repeat_rule: Mapped[str | None] = mapped_column(String(20), nullable=True)  # daily|weekly|monthly|yearly
    status: Mapped[str] = mapped_column(String(20), default="todo")  # todo, in_progress, done
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    last_synced_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True)

    category: Mapped["Category"] = relationship(back_populates="todos")


class NavPrimaryItem(Base):
    """1차 메뉴 (PrimaryNav 상단 라우트 항목). 설정/프로필은 하드코딩 chrome이라 여기 없음."""

    __tablename__ = "nav_primary_items"

    id: Mapped[uuid.UUID] = uuid_pk()
    label: Mapped[str] = mapped_column(String(50), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(255))
    route_path: Mapped[str] = mapped_column(String(100), nullable=False)
    # 콤마 구분 추가 경로 접두사 — 활성 섹션 판별용 (예: 작업 섹션의 `/category`)
    path_prefixes: Mapped[str | None] = mapped_column(String(255))
    page_title: Mapped[str | None] = mapped_column(String(100))
    page_description: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    secondary_items: Mapped[list["NavSecondaryItem"]] = relationship(
        back_populates="primary",
        cascade="all, delete-orphan",
        order_by="NavSecondaryItem.sort_order",
    )


class NavSecondaryItem(Base):
    """2차 메뉴 (Sidebar 패널 항목). item_type: link | heading | categories."""

    __tablename__ = "nav_secondary_items"

    id: Mapped[uuid.UUID] = uuid_pk()
    primary_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("nav_primary_items.id", ondelete="CASCADE"), nullable=False
    )
    item_type: Mapped[str] = mapped_column(String(20), nullable=False, default="link")
    label: Mapped[str] = mapped_column(String(50), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(255))
    route_path: Mapped[str | None] = mapped_column(String(100))
    page_title: Mapped[str | None] = mapped_column(String(100))
    page_description: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    primary: Mapped["NavPrimaryItem"] = relationship(back_populates="secondary_items")


class Document(Base):
    """정보 섹션의 노션 스타일 마크다운 문서. content는 BlockNote JSON 블록 배열."""

    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = uuid_pk()
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str | None] = mapped_column(Text)  # JSON-serialized BlockNote blocks
    icon: Mapped[str | None] = mapped_column(String(255))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True)


class BookmarkLink(Base):
    """홈 > 링크 모음에 표시되는 북마크."""

    __tablename__ = "bookmark_links"

    id: Mapped[uuid.UUID] = uuid_pk()
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    note: Mapped[str | None] = mapped_column(String(255))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
