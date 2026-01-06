"""
Delete Old Jobs Without Descriptions

Quick script to remove jobs that don't have descriptions.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "job_search"

async def delete_old_jobs():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db.jobs
    
    # Count jobs to delete
    count = await collection.count_documents({
        'description': None
    })
    
    print(f"\n{'='*60}")
    print(f"🗑️  Delete Old Jobs Without Descriptions")
    print(f"{'='*60}\n")
    print(f"⚠️  This will DELETE {count} jobs from the database!")
    print(f"⚠️  This action CANNOT be undone!")
    print(f"\nThese are likely old jobs scraped before the")
    print(f"description feature was implemented.")
    
    confirm = input(f"\nType 'DELETE' to confirm: ")
    
    if confirm != "DELETE":
        print("\n❌ Cancelled. No jobs were deleted.")
        return
    
    # Delete jobs without descriptions
    result = await collection.delete_many({
        'description': None
    })
    
    print(f"\n{'='*60}")
    print(f"✅ Deleted {result.deleted_count} jobs")
    print(f"{'='*60}\n")
    print(f"💡 Tip: Run a new search to get fresh jobs with descriptions!")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    asyncio.run(delete_old_jobs())
