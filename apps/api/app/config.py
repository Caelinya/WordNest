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

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8', extra='ignore')

settings = Settings()