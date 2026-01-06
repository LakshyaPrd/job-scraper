'use client';

import { useState, useEffect } from 'react';
import JobCard from '@/components/JobCard';
import SearchBar from '@/components/SearchBar';
import StatsBar from '@/components/StatsBar';

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
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [total, setTotal] = useState(0);
  const [newJobsCount, setNewJobsCount] = useState(0);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchJobs();
    // Poll for new jobs every 5 minutes
    const interval = setInterval(fetchJobs, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/jobs`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      
      const data = await response.json();
      setJobs(data.jobs);
      setTotal(data.total);
      setNewJobsCount(data.new_jobs_count);
      setError('');
    } catch (err) {
      setError('Failed to load jobs. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (role: string, location: string) => {
    setSearching(true);
    setError('');
    
    try {
      // Trigger scrape
      const scrapeResponse = await fetch(`${API_URL}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, location }),
      });
      
      if (!scrapeResponse.ok) throw new Error('Scraping failed');
      
      // Wait a bit for scraping to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Search in database
      const searchResponse = await fetch(`${API_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, location }),
      });
      
      if (!searchResponse.ok) throw new Error('Search failed');
      
      const searchData = await searchResponse.json();
      setJobs(searchData);
      setTotal(searchData.length);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            Job Finder 🚀
          </h1>
          <p className="text-gray-600 text-lg">
            Find the latest job openings from LinkedIn and Indeed
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} isSearching={searching} />

        {/* Stats */}
        <StatsBar total={total} newJobs={newJobsCount} />

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          </div>
        ) : (
          /* Jobs Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.length > 0 ? (
              jobs.map((job) => <JobCard key={job._id} job={job} />)
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="text-gray-400 text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No jobs found
                </h3>
                <p className="text-gray-500">
                  Try searching for a different role or location
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
