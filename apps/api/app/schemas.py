from sqlmodel import SQLModel, Field
from typing import List, Optional
from datetime import datetime
from pydantic import field_validator, EmailStr
import re

# --- Tag Schemas ---

class TagRead(SQLModel):
    id: int
    name: str
    color: str

class FolderRead(SQLModel):
    id: int
    name: str

class FolderCreate(SQLModel):
    name: str

class NoteRead(SQLModel):
    id: int
    text: str
    type: str = "word" # Add type field with a default
    translation: Optional[dict] = None
    tags: List[TagRead] = []
    corrected_text: Optional[str] = None
    folder_id: Optional[int] = None
    folder: Optional[FolderRead] = None


# --- Note Schemas ---

class NoteCreate(SQLModel):
    text: str
    tags: Optional[List[str]] = []
    folder_id: Optional[int] = None

class NoteUpdate(SQLModel):
    text: Optional[str] = None
    type: Optional[str] = None
    translation: Optional[dict] = None
    tags: Optional[List[str]] = None
    corrected_text: Optional[str] = None
    folder_id: Optional[int] = None

# --- User Schemas ---

class UserCreate(SQLModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v

    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v

class UserRead(SQLModel):
    id: int
    username: str
    email: str

# --- Token Schemas ---

class Token(SQLModel):
    access_token: str
    token_type: str
    user: UserRead

# --- Practice List Schemas ---

class PracticeListCreate(SQLModel):
    name: str
    description: Optional[str] = None
    settings: Optional[dict] = None

class PracticeListUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[dict] = None

class PracticeListRead(SQLModel):
    id: int
    name: str
    description: Optional[str] = None
    settings: Optional[dict] = None
    created_at: datetime
    updated_at: datetime
    item_count: int = 0

class PracticeListDetail(PracticeListRead):
    items: List["PracticeListItemRead"] = []

# --- Practice List Item Schemas ---

class PracticeListItemCreate(SQLModel):
    note_ids: List[int]  # 支持批量添加

class PracticeListItemRead(SQLModel):
    id: int
    note_id: int
    note: NoteRead
    order_index: int
    added_at: datetime
    review_count: int
    last_reviewed: Optional[datetime] = None
    mastery_level: int

class PracticeListItemUpdate(SQLModel):
    order_index: Optional[int] = None
    mastery_level: Optional[int] = None

class PracticeListReorderRequest(SQLModel):
    item_ids: List[int]  # 按新顺序排列的 item IDs

class ReviewResultRequest(SQLModel):
    rating: str  # "again", "good", "easy"
