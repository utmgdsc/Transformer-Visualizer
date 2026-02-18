from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # application configuration
    app_name: str = "Transformer Visualizer API"
    
    # model configuration
    model_name: str = "gpt2"
    device: str = "cpu"
    
    class Config:
        env_file = ".env"

# global settings instance
settings = Settings()
