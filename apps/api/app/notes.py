from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List
from .db import engine
from .models import Note, User, Folder
from .auth import get_current_user
from .services import note_service, ai_service
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
    ai_response = ai_service.analyze_text(note.text)

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
    """
    Creates a new note by calling the note service.
    """
    return note_service.create_note_service(session=session, note_in=note, owner=current_user)

@router.get("", response_model=list[NoteRead])
def read_notes(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    notes = note_crud.get_notes_by_owner(session=session, owner_id=current_user.id)
    return notes

@router.get("/search", response_model=list[NoteRead])
def search_notes_route(
    q: str | None = None,
    semantic: bool = False,
    similarity: float = 0.5,
    folder_id: int | None = None,
    tags: List[str] = Query(None),
    note_type: str | None = None,
    search_in_content: bool = True,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Search for notes with advanced filtering.
    """
    # Allow search without a query string if filters are present
    if not q and not folder_id and not tags and not note_type:
        # If there's no query and no filters, return all notes for the user
        return note_crud.get_notes_by_owner(session=session, owner_id=current_user.id)

    search_embedding = None
    if q and semantic:
        search_embedding = ai_service.get_embedding(q)
        if not search_embedding:
            # Non-fatal, semantic search will just be skipped
            print(f"Could not generate embedding for the search query: {q}")

    notes = note_crud.search_notes(
        session=session,
        owner_id=current_user.id,
        search_query=q,
        search_embedding=search_embedding,
        semantic=semantic,
        similarity=similarity,
        folder_id=folder_id,
        tags=tags,
        note_type=note_type,
        search_in_content=search_in_content
    )

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
    """
    Updates a note by calling the note service.
    """
    db_note = note_crud.get_note(session=session, note_id=note_id)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    if db_note.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this note")

    return note_service.update_note_service(
        session=session,
        db_note=db_note,
        note_in=note_update,
        re_analyze=re_analyze
    )