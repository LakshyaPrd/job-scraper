from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    mongodb_url: str = Field(default="mongodb://localhost:27017")
    database_name: str = Field(default="job_scraper")
    cors_origins: str = Field(default="http://localhost:3000")
    scrape_interval_hours: int = Field(default=6)
    verify_interval_hours: int = Field(default=12)
    rapidapi_key: str = Field(default="")  # JSearch API key
    google_api_key: str = Field(default="")  # Google Custom Search API key
    google_search_engine_id: str = Field(default="")  # Google Custom Search Engine ID
    
    class Config:
        env_file = ".env"

settings = Settings()

