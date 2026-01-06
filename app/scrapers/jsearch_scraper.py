import requests
import os
from typing import List, Dict
from datetime import datetime

class JSearchScraper:
    """JSearch API scraper for job listings from Indeed, LinkedIn, Glassdoor, etc."""
    
    BASE_URL = "https://jsearch.p.rapidapi.com/search"
    
    def __init__(self):
        self.api_key = os.getenv('RAPIDAPI_KEY')
        if not self.api_key:
            print("⚠️ Warning: RAPIDAPI_KEY not found in environment variables")
            print("   JSearch scraping will not work. Please add RAPIDAPI_KEY to .env or Railway")
        
        self.headers = {
            "X-RapidAPI-Key": self.api_key or "",
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
        }
    
    def search_jobs(self, keywords: str, location: str = "", max_pages: int = 1) -> List[Dict]:
        """
        Search jobs using JSearch API
        
        Args:
            keywords: Job search keywords (e.g., "Python Developer")
            location: Location (e.g., "San Francisco, CA" or empty for remote/all)
            max_pages: Number of pages to fetch (1 page = ~10 jobs, max 10 pages)
        
        Returns:
            List of job dictionaries
        """
        if not self.api_key:
            print("❌ Cannot scrape: RAPIDAPI_KEY not configured")
            return []
        
        all_jobs = []
        
        # JSearch uses pages 1-10
        for page in range(1, min(max_pages + 1, 11)):  # Max 10 pages
            try:
                # Construct query
                query = keywords
                if location:
                    query += f" in {location}"
                
                params = {
                    "query": query,
                    "page": str(page),
                    "num_pages": "1",
                    "date_posted": "month"  # Jobs from last 30 days
                }
                
                print(f"  📡 Fetching JSearch page {page}/{max_pages}...")
                
                response = requests.get(
                    self.BASE_URL,
                    headers=self.headers,
                    params=params,
                    timeout=15
                )
                
                if response.status_code == 200:
                    data = response.json()
                    jobs_data = data.get('data', [])
                    
                    if not jobs_data:
                        print(f"  No more jobs found on page {page}")
                        break
                    
                    # Parse jobs
                    for job in jobs_data:
                        parsed_job = self._parse_job(job)
                        if parsed_job:
                            all_jobs.append(parsed_job)
                    
                    print(f"  ✅ Found {len(jobs_data)} jobs on page {page} (Total: {len(all_jobs)})")
                
                elif response.status_code == 429:
                    print(f"  ⚠️ Rate limit reached (page {page}). Daily limit: 100 requests")
                    break
                else:
                    print(f"  ⚠️ API error on page {page}: {response.status_code}")
                    break
                    
            except Exception as e:
                print(f"  ❌ Error fetching page {page}: {e}")
                break
        
        print(f"  🎉 Total jobs scraped from JSearch: {len(all_jobs)}")
        return all_jobs
    
    def _parse_job(self, job_data: Dict) -> Dict:
        """Parse JSearch API response to our job format"""
        try:
            # Extract location
            location_parts = []
            if job_data.get('job_city'):
                location_parts.append(job_data['job_city'])
            if job_data.get('job_state'):
                location_parts.append(job_data['job_state'])
            if job_data.get('job_country') and job_data['job_country'] != 'US':
                location_parts.append(job_data['job_country'])
            
            location = ', '.join(location_parts) if location_parts else 'Remote'
            
            # Handle remote jobs
            if job_data.get('job_is_remote'):
                location = 'Remote'
            
            # Extract salary
            salary = None
            if job_data.get('job_min_salary') and job_data.get('job_max_salary'):
                min_sal = job_data['job_min_salary']
                max_sal = job_data['job_max_salary']
                currency = job_data.get('job_salary_currency', 'USD')
                period = job_data.get('job_salary_period', 'YEAR')
                
                # Format salary nicely
                if min_sal and max_sal:
                    if period == 'YEAR':
                        salary = f"${min_sal:,.0f} - ${max_sal:,.0f}/year"
                    elif period == 'MONTH':
                        salary = f"${min_sal:,.0f} - ${max_sal:,.0f}/month"
                    elif period == 'HOUR':
                        salary = f"${min_sal:.2f} - ${max_sal:.2f}/hour"
            
            # Extract job type
            job_type = None
            employment_type = job_data.get('job_employment_type', '')
            if employment_type == 'FULLTIME':
                job_type = 'Full-time'
            elif employment_type == 'PARTTIME':
                job_type = 'Part-time'
            elif employment_type == 'CONTRACTOR':
                job_type = 'Contract'
            elif employment_type == 'INTERN':
                job_type = 'Internship'
            
            # Parse posted date
            posted_date = None
            if job_data.get('job_posted_at_datetime_utc'):
                try:
                    posted_date = datetime.fromisoformat(
                        job_data['job_posted_at_datetime_utc'].replace('Z', '+00:00')
                    )
                except:
                    posted_date = datetime.utcnow()
            else:
                posted_date = datetime.utcnow()
            
            # Get job source (Indeed, LinkedIn, etc.)
            source = job_data.get('job_publisher', 'jsearch').lower()
            if 'indeed' in source:
                source = 'indeed'
            elif 'linkedin' in source:
                source = 'linkedin'
            elif 'glassdoor' in source:
                source = 'glassdoor'
            else:
                source = 'jsearch'
            
            return {
                'job_id': f"{source}_{job_data.get('job_id', '')}",
                'title': job_data.get('job_title', 'No Title'),
                'company': job_data.get('employer_name', 'Unknown Company'),
                'location': location,
                'url': job_data.get('job_apply_link', ''),
                'source': source,
                'salary': salary,
                'job_type': job_type,
                'description': job_data.get('job_description', ''),
                'posted_date': posted_date,
                'is_active': True,
                'last_verified': datetime.utcnow(),
                'created_at': datetime.utcnow(),
                # Extra fields from JSearch
                'employer_logo': job_data.get('employer_logo'),
                'employer_website': job_data.get('employer_website'),
                'job_highlights': job_data.get('job_highlights', {}),
                'required_skills': job_data.get('job_required_skills', []),
            }
        except Exception as e:
            print(f"  ⚠️ Error parsing job: {e}")
            return None
