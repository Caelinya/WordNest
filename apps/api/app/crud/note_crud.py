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

def get_notes_count_by_owner(*, session: Session, owner_id: int) -> int:
    """
    Get the total count of notes for a specific user.
    """
    statement = select(sa.func.count(Note.id)).where(Note.owner_id == owner_id)
    return session.exec(statement).one()

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
    search_query: str | None = None,
    semantic: bool = False,
    similarity: float = 0.5,
    folder_id: int | None = None,
    tags: list[str] | None = None,
    note_type: str | None = None,
    search_embedding: list[float] | None = None,
    search_in_content: bool = True
) -> list[Note]:
    """
    Performs a hybrid search with advanced filtering for notes.
    Filters by owner, folder, note type, and tags.
    Then, performs keyword and/or semantic search on the filtered results.
    """
    # Base query with owner and necessary joins/loads
    base_query = (
        select(Note)
        .where(Note.owner_id == owner_id)
        .options(selectinload(Note.tags), joinedload(Note.folder))
    )

    # Base query for filtering note IDs
    id_query = select(Note.id).where(Note.owner_id == owner_id)

    # Apply filters to the ID query
    if folder_id is not None:
        id_query = id_query.where(Note.folder_id == folder_id)
    if note_type:
        id_query = id_query.where(Note.type == note_type)
    if tags:
        id_query = id_query.join(Note.tags).where(Tag.name.in_(tags))

    # Use a subquery to get distinct note IDs that match all filters
    subquery = id_query.distinct().subquery()
    
    # Main query to fetch full note objects
    base_query = (
        select(Note)
        .where(Note.id.in_(select(subquery)))
        .options(selectinload(Note.tags), joinedload(Note.folder))
    )

    # If no search query, return filtered results, ordered by creation date
    if not search_query:
        final_query = base_query.order_by(Note.created_at.desc())
        return session.exec(final_query).all()

    # --- Hybrid Search Logic ---
    if search_in_content:
        # Search in text, corrected_text, and translation content
        keyword_query = base_query.where(
            or_(
                Note.text.ilike(f"%{search_query}%"),
                Note.corrected_text.ilike(f"%{search_query}%"),
                sa.func.jsonb_path_exists(
                    sa.cast(Note.translation, sa.dialects.postgresql.JSONB),
                    f'$.**.translation ? (@ like_regex "{search_query}")'
                ),
            )
        )
    else:
        # Search only in text and corrected_text (not in translation content)
        keyword_query = base_query.where(
            or_(
                Note.text.ilike(f"%{search_query}%"),
                Note.corrected_text.ilike(f"%{search_query}%"),
            )
        )
    
    # Execute keyword search first
    keyword_search_results = session.exec(keyword_query).all()
    
    semantic_search_results = []
    if semantic and search_embedding:
        # Semantic search on the filtered results
        # Use l2_distance for better performance with ivfflat indexes
        # Convert similarity (0-1) to max L2 distance threshold
        # For normalized vectors, L2 distance ranges from 0 to 2
        max_distance = 2 * (1 - similarity)
        
        semantic_query = (
            base_query
            .filter(Note.vector.l2_distance(search_embedding) < max_distance)
            .order_by(Note.vector.l2_distance(search_embedding))
            .limit(20)
        )
        semantic_search_results = session.exec(semantic_query).all()

    # Combine and de-duplicate results, preserving order from semantic search if applicable
    combined_results = {note.id: note for note in semantic_search_results}
    for note in keyword_search_results:
        if note.id not in combined_results:
            combined_results[note.id] = note
            
    return list(combined_results.values())