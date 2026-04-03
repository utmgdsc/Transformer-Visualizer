from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # application configuration
    app_name: str = "Transformer Visualizer API"
    
    # model configuration
    default_language: str = "en"
    device: str = "cpu"
    
    # API keys
    groq_api_key: Optional[str] = None
    
    class Config:
        env_file = ".env"

# global settings instance
settings = Settings()
