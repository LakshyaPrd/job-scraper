from fastapi import APIRouter, Depends, HTTPException
from app.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter()

@router.get("/api/companies")
async def get_companies(
    search_role: str = None,
    date_filter: str = "all",
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get companies aggregated by job count
    
    Args:
        search_role: Filter by role/title (optional)
        date_filter: Filter by date - 'today', 'yesterday', 'week', 'all'
    """
    from app.services.job_service import JobService
    
    job_service = JobService(db)
    return await job_service.get_companies(search_role, date_filter)

@router.get("/api/companies/{company_name}/jobs")
async def get_company_jobs(
    company_name: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get all jobs from a specific company
    
    Args:
        company_name: Name of the company
    """
    from app.services.job_service import JobService
    
    job_service = JobService(db)
    result = await job_service.get_company_jobs(company_name)
    
    if result['total_jobs'] == 0:
        raise HTTPException(status_code=404, detail=f"No jobs found for company: {company_name}")
    
    return result

@router.get("/api/companies/{company_name}/info")
async def get_company_info(company_name: str):
    """
    Get company information (website and description) using Google Custom Search API
    
    Returns:
        {
            "website": "https://www.company.com",
            "description": "Actual company description from Google"
        }
    """
    from app.services.company_info_service import CompanyInfoService
    
    company_info_service = CompanyInfoService()
    info = await company_info_service.get_company_info(company_name)
    
    # If we got a website, try to fetch a better About description
    if info['website'] and not info['description']:
        about = await company_info_service.get_company_about(company_name, info['website'])
        if about:
            info['description'] = about
    
    return info

