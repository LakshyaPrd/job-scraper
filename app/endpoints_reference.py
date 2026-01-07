"""
New API endpoint for getting jobs grouped by scrape date
"""

# New endpoint to add to main.py:

@app.get("/api/jobs/by-date")
async def get_jobs_by_date():
    """Get jobs grouped by scrape date (today, yesterday, older)"""
    from datetime import datetime, timedelta
    
    jobs_by_date = await app.state.job_service.get_jobs_grouped_by_date()
    
    return jobs_by_date


# Add this method to JobService class in job_service.py:

async def get_jobs_grouped_by_date(self):
    """Get jobs grouped by scrape date"""
    from datetime import datetime, timedelta
    
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    
    # Get today's jobs
    today_jobs = await self.collection.find({
        'is_active': True,
        'description': {'$exists': True, '$ne': '', '$ne': None},
        'created_at': {'$gte': today_start}
    }).sort('created_at', -1).to_list(length=None)
    
    # Get yesterday's jobs
    yesterday_jobs = await self.collection.find({
        'is_active': True,
        'description': {'$exists': True, '$ne': '', '$ne': None},
        'created_at': {'$gte': yesterday_start, '$lt': today_start}
    }).sort('created_at', -1).to_list(length=None)
    
    # Get older jobs (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    older_jobs = await self.collection.find({
        'is_active': True,
        'description': {'$exists': True, '$ne': '', '$ne': None},
        'created_at': {'$gte': week_ago, '$lt': yesterday_start}
    }).sort('created_at', -1).to_list(length=None)
    
    # Convert dates to strings for all jobs
    for job_list in [today_jobs, yesterday_jobs, older_jobs]:
        for job in job_list:
            job['_id'] = str(job['_id'])
            if job.get('posted_date'):
                job['posted_date'] = job['posted_date'].isoformat()
            if job.get('last_verified'):
                job['last_verified'] = job['last_verified'].isoformat()
            if job.get('created_at'):
                job['created_at'] = job['created_at'].isoformat()
    
    return {
        "today": {
            "date": today_start.isoformat(),
            "count": len(today_jobs),
            "jobs": today_jobs
        },
        "yesterday": {
            "date": yesterday_start.isoformat(),
            "count": len(yesterday_jobs),
            "jobs": yesterday_jobs
        },
        "older": {
            "count": len(older_jobs),
            "jobs": older_jobs
        }
    }
