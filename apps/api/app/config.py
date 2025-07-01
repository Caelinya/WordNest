from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # --- Security (Required) ---
    SECRET_KEY: str

    # --- Token Expiration (Optional) ---
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # --- AI Service (Required) ---
    API_KEY: str
    
    # --- AI Service Endpoint (Optional) ---
    BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    AI_MODEL: str = "gemini-2.0-flash"

    # --- Database (Optional) ---
    DATABASE_URL: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8', extra='ignore')

settings = Settings()