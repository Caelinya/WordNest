from sqlmodel import create_engine
import os

DATABASE_FILE = "database.db"
DATABASE_PATH = f"./data/{DATABASE_FILE}"
sqlite_url = f"sqlite:///{DATABASE_PATH}"

# Create the directory if it doesn't exist
os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)

engine = create_engine(sqlite_url, echo=True)