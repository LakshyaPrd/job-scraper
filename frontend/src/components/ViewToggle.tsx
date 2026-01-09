'use client';

interface ViewToggleProps {
  viewMode: 'jobs' | 'companies';
  onChange: (mode: 'jobs' | 'companies') => void;
}

export default function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-gray-700">View:</span>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onChange('jobs')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'jobs'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 Job View
          </button>
          <button
            onClick={() => onChange('companies')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'companies'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🏢 Company View
          </button>
        </div>
      </div>
    </div>
  );
}
