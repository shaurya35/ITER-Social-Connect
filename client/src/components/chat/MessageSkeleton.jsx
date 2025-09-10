"use client";

export function MessageSkeleton() {
  return (
    <div className="space-y-1 p-3 lg:p-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex w-full justify-start">
          <div className="flex flex-col max-w-[85%] lg:max-w-[70%]">
            <div className="px-4 py-2 bg-white dark:bg-gray-700 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-600 animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-1"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
            </div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-12 mt-1"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
