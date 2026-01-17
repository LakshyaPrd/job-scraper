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
  const [companyInfo, setCompanyInfo] = useState({
    description: '',
    industry: '',
    locations: [] as string[],
    jobTypes: [] as string[]
  });

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
        
        // Fetch real company information from Google API
        try {
          const infoResponse = await fetch(`${API_URL}/api/companies/${encodeURIComponent(companyName)}/info`);
          if (infoResponse.ok) {
            const companyData = await infoResponse.json();
            
            const jobs = data.jobs || [];
            const locations = [...new Set(jobs.map((j: Job) => j.location).filter(Boolean))];
            const jobTypes = [...new Set(jobs.map((j: Job) => j.job_type).filter(Boolean))];
            
            // Detect industry
            const descriptions = jobs
              .map((j: Job) => j.description)
              .filter(Boolean)
              .join(' ');
            
            const industryKeywords: { [key: string]: string[] } = {
              'Technology': ['software', 'developer', 'engineer', 'tech', 'IT', 'data', 'cloud', 'AI'],
              'Construction': ['construction', 'engineering', 'BIM', 'architecture', 'building', 'civil'],
              'Healthcare': ['healthcare', 'medical', 'hospital', 'nurse', 'doctor', 'clinical'],
              'Finance': ['finance', 'banking', 'financial', 'accountant', 'investment'],
              'Education': ['education', 'teacher', 'training', 'learning', 'academic'],
              'Retail': ['retail', 'sales', 'store', 'customer service', 'merchandising'],
            };
            
            let detectedIndustry = 'General';
            for (const [industry, keywords] of Object.entries(industryKeywords)) {
              const matches = keywords.filter(keyword => 
                descriptions.toLowerCase().includes(keyword.toLowerCase())
              );
              if (matches.length > 2) {
                detectedIndustry = industry;
                break;
              }
            }
            
            // Generate fallback description if Google API didn't return one
            let finalDescription = companyData.description;
            if (!finalDescription || companyData.fallback) {
              // Create a more detailed auto-generated description
              const roleTypes = [...new Set(jobs.map((j: Job) => {
                const title = j.title.toLowerCase();
                if (title.includes('engineer')) return 'Engineering';
                if (title.includes('developer')) return 'Development';
                if (title.includes('manager')) return 'Management';
                if (title.includes('designer')) return 'Design';
                if (title.includes('analyst')) return 'Analysis';
                return 'Professional';
              }))];
              
              finalDescription = `${companyName} is actively hiring across ${jobs.length} position${jobs.length > 1 ? 's' : ''} in the ${detectedIndustry.toLowerCase()} sector. The company has opportunities in ${roleTypes.slice(0, 3).join(', ')} roles${roleTypes.length > 3 ? ' and more' : ''}, with openings across ${locations.length} location${locations.length > 1 ? 's' : ''} including ${locations.slice(0, 2).join(' and ')}.`;
            }
            
            // Set real website from Google or generate fallback
            if (companyData.website) {
              setCompanyWebsite(companyData.website);
            } else {
              const cleanedName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
              setCompanyWebsite(`https://www.${cleanedName}.com`);
            }
            
            setCompanyInfo({
              description: finalDescription,
              industry: detectedIndustry,
              locations: locations as string[],
              jobTypes: jobTypes as string[]
            });
          }
        } catch (infoError) {
          console.log('Could not fetch company info from Google, using fallback');
          // Full fallback: generate all info from job data
          const jobs = data.jobs || [];
          const locations = [...new Set(jobs.map((j: Job) => j.location).filter(Boolean))];
          const cleanedName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
          setCompanyWebsite(`https://www.${cleanedName}.com`);
          
          const fallbackDescription = `${companyName} is currently hiring for ${jobs.length} position${jobs.length > 1 ? 's' : ''}. View all available opportunities and apply directly.`;
          
          setCompanyInfo({
            description: fallbackDescription,
            industry: 'General',
            locations: locations as string[],
            jobTypes: []
          });
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
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{companyName}</h1>
                <p className="text-gray-600 text-lg mb-1">
                  {allJobs.length} job {allJobs.length === 1 ? 'opening' : 'openings'}
                </p>
                {companyInfo.industry && (
                  <p className="text-sm text-gray-500">
                    🏢 {companyInfo.industry} Industry
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
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
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(companyName + ' company')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center gap-2"
                >
                  🔍 Search about company on Google
                </a>
              </div>
            </div>

            {/* Company Description */}
            {companyInfo.description && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">About {companyName}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{companyInfo.description}</p>
              </div>
            )}

            {/* Company Info Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">Total Openings</div>
                <div className="text-2xl font-bold text-blue-900">{allJobs.length}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium">Locations</div>
                <div className="text-2xl font-bold text-green-900">
                  {companyInfo.locations.length}
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium">Sources</div>
                <div className="text-2xl font-bold text-purple-900">
                  {new Set(allJobs.map(j => j.source)).size}
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm text-orange-600 font-medium">Job Types</div>
                <div className="text-2xl font-bold text-orange-900">
                  {companyInfo.jobTypes.length || 'Various'}
                </div>
              </div>
            </div>

            {/* Key Locations */}
            {companyInfo.locations.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Office Locations</h3>
                <div className="flex flex-wrap gap-2">
                  {companyInfo.locations.slice(0, 5).map((loc, idx) => (
                    <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      📍 {loc}
                    </span>
                  ))}
                  {companyInfo.locations.length > 5 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      +{companyInfo.locations.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
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
          <div className="mb-4 text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
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
