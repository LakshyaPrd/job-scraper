import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.job_scraper
    
    # Count Indeed jobs
    count = await db.jobs.count_documents({'source': 'indeed'})
    print(f'Indeed jobs in DB: {count}')
    
    # Count ACTIVE Indeed jobs
    active_count = await db.jobs.count_documents({'source': 'indeed', 'is_active': True})
    print(f'Active Indeed jobs: {active_count}')
    
    # Get a sample - show ALL fields
    sample = await db.jobs.find_one({'source': 'indeed'})
    if sample:
        print(f"\nSample Indeed job (ALL FIELDS):")
        for key, value in sample.items():
            print(f"  {key}: {value}")
    else:
        print("No Indeed jobs found in database")
    
    # Count all by source AND is_active status
    print("\nAll jobs by source and active status:")
    pipeline = [{"$group": {"_id": {"source": "$source", "active": "$is_active"}, "count": {"$sum": 1}}}]
    async for doc in db.jobs.aggregate(pipeline):
        print(f"  {doc['_id']}: {doc['count']}")
    
    client.close()

asyncio.run(check())
