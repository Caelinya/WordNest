import sqlalchemy as sa
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from sqlalchemy import or_
from pgvector.sqlalchemy import Vector
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

def search_notes(
    *,
    session: Session,
    owner_id: int,
    search_query: str,
    semantic: bool,
    search_embedding: list[float] | None = None
) -> list[Note]:
    """
    Performs a hybrid search for notes for a specific user.
    Combines semantic vector search with keyword-based full-text search.
    """
    semantic_search_results = []
    if semantic and search_embedding:
        # 1. Semantic Search (only if enabled)
        # We add a distance threshold to filter out irrelevant results.
        # Cosine distance: 0 = identical, 1 = dissimilar, 2 = opposite.
        # A threshold of 0.5 is a reasonable starting point.
        distance_threshold = 0.5
        semantic_search_statement = (
            select(Note)
            .where(Note.owner_id == owner_id)
            .where(Note.vector.cosine_distance(search_embedding) < distance_threshold)
            .order_by(Note.vector.cosine_distance(search_embedding))
            .limit(20)
        )
        semantic_search_results = session.exec(semantic_search_statement).all()

    # 2. Keyword Search
    # This finds notes where the query appears as a substring in the text or translation.
    # The translation field is JSON, so we cast it to text to search within it.
    keyword_search_statement = (
        select(Note)
        .where(Note.owner_id == owner_id)
        .where(
            or_(
                Note.text.ilike(f"%{search_query}%"),
                Note.corrected_text.ilike(f"%{search_query}%"),
                Note.translation.cast(sa.Text).ilike(f"%{search_query}%")
            )
        )
    )
    keyword_search_results = session.exec(keyword_search_statement).all()

    # 3. Combine and de-duplicate results
    # A simple way is to use a dictionary with note IDs to ensure uniqueness.
    # The order from the semantic search is preserved first.
    combined_results = {}
    for note in semantic_search_results:
        combined_results[note.id] = note
    for note in keyword_search_results:
        if note.id not in combined_results:
            combined_results[note.id] = note
    
    return list(combined_results.values())