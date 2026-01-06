import requests
from typing import List, Dict
from datetime import datetime
import time

class RemotiveScaper:
    """Arbeitnow API - Free public job API, no authentication needed"""
    
    BASE_URL = "https://www.arbeitnow.com/api/job-board-api"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
        })
    
    def search_jobs(self, keywords: str, location: str = "", limit: int = 20) -> List[Dict]:
        """Search jobs from Arbeitnow API"""
        try:
            response = self.session.get(self.BASE_URL, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            jobs_data = data.get('data', [])
            
            # Filter by keywords
            keywords_lower = keywords.lower()
            filtered_jobs = [
                job for job in jobs_data 
                if keywords_lower in job.get('title', '').lower() or 
                   keywords_lower in job.get('description', '').lower() or
                   keywords_lower in job.get('tags', [])
            ][:limit]
            
            jobs = []
            for job in filtered_jobs:
                try:
                    parsed = self._parse_job(job)
                    if parsed:
                        jobs.append(parsed)
                except Exception as e:
                    print(f"Error parsing Arbeitnow job: {e}")
                    continue
            
            print(f"Found {len(jobs)} Arbeitnow jobs")
            return jobs
            
        except Exception as e:
            print(f"Arbeitnow API error: {e}")
            return []
    
    def _parse_job(self, job: dict) -> Dict:
        """Parse job data from Arbeitnow API"""
        try:
            # Parse created_at date
            created_at = job.get('created_at', '')
            posted_date = datetime.utcnow()
            if created_at:
                try:
                    posted_date = datetime.fromtimestamp(created_at)
                except:
                    pass
            
            return {
                'job_id': f"arbeitnow_{job.get('slug', '')}",
                'title': job.get('title', 'No Title'),
                'company': job.get('company_name', 'Not specified'),
                'location': job.get('location', 'Remote'),
                'url': job.get('url', ''),
                'source': 'arbeitnow',
                'description': job.get('description', '')[:500] if job.get('description') else None,
                'salary': None,
                'job_type': 'Remote' if job.get('remote', False) else 'On-site',
                'posted_date': posted_date,
                'is_active': True,
                'last_verified': datetime.utcnow(),
                'created_at': datetime.utcnow()
            }
        except Exception as e:
            print(f"Parse error: {e}")
            return None


class JSearchScraper:
    """JSearch API via RapidAPI - Free tier available"""
    
    # Note: This requires a free RapidAPI key
    # Sign up at https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
    
    BASE_URL = "https://jsearch.p.rapidapi.com/search"
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key
        self.session = requests.Session()
    
    def search_jobs(self, keywords: str, location: str = "", limit: int = 10) -> List[Dict]:
        """Search jobs using JSearch API"""
        if not self.api_key:
            print("JSearch: No API key configured, skipping")
            return []
        
        try:
            headers = {
                "X-RapidAPI-Key": self.api_key,
                "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
            }
            
            query = f"{keywords} {location}".strip()
            params = {
                "query": query,
                "page": "1",
                "num_pages": "1"
            }
            
            response = self.session.get(self.BASE_URL, headers=headers, params=params, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            jobs_data = data.get('data', [])
            
            jobs = []
            for job in jobs_data[:limit]:
                try:
                    parsed = self._parse_job(job)
                    if parsed:
                        jobs.append(parsed)
                except:
                    continue
            
            print(f"Found {len(jobs)} JSearch jobs")
            return jobs
            
        except Exception as e:
            print(f"JSearch API error: {e}")
            return []
    
    def _parse_job(self, job: dict) -> Dict:
        """Parse job from JSearch API"""
        return {
            'job_id': f"jsearch_{job.get('job_id', '')}",
            'title': job.get('job_title', 'No Title'),
            'company': job.get('employer_name', 'Not specified'),
            'location': f"{job.get('job_city', '')} {job.get('job_state', '')} {job.get('job_country', '')}".strip() or 'Not specified',
            'url': job.get('job_apply_link', '') or job.get('job_google_link', ''),
            'source': 'jsearch',
            'description': job.get('job_description', '')[:500] if job.get('job_description') else None,
            'salary': None,
            'job_type': job.get('job_employment_type', None),
            'posted_date': datetime.utcnow(),
            'is_active': True,
            'last_verified': datetime.utcnow(),
            'created_at': datetime.utcnow()
        }
