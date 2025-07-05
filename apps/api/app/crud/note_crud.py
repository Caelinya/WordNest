import sqlalchemy as sa
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy import or_
from pgvector.sqlalchemy import Vector
from ..models import Note, User, Tag
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

def search_notes(
    *,
    session: Session,
    owner_id: int,
    search_query: str | None,
    semantic: bool,
    similarity: float,
    folder_id: int | None,
    tags: list[str] | None,
    note_type: str | None,
    search_embedding: list[float] | None = None
) -> list[Note]:
    """
    Performs a hybrid search with advanced filtering for notes.
    """
    # Base query with owner and necessary joins/loads
    base_query = (
        select(Note)
        .where(Note.owner_id == owner_id)
        .options(selectinload(Note.tags), joinedload(Note.folder))
    )

    # Apply filters
    if folder_id:
        base_query = base_query.where(Note.folder_id == folder_id)
    if note_type:
        base_query = base_query.where(Note.type == note_type)
    if tags:
        base_query = base_query.join(Note.tags).where(Tag.name.in_(tags))

    # If no search query, return filtered results
    if not search_query:
        return session.exec(base_query).all()

    # --- Hybrid Search Logic ---
    semantic_search_results = []
    if semantic and search_embedding:
        # Semantic search on the filtered results
        semantic_query = base_query.where(Note.vector.cosine_distance(search_embedding) < similarity)
        semantic_query = semantic_query.order_by(Note.vector.cosine_distance(search_embedding)).limit(20)
        semantic_search_results = session.exec(semantic_query).all()

    # Keyword search on the filtered results
    keyword_query = base_query.where(
        or_(
            Note.text.ilike(f"%{search_query}%"),
            Note.corrected_text.ilike(f"%{search_query}%"),
            Note.translation.cast(sa.Text).ilike(f"%{search_query}%"),
        )
    )
    keyword_search_results = session.exec(keyword_query).all()

    # Combine and de-duplicate results
    combined_results = {}
    for note in semantic_search_results:
        combined_results[note.id] = note
    for note in keyword_search_results:
        if note.id not in combined_results:
            combined_results[note.id] = note

    return list(combined_results.values())