from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from .db import engine
from .models import Folder, User
from .auth import get_current_user

router = APIRouter()

def get_session():
    with Session(engine) as session:
        yield session

@router.get("", response_model=list[Folder])
def get_folders(current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Get all folders for the current user.
    """
    folders = session.exec(select(Folder).where(Folder.owner_id == current_user.id)).all()
    return folders

@router.post("", response_model=Folder)
def create_folder(folder_name: str, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Create a new folder for the current user.
    """
    # Check if folder with the same name already exists for this user
    existing_folder = session.exec(
        select(Folder).where(Folder.owner_id == current_user.id, Folder.name == folder_name)
    ).first()
    if existing_folder:
        raise HTTPException(status_code=400, detail="Folder with this name already exists.")

    new_folder = Folder(name=folder_name, owner_id=current_user.id)
    session.add(new_folder)
    session.commit()
    session.refresh(new_folder)
    return new_folder