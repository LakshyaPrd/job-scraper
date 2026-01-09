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
    
    async def scrape_and_store_jobs(
        self, 
        keywords: str, 
        location: str = "",
        platforms: List[str] = None,
        max_jobs: int = 100,
        continue_from_last: bool = False
    ):
        """Scrape jobs from selected platforms with job limit and pagination support"""
        if not self.linkedin_scraper and not self.jsearch_scraper and not self.indeed_scraper:
            print("⚠️ Scraping not available in this environment (no scrapers configured)")
            return 0
        
        # Default platforms if none specified
        if platforms is None:
            platforms = []
            if self.linkedin_scraper:
                platforms.append("linkedin")
            if self.jsearch_scraper:
                platforms.append("jsearch")
            
        print(f"\n{'='*60}")
        print(f"🔍 Starting scrape for: {keywords} in {location or 'Remote'}")
        print(f"📊 Platforms: {', '.join(platforms)}")
        print(f"🎯 Max jobs: {max_jobs}")
        print(f"{'='*60}\n")
        
        # Normalize the search category
        search_category = keywords.strip().title()
        search_key = f"{keywords}_{location}".lower().replace(" ", "_")
        
        # Get offset if continuing from last
        offset = 0
        if continue_from_last:
            search_metadata_col = self.db.search_metadata
            metadata = await search_metadata_col.find_one({"search_key": search_key})
            if metadata:
                offset = metadata.get("last_offset", 0)
                print(f"▶️  Continuing from job #{offset + 1}\n")
        
        all_jobs = []
        jobs_needed = max_jobs
        
        # Calculate jobs per platform
        active_platforms = [p for p in platforms if p in ["linkedin", "jsearch", "indeed"]]
        jobs_per_platform = max_jobs // len(active_platforms) if active_platforms else max_jobs
        
        # 1. Scrape with JSearch API if selected
        if "jsearch" in platforms and self.jsearch_scraper and jobs_needed > 0:
            print("🚀 Scraping with JSearch API (Indeed, LinkedIn, Glassdoor, etc.)...")
            pages_needed = min((jobs_per_platform // 10) + 1, 10)
            jsearch_jobs = self.jsearch_scraper.search_jobs(keywords, location, max_pages=pages_needed)
            jsearch_jobs = jsearch_jobs[:min(len(jsearch_jobs), jobs_per_platform)]
            all_jobs.extend(jsearch_jobs)
            jobs_needed -= len(jsearch_jobs)
            print(f"✅ Found {len(jsearch_jobs)} jobs from JSearch API\n")
        
        # 2. Scrape LinkedIn directly if selected
        if "linkedin" in platforms and self.linkedin_scraper and jobs_needed > 0:
            print("📘 Scraping LinkedIn directly...")
            pages_needed = min((jobs_per_platform // 25) + 1, 10)
            linkedin_jobs = self.linkedin_scraper.search_jobs(keywords, location, max_pages=pages_needed)
            linkedin_jobs = linkedin_jobs[:min(len(linkedin_jobs), jobs_per_platform)]
            
            # Fetch descriptions for limited jobs
            if linkedin_jobs:
                print(f"📄 Fetching descriptions for LinkedIn jobs (max {min(len(linkedin_jobs), 10)})...")
                for idx, job in enumerate(linkedin_jobs[:10], 1):
                    try:
                        print(f"  [{idx}/{min(len(linkedin_jobs), 10)}] {job['title'][:40]}...")
                        details = self.linkedin_scraper.get_job_details(job['url'])
                        if details.get('description'):
                            job['description'] = details['description']
                        time.sleep(1)
                    except Exception as e:
                        print(f"  ⚠️ Error: {e}")
                print(f"✅ LinkedIn descriptions fetched\n")
            
            all_jobs.extend(linkedin_jobs)
            jobs_needed -= len(linkedin_jobs)
            print(f"✅ Found {len(linkedin_jobs)} LinkedIn jobs\n")
        
        # 3. Scrape with Selenium Indeed if selected (local only)
        if "indeed" in platforms and self.indeed_scraper and jobs_needed > 0:
            print("🔵 Scraping Indeed with Selenium (local only)...")
            pages_needed = min((jobs_per_platform // 15) + 1, 5)
            indeed_jobs = self.indeed_scraper.search_jobs(keywords, location, max_pages=pages_needed)
            indeed_jobs = indeed_jobs[:min(len(indeed_jobs), jobs_per_platform)]
            
            if indeed_jobs:
                print(f"📄 Fetching descriptions for Indeed jobs (max {min(len(indeed_jobs), 10)})...")
                for idx, job in enumerate(indeed_jobs[:10], 1):
                    try:
                        print(f"  [{idx}/{min(len(indeed_jobs), 10)}] {job['title'][:40]}...")
                        details = self.indeed_scraper.get_job_details(job['url'])
                        if details.get('description'):
                            job['description'] = details['description']
                        time.sleep(2)
                    except Exception as e:
                        print(f"  ⚠️ Error: {e}")
                print(f"✅ Indeed descriptions fetched\n")
            
            all_jobs.extend(indeed_jobs)
            jobs_needed -= len(indeed_jobs)
            print(f"✅ Found {len(indeed_jobs)} Indeed jobs\n")
        
        # Limit to max_jobs
        all_jobs = all_jobs[:max_jobs]
        
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
                job['search_category'] = search_category
                await self.collection.insert_one(job)
                new_jobs_count += 1
            else:
                update_data = {'last_verified': datetime.utcnow()}
                if not existing.get('search_category'):
                    update_data['search_category'] = search_category
                if job.get('description') and not existing.get('description'):
                    update_data['description'] = job['description']
                await self.collection.update_one(
                    {'job_id': job['job_id']},
                    {'$set': update_data}
                )
        
        # Update search metadata
        search_metadata_col = self.db.search_metadata
        await search_metadata_col.update_one(
            {"search_key": search_key},
            {
                "$set": {
                    "last_offset": offset + len(all_jobs),
                    "total_scraped": offset + len(all_jobs),
                    "last_scrape_date": datetime.utcnow(),
                    "platforms_used": platforms,
                    "search_query": keywords,
                    "search_location": location
                }
            },
            upsert=True
        )
        
        print(f"\n{'='*60}")
        print(f"✅ Stored {new_jobs_count} new jobs in category: {search_category}")
        print(f"ℹ️  Skipped {skipped_no_description} jobs without descriptions")
        print(f"📊 Total jobs found: {len(all_jobs)}")
        print(f"📍 Next scrape will start from job #{offset + len(all_jobs) + 1}")
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
    
    async def get_companies(self, search_role: str = None, date_filter: str = "all"):
        """Get companies aggregated by job count"""
        from datetime import datetime, timedelta
        
        # Build date filter
        query = {'is_active': True, 'description': {'$exists': True, '$ne': '', '$ne': None}}
        if date_filter == "today":
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            query['created_at'] = {'$gte': today_start}
        elif date_filter == "yesterday":
            yesterday_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            query['created_at'] = {'$gte': yesterday_start, '$lt': today_start}
        elif date_filter == "week":
            week_ago = datetime.utcnow() - timedelta(days=7)
            query['created_at'] = {'$gte': week_ago}
        
        # Add role filter if specified
        if search_role:
            query['$or'] = [
                {'title': {'$regex': search_role, '$options': 'i'}},
                {'search_category': {'$regex': search_role, '$options': 'i'}}
            ]
        
        # Aggregate by company
        pipeline = [
            {'$match': query},
            {
                '$group': {
                    '_id': '$company',
                    'total_jobs': {'$sum': 1},
                    'latest_date': {'$max': '$created_at'},
                    'oldest_date': {'$min': '$created_at'},
                    'job_titles': {'$addToSet': '$title'},
                    'sources': {'$addToSet': '$source'},
                    'locations': {'$addToSet': '$location'},
                    'salaries': {'$push': '$salary'}
                }
            },
            {'$sort': {'total_jobs': -1}},
            {'$limit': 100}
        ]
        
        companies = await self.collection.aggregate(pipeline).to_list(length=100)
        
        # Format results
        formatted_companies = []
        for company in companies:
            formatted_companies.append({
                'company_name': company['_id'],
                'total_jobs': company['total_jobs'],
                'latest_job_date': company['latest_date'].isoformat() if company.get('latest_date') else None,
                'oldest_job_date': company['oldest_date'].isoformat() if company.get('oldest_date') else None,
                'job_titles': company['job_titles'][:5],  # Limit to 5 titles
                'sources': company['sources'],
                'locations': company['locations'][:3]  # Limit to 3 locations
            })
        
        return {
            'companies': formatted_companies,
            'total': len(formatted_companies)
        }
    
    async def get_company_jobs(self, company_name: str):
        """Get all jobs from a specific company"""
        jobs = await self.collection.find({
            'company': company_name,
            'is_active': True,
            'description': {'$exists': True, '$ne': '', '$ne': None}
        }).sort('created_at', -1).to_list(length=100)
        
        # Convert dates to strings
        for job in jobs:
            job['_id'] = str(job['_id'])
            if job.get('posted_date'):
                job['posted_date'] = job['posted_date'].isoformat()
            if job.get('last_verified'):
                job['last_verified'] = job['last_verified'].isoformat()
            if job.get('created_at'):
                job['created_at'] = job['created_at'].isoformat()
        
        return {
            'company_name': company_name,
            'total_jobs': len(jobs),
            'jobs': jobs
        }
    
    async def filter_jobs(
        self,
        min_salary: int = None,
        max_salary: int = None,
        job_types: List[str] = None,
        locations: List[str] = None,
        sources: List[str] = None,
        remote_only: bool = False,
        date_filter: str = "all"
    ):
        """Filter jobs based on various criteria"""
        from datetime import datetime, timedelta
        
        query = {
            'is_active': True,
            'description': {'$exists': True, '$ne': '', '$ne': None}
        }
        
        # Date filter
        if date_filter == "today":
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            query['created_at'] = {'$gte': today_start}
        elif date_filter == "yesterday":
            yesterday_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            query['created_at'] = {'$gte': yesterday_start, '$lt': today_start}
        elif date_filter == "week":
            week_ago = datetime.utcnow() - timedelta(days=7)
            query['created_at'] = {'$gte': week_ago}
        
        # Location filter
        if locations and len(locations) > 0:
            query['location'] = {'$in': locations}
        
        if remote_only:
            query['location'] = {'$regex': 'remote', '$options': 'i'}
        
        # Job type filter
        if job_types and len(job_types) > 0:
            query['job_type'] = {'$in': job_types}
        
        # Source filter
        if sources and len(sources) > 0:
            query['source'] = {'$in': sources}
        
        # Salary filter (requires parsing salary strings - simplified for now)
        # This would need more sophisticated parsing in production
        
        jobs = await self.collection.find(query).sort('created_at', -1).to_list(length=1000)
        
        # Convert dates
        for job in jobs:
            job['_id'] = str(job['_id'])
            if job.get('posted_date'):
                job['posted_date'] = job['posted_date'].isoformat()
            if job.get('last_verified'):
                job['last_verified'] = job['last_verified'].isoformat()
            if job.get('created_at'):
                job['created_at'] = job['created_at'].isoformat()
        
        return {
            'jobs': jobs,
            'total': len(jobs)
        }
    
    async def get_search_metadata(self, search_key: str):
        """Get metadata for a search query"""
        metadata_col = self.db.search_metadata
        metadata = await metadata_col.find_one({'search_key': search_key})
        
        if metadata and metadata.get('_id'):
            metadata['_id'] = str(metadata['_id'])
        if metadata and metadata.get('last_scrape_date'):
            metadata['last_scrape_date'] = metadata['last_scrape_date'].isoformat()
        
        return metadata
