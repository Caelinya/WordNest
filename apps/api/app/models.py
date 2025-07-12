from typing import Union, Any, List
from pydantic import ConfigDict
from sqlmodel import Field, SQLModel, Relationship, Column, UniqueConstraint
from sqlalchemy import Index
from sqlalchemy.types import JSON
from datetime import datetime, timezone
from pgvector.sqlalchemy import Vector
from numpy import ndarray


class NoteTagLink(SQLModel, table=True):
    note_id: int | None = Field(default=None, foreign_key="note.id", primary_key=True)
    tag_id: int | None = Field(default=None, foreign_key="tag.id", primary_key=True)


class Folder(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("name", "owner_id", name="unique_folder_name_for_owner"),)

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, max_length=100)

    owner_id: int | None = Field(default=None, foreign_key="user.id")
    owner: "User" = Relationship(back_populates="folders")

    notes: List["Note"] = Relationship(back_populates="folder")
    model_config = ConfigDict(arbitrary_types_allowed=True)


class Tag(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("name", "owner_id", name="unique_name_for_owner"),)

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, max_length=50)
    color: str = Field(max_length=7)  # hex color #RRGGBB

    owner_id: int | None = Field(default=None, foreign_key="user.id")
    owner: "User" = Relationship(back_populates="tags")

    notes: List["Note"] = Relationship(back_populates="tags", link_model=NoteTagLink)
    model_config = ConfigDict(arbitrary_types_allowed=True)


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True, max_length=50)
    email: str = Field(index=True, unique=True, max_length=255)
    hashed_password: str = Field(max_length=255)

    notes: List["Note"] = Relationship(back_populates="owner")
    tags: List[Tag] = Relationship(back_populates="owner")
    folders: List[Folder] = Relationship(back_populates="owner")
    practice_lists: List["PracticeList"] = Relationship(back_populates="owner")

    model_config = ConfigDict(arbitrary_types_allowed=True)


class Note(SQLModel, table=True):
    __table_args__ = (
        # Composite indexes for common query patterns
        Index("idx_note_owner_type", "owner_id", "type"),
        Index("idx_note_owner_due", "owner_id", "due"),
        Index("idx_note_owner_state", "owner_id", "state"),
        Index("idx_note_owner_created", "owner_id", "created_at"),
        Index("idx_note_folder_owner", "folder_id", "owner_id"),
    )
    
    id: int | None = Field(default=None, primary_key=True)
    text: str = Field(max_length=2000)
    corrected_text: str | None = Field(default=None, max_length=2000)
    type: str = Field(index=True, max_length=20)  # AI-classified type: 'word', 'phrase', or 'sentence'
    translation: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    vector: ndarray | None = Field(
        default=None, sa_column=Column(Vector(768))
    )  # Vector for semantic search

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)

    # FSRS fields
    due: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    stability: float = Field(default=0)
    difficulty: float = Field(default=0)
    elapsed_days: int = Field(default=0)
    scheduled_days: int = Field(default=0)
    reps: int = Field(default=0)
    lapses: int = Field(default=0)
    state: str = Field(default="new", max_length=20)
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
    __table_args__ = (
        UniqueConstraint("name", "owner_id", name="unique_practice_list_name_for_owner"),
        Index("idx_practice_list_owner_updated", "owner_id", "updated_at"),
    )
    
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    settings: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    owner_id: int | None = Field(default=None, foreign_key="user.id")
    owner: "User" = Relationship(back_populates="practice_lists")
    
    items: List["PracticeListItem"] = Relationship(back_populates="practice_list", cascade_delete=True)
    
    model_config = ConfigDict(arbitrary_types_allowed=True)


class PracticeListItem(SQLModel, table=True):
    """Item in a practice list"""
    __table_args__ = (
        UniqueConstraint("practice_list_id", "note_id", name="unique_note_in_practice_list"),
        Index("idx_practice_list_item_order", "practice_list_id", "order_index"),
    )
    
    id: int | None = Field(default=None, primary_key=True)
    order_index: int = Field(default=0, index=True)
    added_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Independent review statistics
    review_count: int = Field(default=0)
    last_reviewed: datetime | None = Field(default=None)
    mastery_level: int = Field(default=0)  # 0-5 mastery level
    
    practice_list_id: int = Field(foreign_key="practicelist.id", index=True)
    practice_list: PracticeList = Relationship(back_populates="items")
    
    note_id: int = Field(foreign_key="note.id", index=True)
    note: "Note" = Relationship(back_populates="practice_list_items")
    
    model_config = ConfigDict(arbitrary_types_allowed=True)