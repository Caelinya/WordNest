from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from .db import engine
from .models import Note, User
from .auth import get_current_user
from .services import translation_service
from .schemas import NoteCreate, NoteUpdate
from .crud import note_crud

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
    return note_crud.create_note_db(session=session, note=db_note)

@router.get("", response_model=list[Note])
def read_notes(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    return note_crud.get_notes_by_owner(session=session, owner_id=current_user.id)

@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: int, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    note = note_crud.get_note(session=session, note_id=note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this note")
    
    note_crud.delete_note_db(session=session, note=note)
    return

@router.put("/{note_id}", response_model=Note)
def update_note(note_id: int, note_update: NoteUpdate, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    db_note = note_crud.get_note(session=session, note_id=note_id)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    if db_note.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this note")

    return note_crud.update_note_db(session=session, db_note=db_note, note_in=note_update)