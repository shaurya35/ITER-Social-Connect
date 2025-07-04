"use client"

import { useState } from "react"
import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function MessageIconButton({ userId, userName, className = "" }) {
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
      variant="outline"
      size="sm"
      className={`
        group relative
        h-10 w-10 p-0 rounded-full
        border-2 border-blue-200 hover:border-blue-400
        bg-white hover:bg-blue-50
        text-blue-600 hover:text-blue-700
        transition-all duration-200 ease-in-out
        shadow-sm hover:shadow-md
        transform hover:scale-110
        ${className}
      `}
      title={`Send message to ${userName}`}
    >
      <MessageCircle className={`h-5 w-5 transition-transform duration-200 ${isHovered ? "scale-110" : "scale-100"}`} />

      {/* Ripple effect on hover */}
      <div className="absolute inset-0 rounded-full bg-blue-100 opacity-0 group-hover:opacity-30 transition-opacity duration-200" />
    </Button>
  )
}
