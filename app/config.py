from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    mongodb_url: str = Field(default="mongodb://localhost:27017")
    database_name: str = Field(default="job_scraper")
    cors_origins: str = Field(default="http://localhost:3000")
    scrape_interval_hours: int = Field(default=6)
    verify_interval_hours: int = Field(default=12)
    rapidapi_key: str = Field(default="")  # Add this field for JSearch API
    
    class Config:
        env_file = ".env"

settings = Settings()
