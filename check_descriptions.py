"""
Quick Script to Check Jobs Without Descriptions

Shows statistics and provides options to fix.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "job_search"

async def check_descriptions():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db.jobs
    
    # Count total jobs
    total_jobs = await collection.count_documents({'is_active': True})
    
    # Count jobs with descriptions
    with_desc = await collection.count_documents({
        'is_active': True,
        'description': {'$ne': None}
    })
    
    # Count jobs without descriptions
    without_desc = await collection.count_documents({
        'is_active': True,
        'description': None
    })
    
    # Group by source
    linkedin_without = await collection.count_documents({
        'is_active': True,
        'source': 'linkedin',
        'description': None
    })
    
    indeed_without = await collection.count_documents({
        'is_active': True,
        'source': 'indeed',
        'description': None
    })
    
    arbeitnow_without = await collection.count_documents({
        'is_active': True,
        'source': 'arbeitnow',
        'description': None
    })
    
    print(f"\n{'='*60}")
    print(f"📊 Job Description Status Report")
    print(f"{'='*60}\n")
    
    print(f"📦 Total active jobs: {total_jobs}")
    
    if total_jobs == 0:
        print(f"\n⚠️  No active jobs in database!")
        print(f"\n💡 Run a job search to populate the database")
        print(f"{'='*60}\n")
        return
    
    print(f"✅ With descriptions: {with_desc} ({with_desc/total_jobs*100:.1f}%)")
    print(f"❌ Without descriptions: {without_desc} ({without_desc/total_jobs*100:.1f}%)")
    
    print(f"\n📊 Breakdown by source:")
    print(f"  📘 LinkedIn: {linkedin_without} missing descriptions")
    print(f"  🔵 Indeed: {indeed_without} missing descriptions")
    print(f"  🌐 Arbeitnow: {arbeitnow_without} missing descriptions")
    
    if without_desc > 0:
        print(f"\n{'='*60}")
        print(f"💡 Solutions:")
        print(f"{'='*60}")
        print(f"\n1. **Backfill Descriptions** (Recommended)")
        print(f"   Run: python backfill_descriptions.py")
        print(f"   Time: ~{(linkedin_without * 2 + indeed_without * 3) / 60:.1f} minutes")
        print(f"   This will fetch descriptions for all existing jobs")
        
        print(f"\n2. **Re-scrape Jobs**")
        print(f"   Delete old jobs and search again")
        print(f"   New scrapes will include descriptions automatically")
        
        print(f"\n3. **Delete Jobs Without Descriptions**")
        print(f"   Remove old jobs that don't have descriptions")
        print(f"   Command: python delete_old_jobs.py")
    else:
        print(f"\n✅ All jobs have descriptions! Nothing to do.")
    
    print(f"\n{'='*60}\n")

if __name__ == "__main__":
    asyncio.run(check_descriptions())
