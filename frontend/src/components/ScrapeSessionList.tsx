'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface ScrapeSession {
  session_id: string;
  search_query: string;
  search_location: string;
  platforms: string[];
  total_jobs: number;
  new_jobs: number;
  duplicate_jobs: number;
  scraped_at: string;
  status: string;
}

interface ScrapeSessionListProps {
  onSessionClick?: (sessionId: string) => void;
}

export default function ScrapeSessionList({ onSessionClick }: ScrapeSessionListProps) {
  const [sessions, setSessions] = useState<ScrapeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const API_URL = process. env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/scrape-sessions?limit=20`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      'linkedin': '💼',
      'jsearch': '🔍',
      'indeed': '🟢'
    };
    return icons[platform] || '📡';
  };

  const handleSessionClick = (sessionId: string) => {
    if (onSessionClick) {
      onSessionClick(sessionId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg p-4 shadow-sm">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-lg shadow-sm">
        <p className="text-gray-500">No scrape sessions yet</p>
        <p className="text-sm text-gray-400 mt-1">Start scraping to see your search history</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 Recent Searches</h3>
      
      {sessions.map((session) => (
        <div
          key={session.session_id}
          onClick={() => handleSessionClick(session.session_id)}
          className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-blue-200"
        >
          {/* Search Query */}
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-800 text-sm flex-1">
              🔍 {session.search_query}
              {session.search_location && (
                <span className="text-gray-500 font-normal ml-1">
                  in {session.search_location}
                </span>
              )}
            </h4>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
            <span className="flex items-center gap-1">
              📅 {formatDate(session.scraped_at)}
            </span>
            <span className="flex items-center gap-1">
              •
            </span>
            <span className="flex items-center gap-1">
              {session.platforms.map((p: string) => getPlatformIcon(p)).join(' ')}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">
              {session.total_jobs} jobs
            </span>
            {session.new_jobs > 0 && (
              <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md font-medium">
                {session.new_jobs} new
              </span>
            )}
            {session.duplicate_jobs > 0 && (
              <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-md">
                {session.duplicate_jobs} duplicates
              </span>
            )}
          </div>

          {/* Status */}
          {session.status === 'in_progress' && (
            <div className="mt-2 flex items-center gap-2 text-xs text-orange-600">
              <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-orange-600"></div>
              Scraping...
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
