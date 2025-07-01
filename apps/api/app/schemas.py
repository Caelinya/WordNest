from sqlmodel import SQLModel
from typing import List, Optional

# --- Tag Schemas ---

class TagRead(SQLModel):
    id: int
    name: str
    color: str

class NoteRead(SQLModel):
    id: int
    text: str
    type: str = "word" # Add type field with a default
    translation: Optional[dict] = None
    tags: List[TagRead] = []
    corrected_text: Optional[str] = None


# --- Note Schemas ---

class NoteCreate(SQLModel):
    text: str
    tags: Optional[List[str]] = []

class NoteUpdate(SQLModel):
    text: Optional[str] = None
    type: Optional[str] = None
    translation: Optional[dict] = None
    tags: Optional[List[str]] = None
    corrected_text: Optional[str] = None

# --- User Schemas ---

class UserCreate(SQLModel):
    username: str
    email: str
    password: str

class UserRead(SQLModel):
    id: int
    username: str
    email: str

# --- Token Schemas ---

class Token(SQLModel):
    access_token: str
    token_type: str
    user: UserRead