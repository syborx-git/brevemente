import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application Info
    APP_NAME: str = "Brevemente Transcription Engine"
    APP_VERSION: str = "1.0.0"
    ENV: str = "production"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Security
    INTERNAL_API_KEY: str = "dev-secret-api-key-change-in-prod"

    # Faster Whisper Configuration
    WHISPER_MODEL_SIZE: str = "base"
    WHISPER_DEVICE: str = "cpu"
    WHISPER_COMPUTE_TYPE: str = "int8"
    WHISPER_DOWNLOAD_ROOT: Optional[str] = "./models_cache"

    # Performance & Long Audio Optimization
    WHISPER_CPU_THREADS: int = 4
    WHISPER_NUM_WORKERS: int = 1
    WHISPER_BEAM_SIZE: int = 2
    WHISPER_USE_BATCHED: bool = True
    WHISPER_BATCH_SIZE: int = 8
    WHISPER_CONDITION_ON_PREVIOUS_TEXT: bool = False
    WHISPER_VAD_MIN_SILENCE_DURATION_MS: int = 500

    # Concurrency Management
    MAX_CONCURRENT_TRANSCRIPTIONS: int = 2

    # Storage & Temporary Files
    TEMP_DIR: str = "./tmp/transcriptions"

    # Webhook / Callback Settings
    CALLBACK_TIMEOUT_SECONDS: float = 30.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def ensure_directories(self) -> None:
        """Ensure necessary working directories exist."""
        Path(self.TEMP_DIR).mkdir(parents=True, exist_ok=True)
        if self.WHISPER_DOWNLOAD_ROOT:
            Path(self.WHISPER_DOWNLOAD_ROOT).mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.ensure_directories()
