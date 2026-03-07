from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # application configuration
    app_name: str = "Transformer Visualizer API"
    
    # model configuration
    default_language: str = "en"
    device: str = "cpu"
    
    class Config:
        env_file = ".env"

# global settings instance
settings = Settings()
