from sqlmodel import create_engine
import os
from .config import settings

# Determine the database URL
if settings.DATABASE_URL:
    # Use PostgreSQL if DATABASE_URL is set
    connect_args = {}
    engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, echo=True)
else:
    # Fallback to SQLite for local development
    DATABASE_FILE = "database.db"
    DATABASE_PATH = f"./data/{DATABASE_FILE}"
    sqlite_url = f"sqlite:///{DATABASE_PATH}"
    
    # Create the directory if it doesn't exist
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    
    connect_args = {"check_same_thread": False} # Needed for SQLite
    engine = create_engine(sqlite_url, connect_args=connect_args, echo=True)