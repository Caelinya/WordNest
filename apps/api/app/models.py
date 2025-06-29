from typing import Union, Any, List
from pydantic import ConfigDict
from sqlmodel import Field, SQLModel, Relationship, Column, UniqueConstraint
from sqlalchemy.types import JSON

class NoteTagLink(SQLModel, table=True):
    note_id: int | None = Field(default=None, foreign_key="note.id", primary_key=True)
    tag_id: int | None = Field(default=None, foreign_key="tag.id", primary_key=True)

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
    hashed_password: str

    notes: List["Note"] = Relationship(back_populates="owner")
    tags: List[Tag] = Relationship(back_populates="owner")
    
    model_config = ConfigDict(arbitrary_types_allowed=True)


class Note(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    text: str
    translation: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))

    owner_id: int | None = Field(default=None, foreign_key="user.id")
    owner: Union["User", None] = Relationship(back_populates="notes")

    tags: List[Tag] = Relationship(back_populates="notes", link_model=NoteTagLink)

    model_config = ConfigDict(arbitrary_types_allowed=True)