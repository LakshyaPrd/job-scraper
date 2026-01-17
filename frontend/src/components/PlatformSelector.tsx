'use client';

import { useState } from 'react';

interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onChange: (platforms: string[]) => void;
}

export default function PlatformSelector({ selectedPlatforms, onChange }: PlatformSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-100 text-blue-800' },
    { id: 'jsearch', name: 'Indeed + Glassdoor', color: 'bg-purple-100 text-purple-800' }
  ];

  const togglePlatform = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      onChange(selectedPlatforms.filter(p => p !== platformId));
    } else {
      onChange([...selectedPlatforms, platformId]);
    }
  };

  const selectAll = () => {
    onChange(platforms.map(p => p.id));
  };

  const deselectAll = () => {
    onChange([]);
  };

  const allSelected = selectedPlatforms.length === platforms.length;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">📡 Select Platforms to Scrape</h3>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Dropdown Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <span className="text-sm text-gray-700">
            {selectedPlatforms.length === 0 ? (
              <span className="text-gray-400">Select platforms...</span>
            ) : (
              <span className="font-medium">
                {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''} selected
              </span>
            )}
          </span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg">
            {platforms.map(platform => {
              const isSelected = selectedPlatforms.includes(platform.id);
              return (
                <label
                  key={platform.id}
                  className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePlatform(platform.id)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className={`ml-3 text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                    {platform.name}
                  </span>
                  {isSelected && (
                    <svg className="w-5 h-5 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Pills */}
      {selectedPlatforms.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedPlatforms.map(platformId => {
            const platform = platforms.find(p => p.id === platformId);
            return platform ? (
              <span
                key={platformId}
                className={`px-3 py-1 rounded-full text-sm font-medium ${platform.color} flex items-center gap-2`}
              >
                {platform.name}
                <button
                  onClick={() => togglePlatform(platformId)}
                  className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ) : null;
          })}
        </div>
      )}

      {selectedPlatforms.length === 0 && (
        <p className="text-sm text-red-500 mt-2">⚠️ Select at least one platform</p>
      )}
    </div>
  );
}
