import logging
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # --- Security (Required) ---
    SECRET_KEY: str

    # --- Token Expiration (Optional) ---
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # --- AI Service (Required) ---
    API_KEY: str
    
    # --- AI Service Endpoint (Optional) ---
    BASE_URL: str
    AI_MODEL: str
    EMBEDDING_MODEL: str

    # --- Database (Optional) ---
    DATABASE_URL: str | None = None
    
    # --- CORS (Optional) ---
    CORS_ORIGINS: str = "*"  # Comma-separated list of origins or "*" for all
    
    # --- Logging (Optional) ---
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8', extra='ignore')

settings = Settings()

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

# Create a logger instance for the application
logger = logging.getLogger("wordnest")