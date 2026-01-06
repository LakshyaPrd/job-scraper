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
  last_verified?: string;
  created_at?: string;
}

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const isNew = () => {
    if (!job.created_at) return false;
    const created = new Date(job.created_at);
    const now = new Date();
    const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-300 relative overflow-hidden group">
      {/* New Badge */}
      {isNew() && (
        <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          NEW
        </div>
      )}

      {/* Source Badge */}
      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
        job.source === 'linkedin' 
          ? 'bg-blue-100 text-blue-700' 
          : 'bg-orange-100 text-orange-700'
      }`}>
        {job.source === 'linkedin' ? '🔗 LinkedIn' : '📋 Indeed'}
      </div>

      {/* Job Title */}
      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
        {job.title}
      </h3>

      {/* Company */}
      <p className="text-gray-700 font-semibold mb-1">🏢 {job.company}</p>

      {/* Location */}
      <p className="text-gray-600 text-sm mb-3">📍 {job.location}</p>

      {/* Job Details */}
      <div className="space-y-2 mb-4">
        {job.salary && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>💰</span>
            <span>{job.salary}</span>
          </div>
        )}
        {job.job_type && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>⏰</span>
            <span>{job.job_type}</span>
          </div>
        )}
      </div>

      {/* Posted Date */}
      <p className="text-xs text-gray-500 mb-4">
        Posted {formatDate(job.posted_date)}
      </p>

      {/* Apply Button */}
      <a
        href={job.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center font-semibold py-3 px-4 rounded-lg transition duration-200"
      >
        Apply Now →
      </a>

      {/* Verified Badge */}
      <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Verified {formatDate(job.last_verified)}
      </div>
    </div>
  );
}
