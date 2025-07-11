from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from typing import List, Optional
from datetime import datetime

from .db import engine
from .models import PracticeList, PracticeListItem, Note, User
from .schemas import (
    PracticeListCreate, PracticeListRead, PracticeListDetail, PracticeListUpdate,
    PracticeListItemCreate, PracticeListItemRead, PracticeListReorderRequest,
    ReviewResultRequest
)
from .auth import get_current_user

router = APIRouter()

def get_session():
    with Session(engine) as session:
        yield session

# --- Practice List Management ---

@router.post("", response_model=PracticeListRead, include_in_schema=False)
@router.post("/", response_model=PracticeListRead)
def create_practice_list(
    practice_list: PracticeListCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create a new practice list"""
    # Check if name already exists
    existing = session.exec(
        select(PracticeList).where(
            PracticeList.name == practice_list.name,
            PracticeList.owner_id == current_user.id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="练习清单名称已存在")
    
    db_practice_list = PracticeList(
        **practice_list.model_dump(),
        owner_id=current_user.id
    )
    session.add(db_practice_list)
    session.commit()
    session.refresh(db_practice_list)
    
    # Add item_count
    result = PracticeListRead.model_validate(db_practice_list)
    result.item_count = 0
    return result

@router.get("", response_model=List[PracticeListRead], include_in_schema=False)
@router.get("", response_model=List[PracticeListRead], include_in_schema=False)
@router.get("/", response_model=List[PracticeListRead])
def get_practice_lists(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all practice lists for the current user"""
    # Use subquery to get item count for each list
    item_count_subquery = (
        select(PracticeListItem.practice_list_id, func.count(PracticeListItem.id).label("count"))
        .group_by(PracticeListItem.practice_list_id)
        .subquery()
    )
    
    statement = (
        select(PracticeList, item_count_subquery.c.count)
        .outerjoin(item_count_subquery, PracticeList.id == item_count_subquery.c.practice_list_id)
        .where(PracticeList.owner_id == current_user.id)
        .order_by(PracticeList.created_at.desc())
    )
    
    results = session.exec(statement).all()
    
    practice_lists = []
    for practice_list, count in results:
        pl_dict = practice_list.model_dump()
        pl_dict["item_count"] = count or 0
        practice_lists.append(PracticeListRead(**pl_dict))
    
    return practice_lists

@router.get("/{practice_list_id}", response_model=PracticeListDetail)
def get_practice_list(
    practice_list_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get practice list details"""
    practice_list = session.get(PracticeList, practice_list_id)
    if not practice_list:
        raise HTTPException(status_code=404, detail="Practice list not found")
    
    if practice_list.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this practice list")
    
    # Get all items in the list
    items = session.exec(
        select(PracticeListItem)
        .where(PracticeListItem.practice_list_id == practice_list_id)
        .order_by(PracticeListItem.order_index)
    ).all()
    
    result = PracticeListDetail.model_validate(practice_list)
    result.item_count = len(items)
    result.items = items
    
    return result

@router.put("/{practice_list_id}", response_model=PracticeListRead)
def update_practice_list(
    practice_list_id: int,
    practice_list_update: PracticeListUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update practice list information"""
    practice_list = session.get(PracticeList, practice_list_id)
    if not practice_list:
        raise HTTPException(status_code=404, detail="Practice list not found")
    
    if practice_list.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this practice list")
    
    # Check if new name conflicts with other lists
    if practice_list_update.name:
        existing = session.exec(
            select(PracticeList).where(
                PracticeList.name == practice_list_update.name,
                PracticeList.owner_id == current_user.id,
                PracticeList.id != practice_list_id
            )
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Practice list name already exists")
    
    # 更新字段
    update_data = practice_list_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(practice_list, key, value)
    
    practice_list.updated_at = datetime.utcnow()
    session.add(practice_list)
    session.commit()
    session.refresh(practice_list)
    
    # Get item_count
    item_count = session.exec(
        select(func.count(PracticeListItem.id))
        .where(PracticeListItem.practice_list_id == practice_list_id)
    ).first()
    
    result = PracticeListRead.model_validate(practice_list)
    result.item_count = item_count or 0
    return result

@router.delete("/{practice_list_id}")
def delete_practice_list(
    practice_list_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete a practice list"""
    practice_list = session.get(PracticeList, practice_list_id)
    if not practice_list:
        raise HTTPException(status_code=404, detail="Practice list not found")
    
    if practice_list.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this practice list")
    
    session.delete(practice_list)
    session.commit()
    
    return {"message": "Practice list deleted successfully"}

# --- Practice List Content Management ---

@router.post("/{practice_list_id}/items", response_model=List[PracticeListItemRead])
def add_items_to_practice_list(
    practice_list_id: int,
    item_create: PracticeListItemCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Add notes to practice list"""
    # Validate practice list
    practice_list = session.get(PracticeList, practice_list_id)
    if not practice_list:
        raise HTTPException(status_code=404, detail="Practice list not found")
    
    if practice_list.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this practice list")
    
    # Validate notes and filter existing ones
    existing_note_ids = set(
        session.exec(
            select(PracticeListItem.note_id)
            .where(PracticeListItem.practice_list_id == practice_list_id)
        ).all()
    )
    
    # Get current max order_index
    max_order = session.exec(
        select(func.max(PracticeListItem.order_index))
        .where(PracticeListItem.practice_list_id == practice_list_id)
    ).first() or -1
    
    added_items = []
    for idx, note_id in enumerate(item_create.note_ids):
        if note_id in existing_note_ids:
            continue
            
        # Validate note exists and belongs to current user
        note = session.get(Note, note_id)
        if not note or note.owner_id != current_user.id:
            continue
        
        # Create new item
        new_item = PracticeListItem(
            practice_list_id=practice_list_id,
            note_id=note_id,
            order_index=max_order + idx + 1
        )
        session.add(new_item)
        added_items.append(new_item)
    
    if added_items:
        practice_list.updated_at = datetime.utcnow()
        session.add(practice_list)
        session.commit()
        
        # Refresh all items to get complete data
        for item in added_items:
            session.refresh(item)
    
    return added_items

@router.delete("/{practice_list_id}/items/{item_id}")
def remove_item_from_practice_list(
    practice_list_id: int,
    item_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Remove note from practice list"""
    # Validate practice list
    practice_list = session.get(PracticeList, practice_list_id)
    if not practice_list:
        raise HTTPException(status_code=404, detail="Practice list not found")
    
    if practice_list.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this practice list")
    
    # Find and delete item
    item = session.get(PracticeListItem, item_id)
    if not item or item.practice_list_id != practice_list_id:
        raise HTTPException(status_code=404, detail="Item not found")
    
    session.delete(item)
    practice_list.updated_at = datetime.utcnow()
    session.add(practice_list)
    session.commit()
    
    return {"message": "Removed from practice list successfully"}

@router.put("/{practice_list_id}/items/reorder")
def reorder_practice_list_items(
    practice_list_id: int,
    reorder_request: PracticeListReorderRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Reorder items in practice list"""
    # Validate practice list
    practice_list = session.get(PracticeList, practice_list_id)
    if not practice_list:
        raise HTTPException(status_code=404, detail="Practice list not found")
    
    if practice_list.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this practice list")
    
    # Update order
    for idx, item_id in enumerate(reorder_request.item_ids):
        item = session.get(PracticeListItem, item_id)
        if item and item.practice_list_id == practice_list_id:
            item.order_index = idx
            session.add(item)
    
    practice_list.updated_at = datetime.utcnow()
    session.add(practice_list)
    session.commit()
    
    return {"message": "Reordered successfully"}

# --- Review Related ---

@router.get("/{practice_list_id}/review-queue", response_model=List[PracticeListItemRead])
def get_review_queue(
    practice_list_id: int,
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get review queue for practice list"""
    # Validate practice list
    practice_list = session.get(PracticeList, practice_list_id)
    if not practice_list:
        raise HTTPException(status_code=404, detail="Practice list not found")
    
    if practice_list.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this practice list")
    
    # Prioritize items with low mastery level and items not reviewed recently
    items = session.exec(
        select(PracticeListItem)
        .where(PracticeListItem.practice_list_id == practice_list_id)
        .order_by(
            PracticeListItem.mastery_level.asc(),
            PracticeListItem.last_reviewed.asc().nullsfirst()
        )
        .limit(limit)
    ).all()
    
    return items

@router.post("/{practice_list_id}/items/{item_id}/review")
def record_review_result(
    practice_list_id: int,
    item_id: int,
    review_result: ReviewResultRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Record review result"""
    # Validate practice list
    practice_list = session.get(PracticeList, practice_list_id)
    if not practice_list:
        raise HTTPException(status_code=404, detail="Practice list not found")
    
    if practice_list.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this practice list")
    
    # Update item review statistics
    item = session.get(PracticeListItem, item_id)
    if not item or item.practice_list_id != practice_list_id:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item.review_count += 1
    item.last_reviewed = datetime.utcnow()
    
    # Adjust mastery level based on rating
    if review_result.rating == "easy":
        item.mastery_level = min(5, item.mastery_level + 2)
    elif review_result.rating == "good":
        item.mastery_level = min(5, item.mastery_level + 1)
    else:  # again
        item.mastery_level = max(0, item.mastery_level - 1)
    
    session.add(item)
    session.commit()
    
    return {"message": "Review result recorded", "new_mastery_level": item.mastery_level}