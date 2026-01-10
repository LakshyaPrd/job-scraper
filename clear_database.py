import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def clear_database():
    """Clear all jobs and search metadata from database"""
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    
    # Delete all jobs
    jobs_result = await db.jobs.delete_many({})
    print(f"✅ Deleted {jobs_result.deleted_count} jobs")
    
    # Delete all search metadata
    metadata_result = await db.search_metadata.delete_many({})
    print(f"✅ Deleted {metadata_result.deleted_count} search metadata records")
    
    # Close connection
    client.close()
    print("\n🎉 Database cleared successfully!")
    print("Ready for demo! 🚀")

if __name__ == "__main__":
    print("🧹 Clearing database...")
    print("-" * 50)
    asyncio.run(clear_database())
