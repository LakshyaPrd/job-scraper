from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "job_scraper"
    cors_origins: str = "http://localhost:3000"
    scrape_interval_hours: int = 6
    verify_interval_hours: int = 12
    
    class Config:
        env_file = ".env"

settings = Settings()
