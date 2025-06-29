from sqlmodel import SQLModel

class NoteCreate(SQLModel):
    text: str

class NoteUpdate(SQLModel):
    text: str
    translation: str | None = None

# --- User Schemas ---

class UserCreate(SQLModel):
    username: str
    password: str

class UserRead(SQLModel):
    id: int
    username: str

# --- Token Schemas ---

class Token(SQLModel):
    access_token: str
    token_type: str