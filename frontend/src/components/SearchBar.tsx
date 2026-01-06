'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (role: string, location: string) => void;
  isSearching: boolean;
}

export default function SearchBar({ onSearch, isSearching }: SearchBarProps) {
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role.trim()) {
      onSearch(role.trim(), location.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Job Role *
          </label>
          <input
            type="text"
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g., Software Engineer"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-neutral-900"
            required
          />
        </div>

        <div className="md:col-span-1">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location (Optional)
          </label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., New York"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-neutral-900"
          />
        </div>

        <div className="md:col-span-1 flex items-end">
          <button
            type="submit"
            disabled={isSearching || !role.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
          >
            {isSearching ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                Searching...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Jobs
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
