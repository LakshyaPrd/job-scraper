'use client';

import Link from 'next/link';

interface CompanyCardProps {
  company: {
    company_name: string;
    total_jobs: number;
    latest_job_date: string;
    job_titles: string[];
    locations: string[];
  };
}

export default function CompanyCard({ company }: CompanyCardProps) {
  const daysAgo = company.latest_job_date 
    ? Math.floor((Date.now() - new Date(company.latest_job_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Link href={`/companies/${encodeURIComponent(company.company_name)}`}>
      <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{company.company_name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {company.total_jobs} {company.total_jobs === 1 ? 'opening' : 'openings'}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              🏢 {company.total_jobs}
            </span>
            {daysAgo !== null && (
              <span className="text-xs text-gray-500 mt-2">
                {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Roles:</p>
            <div className="flex flex-wrap gap-1">
              {company.job_titles.slice(0, 3).map((title, idx) => (
                <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                  {title.length > 30 ? title.substring(0, 30) + '...' : title}
                </span>
              ))}
              {company.job_titles.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  +{company.job_titles.length - 3} more
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">Locations:</p>
            <div className="flex flex-wrap gap-1">
              {company.locations.slice(0, 2).map((loc, idx) => (
                <span key={idx} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                  📍 {loc.length > 20 ? loc.substring(0, 20) + '...' : loc}
                </span>
              ))}
              {company.locations.length > 2 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  +{company.locations.length - 2} more
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Click to view all jobs →
          </div>
        </div>
      </div>
    </Link>
  );
}
