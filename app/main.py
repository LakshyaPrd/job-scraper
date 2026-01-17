from fastapi import FastAPI, Depends, BackgroundTasks, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import connect_to_mongo, close_mongo_connection, get_database
from app.config import settings
from app.models import SearchRequest, JobResponse, CategoriesResponse, FilterRequest
from app.routers import companies, sessions  # Import sessions router
from app.services.job_service import JobService
from app.scheduler import scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    db = await get_database()
    job_service = JobService(db)
    
    # Initialize scheduler
    scheduler.init_scheduler(job_service)
    
    # Store job_service in app state
    app.state.job_service = job_service
    
    yield
    
    # Shutdown
    scheduler.shutdown()
    await close_mongo_connection()

app = FastAPI(
    title="Job Scraper API",
    version="1.0.0",
    lifespan=lifespan
)

# Register routers
app.include_router(companies.router)
app.include_router(sessions.router)  # Add sessions router

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Job Scraper API is running"}

@app.post("/api/scrape", response_model=dict)
async def trigger_scrape(
    search: SearchRequest,
    background_tasks: BackgroundTasks
):
    """Trigger immediate scrape for specific role"""
    async def scrape_task():
        await app.state.job_service.scrape_and_store_jobs(
            search.role,
            search.location or "",
            search.platforms,
            search.max_jobs,
            search.continue_from_last
        )
    
    background_tasks.add_task(scrape_task)
    return {"message": "Scraping started in background", "role": search.role, "platforms": search.platforms, "max_jobs": search.max_jobs}

@app.get("/api/jobs", response_model=JobResponse)
async def get_jobs(
    skip: int = 0, 
    limit: int = 100,
    date_filter: str = Query("all", description="Filter by date: 'today', 'yesterday', 'week', 'all'")
):
    """Get all active jobs with optional date filtering"""
    jobs, total = await app.state.job_service.get_active_jobs(skip, limit, date_filter)
    
    # Count new jobs (posted in last 24 hours)
    from datetime import datetime, timedelta
    new_threshold = datetime.utcnow() - timedelta(hours=24)
    new_jobs_count = 0
    for j in jobs:
        created_at = j.get('created_at')
        if created_at:
            try:
                if isinstance(created_at, str):
                    # Remove timezone info for comparison
                    clean_date = created_at.split('+')[0].split('Z')[0]
                    created_dt = datetime.fromisoformat(clean_date)
                else:
                    created_dt = created_at
                if created_dt > new_threshold:
                    new_jobs_count += 1
            except Exception:
                pass
    
    return {
        "jobs": jobs,
        "total": total,
        "new_jobs_count": new_jobs_count
    }

@app.post("/api/search", response_model=list)
async def search_jobs(search: SearchRequest):
    """Search jobs by role"""
    jobs = await app.state.job_service.search_jobs_by_role(
        search.role,
        search.location or ""
    )
    return jobs

@app.post("/api/verify")
async def verify_jobs(background_tasks: BackgroundTasks):
    """Trigger job verification"""
    async def verify_task():
        await app.state.job_service.verify_jobs_status()
    
    background_tasks.add_task(verify_task)
    return {"message": "Verification started in background"}

@app.get("/api/categories", response_model=CategoriesResponse)
async def get_categories():
    """Get all search categories (tabs)"""
    categories = await app.state.job_service.get_categories()
    return {"categories": categories}

@app.get("/api/jobs/category/{category}")
async def get_jobs_by_category(
    category: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500)
):
    """Get jobs by category"""
    jobs, total = await app.state.job_service.get_jobs_by_category(category, skip, limit)
    return {"jobs": jobs, "total": total}

@app.delete("/api/categories/{category}")
async def delete_category(category: str):
    """Delete a category and all its jobs"""
    deleted_count = await app.state.job_service.delete_category(category)
    return {"message": f"Deleted {deleted_count} jobs from category: {category}"}

@app.get("/api/jobs/detail/{job_id}")
async def get_job_by_id(job_id: str):
    """Get single job with full description by job_id"""
    try:
        job = await app.state.job_service.get_job_by_id(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/jobs/filter")
async def filter_jobs(
    min_salary: int = None,
    max_salary: int = None,
    job_types: str = None,
    locations: str = None,
    sources: str = None,
    remote_only: bool = False,
    date_filter: str = "all"
):
    """Filter jobs based on various criteria"""
    job_types_list = job_types.split(",") if job_types else None
    locations_list = locations.split(",") if locations else None
    sources_list = sources.split(",") if sources else None
    
    result = await app.state.job_service.filter_jobs(
        min_salary=min_salary,
        max_salary=max_salary,
        job_types=job_types_list,
        locations=locations_list,
        sources=sources_list,
        remote_only=remote_only,
        date_filter=date_filter
    )
    return result

@app.get("/api/search/metadata/{search_key}")
async def get_search_metadata(search_key: str):
    """Get metadata for a search query to enable pagination"""
    metadata = await app.state.job_service.get_search_metadata(search_key)
    if not metadata:
        return {"search_key": search_key, "last_offset": 0, "total_scraped": 0}
    return metadata

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
