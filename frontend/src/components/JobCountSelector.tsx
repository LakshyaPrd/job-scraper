'use client';

interface JobCountSelectorProps {
  maxJobs: number;
  onChange: (count: number) => void;
}

export default function JobCountSelector({ maxJobs, onChange }: JobCountSelectorProps) {
  const options = [10, 20, 30, 40, 50];

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="max-jobs" className="text-sm font-bold text-gray-800 flex items-center gap-2">
        <span>🔢</span>
        Max Jobs:
      </label>
      <select
        id="max-jobs"
        value={maxJobs}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white/70 backdrop-blur-sm text-sm font-bold text-gray-800 hover:bg-white hover:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm cursor-pointer"
      >
        {options.map(option => (
          <option key={option} value={option} className="font-semibold">
            {option} jobs
          </option>
        ))}
      </select>
    </div>
  );
}
