from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.config import settings
import asyncio

class JobScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.job_service = None
        
    def init_scheduler(self, job_service):
        """Initialize scheduler with job service"""
        self.job_service = job_service
        
        # Schedule scraping jobs every N hours
        self.scheduler.add_job(
            func=self._run_scrape_job,
            trigger=IntervalTrigger(hours=settings.scrape_interval_hours),
            id='scrape_jobs',
            name='Scrape new job postings',
            replace_existing=True
        )
        
        # Schedule verification every N hours
        self.scheduler.add_job(
            func=self._run_verify_job,
            trigger=IntervalTrigger(hours=settings.verify_interval_hours),
            id='verify_jobs',
            name='Verify job status',
            replace_existing=True
        )
        
        self.scheduler.start()
        print("Scheduler started")
    
    def _run_scrape_job(self):
        """Run scraping in async context"""
        # Default search terms (you can make this configurable)
        search_terms = [
            ("Software Engineer", ""),
            ("Data Scientist", ""),
            ("Product Manager", "")
        ]
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        for role, location in search_terms:
            loop.run_until_complete(
                self.job_service.scrape_and_store_jobs(role, location)
            )
        
        loop.close()
    
    def _run_verify_job(self):
        """Run verification in async context"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        loop.run_until_complete(self.job_service.verify_jobs_status())
        loop.close()
    
    def shutdown(self):
        """Shutdown scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            print("Scheduler shutdown")

scheduler = JobScheduler()
