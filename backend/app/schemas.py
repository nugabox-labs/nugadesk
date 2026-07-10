import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .todo_repeat import REPEAT_RULES


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
    priority: int = Field(default=0, ge=0, le=1)
    repeat_rule: str | None = None
    status: str = "todo"
    sort_order: int = 0

    @field_validator("repeat_rule")
    @classmethod
    def validate_repeat_rule(cls, value: str | None) -> str | None:
        if value is not None and value not in REPEAT_RULES:
            raise ValueError("repeat_rule must be one of: daily, weekly, monthly, yearly")
        return value


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    title: str | None = None
    notes: str | None = None
    due_date: datetime | None = None
    priority: int | None = Field(default=None, ge=0, le=1)
    repeat_rule: str | None = None
    status: str | None = None
    sort_order: int | None = None

    @field_validator("repeat_rule")
    @classmethod
    def validate_repeat_rule(cls, value: str | None) -> str | None:
        if value is not None and value not in REPEAT_RULES:
            raise ValueError("repeat_rule must be one of: daily, weekly, monthly, yearly")
        return value


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


class AppleAuthConfigOut(BaseModel):
    enabled: bool
    client_id: str | None = None
    redirect_uri: str | None = None
    login_redirect_uri: str | None = None


class AppleLinkRequest(BaseModel):
    id_token: str


class AppleLoginRequest(BaseModel):
    id_token: str
    remember_me: bool = False


class MeOut(BaseModel):
    username: str
    remember: bool
    avatar_url: str | None = None
    apple_linked: bool = False


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=4, max_length=255)


class AvatarUpdateRequest(BaseModel):
    avatar_url: str = Field(max_length=255)


class VersionOut(BaseModel):
    version: str
    mode: str
    gitCommit: str


NavSecondaryItemType = str  # link | heading | categories


class NavSecondaryItemBase(BaseModel):
    item_type: NavSecondaryItemType = "link"
    label: str = Field(max_length=50)
    icon: str | None = Field(default=None, max_length=255)
    route_path: str | None = Field(default=None, max_length=100)
    page_title: str | None = Field(default=None, max_length=100)
    page_description: str | None = None
    sort_order: int = 0


class NavSecondaryItemCreate(NavSecondaryItemBase):
    primary_id: uuid.UUID


class NavSecondaryItemUpdate(BaseModel):
    item_type: NavSecondaryItemType | None = None
    label: str | None = Field(default=None, max_length=50)
    icon: str | None = Field(default=None, max_length=255)
    route_path: str | None = Field(default=None, max_length=100)
    page_title: str | None = Field(default=None, max_length=100)
    page_description: str | None = None
    sort_order: int | None = None


class NavSecondaryItemOut(NavSecondaryItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    primary_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class NavPrimaryItemBase(BaseModel):
    label: str = Field(max_length=50)
    icon: str | None = Field(default=None, max_length=255)
    route_path: str = Field(max_length=100)
    path_prefixes: str | None = Field(default=None, max_length=255)
    page_title: str | None = Field(default=None, max_length=100)
    page_description: str | None = None
    sort_order: int = 0


class NavPrimaryItemCreate(NavPrimaryItemBase):
    pass


class NavPrimaryItemUpdate(BaseModel):
    label: str | None = Field(default=None, max_length=50)
    icon: str | None = Field(default=None, max_length=255)
    route_path: str | None = Field(default=None, max_length=100)
    path_prefixes: str | None = Field(default=None, max_length=255)
    page_title: str | None = Field(default=None, max_length=100)
    page_description: str | None = None
    sort_order: int | None = None


class NavPrimaryItemOut(NavPrimaryItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    secondary_items: list[NavSecondaryItemOut] = []


class NavReorderRequest(BaseModel):
    ids: list[uuid.UUID] = Field(min_length=1)


class DocumentBase(BaseModel):
    title: str = Field(max_length=255)
    content: list[dict[str, Any]] | None = None
    icon: str | None = Field(default=None, max_length=255)
    sort_order: int = 0


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    content: list[dict[str, Any]] | None = None
    icon: str | None = Field(default=None, max_length=255)
    sort_order: int | None = None


class DocumentListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    icon: str | None
    sort_order: int
    created_at: datetime
    updated_at: datetime


class DocumentOut(DocumentBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class BookmarkLinkBase(BaseModel):
    title: str = Field(max_length=100)
    url: str = Field(max_length=500)
    note: str | None = Field(default=None, max_length=255)
    sort_order: int = 0


class BookmarkLinkCreate(BookmarkLinkBase):
    pass


class BookmarkLinkUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=100)
    url: str | None = Field(default=None, max_length=500)
    note: str | None = Field(default=None, max_length=255)
    sort_order: int | None = None


class BookmarkLinkOut(BookmarkLinkBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class IcloudConnectRequest(BaseModel):
    apple_id_email: str = Field(min_length=3, max_length=255)
    app_specific_password: str = Field(min_length=8, max_length=64)


class IcloudReminderListOut(BaseModel):
    uid: str
    name: str


class IcloudListsResponse(BaseModel):
    lists: list[IcloudReminderListOut]


class IcloudConnectResponse(BaseModel):
    connected: bool
    apple_id_email: str
    connected_at: datetime
    reminder_lists: list[IcloudReminderListOut]


class IcloudStatusOut(BaseModel):
    connected: bool
    apple_id_email: str | None = None
    connected_at: datetime | None = None
    last_sync_at: datetime | None = None
    last_sync_error: str | None = None
    reminder_list_count: int | None = None
    poll_enabled: bool = True
    poll_interval_seconds: int = 300
    auto_sync_debounce_seconds: int = 3


class IcloudSyncResponse(BaseModel):
    ok: bool
    message: str
    pulled: int = 0
    pushed: int = 0
    updated: int = 0
    deleted: int = 0
    skipped: int = 0
