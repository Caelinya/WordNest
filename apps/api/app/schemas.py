from sqlmodel import SQLModel

class NoteCreate(SQLModel):
    text: str

class NoteUpdate(SQLModel):
    text: str
    translation: str | None = None