from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from typing import List
from datetime import datetime

router = APIRouter()

@router.get("/api/scrape-sessions")
async def get_scrape_sessions(
    limit: int = 20,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get list of recent scrape sessions
    
    Returns sessions sorted by scraped_at (newest first)
    """
    sessions_collection = db.scrape_sessions
    
    # Get sessions, sorted by date
    cursor = sessions_collection.find({}).sort("scraped_at", -1).limit(limit)
    sessions = await cursor.to_list(length=limit)
    
    # Convert ObjectId and datetime to string
    for session in sessions:
        session['_id'] = str(session['_id'])
        if session.get('scraped_at'):
            session['scraped_at'] = session['scraped_at'].isoformat()
    
    return {
        "sessions": sessions,
        "total": len(sessions)
    }

@router.get("/api/scrape-sessions/{session_id}/jobs")
async def get_session_jobs(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get all jobs from a specific scrape session
    """
    jobs_collection = db.jobs
    
    # Find all jobs with this session_id
    cursor = jobs_collection.find({"scrape_session_id": session_id}).sort("created_at", -1)
    jobs = await cursor.to_list(length=1000)
    
    # Convert ObjectId and datetime to string
    for job in jobs:
        job['_id'] = str(job['_id'])
        if job.get('posted_date'):
            job['posted_date'] = job['posted_date'].isoformat()
        if job.get('last_verified'):
            job['last_verified'] = job['last_verified'].isoformat()
        if job.get('created_at'):
            job['created_at'] = job['created_at'].isoformat()
    
    return {
        "jobs": jobs,
        "total": len(jobs),
        "session_id": session_id
    }
