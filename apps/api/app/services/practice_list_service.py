from fastapi import HTTPException
from sqlmodel import Session, select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime

from ..models import PracticeList, PracticeListItem, Note, User
from ..schemas import PracticeListCreate, PracticeListUpdate, PracticeListRead, PracticeListDetail, PracticeListItemCreate, PracticeListReorderRequest

def create_practice_list_service(*, session: Session, practice_list_in: PracticeListCreate, owner: User) -> PracticeListRead:
    db_practice_list = PracticeList.model_validate(practice_list_in, update={"owner_id": owner.id})
    session.add(db_practice_list)
    try:
        session.commit()
        session.refresh(db_practice_list)
        result = PracticeListRead.model_validate(db_practice_list)
        result.item_count = 0
        return result
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=409, detail="A practice list with this name already exists.")

def get_practice_lists_service(*, session: Session, owner: User) -> List[PracticeListRead]:
    item_count_subquery = (
        select(PracticeListItem.practice_list_id, func.count(PracticeListItem.id).label("count"))
        .group_by(PracticeListItem.practice_list_id)
        .subquery()
    )
    
    statement = (
        select(PracticeList, item_count_subquery.c.count)
        .outerjoin(item_count_subquery, PracticeList.id == item_count_subquery.c.practice_list_id)
        .where(PracticeList.owner_id == owner.id)
        .order_by(PracticeList.created_at.desc())
    )
    
    results = session.exec(statement).all()
    
    practice_lists = []
    for practice_list, count in results:
        pl_dict = practice_list.model_dump()
        pl_dict["item_count"] = count or 0
        practice_lists.append(PracticeListRead(**pl_dict))
    
    return practice_lists

def get_practice_list_details_service(*, session: Session, practice_list_id: int, owner: User) -> PracticeListDetail:
    practice_list = session.get(PracticeList, practice_list_id)
    if not practice_list or practice_list.owner_id != owner.id:
        raise HTTPException(status_code=404, detail="Practice list not found")
    
    items = session.exec(
        select(PracticeListItem)
        .options(selectinload(PracticeListItem.note))
        .where(PracticeListItem.practice_list_id == practice_list_id)
        .order_by(PracticeListItem.order_index)
    ).all()
    
    result = PracticeListDetail.model_validate(practice_list)
    result.item_count = len(items)
    result.items = items
    
    return result

def update_practice_list_service(*, session: Session, practice_list_id: int, practice_list_in: PracticeListUpdate, owner: User) -> PracticeListRead:
    practice_list = session.get(PracticeList, practice_list_id)
    if not practice_list or practice_list.owner_id != owner.id:
        raise HTTPException(status_code=404, detail="Practice list not found")

    update_data = practice_list_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(practice_list, key, value)
    
    practice_list.updated_at = datetime.utcnow()
    session.add(practice_list)
    
    try:
        session.commit()
        session.refresh(practice_list)
        item_count = session.exec(
            select(func.count(PracticeListItem.id))
            .where(PracticeListItem.practice_list_id == practice_list_id)
        ).scalar_one_or_none() or 0
        
        result = PracticeListRead.model_validate(practice_list)
        result.item_count = item_count
        return result
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=409, detail="A practice list with this name already exists.")

def delete_practice_list_service(*, session: Session, practice_list_id: int, owner: User):
    practice_list = session.get(PracticeList, practice_list_id)
    if not practice_list or practice_list.owner_id != owner.id:
        raise HTTPException(status_code=404, detail="Practice list not found")
    
    session.delete(practice_list)
    session.commit()
    return

def add_items_to_list_service(*, session: Session, practice_list_id: int, item_create: PracticeListItemCreate, owner: User) -> List[PracticeListItem]:
    practice_list = session.get(PracticeList, practice_list_id)
    if not practice_list or practice_list.owner_id != owner.id:
        raise HTTPException(status_code=404, detail="Practice list not found")

    existing_note_ids = set(
        session.exec(
            select(PracticeListItem.note_id)
            .where(PracticeListItem.practice_list_id == practice_list_id)
        ).all()
    )
    
    max_order = session.exec(
        select(func.max(PracticeListItem.order_index))
        .where(PracticeListItem.practice_list_id == practice_list_id)
    ).first() or -1
    
    added_items = []
    for idx, note_id in enumerate(item_create.note_ids):
        if note_id in existing_note_ids:
            continue
            
        note = session.get(Note, note_id)
        if not note or note.owner_id != owner.id:
            continue
        
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
        for item in added_items:
            session.refresh(item)
    
    return added_items

def remove_item_from_list_service(*, session: Session, practice_list_id: int, item_id: int, owner: User):
    item = session.exec(
        select(PracticeListItem)
        .join(PracticeList)
        .where(PracticeListItem.id == item_id, PracticeList.owner_id == owner.id, PracticeListItem.practice_list_id == practice_list_id)
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found in the specified practice list.")
        
    practice_list = session.get(PracticeList, practice_list_id)
    practice_list.updated_at = datetime.utcnow()

    session.delete(item)
    session.add(practice_list)
    session.commit()
    return

def reorder_list_items_service(*, session: Session, practice_list_id: int, reorder_request: PracticeListReorderRequest, owner: User):
    practice_list = session.get(PracticeList, practice_list_id)
    if not practice_list or practice_list.owner_id != owner.id:
        raise HTTPException(status_code=404, detail="Practice list not found")
    
    # Fetch all items to be reordered in one query to ensure they belong to the user and list
    items_to_reorder = session.exec(
        select(PracticeListItem).where(
            PracticeListItem.id.in_(reorder_request.item_ids),
            PracticeListItem.practice_list_id == practice_list_id
        )
    ).all()

    item_map = {item.id: item for item in items_to_reorder}

    if len(item_map) != len(reorder_request.item_ids):
        raise HTTPException(status_code=400, detail="One or more items do not belong to this practice list.")

    for idx, item_id in enumerate(reorder_request.item_ids):
        item = item_map[item_id]
        item.order_index = idx
        session.add(item)
    
    practice_list.updated_at = datetime.utcnow()
    session.add(practice_list)
    session.commit()
    return
