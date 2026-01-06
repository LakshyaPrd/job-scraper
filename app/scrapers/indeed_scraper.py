import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from bs4 import BeautifulSoup
from typing import List, Dict
from datetime import datetime, timedelta
import time
import re
import random
import os
import json
import pickle

class IndeedScraper:
    def __init__(self, use_brave=False):
        self.driver = None
        self.use_brave = use_brave
        self.cookies_file = "indeed_cookies.pkl"
        
        # Common Brave installation paths on Windows
        self.brave_paths = [
            r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
            r"C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe",
            os.path.expanduser(r"~\AppData\Local\BraveSoftware\Brave-Browser\Application\brave.exe"),
        ]
    
    def _find_brave_path(self):
        """Find Brave browser installation path"""
        for path in self.brave_paths:
            if os.path.exists(path):
                return path
        return None
    
    def _is_driver_alive(self):
        """Check if the driver is still responsive"""
        if self.driver is None:
            return False
        try:
            # Try to get the current URL - will fail if driver is dead
            _ = self.driver.current_url
            return True
        except:
            return False
        
    def _init_driver(self):
        """Initialize undetected Chrome/Brave driver lazily"""
        # Check if existing driver is dead and clean it up
        if self.driver is not None and not self._is_driver_alive():
            print("Browser driver is dead, reinitializing...")
            try:
                self.driver.quit()
            except:
                pass
            self.driver = None
        
        if self.driver is None:
            try:
                options = uc.ChromeOptions()
                
                # Use Brave if requested and available
                brave_path = self._find_brave_path() if self.use_brave else None
                if self.use_brave and brave_path:
                    options.binary_location = brave_path
                    print(f"Using Brave browser: {brave_path}")
                elif self.use_brave:
                    print("Brave not found, falling back to Chrome")
                
                # Run in visible mode - headless is more easily detected
                # options.add_argument('--headless=new')  # Disabled - Indeed detects headless
                options.add_argument('--no-sandbox')
                options.add_argument('--disable-dev-shm-usage')
                options.add_argument('--disable-gpu')
                options.add_argument('--window-size=1920,1080')
                options.add_argument('--log-level=3')
                options.add_argument('--start-maximized')
                
                # Add more human-like settings
                options.add_argument('--disable-blink-features=AutomationControlled')
                
                # Add user data directory for persistent session (cookies, cache)
                user_data_dir = os.path.join(os.getcwd(), "chrome_profile")
                if not os.path.exists(user_data_dir):
                    os.makedirs(user_data_dir)
                options.add_argument(f'--user-data-dir={user_data_dir}')
                
                # undetected-chromedriver handles anti-bot detection automatically
                self.driver = uc.Chrome(options=options, use_subprocess=True)
                
                # Set a more realistic page load timeout
                self.driver.set_page_load_timeout(30)
                
                # Load saved cookies if available
                self._load_cookies()
                
                browser_name = "Brave" if (self.use_brave and brave_path) else "Chrome"
                print(f"Undetected {browser_name} driver initialized successfully (visible mode)")
            except Exception as e:
                print(f"Failed to initialize undetected Chrome driver: {e}")
                self.driver = None
    
    def search_jobs(self, keywords: str, location: str = "", max_pages: int = 2) -> List[Dict]:
        """Search Indeed jobs using Selenium with pagination support"""
        self._init_driver()
        
        if self.driver is None:
            print("Chrome driver not available, skipping Indeed scraping")
            return []
        
        all_jobs = []
        
        # Fetch multiple pages
        for page_num in range(max_pages):
            start = page_num * 10  # Indeed uses 10 jobs per pagination offset
            
            search_url = f"https://www.indeed.com/jobs?q={keywords.replace(' ', '+')}&l={location.replace(' ', '+')}&start={start}&fromage=30"
            
            try:
                print(f"  Fetching Indeed page {page_num + 1}/{max_pages}...")
                
                # First visit the homepage to appear more human (only on first page)
                if page_num == 0:
                    self.driver.get("https://www.indeed.com")
                    time.sleep(random.uniform(2, 4))
                
                # Now navigate to search
                self.driver.get(search_url)
                
                # Random human-like delay
                time.sleep(random.uniform(4, 7))
                
                # Scroll down slowly like a human
                for _ in range(3):
                    self.driver.execute_script("window.scrollBy(0, 300);")
                    time.sleep(random.uniform(0.5, 1.5))
                
                # Scroll back up
                self.driver.execute_script("window.scrollTo(0, 0);")
                time.sleep(random.uniform(1, 2))
                
                # Check if we hit a CAPTCHA or Cloudflare protection (only on first page)
                page_source = self.driver.page_source
                page_title = self.driver.title.lower()
                
                if page_num == 0:  # Only check CAPTCHA on first page
                    # Cloudflare "Just a moment..." detection
                    if 'just a moment' in page_title or 'checking your browser' in page_source.lower():
                        print("\n" + "="*60)
                        print("🤖 CLOUDFLARE CHALLENGE DETECTED!")
                        print("🧑 PLEASE SOLVE THE CHALLENGE IN THE BROWSER")
                        print("⏱️  Waiting for up to 60 seconds...")
                        print("="*60 + "\n")
                        # Wait for user to solve CAPTCHA manually
                        for i in range(60):
                            time.sleep(1)
                            if (i + 1) % 10 == 0:
                                print(f"⏳ Still waiting... {60 - i - 1} seconds remaining")
                            page_title = self.driver.title.lower()
                            if 'just a moment' not in page_title and 'indeed' in page_title:
                                print(f"\n✅ Cloudflare solved after {i+1} seconds!")
                                time.sleep(2)  # Wait for page to fully load
                                page_source = self.driver.page_source
                                # Save cookies after successful solve
                                self._save_cookies()
                                break
                        else:
                            print("\n❌ Cloudflare challenge not solved in time")
                            return all_jobs  # Return what we have so far
                    
                    # More precise CAPTCHA detection (after Cloudflare check)
                    captcha_indicators = [
                        'hcaptcha' in page_source.lower() and 'challenge' in page_source.lower(),
                        'recaptcha' in page_source.lower() and 'challenge' in page_source.lower(),
                        'unusual traffic' in page_source.lower(),
                        'verify you are human' in page_source.lower(),
                    ]
                    
                    if any(captcha_indicators):
                        print("\n" + "="*60)
                        print("🔒 INDEED CAPTCHA DETECTED!")
                        print("🧑 PLEASE SOLVE THE CAPTCHA IN THE BROWSER")
                        print("⏱️  Waiting for up to 60 seconds...")
                        print("="*60 + "\n")
                        for i in range(60):
                            time.sleep(1)
                            if (i + 1) % 10 == 0:
                                print(f"⏳ Still waiting... {60 - i - 1} seconds remaining")
                            new_source = self.driver.page_source
                            # Check if job listings appeared
                            if 'job_seen_beacon' in new_source or 'jobsearch-ResultsList' in new_source:
                                print(f"\n✅ CAPTCHA solved after {i+1} seconds!")
                                page_source = new_source
                                # Save cookies after successful solve
                                self._save_cookies()
                                break
                        else:
                            print("\n❌ CAPTCHA not solved in time")
                            return all_jobs  # Return what we have so far
                
                # Try multiple selectors with explicit waits
                selectors_to_try = [
                    (By.CLASS_NAME, "job_seen_beacon"),
                    (By.CSS_SELECTOR, "div.jobsearch-ResultsList > div"),
                    (By.CSS_SELECTOR, "ul.jobsearch-ResultsList > li"),
                    (By.CSS_SELECTOR, "[data-testid='jobListing']"),
                    (By.CSS_SELECTOR, "div.mosaic-provider-jobcards > div"),
                    (By.CSS_SELECTOR, "a[data-jk]"),
                ]
                
                found_element = False
                for selector_type, selector_value in selectors_to_try:
                    try:
                        WebDriverWait(self.driver, 3).until(
                            EC.presence_of_element_located((selector_type, selector_value))
                        )
                        print(f"  Found elements with selector: {selector_value}")
                        found_element = True
                        break
                    except:
                        continue
                
                if not found_element:
                    # Debug: save page source to see what we're getting
                    print(f"  No job listings found on page {page_num + 1}")
                    # Check if page has any job-related content
                    if 'jobs' not in page_source.lower():
                        print("  Indeed may be blocking - page doesn't contain job content")
                    break  # No more jobs, stop pagination
                
                soup = BeautifulSoup(page_source, 'lxml')
                
                # Try multiple selectors for job cards
                job_cards = []
                
                # Method 1: Standard job cards
                job_cards = soup.find_all('div', class_='job_seen_beacon')
                
                # Method 2: Result list divs
                if not job_cards:
                    results_list = soup.find('div', class_='jobsearch-ResultsList')
                    if results_list:
                        job_cards = results_list.find_all('div', recursive=False)
                
                # Method 3: Mosaic cards
                if not job_cards:
                    mosaic = soup.find('div', class_='mosaic-provider-jobcards')
                    if mosaic:
                        job_cards = mosaic.find_all('div', recursive=False)
                
                # Method 4: Links with data-jk attribute (job key)
                if not job_cards:
                    job_links = soup.find_all('a', {'data-jk': True})
                    # Convert links to their parent containers
                    job_cards = [link.find_parent('div') for link in job_links if link.find_parent('div')]
                
                # Method 5: Any element with job data
                if not job_cards:
                    job_cards = soup.find_all('div', {'data-jk': True})
                
                if not job_cards:
                    print(f"  No job cards found on page {page_num + 1}, stopping pagination")
                    break  # No more jobs
                
                print(f"  Found {len(job_cards)} job cards on page {page_num + 1}")
                
                # Parse jobs from this page
                page_jobs = []
                for card in job_cards[:15]:  # Limit to 15 per page
                    try:
                        job_data = self._parse_job_card(card)
                        if job_data:
                            page_jobs.append(job_data)
                    except Exception as e:
                        print(f"  Error parsing card: {e}")
                        continue
                
                all_jobs.extend(page_jobs)
                print(f"  Parsed {len(page_jobs)} jobs from page {page_num + 1} (Total: {len(all_jobs)})")
                
                # Delay between pages to avoid rate limiting
                if page_num < max_pages - 1:  # Don't delay after last page
                    delay = random.uniform(5, 8)
                    print(f"  Waiting {delay:.1f}s before next page...")
                    time.sleep(delay)
                
            except Exception as e:
                print(f"  Error on page {page_num + 1}: {e}")
                break  # Stop pagination on error
        
        print(f"  Successfully scraped {len(all_jobs)} total Indeed jobs from {page_num + 1} pages")
        return all_jobs
    
    
    def _parse_job_card(self, card) -> Dict:
        """Parse individual job card"""
        try:
            # First, try to find any link with data-jk (job key)
            link_elem = card.find('a', {'data-jk': True})
            job_id = None
            title = None
            
            if link_elem:
                job_id = link_elem.get('data-jk')
                title = link_elem.get_text(strip=True)
            else:
                # Try finding title element
                title_elem = card.find('h2', class_='jobTitle')
                if not title_elem:
                    title_elem = card.find('a', class_='jcs-JobTitle')
                if not title_elem:
                    title_elem = card.find('h2')
                if not title_elem:
                    # Look for any heading or strong text
                    title_elem = card.find(['h1', 'h2', 'h3', 'strong'])
                
                if not title_elem:
                    return None
                
                link_elem = title_elem.find('a') if title_elem.name != 'a' else title_elem
                if not link_elem:
                    link_elem = card.find('a', href=True)
                if not link_elem:
                    return None
                
                title = title_elem.get_text(strip=True) or link_elem.get_text(strip=True)
                
                # Extract job ID from various sources
                job_id = link_elem.get('data-jk')
                if not job_id:
                    job_id = card.get('data-jk')
                if not job_id:
                    href = link_elem.get('href', '')
                    id_attr = link_elem.get('id', '')
                    jk_match = re.search(r'jk=([a-f0-9]+)', href) or re.search(r'job_([a-f0-9]+)', id_attr)
                    job_id = jk_match.group(1) if jk_match else None
            
            if not job_id or not title:
                return None
            
            url = f"https://www.indeed.com/viewjob?jk={job_id}"
            
            # Company name - try multiple selectors
            company = 'Not specified'
            for selector in [
                ('span', {'data-testid': 'company-name'}),
                ('span', {'class': 'companyName'}),
                ('span', {'class': 'company'}),
                ('div', {'class': 'company_location'}),
            ]:
                company_elem = card.find(selector[0], selector[1])
                if company_elem:
                    company = company_elem.get_text(strip=True)
                    break
            
            # Location - try multiple selectors
            location = 'Not specified'
            for selector in [
                ('div', {'data-testid': 'text-location'}),
                ('div', {'class': 'companyLocation'}),
                ('span', {'class': 'location'}),
            ]:
                location_elem = card.find(selector[0], selector[1])
                if location_elem:
                    location = location_elem.get_text(strip=True)
                    break
            
            # Salary - try multiple selectors
            salary = None
            for selector in [
                ('div', {'class': 'salary-snippet'}),
                ('span', {'class': 'salary-snippet'}),
                ('div', {'data-testid': 'attribute_snippet_testid'}),
                ('div', {'class': 'salaryOnly'}),
                ('span', {'class': 'salaryText'}),
                ('div', {'class': 'metadata salary-snippet-container'}),
            ]:
                salary_elem = card.find(selector[0], selector[1])
                if salary_elem:
                    salary = salary_elem.get_text(strip=True)
                    break
            
            # Also check for salary in estimated salary container
            if not salary:
                estimated = card.find('div', {'class': 'estimated-salary'})
                if estimated:
                    salary = estimated.get_text(strip=True)
            
            # Posted date
            date_elem = card.find('span', class_='date')
            if not date_elem:
                date_elem = card.find('span', {'data-testid': 'myJobsStateDate'})
            posted_date = self._parse_date(date_elem.get_text()) if date_elem else None
            
            # Job type
            job_type_elem = card.find('div', class_='metadata')
            if not job_type_elem:
                job_type_elem = card.find('div', class_='attribute_snippet')
            job_type = job_type_elem.get_text(strip=True) if job_type_elem else None
            
            return {
                'job_id': f"indeed_{job_id}",
                'title': title,
                'company': company,
                'location': location,
                'url': url,
                'source': 'indeed',
                'salary': salary,
                'job_type': job_type,
                'posted_date': posted_date,
                'is_active': True,
                'last_verified': datetime.utcnow(),
                'created_at': datetime.utcnow()
            }
        except Exception as e:
            print(f"Parse error: {e}")
            return None
    
    def _parse_date(self, date_text: str) -> datetime:
        """Convert relative date to datetime"""
        try:
            date_text = date_text.lower()
            if 'just posted' in date_text or 'today' in date_text:
                return datetime.utcnow()
            elif 'day' in date_text:
                days = int(re.search(r'(\d+)', date_text).group(1))
                return datetime.utcnow() - timedelta(days=days)
            elif 'hour' in date_text:
                hours = int(re.search(r'(\d+)', date_text).group(1))
                return datetime.utcnow() - timedelta(hours=hours)
            else:
                return datetime.utcnow()
        except:
            return datetime.utcnow()
    
    def verify_job_active(self, job_url: str) -> bool:
        """Check if job URL is still active"""
        self._init_driver()
        
        if self.driver is None:
            return True  # Assume active if can't verify
        
        try:
            self.driver.get(job_url)
            time.sleep(2)
            
            # Check if page shows "job has expired" or similar
            page_source = self.driver.page_source.lower()
            if any(phrase in page_source for phrase in ['job has expired', 'no longer available', 'this job is no longer accepting applications']):
                return False
            
            return True
        except:
            return False
    
    def _save_cookies(self):
        """Save cookies to file for session persistence"""
        try:
            if self.driver:
                cookies = self.driver.get_cookies()
                with open(self.cookies_file, 'wb') as f:
                    pickle.dump(cookies, f)
                print(f"💾 Cookies saved to {self.cookies_file}")
        except Exception as e:
            print(f"Warning: Could not save cookies: {e}")
    
    def _load_cookies(self):
        """Load cookies from file to maintain session"""
        try:
            if os.path.exists(self.cookies_file) and self.driver:
                # Need to visit Indeed first before adding cookies
                self.driver.get("https://www.indeed.com")
                time.sleep(2)
                with open(self.cookies_file, 'rb') as f:
                    cookies = pickle.load(f)
                for cookie in cookies:
                    try:
                        self.driver.add_cookie(cookie)
                    except:
                        pass  # Some cookies might be expired
                print(f"🍪 Loaded cookies from {self.cookies_file}")
                time.sleep(1)
        except Exception as e:
            print(f"Note: Could not load cookies (first run?): {e}")
    
    def _simulate_human_behavior(self):
        """Simulate human-like mouse movements and scrolling"""
        try:
            actions = ActionChains(self.driver)
            # Random mouse movements
            for _ in range(random.randint(2, 4)):
                x_offset = random.randint(-100, 100)
                y_offset = random.randint(-100, 100)
                actions.move_by_offset(x_offset, y_offset)
                actions.perform()
                time.sleep(random.uniform(0.1, 0.3))
        except:
            pass  # Not critical if this fails
    
    def get_job_details(self, job_url: str) -> Dict:
        """Fetch full job description from job detail page"""
        self._init_driver()
        
        if self.driver is None:
            print("Chrome driver not available")
            return {'description': None, 'job_type': None}
        
        try:
            self.driver.get(job_url)
            time.sleep(random.uniform(3, 5))  # Human-like delay
            
            # Simulate human behavior
            self._simulate_human_behavior()
            
            soup = BeautifulSoup(self.driver.page_source, 'lxml')
            
            # Find job description container
            description_elem = None
            description_selectors = [
                ('div', {'id': 'jobDescriptionText'}),
                ('div', {'class': 'jobsearch-jobDescriptionText'}),
                ('div', {'class': 'job-description'}),
            ]
            
            for selector in description_selectors:
                description_elem = soup.find(selector[0], selector[1])
                if description_elem:
                    break
            
            if not description_elem:
                return {'description': None, 'job_type': None}
            
            # Clean the description HTML
            # Remove "Apply Now" buttons and links
            for tag in description_elem.find_all(['button', 'a'], text=re.compile(r'apply', re.I)):
                tag.decompose()
            
            # Remove script and style tags
            for tag in description_elem.find_all(['script', 'style']):
                tag.decompose()
            
            # Remove Indeed-specific tracking/promotional elements
            for tag in description_elem.find_all(class_=re.compile(r'jobsearch-.*Apply|apply-button|indeed-apply', re.I)):
                tag.decompose()
            
            # Get clean text
            description = description_elem.get_text(separator='\n', strip=True)
            
            # Clean up extra whitespace
            description = re.sub(r'\n{3,}', '\n\n', description)
            description = re.sub(r' {2,}', ' ', description)
            
            # Extract job type if available
            job_type = None
            job_type_elem = soup.find('div', {'id': 'jobDetailsSection'})
            if job_type_elem:
                job_type_text = job_type_elem.get_text()
                if 'full-time' in job_type_text.lower():
                    job_type = 'Full-time'
                elif 'part-time' in job_type_text.lower():
                    job_type = 'Part-time'
                elif 'contract' in job_type_text.lower():
                    job_type = 'Contract'
            
            return {
                'description': description,
                'job_type': job_type
            }
        except Exception as e:
            print(f"Error fetching job details from {job_url}: {e}")
            return {'description': None, 'job_type': None}
    
    def close(self):
        """Close the browser"""
        if self.driver:
            # Save cookies before closing
            self._save_cookies()
            self.driver.quit()
            self.driver = None
            print("Chrome driver closed")
