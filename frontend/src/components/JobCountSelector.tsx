'use client';

interface JobCountSelectorProps {
  maxJobs: number;
  onChange: (count: number) => void;
}

export default function JobCountSelector({ maxJobs, onChange }: JobCountSelectorProps) {
  const options = [10, 20, 30, 40, 50];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <label htmlFor="maxJobs" className="block text-sm font-semibold text-gray-700 mb-3">
        Maximum Jobs per Search
      </label>
      <div className="relative">
        <select
          id="maxJobs"
          value={maxJobs}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 font-medium cursor-pointer appearance-none pr-10"
        >
          {options.map(count => (
            <option key={count} value={count}>
              {count} jobs
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Higher counts may take longer to complete
      </p>
    </div>
  );
}
