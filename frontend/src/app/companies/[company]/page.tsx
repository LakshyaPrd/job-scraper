'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import JobList from '@/components/JobList';
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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md text-gray-700 hover:text-blue-600 font-bold transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Companies
          </button>
          
          {/* Company Hero Card */}
          <div className="glass rounded-3xl shadow-2xl overflow-hidden border-2 border-white/30">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
              
              <div className="relative">
                <div className="flex items-start justify-between flex-wrap gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-4xl">
                        🏢
                      </div>
                      <div>
                        <h1 className="text-4xl md:text-5xl font-bold leading-tight">{companyName}</h1>
                        {companyInfo.industry && (
                          <p className="text-white/90 text-lg font-medium mt-1">
                            {companyInfo.industry} Industry
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-white/90">
                      <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-xl">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="font-bold text-xl">{allJobs.length}</span>
                        <span className="font-medium">Open Positions</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {companyWebsite && (
                      <a
                        href={companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl hover:bg-white/30 transition-all font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        Visit Website
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(companyName + ' company')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-white text-gray-800 rounded-xl hover:bg-gray-100 transition-all font-bold flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Google Search
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-8 bg-white/50 backdrop-blur-sm">
              {/* Company Description */}
              {companyInfo.description && (
                <div className="mb-6 p-6 glass rounded-2xl border border-white/20">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="text-2xl">📖</span>
                    About {companyName}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{companyInfo.description}</p>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="glass rounded-2xl p-6 border border-blue-200 relative overflow-hidden group hover:scale-105 transition-transform">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition"></div>
                  <div className="relative">
                    <div className="text-3xl mb-2">💼</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{allJobs.length}</div>
                    <div className="text-sm text-gray-600 font-semibold">Total Openings</div>
                  </div>
                </div>
                <div className="glass rounded-2xl p-6 border border-green-200 relative overflow-hidden group hover:scale-105 transition-transform">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition"></div>
                  <div className="relative">
                    <div className="text-3xl mb-2">📍</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">{companyInfo.locations.length}</div>
                    <div className="text-sm text-gray-600 font-semibold">Locations</div>
                  </div>
                </div>
                <div className="glass rounded-2xl p-6 border border-purple-200 relative overflow-hidden group hover:scale-105 transition-transform">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition"></div>
                  <div className="relative">
                    <div className="text-3xl mb-2">🔗</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">{new Set(allJobs.map(j => j.source)).size}</div>
                    <div className="text-sm text-gray-600 font-semibold">Sources</div>
                  </div>
                </div>
                <div className="glass rounded-2xl p-6 border border-orange-200 relative overflow-hidden group hover:scale-105 transition-transform">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200 rounded-full blur-2xl opacity-50 group-hover:opacity-70 transition"></div>
                  <div className="relative">
                    <div className="text-3xl mb-2">⏰</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">{companyInfo.jobTypes.length || 'Various'}</div>
                    <div className="text-sm text-gray-600 font-semibold">Job Types</div>
                  </div>
                </div>
              </div>

              {/* Key Locations */}
              {companyInfo.locations.length > 0 && (
                <div className="glass rounded-2xl p-6 border border-white/20">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-2xl">🌍</span>
                    Office Locations
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {companyInfo.locations.slice(0, 8).map((loc, idx) => (
                      <span key={idx} className="px-4 py-2 bg-gradient-to-r from-green-100 to-teal-100 text-green-800 rounded-xl text-sm font-bold border border-green-200 flex items-center gap-2">
                        <span>📍</span>
                        {loc}
                      </span>
                    ))}
                    {companyInfo.locations.length > 8 && (
                      <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold border border-gray-200">
                        +{companyInfo.locations.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
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

        {/* Jobs Grid */}
        <JobList jobs={filteredJobs} loading={loading} />
      </div>
    </main>
  );
}
