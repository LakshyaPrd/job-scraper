from typing import List, Dict
from datetime import datetime
import time

# Make scrapers optional - they won't work in Railway without Chrome/display
try:
    from app.scrapers.linkedin_scraper import LinkedInScraper
    from app.scrapers.indeed_scraper import IndeedScraper
    SCRAPERS_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ Warning: Scrapers not available - {e}")
    LinkedInScraper = None
    IndeedScraper = None
    SCRAPERS_AVAILABLE = False

from motor.motor_asyncio import AsyncIOMotorDatabase

class JobService:
    def __init__(self, db: AsyncIOMotorDatabase, use_brave: bool = True):
        self.db = db
        self.collection = db.jobs
        
        # Initialize scrapers only if available
        if SCRAPERS_AVAILABLE and LinkedInScraper:
            self.linkedin_scraper = LinkedInScraper()
        else:
            self.linkedin_scraper = None
            
        if SCRAPERS_AVAILABLE and IndeedScraper:
            self.indeed_scraper = IndeedScraper(use_brave=use_brave)
        else:
            self.indeed_scraper = None
            print("ℹ️ Running without scraper support (API-only mode)")
    
    async def scrape_and_store_jobs(self, keywords: str, location: str = ""):
        """Scrape jobs from multiple platforms and store in DB"""
        if not self.linkedin_scraper and not self.indeed_scraper:
            print("⚠️ Scraping not available in this environment (no Selenium/Chrome support)")
            return 0
            
        print(f"\n{'='*60}")
        print(f"🔍 Starting scrape for: {keywords} in {location or 'Remote'}")
        print(f"{'='*60}\n")
        
        # Normalize the search category (e.g., "spring boot developer" -> "Spring Boot")
        search_category = keywords.strip().title()
        
        # Scrape LinkedIn (with pagination - up to 50+ jobs)
        print("📘 Scraping LinkedIn...")
        linkedin_jobs = self.linkedin_scraper.search_jobs(keywords, location, max_pages=5)
        print(f"✅ Found {len(linkedin_jobs)} LinkedIn jobs\n")
        
        # Fetch full descriptions for LinkedIn jobs
        print(f"📄 Fetching full descriptions for LinkedIn jobs...")
        for idx, job in enumerate(linkedin_jobs, 1):
            try:
                print(f"  [{idx}/{len(linkedin_jobs)}] Fetching: {job['title'][:50]}...")
                details = self.linkedin_scraper.get_job_details(job['url'])
                if details.get('description'):
                    job['description'] = details['description']
                if details.get('job_type') and not job.get('job_type'):
                    job['job_type'] = details['job_type']
                time.sleep(2)  # Rate limiting
            except Exception as e:
                print(f"  ⚠️ Error fetching details: {e}")
        print(f"✅ LinkedIn descriptions fetched\n")
        
        # Scrape Indeed (with pagination - 30+ jobs)
        print("🔵 Scraping Indeed...")
        indeed_jobs = self.indeed_scraper.search_jobs(keywords, location, max_pages=2)
        print(f"✅ Found {len(indeed_jobs)} Indeed jobs\n")
        
        # Fetch full descriptions for Indeed jobs
        if indeed_jobs:
            print(f"📄 Fetching full descriptions for Indeed jobs...")
            for idx, job in enumerate(indeed_jobs, 1):
                try:
                    print(f"  [{idx}/{len(indeed_jobs)}] Fetching: {job['title'][:50]}...")
                    details = self.indeed_scraper.get_job_details(job['url'])
                    if details.get('description'):
                        job['description'] = details['description']
                    if details.get('job_type') and not job.get('job_type'):
                        job['job_type'] = details['job_type']
                    time.sleep(3)  # Longer delay for Indeed (anti-bot protection)
                except Exception as e:
                    print(f"  ⚠️ Error fetching details: {e}")
            print(f"✅ Indeed descriptions fetched\n")
        
        all_jobs = linkedin_jobs + indeed_jobs
        new_jobs_count = 0
        
        print(f"💾 Storing jobs in database...")
        for job in all_jobs:
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
        print(f"📊 Total jobs found: {len(all_jobs)}")
        print(f"{'='*60}\n")
        return new_jobs_count
    
    async def get_active_jobs(self, skip: int = 0, limit: int = 100):
        """Get all active jobs"""
        # Sort by created_at (always set) instead of posted_date (can be None)
        cursor = self.collection.find(
            {'is_active': True}
        ).sort('created_at', -1).skip(skip).limit(limit)
        
        jobs = await cursor.to_list(length=limit)
        total = await self.collection.count_documents({'is_active': True})
        
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
        """Search jobs by role in database"""
        query = {
            'is_active': True,
            'title': {'$regex': role, '$options': 'i'}
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
        """Get jobs by search category"""
        query = {'is_active': True}
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
