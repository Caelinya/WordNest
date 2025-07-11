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
    practice_lists: List["PracticeList"] = Relationship(back_populates="owner")

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
    practice_list_items: List["PracticeListItem"] = Relationship(back_populates="note")

    model_config = ConfigDict(arbitrary_types_allowed=True)


class PracticeList(SQLModel, table=True):
    """Practice list for organizing notes"""
    __table_args__ = (UniqueConstraint("name", "owner_id", name="unique_practice_list_name_for_owner"),)
    
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: str | None = Field(default=None)
    settings: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    owner_id: int | None = Field(default=None, foreign_key="user.id")
    owner: "User" = Relationship(back_populates="practice_lists")
    
    items: List["PracticeListItem"] = Relationship(back_populates="practice_list", cascade_delete=True)
    
    model_config = ConfigDict(arbitrary_types_allowed=True)


class PracticeListItem(SQLModel, table=True):
    """Item in a practice list"""
    __table_args__ = (UniqueConstraint("practice_list_id", "note_id", name="unique_note_in_practice_list"),)
    
    id: int | None = Field(default=None, primary_key=True)
    order_index: int = Field(default=0, index=True)
    added_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Independent review statistics
    review_count: int = Field(default=0)
    last_reviewed: datetime | None = Field(default=None)
    mastery_level: int = Field(default=0)  # 0-5 mastery level
    
    practice_list_id: int = Field(foreign_key="practicelist.id", index=True)
    practice_list: PracticeList = Relationship(back_populates="items")
    
    note_id: int = Field(foreign_key="note.id", index=True)
    note: "Note" = Relationship(back_populates="practice_list_items")
    
    model_config = ConfigDict(arbitrary_types_allowed=True)