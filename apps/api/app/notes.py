from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from .db import engine
from .models import Note, User
from .auth import get_current_user
from .services import translation_service, tag_service
from .schemas import NoteCreate, NoteUpdate, NoteRead
from .crud import note_crud

router = APIRouter()

def get_session():
    with Session(engine) as session:
        yield session

@router.post("", response_model=NoteRead)
def create_note(note: NoteCreate, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    # Call the new translation service, which returns a dict with 'type' and 'data'
    ai_response = translation_service.translate_text(note.text)

    note_type = "word" # Default type
    note_data = None
    corrected_text = note.text # Default to original text

    if ai_response:
        note_type = ai_response.get("type", "word")
        note_data = ai_response.get("data")
        corrected_text = ai_response.get("corrected_text", note.text)

    # Get or create tags
    tags = tag_service.get_or_create_tags_db(db=session, owner=current_user, tag_names=note.tags)
    
    # Create the Note object with the new type and data fields
    db_note = Note(
        text=note.text,
        corrected_text=corrected_text,
        type=note_type,
        translation=note_data,
        owner_id=current_user.id,
        tags=tags
    )
    
    # Save to the database using the CRUD function
    created_note = note_crud.create_note_db(session=session, note=db_note)
    session.commit()
    session.refresh(created_note)
    
    return created_note

@router.get("", response_model=list[NoteRead])
def read_notes(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    notes = note_crud.get_notes_by_owner(session=session, owner_id=current_user.id)
    return notes

@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: int, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    note = note_crud.get_note(session=session, note_id=note_id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if note.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this note")
    
    note_crud.delete_note_db(session=session, note=note)
    session.commit()
    return

@router.put("/{note_id}", response_model=NoteRead)
def update_note(note_id: int, note_update: NoteUpdate, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    db_note = note_crud.get_note(session=session, note_id=note_id)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    if db_note.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this note")

    updated_note = note_crud.update_note_db(session=session, db_note=db_note, note_in=note_update)
    session.commit()
    session.refresh(updated_note)
    return updated_note