from fastapi import FastAPI
from contextlib import asynccontextmanager

from . import auth, notes, parser
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

@app.get("/")
def read_root():
    return {"message": "Welcome to WordNest API"}
