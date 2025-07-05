from sqlmodel import Session, select
from fastapi import HTTPException
from ..models import Note, User, Folder
from ..schemas import NoteCreate, NoteUpdate
from . import ai_service, tag_service
from ..crud import note_crud

def create_note_service(*, session: Session, note_in: NoteCreate, owner: User) -> Note:
    """
    Business logic for creating a note.
    """
    # Determine the folder for the note
    folder_id = note_in.folder_id
    if not folder_id:
        default_folder = session.exec(
            select(Folder).where(Folder.owner_id == owner.id, Folder.name == "default")
        ).first()
        if not default_folder:
            raise HTTPException(status_code=400, detail="Default folder not found for user.")
        folder_id = default_folder.id

    # Get AI analysis
    ai_response = ai_service.analyze_text(note_in.text)
    note_type = "word"
    note_data = None
    corrected_text = note_in.text
    if ai_response:
        note_type = ai_response.get("type", "word")
        note_data = ai_response.get("data")
        corrected_text = ai_response.get("corrected_text", note_in.text)

    # Get or create tags
    tags = tag_service.get_or_create_tags_db(db=session, owner=owner, tag_names=note_in.tags)
    
    # Get embedding
    embedding = ai_service.get_embedding(note_in.text)

    db_note = Note(
        text=note_in.text,
        corrected_text=corrected_text,
        type=note_type,
        translation=note_data,
        owner_id=owner.id,
        folder_id=folder_id,
        tags=tags,
        vector=embedding
    )
    
    created_note = note_crud.create_note_db(session=session, note=db_note)
    session.commit()
    session.refresh(created_note)
    return created_note

def update_note_service(*, session: Session, db_note: Note, note_in: NoteUpdate, re_analyze: bool) -> Note:
    """
    Business logic for updating a note.
    """
    if re_analyze and note_in.text:
        ai_response = ai_service.analyze_text(note_in.text)
        update_data = {
            "text": note_in.text,
            "type": "word",
            "translation": None,
            "corrected_text": note_in.text,
            "tags": note_in.tags,
            "folder_id": note_in.folder_id
        }
        if ai_response:
            update_data["type"] = ai_response.get("type", "word")
            update_data["translation"] = ai_response.get("data")
            update_data["corrected_text"] = ai_response.get("corrected_text", note_in.text)
        
        update_payload = NoteUpdate.model_validate(update_data)
        updated_note = note_crud.update_note_db(session=session, db_note=db_note, note_in=update_payload)
    else:
        updated_note = note_crud.update_note_db(session=session, db_note=db_note, note_in=note_in)
        if note_in.text is not None:
            updated_note.corrected_text = updated_note.text
            updated_note.vector = ai_service.get_embedding(updated_note.text)

    session.commit()
    session.refresh(updated_note)
    return updated_note