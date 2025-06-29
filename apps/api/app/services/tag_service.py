from typing import List
from sqlalchemy import func
from sqlmodel import Session, select
from ..models import Tag, User
from .color_service import generate_color_from_string

def get_or_create_tags_db(db: Session, owner: User, tag_names: List[str]) -> List[Tag]:
    """
    For a given user, finds existing tags or creates new ones for a list of tag names.

    This function is case-insensitive for tag lookup but preserves the original
    casing when creating a new tag.

    Args:
        db: The database session.
        owner: The user who owns the tags.
        tag_names: A list of strings representing the tag names.

    Returns:
        A list of Tag model instances, including both existing and newly created tags.
    """
    tags_to_return: List[Tag] = []
    
    if not tag_names:
        return tags_to_return

    # To optimize, first fetch all existing tags for the user that match the names
    # Use a case-insensitive comparison for the lookup
    lower_tag_names = [name.lower() for name in tag_names]
    # Use a case-insensitive comparison for the lookup.
    # We construct a list of lowercased tag names to use in the query.
    lower_to_original_map = {name.lower(): name for name in tag_names}
    
    # Fetch all existing tags for the user that match the given names in a single query.
    statement = select(Tag).where(Tag.owner_id == owner.id).where(func.lower(Tag.name).in_(lower_tag_names))
    existing_tags = db.exec(statement).all()
    
    existing_tags_map = {tag.name.lower(): tag for tag in existing_tags}
    
    
    # Iterate through the original list to create missing tags and preserve order
    for name in tag_names:
        lower_name = name.lower()
        if lower_name in existing_tags_map:
            # Add existing tag
            tags_to_return.append(existing_tags_map[lower_name])
        else:
            # Create a new tag if it doesn't exist
            new_color = generate_color_from_string(name)
            new_tag = Tag(name=name, color=new_color, owner_id=owner.id)
            db.add(new_tag)
            tags_to_return.append(new_tag)
            # Add to map to handle potential duplicates in the input list
            existing_tags_map[lower_name] = new_tag
    # We flush here once after adding all new tags.
    db.flush()
    
    # Refresh each new tag to get its ID, etc.
    for tag in tags_to_return:
        if not tag.id: # Or some other attribute that indicates it's new
            db.refresh(tag)
            
    return tags_to_return