from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, SQLModel

from .db import engine
from .models import Note, User
from .auth import get_current_user

router = APIRouter()

class NoteCreate(SQLModel):
    text: str

def get_session():
    with Session(engine) as session:
        yield session

@router.post("", response_model=Note)
def create_note(note: NoteCreate, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    db_note = Note(text=note.text, owner_id=current_user.id)
    session.add(db_note)
    session.commit()
    session.refresh(db_note)
    return db_note

@router.get("", response_model=list[Note])
def read_notes(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    notes = session.exec(select(Note).where(Note.owner_id == current_user.id)).all()
    return notes

@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: int, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    note = session.get(Note, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this note")
    
    session.delete(note)
    session.commit()
    return