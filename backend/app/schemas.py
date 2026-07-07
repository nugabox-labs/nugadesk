import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class WorkspaceBase(BaseModel):
    name: str
    icon: str | None = Field(default=None, max_length=255)
    color: str | None = None
    sort_order: int = 0


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceUpdate(BaseModel):
    name: str | None = None
    icon: str | None = Field(default=None, max_length=255)
    color: str | None = None
    sort_order: int | None = None


class WorkspaceOut(WorkspaceBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class TaskCategoryBase(BaseModel):
    name: str
    icloud_list_uid: str | None = None
    icloud_list_name: str | None = None
    sort_order: int = 0


class TaskCategoryCreate(TaskCategoryBase):
    pass


class TaskCategoryUpdate(BaseModel):
    name: str | None = None
    icloud_list_uid: str | None = None
    icloud_list_name: str | None = None
    sort_order: int | None = None


class TaskCategoryOut(TaskCategoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    workspace_id: uuid.UUID
    created_at: datetime


class ProjectBase(BaseModel):
    name: str
    description: str | None = None
    status: str = "active"
    sort_order: int = 0


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None
    sort_order: int | None = None


class ProjectOut(ProjectBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    task_category_id: uuid.UUID
    created_at: datetime


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
    project_id: uuid.UUID
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class LoginRequest(BaseModel):
    username: str
    password: str
    remember_me: bool = False


class VersionOut(BaseModel):
    version: str
    mode: str
    gitCommit: str
