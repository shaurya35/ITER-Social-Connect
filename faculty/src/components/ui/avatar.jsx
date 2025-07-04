import React from "react";

export function Avatar({ children, className = "", ...props }) {
  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarImage({ src, alt = "", className = "", ...props }) {
  return (
    <img
      src={src}
      alt={alt}
      className={`aspect-square h-full w-full object-cover ${className}`}
      {...props}
    />
  );
}

export function AvatarFallback({ children, className = "", ...props }) {
  return (
    <span
      className={`flex h-full w-full items-center justify-center rounded-full bg-gray-300 text-white text-sm ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
