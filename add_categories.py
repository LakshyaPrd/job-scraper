import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def add_categories():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.job_scraper
    
    # Update all jobs without a category to 'Software Engineer'
    result = await db.jobs.update_many(
        {'search_category': {'$exists': False}},
        {'$set': {'search_category': 'Software Engineer'}}
    )
    print(f'Updated {result.modified_count} jobs with default category')
    
    # Also update jobs with null category
    result2 = await db.jobs.update_many(
        {'search_category': None},
        {'$set': {'search_category': 'Software Engineer'}}
    )
    print(f'Updated {result2.modified_count} jobs with null category')
    
    # Check categories
    categories = await db.jobs.distinct('search_category')
    print(f'Categories: {categories}')
    
    # Count per category
    pipeline = [{"$group": {"_id": "$search_category", "count": {"$sum": 1}}}]
    async for doc in db.jobs.aggregate(pipeline):
        print(f"  {doc['_id']}: {doc['count']}")
    
    client.close()

asyncio.run(add_categories())
