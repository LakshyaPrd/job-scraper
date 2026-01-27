'use client';

interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onPlatformsChange: (platforms: string[]) => void;
}

export default function PlatformSelector({ selectedPlatforms, onPlatformsChange }: PlatformSelectorProps) {
  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { id: 'jsearch', name: 'Indeed/Glassdoor', icon: '🔍' },
  ];

  const togglePlatform = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      onPlatformsChange(selectedPlatforms.filter(p => p !== platformId));
    } else {
      onPlatformsChange([...selectedPlatforms, platformId]);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Platforms</h3>
      <div className="space-y-2">
        {platforms.map(platform => (
          <label
            key={platform.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <input
              type="checkbox"
              checked={selectedPlatforms.includes(platform.id)}
              onChange={() => togglePlatform(platform.id)}
              className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
            />
            <span className="text-2xl">{platform.icon}</span>
            <span className="font-medium text-gray-900">{platform.name}</span>
          </label>
        ))}
      </div>
      {selectedPlatforms.length === 0 && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          ⚠️ Please select at least one platform
        </p>
      )}
    </div>
  );
}
