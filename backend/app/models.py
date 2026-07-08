import uuid
from datetime import datetime

from sqlalchemy import (
    ForeignKey,
    Integer,
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
    priority: Mapped[int] = mapped_column(SmallInteger, default=0)
    status: Mapped[str] = mapped_column(String(20), default="todo")  # todo, in_progress, done
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    last_synced_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True)

    category: Mapped["Category"] = relationship(back_populates="todos")
