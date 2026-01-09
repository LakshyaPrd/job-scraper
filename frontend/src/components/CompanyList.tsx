'use client';

import CompanyCard from './CompanyCard';

interface Company {
  company_name: string;
  total_jobs: number;
  latest_job_date: string;
  job_titles: string[];
  locations: string[];
}

interface CompanyListProps {
  companies: Company[];
  loading: boolean;
}

export default function CompanyList({ companies, loading }: CompanyListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">No companies found</p>
        <p className="text-gray-400 text-sm mt-2">Try scraping some jobs first</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Found <span className="font-bold">{companies.length}</span> companies hiring
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company, idx) => (
          <CompanyCard key={idx} company={company} />
        ))}
      </div>
    </div>
  );
}
