from typing import List, Dict
from datetime import datetime
import time

# Make scrapers optional - they won't work in Railway without Chrome/display
try:
    from app.scrapers.linkedin_scraper import LinkedInScraper
    LINKEDIN_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ Warning: LinkedIn scraper not available - {e}")
    LinkedInScraper = None
    LINKEDIN_AVAILABLE = False

try:
    from app.scrapers.indeed_scraper import IndeedScraper
    INDEED_SELENIUM_AVAILABLE = True
except ImportError as e:
    print(f"ℹ️ Info: Selenium Indeed scraper not available (expected in production) - {e}")
    IndeedScraper = None
    INDEED_SELENIUM_AVAILABLE = False

# JSearch API scraper - works everywhere (no Selenium needed)
try:
    from app.scrapers.jsearch_scraper import JSearchScraper
    JSEARCH_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ Warning: JSearch scraper not available - {e}")
    JSearchScraper = None
    JSEARCH_AVAILABLE = False

from motor.motor_asyncio import AsyncIOMotorDatabase

class JobService:
    def __init__(self, db: AsyncIOMotorDatabase, use_brave: bool = True):
        self.db = db
        self.collection = db.jobs
        
        # Initialize LinkedIn scraper (works on Railway - uses requests only)
        if LINKEDIN_AVAILABLE and LinkedInScraper:
            self.linkedin_scraper = LinkedInScraper()
            print("✅ LinkedIn scraper initialized")
        else:
            self.linkedin_scraper = None
            print("ℹ️ LinkedIn scraper not available")
        
        # Initialize JSearch scraper (works on Railway - API-based)
        if JSEARCH_AVAILABLE and JSearchScraper:
            self.jsearch_scraper = JSearchScraper()
            print("✅ JSearch API scraper initialized")
        else:
            self.jsearch_scraper = None
            print("ℹ️ JSearch API scraper not available")
            
        # Initialize Selenium Indeed scraper (only works locally)
        if INDEED_SELENIUM_AVAILABLE and IndeedScraper:
            self.indeed_scraper = IndeedScraper(use_brave=use_brave)
            print("✅ Indeed Selenium scraper initialized (local only)")
        else:
            self.indeed_scraper = None
        
        # Check if we have at least one scraper
        if not self.linkedin_scraper and not self.jsearch_scraper and not self.indeed_scraper:
            print("⚠️ Running in API-only mode (no scrapers available)")
    
    async def scrape_and_store_jobs(self, keywords: str, location: str = ""):
        """Scrape jobs from multiple platforms and store in DB"""
        if not self.linkedin_scraper and not self.jsearch_scraper and not self.indeed_scraper:
            print("⚠️ Scraping not available in this environment (no scrapers configured)")
            return 0
            
        print(f"\n{'='*60}")
        print(f"🔍 Starting scrape for: {keywords} in {location or 'Remote'}")
        print(f"{'='*60}\n")
        
        # Normalize the search category (e.g., "spring boot developer" -> "Spring Boot")
        search_category = keywords.strip().title()
        
        all_jobs = []
        
        # 1. Scrape with JSearch API (works on Railway) - gives Indeed + LinkedIn + Glassdoor
        if self.jsearch_scraper:
            print("🚀 Scraping with JSearch API (Indeed, LinkedIn, Glassdoor, etc.)...")
            jsearch_jobs = self.jsearch_scraper.search_jobs(keywords, location, max_pages=2)
            all_jobs.extend(jsearch_jobs)
            print(f"✅ Found {len(jsearch_jobs)} jobs from JSearch API\n")
        
        # 2. Scrape LinkedIn directly (works on Railway) - for additional LinkedIn jobs
        if self.linkedin_scraper:
            print("📘 Scraping LinkedIn directly...")
            linkedin_jobs = self.linkedin_scraper.search_jobs(keywords, location, max_pages=3)
            print(f"✅ Found {len(linkedin_jobs)} LinkedIn jobs\n")
            
            # Fetch full descriptions for LinkedIn jobs (JSearch already has descriptions)
            if linkedin_jobs:
                print(f"📄 Fetching full descriptions for LinkedIn jobs...")
                for idx, job in enumerate(linkedin_jobs, 1):
                    try:
                        if idx <= 10:  # Limit to first 10 to avoid timeout
                            print(f"  [{idx}/{min(len(linkedin_jobs), 10)}] Fetching: {job['title'][:50]}...")
                            details = self.linkedin_scraper.get_job_details(job['url'])
                            if details.get('description'):
                                job['description'] = details['description']
                            if details.get('job_type') and not job.get('job_type'):
                                job['job_type'] = details['job_type']
                            time.sleep(1)  # Brief delay
                    except Exception as e:
                        print(f"  ⚠️ Error fetching details: {e}")
                print(f"✅ LinkedIn descriptions fetched\n")
            
            all_jobs.extend(linkedin_jobs)
        
        # 3. Scrape with Selenium Indeed (only works locally, not on Railway)
        if self.indeed_scraper:
            print("🔵 Scraping Indeed with Selenium (local only)...")
            indeed_jobs = self.indeed_scraper.search_jobs(keywords, location, max_pages=2)
            print(f"✅ Found {len(indeed_jobs)} Indeed jobs\n")
            
            # Fetch full descriptions for Indeed jobs
            if indeed_jobs:
                print(f"📄 Fetching full descriptions for Indeed jobs...")
                for idx, job in enumerate(indeed_jobs, 1):
                    try:
                        if idx <= 10:  # Limit to first 10
                            print(f"  [{idx}/{min(len(indeed_jobs), 10)}] Fetching: {job['title'][:50]}...")
                            details = self.indeed_scraper.get_job_details(job['url'])
                            if details.get('description'):
                                job['description'] = details['description']
                            if details.get('job_type'):
                                job['job_type'] = details['job_type']
                            time.sleep(2)
                    except Exception as e:
                        print(f"  ⚠️ Error fetching details: {e}")
                print(f"✅ Indeed descriptions fetched\n")
            
            all_jobs.extend(indeed_jobs)
        
        new_jobs_count = 0
        skipped_no_description = 0
        
        print(f"💾 Storing jobs in database...")
        for job in all_jobs:
            # Skip jobs without descriptions
            if not job.get('description') or len(job.get('description', '').strip()) < 50:
                skipped_no_description += 1
                continue
            
            existing = await self.collection.find_one({'job_id': job['job_id']})
            
            if not existing:
                # Add search category to new jobs
                job['search_category'] = search_category
                await self.collection.insert_one(job)
                new_jobs_count += 1
            else:
                # Update last_verified and add to category if not already
                update_data = {'last_verified': datetime.utcnow()}
                # Add category if job doesn't have one
                if not existing.get('search_category'):
                    update_data['search_category'] = search_category
                # Update description if we have a new one and old one is missing
                if job.get('description') and not existing.get('description'):
                    update_data['description'] = job['description']
                await self.collection.update_one(
                    {'job_id': job['job_id']},
                    {'$set': update_data}
                )
        
        print(f"\n{'='*60}")
        print(f"✅ Stored {new_jobs_count} new jobs in category: {search_category}")
        print(f"ℹ️  Skipped {skipped_no_description} jobs without descriptions")
        print(f"📊 Total jobs found: {len(all_jobs)}")
        print(f"{'='*60}\n")
        return new_jobs_count
    
    async def get_active_jobs(self, skip: int = 0, limit: int = 100, date_filter: str = "all"):
        """
        Get all active jobs with descriptions
        
        Args:
            skip: Number of jobs to skip
            limit: Number of jobs to return
            date_filter: Filter by date - 'today', 'yesterday', 'week', 'all'
        """
        from datetime import datetime, timedelta
        
        # Build base query
        query = {
            'is_active': True,
            'description': {'$exists': True, '$ne': '', '$ne': None}
        }
        
        # Add date filter
        if date_filter == "today":
            # Jobs scraped today (since midnight UTC)
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            query['created_at'] = {'$gte': today_start}
        elif date_filter == "yesterday":
            # Jobs scraped yesterday
            yesterday_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            query['created_at'] = {'$gte': yesterday_start, '$lt': today_start}
        elif date_filter == "week":
            # Jobs scraped in the last 7 days
            week_ago = datetime.utcnow() - timedelta(days=7)
            query['created_at'] = {'$gte': week_ago}
        # If "all", no date filter is applied
        
        cursor = self.collection.find(query).sort('created_at', -1).skip(skip).limit(limit)
        
        jobs = await cursor.to_list(length=limit)
        total = await self.collection.count_documents(query)
        
        # Convert ObjectId and dates to string
        for job in jobs:
            job['_id'] = str(job['_id'])
            if job.get('posted_date'):
                job['posted_date'] = job['posted_date'].isoformat()
            if job.get('last_verified'):
                job['last_verified'] = job['last_verified'].isoformat()
            if job.get('created_at'):
                job['created_at'] = job['created_at'].isoformat()
        
        return jobs, total
    
    async def verify_jobs_status(self):
        """Verify if stored jobs are still active"""
        print("Starting job verification...")
        jobs = await self.collection.find({'is_active': True}).to_list(length=None)
        
        expired_count = 0
        for job in jobs:
            is_active = False
            
            if job['source'] == 'indeed':
                is_active = self.indeed_scraper.verify_job_active(job['url'])
            else:
                # For LinkedIn, try to access the URL
                import requests
                try:
                    response = requests.head(job['url'], timeout=5, allow_redirects=True)
                    is_active = response.status_code == 200
                except:
                    is_active = False
            
            if not is_active:
                await self.collection.update_one(
                    {'job_id': job['job_id']},
                    {
                        '$set': {
                            'is_active': False,
                            'expired_date': datetime.utcnow()
                        }
                    }
                )
                expired_count += 1
            else:
                await self.collection.update_one(
                    {'job_id': job['job_id']},
                    {'$set': {'last_verified': datetime.utcnow()}}
                )
        
        print(f"Marked {expired_count} jobs as expired")
        return expired_count
    
    async def search_jobs_by_role(self, role: str, location: str = ""):
        """Search jobs by role in database (with descriptions only)"""
        query = {
            'is_active': True,
            'title': {'$regex': role, '$options': 'i'},
            'description': {'$exists': True, '$ne': '', '$ne': None}
        }
        
        if location:
            query['location'] = {'$regex': location, '$options': 'i'}
        
        cursor = self.collection.find(query).sort('created_at', -1)
        jobs = await cursor.to_list(length=None)
        
        for job in jobs:
            job['_id'] = str(job['_id'])
            if job.get('posted_date'):
                job['posted_date'] = job['posted_date'].isoformat()
            if job.get('last_verified'):
                job['last_verified'] = job['last_verified'].isoformat()
            if job.get('created_at'):
                job['created_at'] = job['created_at'].isoformat()
        
        return jobs
    
    async def get_categories(self):
        """Get all unique search categories"""
        categories = await self.collection.distinct('search_category', {'is_active': True})
        # Filter out None values and sort
        return sorted([c for c in categories if c])
    
    async def get_jobs_by_category(self, category: str, skip: int = 0, limit: int = 100):
        """Get jobs by search category (with descriptions only)"""
        query = {
            'is_active': True,
            'description': {'$exists': True, '$ne': '', '$ne': None}
        }
        if category and category != 'All':
            query['search_category'] = category
        
        cursor = self.collection.find(query).sort('created_at', -1).skip(skip).limit(limit)
        jobs = await cursor.to_list(length=limit)
        total = await self.collection.count_documents(query)
        
        for job in jobs:
            job['_id'] = str(job['_id'])
            if job.get('posted_date'):
                job['posted_date'] = job['posted_date'].isoformat()
            if job.get('last_verified'):
                job['last_verified'] = job['last_verified'].isoformat()
            if job.get('created_at'):
                job['created_at'] = job['created_at'].isoformat()
        
        return jobs, total
    
    async def delete_category(self, category: str):
        """Delete all jobs in a category"""
        result = await self.collection.delete_many({'search_category': category})
        return result.deleted_count
    
    async def get_job_by_id(self, job_id: str):
        """Get single job by job_id with full description"""
        job = await self.collection.find_one({'job_id': job_id})
        
        if not job:
            return None
        
        # Convert ObjectId and dates to string
        job['_id'] = str(job['_id'])
        if job.get('posted_date'):
            job['posted_date'] = job['posted_date'].isoformat()
        if job.get('last_verified'):
            job['last_verified'] = job['last_verified'].isoformat()
        if job.get('created_at'):
            job['created_at'] = job['created_at'].isoformat()
        if job.get('expired_date'):
            job['expired_date'] = job['expired_date'].isoformat()
        
        return job
    
    def cleanup(self):
        """Cleanup scrapers"""
        if self.indeed_scraper:
            self.indeed_scraper.close()
