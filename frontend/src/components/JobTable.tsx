'use client';

import { useState } from 'react';
import JobDetailModal from './JobDetailModal';

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
  created_at?: string;
  search_category?: string;
}

interface JobTableProps {
  jobs: Job[];
  loading?: boolean;
}

export default function JobTable({ jobs, loading }: JobTableProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getSourceBadge = (source: string) => {
    const styles: Record<string, string> = {
      linkedin: 'bg-blue-100 text-blue-800 border-blue-200',
      indeed: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return styles[source] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (postedDate?: string, createdAt?: string) => {
    // Prefer posted_date (actual job posting date), fallback to created_at
    const dateStr = postedDate || createdAt;
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      // If we have posted_date, show actual date for older posts
      if (postedDate) {
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      // For created_at (when we scraped it)
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '-';
    }
  };

  const handleJobClick = (jobId: string) => {
    setSelectedJobId(jobId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJobId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm">
        <div className="text-gray-400 text-6xl mb-4">📭</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No jobs found</h3>
        <p className="text-gray-500">Search for a role to find job postings</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Added
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Salary
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {jobs.map((job, index) => (
                <tr 
                  key={job._id} 
                  className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <button
                        onClick={() => handleJobClick(job.job_id)}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-2 text-left underline decoration-transparent hover:decoration-blue-600 transition-all"
                      >
                        {job.title}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700 font-medium">{job.company}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <span className="text-gray-400">📍</span>
                      <span className="line-clamp-1">{job.location || 'Remote'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border ${getSourceBadge(job.source)}`}>
                      {job.source}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500" title={job.posted_date ? 'Posted date' : 'Added to system'}>
                      {formatDate(job.posted_date, job.created_at)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {job.salary || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleJobClick(job.job_id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      View Details
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer with count */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{jobs.length}</span> job{jobs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Job Detail Modal */}
      {selectedJobId && (
        <JobDetailModal 
          jobId={selectedJobId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
