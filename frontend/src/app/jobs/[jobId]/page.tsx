'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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

interface ParsedSection {
  title: string;
  items: string[];
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  
  // Get company from URL query parameter (if navigated from company page)
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const companyFromUrl = searchParams?.get('company') || null;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`${API_URL}/api/jobs/detail/${jobId}`);
        if (!response.ok) throw new Error('Job not found');
        const data = await response.json();
        setJob(data);
      } catch (err) {
        setError('Failed to load job details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId, API_URL]);

  // Parse job description into sections
  const parseDescription = (description: string): ParsedSection[] => {
    const sections: ParsedSection[] = [];
    
    // Split by common section headers
    const sectionRegex = /(Job Responsibilities:|Responsibilities:|Requirements:|Qualifications:|Educational Qualification:|Experience:|Role Specific Qualifications & Training:|Beneficial \(A Plus\):|Behavioural Competencies:|Industries acceptable:|About the Role:|Key Responsibilities:|What You'll Do:|What We're Looking For:|Nice to Have:|Benefits:)/gi;
    
    const parts = description.split(sectionRegex);
    
    for (let i = 1; i < parts.length; i += 2) {
      const title = parts[i].replace(':', '').trim();
      const content = parts[i + 1]?.trim() || '';
      
      // Split content into bullet points
      const items = content
        .split(/\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0 && line.length < 500) // Filter out empty and overly long lines
        .map(line => line.replace(/^[-•*]\s*/, '')); // Remove existing bullets
      
      if (items.length > 0) {
        sections.push({ title, items });
      }
    }
    
    // If no sections found, create a general section
    if (sections.length === 0) {
      const items = description
        .split(/\n/)
        .map(line => line.trim())
        .filter(line => line.length > 10);
      
      if (items.length > 0) {
        sections.push({ title: 'About This Role', items });
      }
    }
    
    return sections;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 absolute top-0"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center glass rounded-2xl p-12 max-w-md shadow-2xl">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
          >
            ← Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const getSourceBadge = (source: string) => {
    const styles: Record<string, string> = {
      linkedin: 'bg-blue-500 text-white border-blue-600',
      indeed: 'bg-purple-500 text-white border-purple-600',
      jsearch: 'bg-green-500 text-white border-green-600',
    };
    return styles[source] || 'bg-gray-500 text-white border-gray-600';
  };

  const parsedSections = job.description ? parseDescription(job.description) : [];

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto max-w-5xl">
        {/* Back Button */}
        <button
          onClick={() => {
            // Check if there's history to go back to
            if (window.history.length > 1) {
              router.back();
            } else if (companyFromUrl) {
              // If opened in new tab from company page, go to company page
              router.push(`/companies/${encodeURIComponent(companyFromUrl)}`);
            } else {
              // Otherwise go to home
              router.push('/');
            }
          }}
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md text-gray-700 hover:text-blue-600 font-medium transition-all cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to {companyFromUrl || 'Jobs'}
        </button>

        {/* Job Header Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6 animate-fade-in">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 p-8 text-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[280px]">
                <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{job.title}</h1>
                <p className="text-xl text-white/95 font-semibold mb-4">{job.company}</p>
                <div className="flex flex-wrap items-center gap-4 text-white/90">
                  <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className="font-medium">{job.location || 'Remote'}</span>
                  </span>
                  {job.salary && (
                    <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{job.salary}</span>
                    </span>
                  )}
                  {job.job_type && (
                    <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{job.job_type}</span>
                    </span>
                  )}
                  {job.posted_date && (
                    <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">{new Date(job.posted_date).toLocaleDateString()}</span>
                    </span>
                  )}
                </div>
              </div>
              <span className={`inline-flex px-5 py-2.5 text-sm font-bold rounded-xl border-2 shadow-lg ${getSourceBadge(job.source)}`}>
                {job.source.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Job Description Sections */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 animate-fade-in">
          {parsedSections.length > 0 ? (
            <div className="space-y-8">
              {parsedSections.map((section, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    {section.title}
                  </h2>
                  <ul className="space-y-3">
                    {section.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-3 text-gray-700 leading-relaxed">
                        <span className="text-blue-500 mt-1.5 flex-shrink-0">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                        <span className="flex-1 text-base">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-lg italic">No detailed description available for this position.</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[250px] inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-2xl transform hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Apply on {job.source.charAt(0).toUpperCase() + job.source.slice(1)}
          </a>
          <button
            onClick={() => {
              // Check if there's history to go back to
              if (window.history.length > 1) {
                router.back();
              } else if (companyFromUrl) {
                // If opened in new tab from company page, go to company page
                router.push(`/companies/${encodeURIComponent(companyFromUrl)}`);
              } else {
                // Otherwise go to home
                router.push('/');
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 text-gray-700 font-bold text-lg rounded-xl hover:bg-gray-200 transition-all shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
