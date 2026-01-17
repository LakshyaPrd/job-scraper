'use client';

interface JobCardProps {
  job: {
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
  };
}

export default function JobCard({ job }: JobCardProps) {
  const getSourceGradient = (source: string) => {
    const gradients: Record<string, string> = {
      linkedin: 'from-blue-500 to-blue-600',
      indeed: 'from-purple-500 to-purple-600',
      jsearch: 'from-green-500 to-emerald-600',
    };
    return gradients[source] || 'from-gray-500 to-gray-600';
  };

  const formatDate = (postedDate?: string, createdAt?: string) => {
    const dateStr = postedDate || createdAt;
    if (!dateStr) return 'Recently';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="group glass rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-white/30 overflow-hidden transform hover:scale-[1.02] animate-fade-in">
      {/* Gradient Header */}
      <div className={`bg-gradient-to-r ${getSourceGradient(job.source)} p-6 text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <a
                href={`/jobs/${job.job_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xl font-bold leading-tight hover:underline block mb-2 line-clamp-2"
              >
                {job.title}
              </a>
              <div className="flex items-center gap-2 text-white/90">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="font-semibold">{job.company}</span>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/30 text-center">
              <p className="text-xs font-bold uppercase tracking-wide">{job.source}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 bg-white/50 backdrop-blur-sm">
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Location */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 rounded-lg border border-blue-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="text-xs font-bold">{job.location || 'Remote'}</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-lg border border-purple-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-bold">{formatDate(job.posted_date, job.created_at)}</span>
          </div>

          {/* Salary */}
          {job.salary && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-100 to-teal-100 text-green-800 rounded-lg border border-green-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-bold">{job.salary}</span>
            </div>
          )}

          {/* Job Type */}
          {job.job_type && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-800 rounded-lg border border-orange-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-bold">{job.job_type}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <a
            href={`/jobs/${job.job_id}?company=${encodeURIComponent(job.company)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Details
          </a>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Apply
          </a>
        </div>
      </div>
    </div>
  );
}
