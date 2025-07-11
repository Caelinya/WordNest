from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from typing import List

from .db import engine
from .models import User
from .schemas import (
    PracticeListCreate, PracticeListRead, PracticeListDetail, PracticeListUpdate,
    PracticeListItemCreate, PracticeListItemRead, PracticeListReorderRequest,
    ReviewResultRequest
)
from .auth import get_current_user
from .services import practice_list_service

router = APIRouter()

def get_session():
    with Session(engine) as session:
        yield session

# --- Practice List Management ---

@router.post("/", response_model=PracticeListRead)
def create_practice_list(
    practice_list: PracticeListCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    return practice_list_service.create_practice_list_service(
        session=session, practice_list_in=practice_list, owner=current_user
    )

@router.get("/", response_model=List[PracticeListRead])
def get_practice_lists(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    return practice_list_service.get_practice_lists_service(session=session, owner=current_user)

@router.get("/{practice_list_id}", response_model=PracticeListDetail)
def get_practice_list(
    practice_list_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    return practice_list_service.get_practice_list_details_service(
        session=session, practice_list_id=practice_list_id, owner=current_user
    )

@router.put("/{practice_list_id}", response_model=PracticeListRead)
def update_practice_list(
    practice_list_id: int,
    practice_list_update: PracticeListUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    return practice_list_service.update_practice_list_service(
        session=session, practice_list_id=practice_list_id, practice_list_in=practice_list_update, owner=current_user
    )

@router.delete("/{practice_list_id}", status_code=204)
def delete_practice_list(
    practice_list_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    practice_list_service.delete_practice_list_service(
        session=session, practice_list_id=practice_list_id, owner=current_user
    )
    return

# --- Practice List Content Management ---

@router.post("/{practice_list_id}/items", response_model=List[PracticeListItemRead])
def add_items_to_practice_list(
    practice_list_id: int,
    item_create: PracticeListItemCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    return practice_list_service.add_items_to_list_service(
        session=session, practice_list_id=practice_list_id, item_create=item_create, owner=current_user
    )

@router.delete("/{practice_list_id}/items/{item_id}", status_code=204)
def remove_item_from_practice_list(
    practice_list_id: int,
    item_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    practice_list_service.remove_item_from_list_service(
        session=session, practice_list_id=practice_list_id, item_id=item_id, owner=current_user
    )
    return

@router.put("/{practice_list_id}/items/reorder", status_code=204)
def reorder_practice_list_items(
    practice_list_id: int,
    reorder_request: PracticeListReorderRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    practice_list_service.reorder_list_items_service(
        session=session, practice_list_id=practice_list_id, reorder_request=reorder_request, owner=current_user
    )
    return

# --- Review Related (DEMO) ---
# This logic remains in the router for now as it's a placeholder.
# It will be moved to a dedicated review_service.py when FSRS is implemented.

@router.get("/{practice_list_id}/review-queue", response_model=List[PracticeListItemRead])
def get_review_queue(
    practice_list_id: int,
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # This is placeholder logic
    practice_list = session.get(PracticeList, practice_list_id)
    if not practice_list or practice_list.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Practice list not found")
    
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
    # This is placeholder logic
    item = session.get(PracticeListItem, item_id)
    if not item or item.practice_list_id != practice_list_id:
        raise HTTPException(status_code=404, detail="Item not found")

    # Simple mastery level adjustment
    item.review_count += 1
    item.last_reviewed = datetime.utcnow()
    if review_result.rating == "easy":
        item.mastery_level = min(5, item.mastery_level + 2)
    elif review_result.rating == "good":
        item.mastery_level = min(5, item.mastery_level + 1)
    else: # again
        item.mastery_level = max(0, item.mastery_level - 1)
    
    session.add(item)
    session.commit()
    
    return {"message": "Review result recorded", "new_mastery_level": item.mastery_level}
