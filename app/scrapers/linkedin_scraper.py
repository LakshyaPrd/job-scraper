import requests
from typing import List, Dict
from datetime import datetime, timedelta
import time
import random
import re

class LinkedInScraper:
    BASE_URL = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        })
    
    def search_jobs(self, keywords: str, location: str = "", max_pages: int = 5) -> List[Dict]:
        """Search LinkedIn jobs with pagination to get more results"""
        all_jobs = []
        
        # Fetch multiple pages (each page has ~10-25 jobs)
        for page in range(max_pages):
            start = page * 25  # LinkedIn uses 25 jobs per page
            
            jobs = self._fetch_page(keywords, location, start)
            
            if not jobs:
                print(f"No more jobs found at page {page + 1}")
                break
            
            all_jobs.extend(jobs)
            print(f"Page {page + 1}: Found {len(jobs)} jobs (Total: {len(all_jobs)})")
            
            # Reduced delay from 2-4 seconds to 0.5-1 second for faster scraping
            time.sleep(random.uniform(0.5, 1))
        
        return all_jobs
    
    def _fetch_page(self, keywords: str, location: str, start: int) -> List[Dict]:
        """Fetch a single page of job results"""
        params = {
            'keywords': keywords,
            'location': location,
            'start': start,
            'f_TPR': 'r2592000',  # Past 30 days
        }
        
        try:
            response = self.session.get(self.BASE_URL, params=params, timeout=15)
            response.raise_for_status()
            
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(response.content, 'lxml')
            
            job_cards = soup.find_all('li')
            jobs = []
            
            for card in job_cards:
                try:
                    job_data = self._parse_job_card(card)
                    if job_data:
                        jobs.append(job_data)
                except Exception as e:
                    continue
            
            return jobs
            
        except Exception as e:
            print(f"LinkedIn page fetch error: {e}")
            return []
    
    def _parse_job_card(self, card) -> Dict:
        """Parse individual job card"""
        try:
            title_elem = card.find('h3', class_='base-search-card__title')
            company_elem = card.find('h4', class_='base-search-card__subtitle')
            location_elem = card.find('span', class_='job-search-card__location')
            link_elem = card.find('a', class_='base-card__full-link')
            date_elem = card.find('time')
            
            if not all([title_elem, company_elem, link_elem]):
                return None
            
            job_url = link_elem.get('href', '').split('?')[0]
            job_id = job_url.split('-')[-1] if job_url else None
            
            posted_date = None
            if date_elem and date_elem.get('datetime'):
                posted_date = datetime.fromisoformat(date_elem['datetime'].replace('Z', '+00:00'))
            
            # Try to extract salary from the card
            salary = None
            salary_elem = card.find('span', class_='job-search-card__salary-info')
            if salary_elem:
                salary = salary_elem.text.strip()
            
            return {
                'job_id': f"linkedin_{job_id}",
                'title': title_elem.text.strip(),
                'company': company_elem.text.strip(),
                'location': location_elem.text.strip() if location_elem else 'Not specified',
                'url': job_url,
                'source': 'linkedin',
                'salary': salary,
                'posted_date': posted_date,
                'is_active': True,
                'last_verified': datetime.utcnow(),
                'created_at': datetime.utcnow()
            }
        except Exception as e:
            print(f"Parse error: {e}")
            return None
    
    def get_job_details(self, job_url: str) -> Dict:
        """Get full job description from job page"""
        try:
            response = self.session.get(job_url, timeout=10)
            response.raise_for_status()
            
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(response.content, 'lxml')
            
            description_elem = soup.find('div', class_='show-more-less-html__markup')
            description = None
            
            if description_elem:
                # Remove "Apply" buttons and links
                for tag in description_elem.find_all(['button', 'a'], text=re.compile(r'apply|easy apply', re.I)):
                    tag.decompose()
                
                # Remove script and style tags
                for tag in description_elem.find_all(['script', 'style']):
                    tag.decompose()
                
                # Remove LinkedIn-specific promotional elements
                for tag in description_elem.find_all(class_=re.compile(r'.*apply.*|.*button.*', re.I)):
                    tag.decompose()
                
                # Get clean text
                description = description_elem.get_text(separator='\n', strip=True)
                
                # Clean up extra whitespace
                description = re.sub(r'\n{3,}', '\n\n', description)
                description = re.sub(r' {2,}', ' ', description)
            
            criteria_items = soup.find_all('li', class_='description__job-criteria-item')
            job_type = None
            for item in criteria_items:
                header = item.find('h3')
                if header and 'Employment type' in header.text:
                    job_type = item.find('span').text.strip()
            
            time.sleep(2)
            return {
                'description': description,
                'job_type': job_type
            }
        except Exception as e:
            print(f"Error fetching job details: {e}")
            return {}
