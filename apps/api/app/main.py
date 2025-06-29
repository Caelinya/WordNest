from fastapi import FastAPI, HTTPException, Depends
from sqlmodel import Session, select
from contextlib import asynccontextmanager

from . import auth
from .db import engine
from .models import SQLModel, User, Note

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Creating tables...")
    create_db_and_tables()
    print("Tables created.")
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(auth.router, prefix="/auth", tags=["auth"])


@app.get("/")
def read_root():
    try:
        with Session(engine) as session:
            # One-time check to create a default user for development
            user_count = session.exec(select(User)).all()
            if not user_count:
                print("Creating default user...")
                # NOTE: In a real app, use a secure password and hashing
                default_user = User(username="default", hashed_password="password")
                session.add(default_user)
                session.commit()
                print("Default user created.")

            note_count = session.exec(select(Note)).all()
            return {"message": "Hello from WordNest API", "database_status": "connected", "note_count": len(note_count)}
    except Exception as e:
        return {"message": "Hello from WordNest API", "database_status": "error", "detail": str(e)}


class NoteCreate(SQLModel):
    text: str


@app.post("/notes", response_model=Note)
def create_note(note: NoteCreate, current_user: User = Depends(auth.get_current_user)):
    """
    Create a new note for the current user.
    """
    with Session(engine) as session:
        db_note = Note(text=note.text, owner_id=current_user.id)
        
        session.add(db_note)
        session.commit()
        
        session.refresh(db_note)
        
        return db_note


@app.get("/notes", response_model=list[Note])
def read_notes(current_user: User = Depends(auth.get_current_user)):
    """
    Retrieve all notes for the current user.
    """
    with Session(engine) as session:
        notes = session.exec(select(Note).where(Note.owner_id == current_user.id)).all()
        return notes


@app.delete("/notes/{note_id}", status_code=204)
def delete_note(note_id: int, current_user: User = Depends(auth.get_current_user)):
    """
    Delete a note by its ID, ensuring it belongs to the current user.
    """
    with Session(engine) as session:
        note = session.get(Note, note_id)
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        if note.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this note")
        
        session.delete(note)
        session.commit()
        
        return
