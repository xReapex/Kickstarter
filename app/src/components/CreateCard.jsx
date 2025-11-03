import { Plus } from "lucide-react";

export function CreateCard({ onOpen }) {
  return (
    <button
  onClick={onOpen}
  className="cursor-pointer relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-neutral-900 p-6 min-h-[360px] transition-colors"
>
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 mb-4">
        <Plus className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold">Create a kickstarter</h3>
      <p className="mt-1 text-sm text-indigo-700/80 dark:text-indigo-300/80 max-w-[24ch] text-center">
        Start your project in few clicks
      </p>
    </button>
  );
}