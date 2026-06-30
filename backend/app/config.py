import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./mincounter.db"
    SECRET_KEY: str = "supersecretjwtkeychangeinproduction123456"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REDIS_URL: str = "redis://localhost:6379/0"
    USE_CELERY: bool = False

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
