from typing import Union, Any, List
from pydantic import ConfigDict
from sqlmodel import Field, SQLModel, Relationship, Column, UniqueConstraint
from sqlalchemy.types import JSON
from datetime import datetime
from pgvector.sqlalchemy import Vector
from numpy import ndarray


class NoteTagLink(SQLModel, table=True):
    note_id: int | None = Field(default=None, foreign_key="note.id", primary_key=True)
    tag_id: int | None = Field(default=None, foreign_key="tag.id", primary_key=True)


class Folder(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("name", "owner_id", name="unique_folder_name_for_owner"),)

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)

    owner_id: int | None = Field(default=None, foreign_key="user.id")
    owner: "User" = Relationship(back_populates="folders")

    notes: List["Note"] = Relationship(back_populates="folder")
    model_config = ConfigDict(arbitrary_types_allowed=True)


class Tag(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("name", "owner_id", name="unique_name_for_owner"),)

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    color: str

    owner_id: int | None = Field(default=None, foreign_key="user.id")
    owner: "User" = Relationship(back_populates="tags")

    notes: List["Note"] = Relationship(back_populates="tags", link_model=NoteTagLink)
    model_config = ConfigDict(arbitrary_types_allowed=True)


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str

    notes: List["Note"] = Relationship(back_populates="owner")
    tags: List[Tag] = Relationship(back_populates="owner")
    folders: List[Folder] = Relationship(back_populates="owner")

    model_config = ConfigDict(arbitrary_types_allowed=True)


class Note(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    text: str
    corrected_text: str | None = Field(default=None)
    type: str = Field(index=True)  # AI-classified type: 'word', 'phrase', or 'sentence'
    translation: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    vector: ndarray | None = Field(
        default=None, sa_column=Column(Vector(768))
    )  # Vector for semantic search

    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    # FSRS fields
    due: datetime = Field(default_factory=datetime.utcnow, index=True)
    stability: float = Field(default=0)
    difficulty: float = Field(default=0)
    elapsed_days: int = Field(default=0)
    scheduled_days: int = Field(default=0)
    reps: int = Field(default=0)
    lapses: int = Field(default=0)
    state: str = Field(default="new")
    last_review: datetime | None = Field(default=None)

    owner_id: int | None = Field(default=None, foreign_key="user.id")
    owner: Union["User", None] = Relationship(back_populates="notes")

    folder_id: int | None = Field(default=None, foreign_key="folder.id")
    folder: Union["Folder", None] = Relationship(back_populates="notes")

    tags: List[Tag] = Relationship(back_populates="notes", link_model=NoteTagLink)

    model_config = ConfigDict(arbitrary_types_allowed=True)