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
  const getCompanyInitials = (name: string) => {
    const words = name.split(' ').filter(word => word.length > 0);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <Link href={`/companies/${encodeURIComponent(company.company_name)}`}>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 overflow-hidden transform hover:scale-[1.01] cursor-pointer animate-fade-in">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start gap-4">
            {/* Company Avatar Circle (Orange like CV Scanner) */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-white font-bold text-xl">
                {getCompanyInitials(company.company_name)}
              </span>
            </div>
            
            {/* Company Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 mb-1 truncate hover:text-orange-600 transition-colors">
                {company.company_name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="font-semibold text-orange-600">{company.total_jobs} open positions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Latest Job Date */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Latest posting: {formatDate(company.latest_job_date)}</span>
          </div>

          {/* Job Titles */}
          {company.job_titles.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Open Roles:</p>
              <div className="flex flex-wrap gap-2">
                {company.job_titles.slice(0, 3).map((title, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm font-medium"
                  >
                    {title}
                  </span>
                ))}
                {company.job_titles.length > 3 && (
                  <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    +{company.job_titles.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Locations */}
          {company.locations.length > 0 && (
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex flex-wrap gap-1.5 text-sm text-gray-600">
                {company.locations.slice(0, 3).map((location, idx) => (
                  <span key={idx}>
                    {location}{idx < Math.min(company.locations.length, 3) - 1 ? ',' : ''}
                  </span>
                ))}
                {company.locations.length > 3 && (
                  <span className="text-gray-500">+{company.locations.length - 3} more</span>
                )}
              </div>
            </div>
          )}

          {/* View Jobs Button */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 text-orange-600 font-semibold text-sm hover:text-orange-700 transition-colors">
              View all positions
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
