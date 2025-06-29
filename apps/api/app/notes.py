from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, SQLModel

from .db import engine
from .models import Note, User
from .auth import get_current_user
from .services import translation_service
from .schemas import NoteCreate, NoteUpdate

router = APIRouter()

def get_session():
    with Session(engine) as session:
        yield session

@router.post("", response_model=Note)
def create_note(note: NoteCreate, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    translation = translation_service.translate_text(note.text)
    db_note = Note(
        text=note.text,
        translation=translation,
        owner_id=current_user.id
    )
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

@router.put("/{note_id}", response_model=Note)
def update_note(note_id: int, note_update: NoteUpdate, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    db_note = session.get(Note, note_id)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    if db_note.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this note")

    # Update the note data
    db_note.text = note_update.text
    db_note.translation = note_update.translation
    
    session.add(db_note)
    session.commit()
    session.refresh(db_note)

    return db_note