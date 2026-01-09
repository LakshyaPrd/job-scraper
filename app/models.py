from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class JobPosting(BaseModel):
    job_id: str
    title: str
    company: str
    location: str
    url: str
    description: Optional[str] = None
    source: str  # "linkedin" or "indeed"
    posted_date: Optional[datetime] = None
    application_deadline: Optional[datetime] = None
    is_active: bool = True
    last_verified: datetime = Field(default_factory=datetime.utcnow)
    expired_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    salary: Optional[str] = None
    job_type: Optional[str] = None
    search_category: Optional[str] = None  # e.g., "Spring Boot", "Frontend"

class SearchRequest(BaseModel):
    role: str
    location: Optional[str] = ""
    platforms: List[str] = Field(default=["linkedin", "jsearch"])
    max_jobs: int = Field(default=100)
    continue_from_last: bool = Field(default=False)

class FilterRequest(BaseModel):
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    job_types: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    sources: Optional[List[str]] = None
    remote_only: bool = False
    date_filter: str = "all"
    
class JobResponse(BaseModel):
    jobs: list
    total: int
    new_jobs_count: int

class CategoriesResponse(BaseModel):
    categories: List[str]

class CompanyResponse(BaseModel):
    companies: list
    total: int
