"""
Delete ALL Jobs from CORRECT Database

Uses the same database name as the backend: job_scraper
"""

from pymongo import MongoClient

# Use the CORRECT database name from .env
client = MongoClient('mongodb://localhost:27017/')
db = client['job_scraper']  # NOT job_search!
collection = db.jobs

# Count before deletion
total_before = collection.count_documents({})

print(f"\n{'='*60}")
print(f"🗑️  DELETE ALL JOBS FROM DATABASE")
print(f"{'='*60}\n")
print(f"Database: job_scraper")
print(f"Total jobs: {total_before}\n")

if total_before == 0:
    print("✅ Database is already empty. Nothing to delete.")
    print(f"{'='*60}\n")
else:
    print(f"⚠️  WARNING: This will DELETE ALL {total_before} jobs!")
    print(f"⚠️  This action CANNOT be undone!\n")
    
    confirm = input(f"Type 'YES DELETE' to confirm: ")
    
    if confirm != "YES DELETE":
        print("\n❌ Cancelled. No jobs were deleted.")
        print(f"{'='*60}\n")
    else:
        # Delete all jobs
        result = collection.delete_many({})
        
        print(f"\n{'='*60}")
        print(f"✅ DELETED {result.deleted_count} jobs")
        print(f"{'='*60}\n")
        print(f"💡 Database is now completely empty!")
        print(f"\nNext steps:")
        print(f"1. Refresh your frontend (F5 or Ctrl+R)")
        print(f"2. Run a new job search")
        print(f"3. All new jobs will have FULL descriptions!")
        print(f"4. Scraping will take 4-7 minutes")
        print(f"{'='*60}\n")
