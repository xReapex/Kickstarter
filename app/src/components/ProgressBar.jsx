export function ProgressBar({ value }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500"
        style={{ width: `${clamped}%` }}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        role="progressbar"
      />
    </div>
  );
}