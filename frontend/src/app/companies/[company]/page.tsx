'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import JobTable from '@/components/JobTable';
import SearchBox from '@/components/SearchBox';

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
  created_at?: string;
}

export default function CompanyPage() {
  const params = useParams();
  const router = useRouter();
  const companyName = decodeURIComponent(params.company as string);
  
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchCompanyJobs = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/companies/${encodeURIComponent(companyName)}/jobs`);
        if (!response.ok) throw new Error('Failed to fetch company jobs');
        const data = await response.json();
        setAllJobs(data.jobs || []);
        setFilteredJobs(data.jobs || []);
        
        // Extract company website from job URLs
        if (data.jobs && data.jobs.length > 0) {
          const firstJob = data.jobs[0];
          if (firstJob.url) {
            try {
              const url = new URL(firstJob.url);
              // Try to find company domain from LinkedIn/Indeed URLs
              if (url.hostname.includes('linkedin.com')) {
                setCompanyWebsite(`https://www.google.com/search?q=${encodeURIComponent(companyName + ' official website')}`);
              } else {
                setCompanyWebsite(url.origin);
              }
            } catch {
              setCompanyWebsite(`https://www.google.com/search?q=${encodeURIComponent(companyName + ' official website')}`);
            }
          }
        }
      } catch (err) {
        setError('Failed to load company jobs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyJobs();
  }, [companyName, API_URL]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredJobs(allJobs);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = allJobs.filter(job => 
      job.title.toLowerCase().includes(lowerQuery) ||
      job.location.toLowerCase().includes(lowerQuery) ||
      (job.description || '').toLowerCase().includes(lowerQuery) ||
      (job.salary || '').toLowerCase().includes(lowerQuery)
    );
    setFilteredJobs(filtered);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4 font-medium transition-colors"
          >
            ← Back to Companies
          </button>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{companyName}</h1>
                <p className="text-gray-600 text-lg">
                  {allJobs.length} job {allJobs.length === 1 ? 'opening' : 'openings'}
                </p>
              </div>
              
              {companyWebsite && (
                <a
                  href={companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  🌐 Visit Website
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>

            {/* Company Info */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">Total Openings</div>
                <div className="text-2xl font-bold text-blue-900">{allJobs.length}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium">Locations</div>
                <div className="text-2xl font-bold text-green-900">
                  {new Set(allJobs.map(j => j.location)).size}
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium">Sources</div>
                <div className="text-2xl font-bold text-purple-900">
                  {new Set(allJobs.map(j => j.source)).size}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="mb-6">
          <SearchBox 
            onSearch={handleSearch}
            placeholder={`Search jobs at ${companyName}...`}
            currentQuery={searchQuery}
          />
        </div>

        {searchQuery && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredJobs.length} of {allJobs.length} jobs matching "{searchQuery}"
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Jobs Table */}
        <JobTable jobs={filteredJobs} loading={loading} />
      </div>
    </main>
  );
}


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
  created_at?: string;
}

export default function CompanyPage() {
  const params = useParams();
  const router = useRouter();
  const companyName = decodeURIComponent(params.company as string);
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchCompanyJobs = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/companies/${encodeURIComponent(companyName)}/jobs`);
        if (!response.ok) throw new Error('Failed to fetch company jobs');
        const data = await response.json();
        setJobs(data.jobs || []);
      } catch (err) {
        setError('Failed to load company jobs');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyJobs();
  }, [companyName, API_URL]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900">{companyName}</h1>
          <p className="text-gray-600 text-lg mt-2">
            {jobs.length} job {jobs.length === 1 ? 'opening' : 'openings'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <JobTable jobs={jobs} loading={loading} />
      </div>
    </main>
  );
}
