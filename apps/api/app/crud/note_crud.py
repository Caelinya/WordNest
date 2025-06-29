from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from ..models import Note, User
from ..schemas import NoteUpdate
from ..services import tag_service

def get_note(*, session: Session, note_id: int) -> Note | None:
    """
    Get a single note by its ID.
    """
    return session.get(Note, note_id)

def get_notes_by_owner(*, session: Session, owner_id: int) -> list[Note]:
    """
    Get all notes for a specific user.
    """
    statement = select(Note).where(Note.owner_id == owner_id).options(selectinload(Note.tags))
    return session.exec(statement).all()

def create_note_db(*, session: Session, note: Note) -> Note:
    """
    Create a new note in the database.
    """
    session.add(note)
    session.flush()
    session.refresh(note)
    return note

def update_note_db(*, session: Session, db_note: Note, note_in: NoteUpdate) -> Note:
    """
    Update an existing note in the database.
    """
    note_data = note_in.model_dump(exclude_unset=True)
    
    # Handle tags separately if they are provided
    if "tags" in note_data:
        tag_names = note_data.pop("tags")
        tags = tag_service.get_or_create_tags_db(db=session, owner=db_note.owner, tag_names=tag_names)
        db_note.tags = tags

    for key, value in note_data.items():
        setattr(db_note, key, value)
    
    session.add(db_note)
    session.flush()
    session.refresh(db_note)
    return db_note

def delete_note_db(*, session: Session, note: Note):
    """
    Delete a note from the database.
    """
    session.delete(note)
    session.flush()
    return