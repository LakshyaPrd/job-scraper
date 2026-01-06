from pymongo import MongoClient

# Check both possible databases
client = MongoClient('mongodb://localhost:27017/')

print("\n" + "="*60)
print("Checking ALL Databases")
print("="*60 + "\n")

# Database 1: job_scraper (from .env)
db1 = client['job_scraper']
total1 = db1.jobs.count_documents({})
with_desc1 = db1.jobs.count_documents({'description': {'$ne': None}})

print(f"📦 Database: job_scraper")
print(f"   Total jobs: {total1}")
print(f"   With descriptions: {with_desc1}")

# Database 2: job_search (old name)
db2 = client['job_search']
total2 = db2.jobs.count_documents({})
with_desc2 = db2.jobs.count_documents({'description': {'$ne': None}})

print(f"\n📦 Database: job_search")
print(f"   Total jobs: {total2}")
print(f"   With descriptions: {with_desc2}")

# List all databases
print(f"\n📚 All databases on this MongoDB:")
for db_name in client.list_database_names():
    if db_name not in ['admin', 'config', 'local']:
        count = client[db_name].jobs.count_documents({})
        if count > 0:
            print(f"   - {db_name}: {count} jobs")

print("\n" + "="*60 + "\n")
