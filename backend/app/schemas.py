import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CategoryBase(BaseModel):
    name: str
    icon: str | None = Field(default=None, max_length=255)
    color: str | None = None
    icloud_list_uid: str | None = None
    icloud_list_name: str | None = None
    sort_order: int = 0


class CategoryCreate(CategoryBase):
    parent_id: uuid.UUID | None = None


class CategoryUpdate(BaseModel):
    name: str | None = None
    icon: str | None = Field(default=None, max_length=255)
    color: str | None = None
    icloud_list_uid: str | None = None
    icloud_list_name: str | None = None
    sort_order: int | None = None


class CategoryOut(CategoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    parent_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class TodoBase(BaseModel):
    title: str
    notes: str | None = None
    due_date: datetime | None = None
    priority: int = 0
    status: str = "todo"
    sort_order: int = 0


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    title: str | None = None
    notes: str | None = None
    due_date: datetime | None = None
    priority: int | None = None
    status: str | None = None
    sort_order: int | None = None


class TodoOut(TodoBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    category_id: uuid.UUID
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class CategoryTreeOut(CategoryOut):
    children: list["CategoryTreeOut"] = []
    todos: list[TodoOut] = []
    todo_count: int = 0
    done_count: int = 0


CategoryTreeOut.model_rebuild()


class LoginRequest(BaseModel):
    username: str
    password: str
    remember_me: bool = False


class MeOut(BaseModel):
    username: str
    remember: bool
    avatar_url: str | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=4, max_length=255)


class AvatarUpdateRequest(BaseModel):
    avatar_url: str = Field(max_length=255)


class VersionOut(BaseModel):
    version: str
    mode: str
    gitCommit: str
