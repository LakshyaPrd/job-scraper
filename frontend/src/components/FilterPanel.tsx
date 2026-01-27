'use client';

import { useState } from 'react';

interface FilterPanelProps {
  onApplyFilters: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  minSalary?: number;
  maxSalary?: number;
  jobTypes?: string[];
  locations?: string[];
  sources?: string[];
  remoteOnly?: boolean;
}

export default function FilterPanel({ onApplyFilters }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [minSalary, setMinSalary] = useState<number | undefined>();
  const [maxSalary, setMaxSalary] = useState<number | undefined>();
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [remoteOnly, setRemoteOnly] = useState(false);

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
  const sources = ['linkedin', 'indeed', 'glassdoor'];

  const toggleJobType = (type: string) => {
    setSelectedJobTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleSource = (source: string) => {
    setSelectedSources(prev =>
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  const handleApply = () => {
    onApplyFilters({
      minSalary,
      maxSalary,
      jobTypes: selectedJobTypes.length > 0 ? selectedJobTypes : undefined,
      sources: selectedSources.length > 0 ? selectedSources : undefined,
      remoteOnly,
    });
    setIsOpen(false);
  };

  const handleClear = () => {
    setMinSalary(undefined);
    setMaxSalary(undefined);
    setSelectedJobTypes([]);
    setSelectedSources([]);
    setRemoteOnly(false);
    onApplyFilters({});
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border-2 border-orange-100">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-sm font-semibold text-gray-700">🔍 Advanced Filters</h3>
        <span className="text-gray-500">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {/* Salary Range */}
          <div>
            <label className="text-sm font-medium text-orange-700 mb-2 block">💰 Salary Range</label>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Min ($)"
                  value={minSalary || ''}
                  onChange={(e) => setMinSalary(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="Max ($)"
                  value={maxSalary || ''}
                  onChange={(e) => setMaxSalary(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Job Types */}
          <div>
            <label className="text-sm font-medium text-orange-700 mb-2 block">💼 Job Type</label>
            <div className="flex flex-wrap gap-2">
              {jobTypes.map(type => (
                <label
                  key={type}
                  className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-all ${
                    selectedJobTypes.includes(type)
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-orange-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mr-1"
                    checked={selectedJobTypes.includes(type)}
                    onChange={() => toggleJobType(type)}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div>
            <label className="text-sm font-medium text-orange-700 mb-2 block">📍 Source</label>
            <div className="flex flex-wrap gap-2">
              {sources.map(source => (
                <label
                  key={source}
                  className={`px-3 py-1 rounded-full text-sm capitalize cursor-pointer transition-all ${
                    selectedSources.includes(source)
                      ? 'bg-orange-400 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-orange-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mr-1"
                    checked={selectedSources.includes(source)}
                    onChange={() => toggleSource(source)}
                  />
                  {source}
                </label>
              ))}
            </div>
          </div>

          {/* Remote Only */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-orange-700">🏠 Remote jobs only</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg font-medium hover:from-orange-700 hover:to-orange-800 transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium hover:bg-orange-200 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
