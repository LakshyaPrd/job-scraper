from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['job_search']
collection = db.jobs

total = collection.count_documents({})
active = collection.count_documents({'is_active': True})
inactive = collection.count_documents({'is_active': False})

with_desc = collection.count_documents({'description': {'$ne': None}})
without_desc = collection.count_documents({'description': None})

print(f"\n{'='*60}")
print(f"Database Status")
print(f"{'='*60}")
print(f"Total jobs: {total}")
print(f"Active: {active}")
print(f"Inactive: {inactive}")
print(f"\nWith descriptions: {with_desc}")
print(f"Without descriptions: {without_desc}")
print(f"{'='*60}\n")

# Show a sample
if total > 0:
    sample = collection.find_one()
    print("Sample job:")
    print(f"  Title: {sample.get('title', 'N/A')}")
    print(f"  Company: {sample.get('company', 'N/A')}")
    print(f"  Source: {sample.get('source', 'N/A')}")
    print(f"  Has description: {'Yes' if sample.get('description') else 'No'}")
    print(f"  Is active: {sample.get('is_active', False)}")
print()
