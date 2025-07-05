from fastapi import FastAPI
from contextlib import asynccontextmanager

from . import auth, notes, parser, folders, tags
from .db import engine
from .models import SQLModel

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
app.include_router(notes.router, prefix="/notes", tags=["notes"])
app.include_router(parser.router, prefix="/parser", tags=["parser"])
app.include_router(folders.router, prefix="/folders", tags=["folders"])
app.include_router(tags.router, prefix="/tags", tags=["tags"])

@app.get("/")
def read_root():
    return {"message": "Welcome to WordNest API"}
