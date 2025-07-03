import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import time

# --- Configuration ---
# Load environment variables from .env file in the `apps/api` directory
dotenv_path = os.path.join('apps', 'api', '.env')
load_dotenv(dotenv_path=dotenv_path)

# Get the database URL from environment variables
DATABASE_URL = os.getenv("DATABASE_URL")

# --- Main Test Logic ---
if not DATABASE_URL:
    print("❌ Error: DATABASE_URL not found in apps/api/.env file.")
    print("Please make sure you have created the .env file and set the variable.")
else:
    print(f"Attempting to connect to the database...")
    print(f"URL: {DATABASE_URL[:DATABASE_URL.find('//')+2]}...{DATABASE_URL[DATABASE_URL.rfind('@'):]}") # Print a masked URL

    try:
        # Create a new SQLAlchemy engine
        engine = create_engine(DATABASE_URL)

        # Try to connect
        start_time = time.time()
        with engine.connect() as connection:
            end_time = time.time()
            
            # If connection is successful, run a simple query
            result = connection.execute(text("SELECT version();"))
            db_version = result.fetchone()
            
            print("\n✅ Success! Connection established.")
            print(f"   -> Connection time: {((end_time - start_time) * 1000):.2f} ms")
            print(f"   -> PostgreSQL Version: {db_version[0]}")

    except Exception as e:
        print("\n❌ Error: Failed to connect to the database.")
        print("\n--- Details ---")
        print(e)
        print("\n--- Troubleshooting ---")
        print("1. Firewall: Is port 5432 open on your server?")
        print("2. Credentials: Are the username, password, and database name correct?")
        print("3. Host: Is the server IP address correct and reachable?")
        print("4. pg_hba.conf: Did you correctly configure remote access for the user?")

