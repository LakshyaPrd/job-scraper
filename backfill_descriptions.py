"""
Backfill Job Descriptions Script

This script fetches full job descriptions for all existing jobs in the database
that don't have descriptions yet.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.scrapers.linkedin_scraper import LinkedInScraper
from app.scrapers.indeed_scraper import IndeedScraper
from datetime import datetime
import time

# MongoDB connection
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "job_search"

async def backfill_descriptions():
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db.jobs
    
    # Initialize scrapers
    linkedin_scraper = LinkedInScraper()
    indeed_scraper = IndeedScraper(use_brave=True)
    
    # Get all jobs without descriptions
    jobs_without_desc = await collection.find({
        'description': None,
        'is_active': True
    }).to_list(length=None)
    
    total_jobs = len(jobs_without_desc)
    print(f"\n{'='*60}")
    print(f"📄 Found {total_jobs} jobs without descriptions")
    print(f"{'='*60}\n")
    
    if total_jobs == 0:
        print("✅ All jobs already have descriptions!")
        return
    
    # Group by source
    linkedin_jobs = [j for j in jobs_without_desc if j['source'] == 'linkedin']
    indeed_jobs = [j for j in jobs_without_desc if j['source'] == 'indeed']
    
    print(f"📘 LinkedIn jobs: {len(linkedin_jobs)}")
    print(f"🔵 Indeed jobs: {len(indeed_jobs)}")
    print(f"\n⚠️  This will take approximately {(len(linkedin_jobs) * 2 + len(indeed_jobs) * 3) / 60:.1f} minutes\n")
    
    input("Press Enter to start backfilling descriptions...")
    
    updated_count = 0
    failed_count = 0
    
    # Process LinkedIn jobs
    if linkedin_jobs:
        print(f"\n📘 Processing {len(linkedin_jobs)} LinkedIn jobs...")
        for idx, job in enumerate(linkedin_jobs, 1):
            try:
                print(f"  [{idx}/{len(linkedin_jobs)}] Fetching: {job['title'][:50]}...")
                details = linkedin_scraper.get_job_details(job['url'])
                
                if details.get('description'):
                    # Update database
                    update_data = {
                        'description': details['description'],
                        'last_verified': datetime.utcnow()
                    }
                    if details.get('job_type') and not job.get('job_type'):
                        update_data['job_type'] = details['job_type']
                    
                    await collection.update_one(
                        {'_id': job['_id']},
                        {'$set': update_data}
                    )
                    updated_count += 1
                    print(f"    ✅ Updated")
                else:
                    print(f"    ⚠️  No description found")
                    failed_count += 1
                
                # Rate limiting
                time.sleep(2)
                
            except Exception as e:
                print(f"    ❌ Error: {e}")
                failed_count += 1
                continue
    
    # Process Indeed jobs
    if indeed_jobs:
        print(f"\n🔵 Processing {len(indeed_jobs)} Indeed jobs...")
        for idx, job in enumerate(indeed_jobs, 1):
            try:
                print(f"  [{idx}/{len(indeed_jobs)}] Fetching: {job['title'][:50]}...")
                details = indeed_scraper.get_job_details(job['url'])
                
                if details.get('description'):
                    # Update database
                    update_data = {
                        'description': details['description'],
                        'last_verified': datetime.utcnow()
                    }
                    if details.get('job_type') and not job.get('job_type'):
                        update_data['job_type'] = details['job_type']
                    
                    await collection.update_one(
                        {'_id': job['_id']},
                        {'$set': update_data}
                    )
                    updated_count += 1
                    print(f"    ✅ Updated")
                else:
                    print(f"    ⚠️  No description found")
                    failed_count += 1
                
                # Longer delay for Indeed (anti-bot)
                time.sleep(3)
                
            except Exception as e:
                print(f"    ❌ Error: {e}")
                failed_count += 1
                continue
    
    # Cleanup
    indeed_scraper.close()
    
    # Summary
    print(f"\n{'='*60}")
    print(f"✅ Backfill Complete!")
    print(f"{'='*60}")
    print(f"📊 Total jobs processed: {total_jobs}")
    print(f"✅ Successfully updated: {updated_count}")
    print(f"❌ Failed: {failed_count}")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    asyncio.run(backfill_descriptions())
