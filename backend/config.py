from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # application configuration
    app_name: str = "Transformer Visualizer API"
    
    # server configuration
    host: str = "0.0.0.0"
    port: int = int(os.getenv("PORT", 8000))
    
    # model configuration
    default_language: str = "en"
    device: str = "cpu"
    
    # API keys
    groq_api_key: Optional[str] = None
    
    class Config:
        env_file = ".env"

# global settings instance
settings = Settings()
