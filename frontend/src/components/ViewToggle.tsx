'use client';

interface ViewToggleProps {
  viewMode: 'jobs' | 'companies';
  onViewChange: (mode: 'jobs' | 'companies') => void;
}

export default function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 inline-flex gap-1">
      <button
        onClick={() => onViewChange('jobs')}
        className={`px-6 py-2.5 rounded-md font-semibold transition-all ${
          viewMode === 'jobs'
            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Jobs
        </div>
      </button>
      <button
        onClick={() => onViewChange('companies')}
        className={`px-6 py-2.5 rounded-md font-semibold transition-all ${
          viewMode === 'companies'
            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Companies
        </div>
      </button>
    </div>
  );
}
