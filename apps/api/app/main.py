from fastapi import FastAPI
from sqlmodel import Field, Session, SQLModel, create_engine, select
from contextlib import asynccontextmanager
import os

# Define the database file path
# It will be created in the volume mounted at /app/data
DATABASE_FILE = "database.db"
DATABASE_PATH = f"./data/{DATABASE_FILE}"
sqlite_url = f"sqlite:///{DATABASE_PATH}"

# Create the directory if it doesn't exist
os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)

# Create the database engine
engine = create_engine(sqlite_url, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# Lifespan manager to create tables on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Creating tables...")
    create_db_and_tables()
    print("Tables created.")
    yield

# Define the FastAPI app with the lifespan manager
app = FastAPI(lifespan=lifespan)

# Define a simple data model for testing
class Note(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    text: str

@app.get("/")
def read_root():
    try:
        with Session(engine) as session:
            note_count = session.exec(select(Note)).all()
            return {"message": "Hello from WordNest API", "database_status": "connected", "note_count": len(note_count)}
    except Exception as e:
        return {"message": "Hello from WordNest API", "database_status": "error", "detail": str(e)}
