import requests
from typing import List, Dict
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import time
import re
import random

class GlassdoorScraper:
    """Glassdoor job scraper as alternative to Indeed"""
    
    BASE_URL = "https://www.glassdoor.com"
    
    USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    ]
    
    def __init__(self):
        self.session = requests.Session()
        self._update_headers()
    
    def _update_headers(self):
        self.session.headers.update({
            'User-Agent': random.choice(self.USER_AGENTS),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
    
    def search_jobs(self, keywords: str, location: str = "", start: int = 0) -> List[Dict]:
        """Search Glassdoor jobs"""
        try:
            self._update_headers()
            
            # Glassdoor search URL
            search_url = f"{self.BASE_URL}/Job/jobs.htm"
            params = {
                'sc.keyword': keywords,
                'locT': 'C',  # City
                'locKeyword': location,
            }
            
            time.sleep(random.uniform(2, 4))
            response = self.session.get(search_url, params=params, timeout=15)
            
            if response.status_code != 200:
                print(f"Glassdoor returned status {response.status_code}")
                return []
            
            soup = BeautifulSoup(response.content, 'lxml')
            
            # Try multiple selectors
            job_cards = (
                soup.find_all('li', {'data-test': 'jobListing'}) or
                soup.find_all('div', class_=re.compile(r'JobCard', re.I)) or
                soup.find_all('a', {'data-test': 'job-link'})
            )
            
            jobs = []
            for card in job_cards[:15]:
                try:
                    job_data = self._parse_job_card(card)
                    if job_data:
                        jobs.append(job_data)
                except Exception as e:
                    continue
            
            print(f"Found {len(jobs)} Glassdoor jobs")
            return jobs
            
        except Exception as e:
            print(f"Glassdoor scraping error: {e}")
            return []
    
    def _parse_job_card(self, card) -> Dict:
        """Parse job card from Glassdoor"""
        try:
            # Find title
            title_elem = (
                card.find('a', {'data-test': 'job-link'}) or
                card.find('a', class_=re.compile(r'jobTitle', re.I)) or
                card.find('div', class_=re.compile(r'job.*title', re.I))
            )
            
            if not title_elem:
                return None
            
            title = title_elem.get_text(strip=True)
            href = title_elem.get('href', '')
            
            job_url = f"{self.BASE_URL}{href}" if href.startswith('/') else href
            
            # Generate job ID
            job_id_match = re.search(r'jobListingId=(\d+)', job_url)
            job_id = job_id_match.group(1) if job_id_match else str(hash(job_url))[:12]
            
            # Find company
            company_elem = (
                card.find('span', {'data-test': 'emp-name'}) or
                card.find('div', class_=re.compile(r'employer', re.I))
            )
            company = company_elem.get_text(strip=True) if company_elem else 'Not specified'
            
            # Find location
            location_elem = (
                card.find('span', {'data-test': 'emp-location'}) or
                card.find('div', class_=re.compile(r'location', re.I))
            )
            location = location_elem.get_text(strip=True) if location_elem else 'Not specified'
            
            # Find salary if available
            salary_elem = card.find('span', {'data-test': 'detailSalary'})
            salary = salary_elem.get_text(strip=True) if salary_elem else None
            
            return {
                'job_id': f"glassdoor_{job_id}",
                'title': title,
                'company': company,
                'location': location,
                'url': job_url,
                'source': 'glassdoor',
                'salary': salary,
                'posted_date': datetime.utcnow(),
                'is_active': True,
                'last_verified': datetime.utcnow(),
                'created_at': datetime.utcnow()
            }
        except Exception as e:
            return None
