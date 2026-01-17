import aiohttp
import os
from typing import Optional, Dict
from urllib.parse import quote_plus

class CompanyInfoService:
    """Service to fetch company information using Google Custom Search API"""
    
    def __init__(self):
        self.api_key = os.getenv('GOOGLE_API_KEY', '')
        self.search_engine_id = os.getenv('GOOGLE_SEARCH_ENGINE_ID', '')
        self.base_url = "https://www.googleapis.com/customsearch/v1"
    
    async def get_company_info(self, company_name: str) -> Dict[str, Optional[str]]:
        """
        Fetch company website and description using Google Custom Search
        
        Returns:
            {
                'website': 'https://www.company.com',
                'description': 'Company description from search results'
            }
        """
        if not self.api_key or not self.search_engine_id:
            print("⚠️ Google API credentials not configured. Using fallback.")
            # Return None to signal frontend to use its own fallback
            return {
                'website': None,
                'description': None,
                'fallback': True  # Signal that this is fallback mode
            }
        
        try:
            # Search for company official website
            search_query = f"{company_name} official website"
            url = f"{self.base_url}?key={self.api_key}&cx={self.search_engine_id}&q={quote_plus(search_query)}&num=1"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if 'items' in data and len(data['items']) > 0:
                            first_result = data['items'][0]
                            website = first_result.get('link', '')
                            snippet = first_result.get('snippet', '')
                            
                            # Clean up the snippet to make it a proper description
                            description = snippet.replace('...', '').strip()
                            
                            return {
                                'website': website,
                                'description': description
                            }
                    else:
                        print(f"Google API error: {response.status}")
                        return {'website': None, 'description': None}
        
        except Exception as e:
            print(f"Error fetching company info: {str(e)}")
            return {'website': None, 'description': None}
        
        return {'website': None, 'description': None}
    
    async def get_company_about(self, company_name: str, website: str) -> Optional[str]:
        """
        Fetch company About/Description from their website
        
        Args:
            company_name: Name of the company
            website: Company website URL
            
        Returns:
            Company description or None
        """
        try:
            # Search for "About [Company]" content
            search_query = f"{company_name} about company description"
            url = f"{self.base_url}?key={self.api_key}&cx={self.search_engine_id}&q={quote_plus(search_query)}&num=3"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        if 'items' in data and len(data['items']) > 0:
                            # Combine snippets from top results for better description
                            snippets = []
                            for item in data['items'][:3]:
                                if website in item.get('link', ''):
                                    snippet = item.get('snippet', '').strip()
                                    if snippet and len(snippet) > 50:
                                        snippets.append(snippet)
                            
                            if snippets:
                                # Return the longest, most descriptive snippet
                                return max(snippets, key=len)
        
        except Exception as e:
            print(f"Error fetching company about: {str(e)}")
            return None
        
        return None
