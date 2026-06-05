"""Application configuration loaded from environment variables."""
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized settings. Values are read from .env or environment."""

    csv_path: str = "./data/matches_1930_2022.csv"
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"
    ollama_timeout_seconds: int = 60
    cors_origins: str = "http://localhost:5173"
    # Optional seed for deterministic random selection in tests.
    random_seed: Optional[int] = None

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated origins into a list."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()