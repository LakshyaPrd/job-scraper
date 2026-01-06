'use client';

import { useState, useEffect } from 'react';

interface JobDetailModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface JobDetails {
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

export default function JobDetailModal({ jobId, isOpen, onClose }: JobDetailModalProps) {
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (!isOpen || !jobId) {
      setJob(null);
      setError('');
      return;
    }

    const fetchJobDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_URL}/api/jobs/detail/${jobId}`);
        if (!response.ok) throw new Error('Failed to fetch job details');
        const data = await response.json();
        setJob(data);
      } catch (err) {
        setError('Failed to load job details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [isOpen, jobId, API_URL]);

  if (!isOpen) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return 'Recently';
    }
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      linkedin: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      indeed: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
      arbeitnow: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    };
    return colors[source] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between sticky top-0 bg-white z-10">
          <div className="flex-1 pr-4">
            {loading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4"></div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{job?.title}</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-gray-700 font-semibold">🏢 {job?.company}</span>
                  <span className="text-gray-600">📍 {job?.location}</span>
                  {job?.source && (
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border ${getSourceColor(job.source).bg} ${getSourceColor(job.source).text} ${getSourceColor(job.source).border}`}>
                      {job.source.toUpperCase()}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-2 flex-shrink-0"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          ) : job ? (
            <div className="space-y-6">
              {/* Job Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                {job.salary && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Salary</p>
                      <p className="text-sm font-semibold text-gray-900">{job.salary}</p>
                    </div>
                  </div>
                )}
                {job.job_type && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⏰</span>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Job Type</p>
                      <p className="text-sm font-semibold text-gray-900">{job.job_type}</p>
                    </div>
                  </div>
                )}
                {job.posted_date && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Posted</p>
                      <p className="text-sm font-semibold text-gray-900">{formatDate(job.posted_date)}</p>
                    </div>
                  </div>
                )}
                {job.search_category && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏷️</span>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Category</p>
                      <p className="text-sm font-semibold text-gray-900">{job.search_category}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Job Description */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Job Description</h3>
                {job.description ? (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                      {job.description}
                    </pre>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No detailed description available.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="text-xs text-gray-500">
            {job?.last_verified && (
              <span>Last verified {formatDate(job.last_verified)}</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
            {job?.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center gap-2"
              >
                Apply on {job.source}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
