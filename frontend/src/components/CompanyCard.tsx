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
      <div className="group glass rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-white/30 overflow-hidden transform hover:scale-105 animate-fade-in">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-2xl">
                  🏢
                </div>
                <h3 className="text-xl font-bold leading-tight">{company.company_name}</h3>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30">
              <p className="text-2xl font-bold">{company.total_jobs}</p>
              <p className="text-xs text-white/80 font-medium">open{company.total_jobs === 1 ? 'ing' : 'ings'}</p>
            </div>
          </div>
          
          {daysAgo !== null && (
            <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Latest: {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 bg-white/50 backdrop-blur-sm space-y-4">
          {/* Roles */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Roles</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {company.job_titles.slice(0, 3).map((title, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-lg text-xs font-semibold border border-purple-200">
                  {title.length > 30 ? title.substring(0, 30) + '...' : title}
                </span>
              ))}
              {company.job_titles.length > 3 && (
                <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-200">
                  +{company.job_titles.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Locations */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Locations</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {company.locations.slice(0, 2).map((loc, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-teal-100 text-green-800 rounded-lg text-xs font-semibold border border-green-200 flex items-center gap-1">
                  <span>📍</span>
                  {loc.length > 20 ? loc.substring(0, 20) + '...' : loc}
                </span>
              ))}
              {company.locations.length > 2 && (
                <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold border border-gray-200">
                  +{company.locations.length - 2} more
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-white/50 flex items-center justify-between">
          <div className="text-sm text-gray-600 font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Actively hiring
          </div>
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm group-hover:gap-3 transition-all">
            View all jobs
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
