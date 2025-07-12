from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from . import auth, notes, parser, folders, tags, practice_lists
from .db import engine
from .models import SQLModel
from .config import settings, logger

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Creating database tables...")
    create_db_and_tables()
    logger.info("Database tables created successfully.")
    yield

app = FastAPI(lifespan=lifespan)

# Configure CORS
origins = []
if settings.CORS_ORIGINS == "*":
    origins = ["*"]
else:
    origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(notes.router, prefix="/notes", tags=["notes"])
app.include_router(parser.router, prefix="/parser", tags=["parser"])
app.include_router(folders.router, prefix="/folders", tags=["folders"])
app.include_router(tags.router, prefix="/tags", tags=["tags"])
app.include_router(practice_lists.router, prefix="/practice-lists", tags=["practice-lists"])

@app.get("/")
def read_root():
    return {"message": "Welcome to WordNest API"}
