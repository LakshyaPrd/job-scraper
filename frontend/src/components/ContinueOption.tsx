'use client';

import { useEffect, useState } from 'react';

interface ContinueOptionProps {
  searchRole: string;
  searchLocation: string;
  continueFromLast: boolean;
  onChange: (value: boolean) => void;
  apiUrl: string;
}

interface SearchMetadata {
  search_key: string;
  last_offset: number;
  total_scraped: number;
  last_scrape_date?: string;
  platforms_used?: string[];
}

export default function ContinueOption({ 
  searchRole, 
  searchLocation, 
  continueFromLast, 
  onChange,
  apiUrl 
}: ContinueOptionProps) {
  const [metadata, setMetadata] = useState<SearchMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!searchRole) return;
      
      setLoading(true);
      const searchKey = `${searchRole}_${searchLocation}`.toLowerCase().replace(/ /g, '_');
      
      try {
        const response = await fetch(`${apiUrl}/api/search/metadata/${searchKey}`);
        if (response.ok) {
          const data = await response.json();
          if (data.total_scraped > 0) {
            setMetadata(data);
          } else {
            setMetadata(null);
          }
        }
      } catch (error) {
        console.error('Error fetching metadata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [searchRole, searchLocation, apiUrl]);

  if (loading || !metadata || metadata.total_scraped === 0) {
    return null;
  }

  const lastScrapeDate = metadata.last_scrape_date 
    ? new Date(metadata.last_scrape_date).toLocaleDateString()
    : 'Unknown';

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="continue-from-last"
          checked={continueFromLast}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <div className="flex-1">
          <label htmlFor="continue-from-last" className="text-sm font-medium text-blue-900 cursor-pointer">
            📍 Continue from last scrape
          </label>
          <p className="text-xs text-blue-700 mt-1">
            Last scrape: {metadata.total_scraped} jobs on {lastScrapeDate}<br />
            Next scrape will start from job #{metadata.last_offset + 1}
          </p>
        </div>
      </div>
    </div>
  );
}
