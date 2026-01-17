'use client';

import JobCard from './JobCard';

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

interface JobListProps {
  jobs: Job[];
  loading?: boolean;
}

export default function JobList({ jobs, loading }: JobListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass rounded-2xl h-80 animate-pulse"></div>
        ))}
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {jobs.map((job) => (
        <JobCard key={job._id} job={job} />
      ))}
    </div>
  );
}
