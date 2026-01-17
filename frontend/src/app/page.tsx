'use client';

import { useState, useEffect, useCallback } from 'react';
import JobList from '@/components/JobList';
import SearchBar from '@/components/SearchBar';
import PlatformSelector from '@/components/PlatformSelector';
import JobCountSelector from '@/components/JobCountSelector';
import ContinueOption from '@/components/ContinueOption';
import ViewToggle from '@/components/ViewToggle';
import CompanyList from '@/components/CompanyList';
import SearchBox from '@/components/SearchBox';
import ScrapeSessionList from '@/components/ScrapeSessionList';

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
  const [maxJobs, setMaxJobs] = useState(10); // Changed from 100 to 10
  const [continueFromLast, setContinueFromLast] = useState(false);
  const [currentSearchRole, setCurrentSearchRole] = useState('');
  const [currentSearchLocation, setCurrentSearchLocation] = useState('');
  const [jobSearchQuery, setJobSearchQuery] = useState(''); // For SearchBox filtering
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null); // For session filtering

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Load persisted state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('jobSearchHistory');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch {
        setSearchHistory([]);
      }
    }
    
    // Restore date filter
    const savedDateFilter = localStorage.getItem('dateFilter');
    if (savedDateFilter && ['all', 'today', 'yesterday', 'week'].includes(savedDateFilter)) {
      setDateFilter(savedDateFilter as 'all' | 'today' | 'yesterday' | 'week');
    }
    
    // Restore view mode
    const savedViewMode = localStorage.getItem('viewMode');
    if (savedViewMode && ['jobs', 'companies'].includes(savedViewMode)) {
      setViewMode(savedViewMode as 'jobs' | 'companies');
    }
  }, []);

  // Persist date filter to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('dateFilter', dateFilter);
  }, [dateFilter]);

  // Persist view mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

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

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/companies?date_filter=${dateFilter}`);
      if (!response.ok) throw new Error('Failed to fetch companies');
      const data = await response.json();
      setCompanies(data.companies || []);
      setError('');
    } catch (err) {
      setError('Failed to load companies. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API_URL, dateFilter]);

  useEffect(() => {
    if (viewMode === 'companies') {
      fetchCompanies();
    } else {
      fetchAllJobs();
    }
  }, [viewMode, fetchAllJobs, fetchCompanies]);

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

  const handleJobSearch = (query: string) => {
    setJobSearchQuery(query);
    if (!query.trim()) {
      if (activeFilter) {
        filterJobs(activeFilter);
      } else {
        setFilteredJobs(allJobs);
      }
      return;
    }

    const lowerQuery = query.toLowerCase();
    
    // Filter jobs
    const filtered = allJobs.filter(job => 
      job.title.toLowerCase().includes(lowerQuery) ||
      job.company.toLowerCase().includes(lowerQuery) ||
      job.location.toLowerCase().includes(lowerQuery) ||
      (job.description || '').toLowerCase().includes(lowerQuery) ||
      (job.salary || '').toLowerCase().includes(lowerQuery)
    );
    setFilteredJobs(filtered);
  };


  const handleSearch = async (role: string, location: string) => {
    if (!role.trim()) return;
    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform to scrape');
      return;
    }
    
    setSearching(true);
    setError('');
    setCurrentSearchRole(role);
    setCurrentSearchLocation(location);
    
    const initialJobCount = allJobs.length;
    
    try {
      const scrapeResponse = await fetch(`${API_URL}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          role, 
          location,
          platforms: selectedPlatforms,
          max_jobs: maxJobs,
          continue_from_last: continueFromLast
        }),
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
            
            // Also fetch companies
            await fetchCompanies();
            break;
          }
        }
        
        attempts++;
      }
      
      // Final fetch after timeout or success
      if (!hasNewJobs) {
        await fetchAllJobs();
        await fetchCompanies();
        filterJobs(role.trim());
      }
      
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error(err);
    } finally {
      // ALWAYS clear searching state
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
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-[1800px]">
        {/* Modern Header with Gradient */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-block mb-4">
            <h1 className="text-5xl md:text-6xl font-bold gradient-text mb-3">
              Job Scraper Pro
            </h1>
            <div className="h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full"></div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Professional job scraping tool for recruiters. Search across multiple platforms with smart filtering and company insights.
          </p>
        </div>

        {/* Search Bar at Top */}
        <div className="mb-6">
          <SearchBar onSearch={handleSearch} isSearching={searching} />
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT SIDEBAR - Filters & Controls */}
          <div className="lg:col-span-3 space-y-4">
            {/* Platform Selection */}
            <PlatformSelector 
              selectedPlatforms={selectedPlatforms}
              onChange={setSelectedPlatforms}
            />

            {/* Job Count */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <JobCountSelector maxJobs={maxJobs} onChange={setMaxJobs} />
            </div>

            {/* Continue from Last */}
            {currentSearchRole && (
              <ContinueOption
                searchRole={currentSearchRole}
                searchLocation={currentSearchLocation}
                continueFromLast={continueFromLast}
                onChange={setContinueFromLast}
                apiUrl={API_URL}
              />
            )}

            {/* View Toggle - Always show but disabled during search */}
            <ViewToggle 
              viewMode={viewMode} 
              onViewChange={setViewMode}
            />  {/* Date Filter */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">📅 Filter by Date</h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                    dateFilter === 'all'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Jobs
                </button>
                <button
                  onClick={() => setDateFilter('today')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                    dateFilter === 'today'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📅 Today
                </button>
                <button
                  onClick={() => setDateFilter('yesterday')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                    dateFilter === 'yesterday'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📅 Yesterday
                </button>
                <button
                  onClick={() => setDateFilter('week')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                    dateFilter === 'week'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📅 This Week
                </button>
              </div>
            </div>

            {/* Search History */}
            {searchHistory.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Your Searches</h3>
                  <button 
                    onClick={() => { saveSearchHistory([]); filterJobs(null); }} 
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => filterJobs(null)} 
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                      activeFilter === null 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Jobs ({allJobs.length})
                  </button>
                  {searchHistory.map((item) => {
                    const matchCount = allJobs.filter(job => {
                      const words = item.query.toLowerCase().split(/\s+/);
                      return words.some(w => 
                        job.title.toLowerCase().includes(w) || 
                        (job.search_category || '').toLowerCase().includes(w)
                      );
                    }).length;
                    return (
                      <div key={item.query} className="relative group">
                        <button 
                          onClick={() => filterJobs(item.query)} 
                          className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                            activeFilter === item.query 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-purple-100 text-gray-700 hover:bg-purple-200'
                          }`}
                        >
                          {item.query} <span className="text-xs opacity-75">({matchCount})</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteSearch(item.query)} 
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Scrape Sessions List */}
            <div className="mt-6">
              <ScrapeSessionList 
                onSessionClick={(sessionId) => {
                  setSelectedSessionId(sessionId);
                  // Fetch jobs for this session
                  fetch(`${API_URL}/api/scrape-sessions/${sessionId}/jobs`)
                    .then(res => res.json())
                    .then(data => {
                      const sessionJobs = data.jobs || [];
                      setFilteredJobs(sessionJobs);
                      setAllJobs(sessionJobs);
                      setActiveFilter(null);
                      setJobSearchQuery('');
                      
                      // Extract companies from these jobs for Company View
                      const companyMap = new Map<string, any>();
                      
                      sessionJobs.forEach((job: any) => {
                        const companyName = job.company || 'Unknown';
                        if (companyMap.has(companyName)) {
                          const existing = companyMap.get(companyName);
                          existing.job_count++;
                          existing.jobs.push(job);
                        } else {
                          companyMap.set(companyName, {
                            company_name: companyName,
                            job_count: 1,
                            total_jobs: 1,
                            jobs: [job],
                            latest_job_date: job.created_at || new Date().toISOString(),
                            job_titles: [job.title],
                            locations: [job.location]
                          });
                        }
                      });
                      
                      const sessionCompanies = Array.from(companyMap.values());
                      setCompanies(sessionCompanies);
                    });
                }}
              />
            </div>

            {/* Clear Session Filter */}
            {selectedSessionId && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setSelectedSessionId(null);
                    fetchAllJobs();
                    fetchCompanies(); // Also refresh companies
                  }}
                  className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  ← Show All Jobs
                </button>
              </div>
            )}
          </div>

          {/* RIGHT PANEL - Results */}
          <div className="lg:col-span-9">
            {/* Search Box - Always Visible */}
            <div className="mb-6">
              <SearchBox 
                onSearch={handleJobSearch}
                placeholder={viewMode === 'companies' ? "Search companies..." : "Search jobs by title, company, location, or skills..."}
                currentQuery={jobSearchQuery}
                suggestions={viewMode === 'companies' ? companies.map(c => c.company_name) : []}
              />
            </div>

            {/* Search Results Count */}
            {jobSearchQuery && viewMode === 'jobs' && (
              <div className="mb-4 text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
                Showing {filteredJobs.length} of {allJobs.length} jobs matching "{jobSearchQuery}"
              </div>
            )}

            {/* Company Search Results Count */}
            {jobSearchQuery && viewMode === 'companies' && (
              <div className="mb-4 text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
                Showing {companies.filter(c => c.company_name?.toLowerCase().includes(jobSearchQuery.toLowerCase())).length} of {companies.length} companies matching "{jobSearchQuery}"
              </div>
            )}

            {/* Stats Bar */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {viewMode === 'companies' ? companies.length : filteredJobs.length}
                  </span>
                  <span className="text-gray-600">
                    {viewMode === 'companies' 
                      ? 'Companies Hiring' 
                      : activeFilter ? `Jobs matching "${activeFilter}"` : 'Total Jobs'
                    }
                  </span>
                </div>
                {viewMode === 'jobs' && (
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      LinkedIn: {linkedinCount}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      Indeed: {indeedCount}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Searching Status */}
            {searching && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600"></div>
                <span>Scraping jobs... This may take 30-60 seconds</span>
              </div>
            )}

            {/* Results - Conditional rendering based on view mode */}
            {viewMode === 'companies' ? (
              <CompanyList companies={companies} loading={loading} searchQuery={jobSearchQuery} />
            ) : (
              <JobList jobs={filteredJobs} loading={loading} />
            )}
          </div>
        </div>
      </div>
      
      <footer className="text-center py-6 text-gray-500 text-sm">
        <p>Professional Recruiter Tool • Data from LinkedIn, Indeed, Glassdoor</p>
      </footer>
    </main>
  );
}
