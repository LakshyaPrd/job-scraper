'use client';

import { useState, useEffect, useCallback } from 'react';
import JobTable from '@/components/JobTable';
import SearchBar from '@/components/SearchBar';
import PlatformSelector from '@/components/PlatformSelector';
import JobCountSelector from '@/components/JobCountSelector';
import ContinueOption from '@/components/ContinueOption';
import ViewToggle from '@/components/ViewToggle';
import CompanyList from '@/components/CompanyList';

interface Job {
  _id: string;
  job_id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  posted_date?: string;
  salary?: string;
  job_type?: string;
  description?: string;
  last_verified?: string;
  created_at?: string;
  search_category?: string;
}

interface SearchHistoryItem {
  query: string;
  location: string;
  timestamp: number;
}

interface Company {
  company_name: string;
  total_jobs: number;
  latest_job_date: string;
  job_titles: string[];
  locations: string[];
}

export default function Home() {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week'>('all');
  const [error, setError] = useState('');
  
  // New states for recruiter features
  const [viewMode, setViewMode] = useState<'jobs' | 'companies'>('jobs');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin', 'jsearch']);
  const [maxJobs, setMaxJobs] = useState(100);
  const [continueFromLast, setContinueFromLast] = useState(false);
  const [currentSearchRole, setCurrentSearchRole] = useState('');
  const [currentSearchLocation, setCurrentSearchLocation] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const saved = localStorage.getItem('jobSearchHistory');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch {
        setSearchHistory([]);
      }
    }
  }, []);

  const saveSearchHistory = (history: SearchHistoryItem[]) => {
    localStorage.setItem('jobSearchHistory', JSON.stringify(history));
    setSearchHistory(history);
  };

  const fetchAllJobs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/jobs?limit=1000&date_filter=${dateFilter}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setAllJobs(data.jobs || []);
      setFilteredJobs(data.jobs || []);
      setError('');
    } catch (err) {
      setError('Failed to load jobs. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, dateFilter]);

  useEffect(() => {
    fetchAllJobs();
  }, [fetchAllJobs]);

  const filterJobs = useCallback((query: string | null) => {
    setActiveFilter(query);
    if (!query) {
      setFilteredJobs(allJobs);
      return;
    }
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);
    const filtered = allJobs.filter(job => {
      const titleLower = job.title.toLowerCase();
      const companyLower = job.company.toLowerCase();
      const categoryLower = (job.search_category || '').toLowerCase();
      return queryWords.some(word => 
        titleLower.includes(word) || companyLower.includes(word) || categoryLower.includes(word)
      );
    });
    setFilteredJobs(filtered);
  }, [allJobs]);


  const handleSearch = async (role: string, location: string) => {
    if (!role.trim()) return;
    setSearching(true);
    setError('');
    
    const initialJobCount = allJobs.length;
    
    try {
      const scrapeResponse = await fetch(`${API_URL}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, location }),
      });
      if (!scrapeResponse.ok) throw new Error('Scraping failed');
      
      const normalizedQuery = role.trim().toLowerCase();
      const existingIndex = searchHistory.findIndex(h => h.query.toLowerCase() === normalizedQuery);
      let newHistory: SearchHistoryItem[];
      const newItem: SearchHistoryItem = { query: role.trim(), location: location.trim(), timestamp: Date.now() };
      
      if (existingIndex >= 0) {
        newHistory = [newItem, ...searchHistory.filter((_, i) => i !== existingIndex)];
      } else {
        newHistory = [newItem, ...searchHistory].slice(0, 10);
      }
      saveSearchHistory(newHistory);
      
      // Poll for new jobs instead of fixed wait
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts * 3 seconds = 90 seconds max
      let hasNewJobs = false;
      
      while (attempts < maxAttempts && !hasNewJobs) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds between checks
        
        // Fetch jobs to check if new ones arrived
        const response = await fetch(`${API_URL}/api/jobs?limit=1000&date_filter=${dateFilter}`);
        if (response.ok) {
          const data = await response.json();
          const currentJobCount = data.jobs?.length || 0;
          
          // Check if we got new jobs
          if (currentJobCount > initialJobCount) {
            hasNewJobs = true;
            setAllJobs(data.jobs || []);
            setFilteredJobs(data.jobs || []);
            filterJobs(role.trim());
            break;
          }
        }
        
        attempts++;
      }
      
      // Final fetch after timeout or success
      if (!hasNewJobs) {
        await fetchAllJobs();
        filterJobs(role.trim());
      }
      
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleDeleteSearch = (query: string) => {
    const newHistory = searchHistory.filter(h => h.query !== query);
    saveSearchHistory(newHistory);
    if (activeFilter === query) filterJobs(null);
  };

  const linkedinCount = filteredJobs.filter(j => j.source === 'linkedin').length;
  const indeedCount = filteredJobs.filter(j => j.source === 'indeed').length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">Job Finder</h1>
          <p className="text-gray-600 text-lg">Search for jobs and filter by category</p>
        </div>

        <SearchBar onSearch={handleSearch} isSearching={searching} />

        {/* Date Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Filter by Date Scraped</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                dateFilter === 'all'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Jobs
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                dateFilter === 'today'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 Today
            </button>
            <button
              onClick={() => setDateFilter('yesterday')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                dateFilter === 'yesterday'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 Yesterday
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                dateFilter === 'week'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📅 This Week
            </button>
          </div>
        </div>

        {searchHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Your Searches</h3>
              <button onClick={() => { saveSearchHistory([]); filterJobs(null); }} className="text-xs text-red-500 hover:text-red-700">Clear All</button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => filterJobs(null)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === null ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                All Jobs ({allJobs.length})
              </button>
              {searchHistory.map((item) => {
                const matchCount = allJobs.filter(job => {
                  const words = item.query.toLowerCase().split(/\s+/);
                  return words.some(w => job.title.toLowerCase().includes(w) || (job.search_category || '').toLowerCase().includes(w));
                }).length;
                return (
                  <div key={item.query} className="relative group">
                    <button onClick={() => filterJobs(item.query)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeFilter === item.query ? 'bg-blue-600 text-white' : 'bg-purple-100 text-gray-700 hover:bg-purple-200'}`}>
                      {item.query} <span className="ml-1 text-xs opacity-75">({matchCount})</span>
                    </button>
                    <button onClick={() => handleDeleteSearch(item.query)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity">x</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{filteredJobs.length}</span>
              <span className="text-gray-600">{activeFilter ? `Jobs matching "${activeFilter}"` : 'Total Jobs'}</span>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">LinkedIn: {linkedinCount}</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">Indeed: {indeedCount}</span>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}

        {searching && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600"></div>
            <span>Scraping jobs... Check the Brave/Chrome window if CAPTCHA appears!</span>
          </div>
        )}

        <JobTable jobs={filteredJobs} loading={loading} />
      </div>
      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>Data from LinkedIn and Indeed • Full job descriptions included</p>
      </footer>
    </main>
  );
}
