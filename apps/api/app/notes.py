from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from .db import engine
from .models import Note, User, Folder
from .auth import get_current_user
from .services import translation_service, tag_service
from .schemas import NoteCreate, NoteUpdate, NoteRead
from .crud import note_crud

router = APIRouter()

def get_session():
    with Session(engine) as session:
        yield session

@router.post("/preview", response_model=NoteRead)
def preview_note(note: NoteCreate, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Analyzes the note text and returns a preview of the note without saving it.
    """
    ai_response = translation_service.translate_text(note.text)

    note_type = "word"
    note_data = None
    corrected_text = note.text
    
    if ai_response:
        note_type = ai_response.get("type", "word")
        note_data = ai_response.get("data")
        corrected_text = ai_response.get("corrected_text", note.text)

    # Note: We are creating a NoteRead object, not a DB model instance.
    # It has a temporary ID and no saved tags.
    preview_note = NoteRead(
        id=-1,  # Temporary ID
        text=note.text,
        corrected_text=corrected_text,
        type=note_type,
        translation=note_data,
        tags=[],  # No tags for preview
        folder_id=note.folder_id
    )

    if note.folder_id:
        folder = session.get(Folder, note.folder_id)
        if folder and folder.owner_id == current_user.id:
            preview_note.folder = folder
    
    return preview_note

@router.post("", response_model=NoteRead)
def create_note(note: NoteCreate, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    # Determine the folder for the note
    folder_id = note.folder_id
    if not folder_id:
        # If no folder is specified, find the user's default folder
        default_folder = session.exec(
            select(Folder).where(Folder.owner_id == current_user.id, Folder.name == "default")
        ).first()
        if not default_folder:
            # This should ideally not happen if the default folder is created upon registration
            raise HTTPException(status_code=400, detail="Default folder not found for user.")
        folder_id = default_folder.id

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
        folder_id=folder_id,
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
def update_note(
    note_id: int,
    note_update: NoteUpdate,
    re_analyze: bool = False,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    db_note = note_crud.get_note(session=session, note_id=note_id)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    if db_note.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this note")

    if re_analyze and note_update.text:
        # AI-powered update: generate new analysis and text
        ai_response = translation_service.translate_text(note_update.text)
        
        update_data = {
            "text": note_update.text,
            "type": "word",
            "translation": None,
            "corrected_text": note_update.text,
            "tags": note_update.tags, # Pass tags along
            "folder_id": note_update.folder_id # Pass folder_id along
        }
        
        if ai_response:
            update_data["type"] = ai_response.get("type", "word")
            update_data["translation"] = ai_response.get("data")
            update_data["corrected_text"] = ai_response.get("corrected_text", note_update.text)
            
        # Create a NoteUpdate instance with all the new data
        update_payload = NoteUpdate.model_validate(update_data)
        updated_note = note_crud.update_note_db(session=session, db_note=db_note, note_in=update_payload)

    else:
        # Simple update: just save the text and tags from the request
        updated_note = note_crud.update_note_db(session=session, db_note=db_note, note_in=note_update)
        # Also sync the corrected_text to match the user's new raw text
        if note_update.text is not None:
            updated_note.corrected_text = updated_note.text


    session.commit()
    session.refresh(updated_note)
    return updated_note