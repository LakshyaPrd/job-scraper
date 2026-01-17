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
      <div className="flex flex-col justify-center items-center h-64 glass rounded-2xl">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 absolute top-0"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading jobs...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-20 glass rounded-2xl shadow-xl">
        <div className="text-gray-300 text-7xl mb-6">📭</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">No jobs found</h3>
        <p className="text-gray-600 text-lg">Try searching for a different role or adjust your filters</p>
      </div>
    );
  }

  return (
    <>
      <div className="glass rounded-2xl shadow-xl overflow-hidden border border-white/20 animate-fade-in">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Added
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Salary
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {jobs.map((job, index) => (
                <tr 
                  key={job._id} 
                  className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                >
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <a
                        href={`/jobs/${job.job_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 text-left underline decoration-transparent hover:decoration-blue-600 transition-all cursor-pointer"
                      >
                        {job.title}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-800 font-medium">{job.company}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 flex items-center gap-1.5">
                      <span className="text-gray-400">📍</span>
                      <span className="line-clamp-1">{job.location || 'Remote'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full border-2 ${getSourceBadge(job.source)}`}>
                      {job.source}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500 font-medium" title={job.posted_date ? 'Posted date' : 'Added to system'}>
                      {formatDate(job.posted_date, job.created_at)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 font-medium">
                      {job.salary || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <a
                      href={`/jobs/${job.job_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md transform hover:scale-105"
                    >
                      View Details
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer with count */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-200">
          <p className="text-sm text-gray-700 font-medium">
            Showing <span className="font-bold text-blue-600">{jobs.length}</span> job{jobs.length !== 1 ? 's' : ''}
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
