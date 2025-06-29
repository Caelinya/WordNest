from typing import Union, Any
from pydantic import ConfigDict
from sqlmodel import Field, SQLModel, Relationship, Column
from sqlalchemy.types import JSON

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    hashed_password: str

    notes: list["Note"] = Relationship(back_populates="owner")
    
    model_config = ConfigDict(arbitrary_types_allowed=True)


class Note(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    text: str
    translation: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))

    owner_id: int | None = Field(default=None, foreign_key="user.id")
    owner: Union["User", None] = Relationship(back_populates="notes")

    model_config = ConfigDict(arbitrary_types_allowed=True)