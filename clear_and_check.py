import requests
from pymongo import MongoClient

print("\n" + "="*60)
print("Checking API and Database")
print("="*60 + "\n")

# Check API
try:
    response = requests.get('http://localhost:8000/api/jobs?limit=5')
    if response.status_code == 200:
        data = response.json()
        print(f"✅ API Response:")
        print(f"   Total jobs (from API): {data.get('total', 0)}")
        print(f"   Jobs returned: {len(data.get('jobs', []))}")
    else:
        print(f"❌ API Error: {response.status_code}")
except Exception as e:
    print(f"❌ API Connection Error: {e}")

print()

# Check Database directly
client = MongoClient('mongodb://localhost:27017/')
db = client['job_search']
total = db.jobs.count_documents({})
print(f"📦 Database count: {total} jobs")

if total > 0:
    print(f"\n💡 Deleting all {total} jobs...")
    result = db.jobs.delete_many({})
    print(f"✅ Deleted {result.deleted_count} jobs from database")
else:
    print(f"\n✅ Database is already empty")

print("\n" + "="*60)
print("IMPORTANT: Refresh your frontend (F5) to clear cached data!")
print("="*60 + "\n")
