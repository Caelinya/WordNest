from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import List

from .db import engine
from .models import User, Tag
from .auth import get_current_user
from .services import tag_service

router = APIRouter()

def get_session():
    with Session(engine) as session:
        yield session

@router.get("", response_model=List[Tag])
def get_tags(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Get all tags for the current user.
    """
    return tag_service.get_tags_by_owner(db=session, owner_id=current_user.id)