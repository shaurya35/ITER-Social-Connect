"use client"

import { useState } from "react"
import { MessageCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function MessageButton({ userId, userName, className = "" }) {
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()

  const handleMessageClick = () => {
    // Navigate to chat page with the user ID as a query parameter
    router.push(`/chat?userId=${userId}&userName=${encodeURIComponent(userName)}`)
  }

  return (
    <Button
      onClick={handleMessageClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group relative overflow-hidden
        bg-blue-600 hover:bg-blue-700 
        text-white border-0
        px-4 py-2 rounded-lg
        transition-all duration-200 ease-in-out
        shadow-md hover:shadow-lg
        transform hover:scale-105
        ${className}
      `}
      size="sm"
    >
      <div className="flex items-center gap-2">
        {isHovered ? (
          <Send className="h-4 w-4 transition-transform duration-200" />
        ) : (
          <MessageCircle className="h-4 w-4 transition-transform duration-200" />
        )}
        <span className="font-medium">Message</span>
      </div>

      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </Button>
  )
}
