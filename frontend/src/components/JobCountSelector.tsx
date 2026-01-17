'use client';

interface JobCountSelectorProps {
  maxJobs: number;
  onChange: (count: number) => void;
}

export default function JobCountSelector({ maxJobs, onChange }: JobCountSelectorProps) {
  const options = [10, 20, 30, 40, 50]; // Reduced from [50, 100, 200, 500, 1000]

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="max-jobs" className="text-sm font-medium text-gray-700">
        🎯 Max Jobs:
      </label>
      <select
        id="max-jobs"
        value={maxJobs}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map(option => (
          <option key={option} value={option}>
            {option} jobs
          </option>
        ))}
      </select>
    </div>
  );
}
