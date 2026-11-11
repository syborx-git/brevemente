import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Brevemente Document Engine"
    APP_VERSION: str = "1.0.0"
    ENV: str = "production"
    PORT: int = 8005
    HOST: str = "0.0.0.0"

    # API Security
    INTERNAL_API_KEY: str = "dev-secret-api-key-change-in-prod"

    # Temporary directory for file processing
    TEMP_DIR: str = "/tmp/documents"

    # Chunking defaults
    DEFAULT_MIN_CHUNK_WORDS: int = 300
    DEFAULT_MAX_CHUNK_WORDS: int = 600

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def ensure_directories(self) -> None:
        Path(self.TEMP_DIR).mkdir(parents=True, exist_ok=True)


settings = Settings()

