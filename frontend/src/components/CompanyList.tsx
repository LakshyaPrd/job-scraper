'use client';

import CompanyCard from './CompanyCard';
import { useRouter } from 'next/navigation';

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
  searchQuery?: string;
}

export default function CompanyList({ companies, loading, searchQuery = '' }: CompanyListProps) {
  const router = useRouter();

  // Filter companies based on search query
  const filteredCompanies = searchQuery
    ? companies.filter(company =>
        company.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : companies;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl p-6 shadow-sm">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredCompanies.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          {searchQuery ? 'No companies found' : 'No companies yet'}
        </h3>
        <p className="text-gray-500">
          {searchQuery ? `No companies match "${searchQuery}"` : 'Start by scraping some jobs!'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Found <span className="font-bold">{filteredCompanies.length}</span> companies hiring
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company, idx) => (
          <CompanyCard key={idx} company={company} />
        ))}
      </div>
    </div>
  );
}
