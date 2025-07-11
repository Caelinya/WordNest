from sqlmodel import Session, select
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from ..models import Folder, User

def create_folder_service(*, session: Session, folder_name: str, owner: User) -> Folder:
    """
    Creates a new folder for a user, handling duplicate name conflicts.
    """
    new_folder = Folder(name=folder_name, owner_id=owner.id)
    session.add(new_folder)
    try:
        session.commit()
        session.refresh(new_folder)
        return new_folder
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=409, # Use 409 Conflict for duplicate resource
            detail="Folder with this name already exists."
        )
