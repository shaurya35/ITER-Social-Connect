"use client";

import { useState } from "react";

export function MessageContent({ content, className = "" }) {
  const [showFullText, setShowFullText] = useState(false);

  // Function to detect and render links
  const renderMessageContent = (text) => {
    if (!text) return "";

    // URL regex pattern
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const phoneRegex = /(\+?[\d\s\-\(\)]{10,})/g;

    // Split text by URLs, emails, and phone numbers
    const parts = text.split(/(https?:\/\/[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\+?[\d\s\-\(\)]{10,})/g);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      } else if (emailRegex.test(part)) {
        return (
          <a
            key={index}
            href={`mailto:${part}`}
            className="text-blue-500 hover:text-blue-600 underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      } else if (phoneRegex.test(part)) {
        return (
          <a
            key={index}
            href={`tel:${part.replace(/\s/g, '')}`}
            className="text-blue-500 hover:text-blue-600 underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      } else {
        return part;
      }
    });
  };

  // Function to detect if text is too long
  const isLongText = content && content.length > 200;
  const displayText = isLongText && !showFullText ? content.substring(0, 200) + "..." : content;

  return (
    <div className={className}>
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {renderMessageContent(displayText)}
      </p>
      
      {isLongText && (
        <button
          onClick={() => setShowFullText(!showFullText)}
          className="text-xs text-blue-500 hover:text-blue-600 mt-1 underline"
        >
          {showFullText ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
