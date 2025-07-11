from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from .db import engine
from .models import Folder, User
from .auth import get_current_user
from .schemas import FolderCreate # Import the new schema
from .services import folder_service # Import the new service

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
def create_folder(folder: FolderCreate, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)):
    """
    Create a new folder for the current user by calling the folder service.
    """
    return folder_service.create_folder_service(
        session=session, folder_name=folder.name, owner=current_user
    )