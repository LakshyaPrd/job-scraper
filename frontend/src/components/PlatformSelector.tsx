'use client';

import { useState } from 'react';

interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onChange: (platforms: string[]) => void;
}

export default function PlatformSelector({ selectedPlatforms, onChange }: PlatformSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const platforms = [
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      gradient: 'from-blue-500 to-blue-600',
      icon: '💼'
    },
    { 
      id: 'jsearch', 
      name: 'Indeed + Glassdoor', 
      gradient: 'from-purple-500 to-pink-500',
      icon: '🔍'
    }
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

  return (
    <div className="glass rounded-2xl shadow-xl p-5 mb-6 border border-white/20 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <span className="text-lg">🎯</span>
          Platforms to Scrape
        </h3>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:shadow-md transform hover:scale-105"
          >
            Select All
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-1.5 text-xs font-bold bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all shadow-sm hover:shadow-md"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Dropdown Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3.5 bg-white/70 backdrop-blur-sm border-2 border-gray-200 rounded-xl text-left flex items-center justify-between hover:bg-white/90 hover:border-blue-300 transition-all shadow-sm"
        >
          <span className="text-sm text-gray-700 font-medium">
            {selectedPlatforms.length === 0 ? (
              <span className="text-gray-400">Select platforms...</span>
            ) : (
              <span className="font-bold text-gray-900">
                {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''} selected
              </span>
            )}
          </span>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-2 glass border-2 border-white/30 rounded-xl shadow-2xl overflow-hidden animate-slide-in-right">
            {platforms.map(platform => {
              const isSelected = selectedPlatforms.includes(platform.id);
              return (
                <label
                  key={platform.id}
                  className={`flex items-center px-4 py-3.5 cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-gradient-to-r ' + platform.gradient + ' text-white' 
                      : 'hover:bg-white/50 backdrop-blur'
                  }`}
                >
                  <div className="flex items-center flex-1">
                    <span className="text-2xl mr-3">{platform.icon}</span>
                    <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                      {platform.name}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => togglePlatform(platform.id)}
                    className="w-5 h-5 rounded border-2 focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Pills */}
      {selectedPlatforms.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedPlatforms.map(platformId => {
            const platform = platforms.find(p => p.id === platformId);
            return platform ? (
              <span
                key={platformId}
                className={`px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r ${platform.gradient} text-white flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 animate-fade-in`}
              >
                <span>{platform.icon}</span>
                {platform.name}
                <button
                  onClick={() => togglePlatform(platformId)}
                  className="ml-1 hover:bg-white/20 rounded-full p-1 transition-colors"
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
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <span className="text-red-500 text-lg">⚠️</span>
          <p className="text-sm text-red-700 font-medium">Select at least one platform</p>
        </div>
      )}
    </div>
  );
}
