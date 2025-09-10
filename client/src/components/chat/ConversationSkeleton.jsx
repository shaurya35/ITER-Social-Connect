"use client";

export function ConversationSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-pulse"
        >
          <div className="flex items-center space-x-3">
            {/* Avatar skeleton */}
            <div className="relative flex-shrink-0">
              <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Name skeleton */}
              <div className="flex items-center justify-between mb-1">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-8"></div>
              </div>
              
              {/* Message skeleton */}
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-1"></div>
              
              {/* Unread count skeleton */}
              <div className="flex justify-end">
                <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
