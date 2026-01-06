import requests
from typing import List, Dict
from datetime import datetime
import time

class ArbeitnowScraper:
    """
    Arbeitnow API - Free job board API (no API key required)
    Focuses on tech jobs, especially in Europe but also US
    """
    
    BASE_URL = "https://www.arbeitnow.com/api/job-board-api"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
        })
    
    def search_jobs(self, keywords: str, location: str = "") -> List[Dict]:
        """
        Search Arbeitnow jobs
        Note: Arbeitnow API returns all jobs, we filter by keywords
        """
        try:
            response = self.session.get(self.BASE_URL, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            all_jobs = data.get('data', [])
            
            # Filter by keywords (case-insensitive)
            keywords_lower = keywords.lower()
            keyword_parts = keywords_lower.split()
            
            filtered_jobs = []
            for job in all_jobs:
                title = job.get('title', '').lower()
                description = job.get('description', '').lower()
                tags = ' '.join(job.get('tags', [])).lower()
                
                # Check if any keyword matches
                if any(kw in title or kw in description or kw in tags for kw in keyword_parts):
                    filtered_jobs.append(job)
            
            # Also filter by location if provided
            if location:
                location_lower = location.lower()
                filtered_jobs = [
                    j for j in filtered_jobs 
                    if location_lower in j.get('location', '').lower()
                ]
            
            # Convert to our format
            jobs = []
            for job in filtered_jobs[:20]:  # Limit to 20 jobs
                try:
                    parsed_job = self._parse_job(job)
                    if parsed_job:
                        jobs.append(parsed_job)
                except Exception as e:
                    continue
            
            print(f"Found {len(jobs)} Arbeitnow jobs matching '{keywords}'")
            return jobs
            
        except Exception as e:
            print(f"Arbeitnow API error: {e}")
            return []
    
    def _parse_job(self, job: Dict) -> Dict:
        """Parse Arbeitnow job to our format"""
        try:
            job_id = job.get('slug', str(job.get('id', '')))
            
            # Parse date
            posted_date = datetime.utcnow()
            if job.get('created_at'):
                try:
                    # Format: "2025-12-28T10:00:00.000000Z"
                    date_str = job['created_at'].split('T')[0]
                    posted_date = datetime.fromisoformat(date_str)
                except:
                    pass
            
            return {
                'job_id': f"arbeitnow_{job_id}",
                'title': job.get('title', 'No Title'),
                'company': job.get('company_name', 'Not specified'),
                'location': job.get('location', 'Remote'),
                'url': job.get('url', ''),
                'source': 'arbeitnow',
                'job_type': 'Remote' if job.get('remote', False) else 'On-site',
                'posted_date': posted_date,
                'is_active': True,
                'last_verified': datetime.utcnow(),
                'created_at': datetime.utcnow()
            }
        except Exception as e:
            return None
