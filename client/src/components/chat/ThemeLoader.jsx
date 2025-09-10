"use client";

export function ThemeLoader({ size = "md", type = "spinner" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  if (type === "dots") {
    return (
      <div className="flex items-center space-x-1">
        <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-bounce`}></div>
        <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
        <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
      </div>
    );
  }

  if (type === "pulse") {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse`}></div>
    );
  }

  // Default spinner
  return (
    <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`}></div>
  );
}
