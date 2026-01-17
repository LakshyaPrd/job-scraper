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
    <div className="glass rounded-2xl shadow-xl p-5 mb-6 border border-white/20">
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <span>👁️</span>
          View:
        </span>
        <div className="inline-flex bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-1.5 shadow-inner">
          <button
            onClick={() => handleViewChange('jobs')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all transform ${
              viewMode === 'jobs'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            📋 Job View
          </button>
          <button
            onClick={() => handleViewChange('companies')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all transform ${
              viewMode === 'companies'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            🏢 Company View
          </button>
        </div>
      </div>
    </div>
  );
}
