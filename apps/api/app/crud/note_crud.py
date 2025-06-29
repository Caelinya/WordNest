from sqlmodel import Session, select
from ..models import Note, User
from ..schemas import NoteUpdate

def get_note(*, session: Session, note_id: int) -> Note | None:
    """
    Get a single note by its ID.
    """
    return session.get(Note, note_id)

def get_notes_by_owner(*, session: Session, owner_id: int) -> list[Note]:
    """
    Get all notes for a specific user.
    """
    statement = select(Note).where(Note.owner_id == owner_id)
    return session.exec(statement).all()

def create_note_db(*, session: Session, note: Note) -> Note:
    """
    Create a new note in the database.
    """
    session.add(note)
    session.commit()
    session.refresh(note)
    return note

def update_note_db(*, session: Session, db_note: Note, note_in: NoteUpdate) -> Note:
    """
    Update an existing note in the database.
    """
    note_data = note_in.model_dump(exclude_unset=True)
    for key, value in note_data.items():
        setattr(db_note, key, value)
    
    session.add(db_note)
    session.commit()
    session.refresh(db_note)
    return db_note

def delete_note_db(*, session: Session, note: Note):
    """
    Delete a note from the database.
    """
    session.delete(note)
    session.commit()
    return