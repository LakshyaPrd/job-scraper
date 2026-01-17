'use client';

interface ViewToggleProps {
  viewMode: 'jobs' | 'companies';
  onViewChange: (mode: 'jobs' | 'companies') => void;
}

export default function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  const handleViewChange = (newView: 'jobs' | 'companies') => {
    onViewChange(newView);
    // Persist view mode to localStorage
    localStorage.setItem('viewMode', newView);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold text-gray-700">View:</span>
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleViewChange('jobs')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'jobs'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 Job View
          </button>
          <button
            onClick={() => handleViewChange('companies')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'companies'
                ? 'bg-white text-blue-600 shadow-sm'
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
