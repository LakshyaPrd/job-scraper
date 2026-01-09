'use client';

import { useState } from 'react';

interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onChange: (platforms: string[]) => void;
}

export default function PlatformSelector({ selectedPlatforms, onChange }: PlatformSelectorProps) {
  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-100 text-blue-800' },
    { id: 'jsearch', name: 'Indeed + Glassdoor', color: 'bg-purple-100 text-purple-800' },
    { id: 'indeed', name: 'Indeed (Selenium)', color: 'bg-green-100 text-green-800' }
  ];

  const togglePlatform = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      onChange(selectedPlatforms.filter(p => p !== platformId));
    } else {
      onChange([...selectedPlatforms, platformId]);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">📡 Select Platforms to Scrape</h3>
      <div className="flex flex-wrap gap-2">
        {platforms.map(platform => (
          <label
            key={platform.id}
            className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-all ${
              selectedPlatforms.includes(platform.id)
                ? platform.color + ' shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <input
              type="checkbox"
              className="mr-2"
              checked={selectedPlatforms.includes(platform.id)}
              onChange={() => togglePlatform(platform.id)}
            />
            {platform.name}
          </label>
        ))}
      </div>
      {selectedPlatforms.length === 0 && (
        <p className="text-sm text-red-500 mt-2">⚠️ Select at least one platform</p>
      )}
    </div>
  );
}
