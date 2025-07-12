from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from . import auth, notes, parser, folders, tags, practice_lists, essays
from .db import engine
from .models import SQLModel
from .config import settings, logger
from .middleware import RateLimitMiddleware

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

# Add rate limiting middleware for auth endpoints
app.add_middleware(
    RateLimitMiddleware,
    max_requests=5,  # 5 attempts
    window_seconds=900  # per 15 minutes
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(notes.router, prefix="/notes", tags=["notes"])
app.include_router(parser.router, prefix="/parser", tags=["parser"])
app.include_router(folders.router, prefix="/folders", tags=["folders"])
app.include_router(tags.router, prefix="/tags", tags=["tags"])
app.include_router(practice_lists.router, prefix="/practice-lists", tags=["practice-lists"])
app.include_router(essays.router, prefix="/essays", tags=["essays"])

@app.get("/")
def read_root():
    return {"message": "Welcome to WordNest API"}
