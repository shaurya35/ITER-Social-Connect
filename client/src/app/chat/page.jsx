"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthProvider"
import { ChatLayout } from "@/components/chat/ChatLayout"

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [redirect, setRedirect] = useState(false)

  const targetUserId = searchParams.get("userId")
  const targetUserName = searchParams.get("userName")
  

  useEffect(() => {
    if (authLoading) return

    if (user && user.id) {
      setCurrentUser(user)
      setLoading(false)
    } else {
      fetchCurrentUser()
    }
  }, [authLoading, user])

  const fetchCurrentUser = async () => {
    try {
      const cookies = document.cookie

      if (!cookies) {
        setRedirect(true)
        return
      }

      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (res.ok) {
        const data = await res.json()
        if (!data?.id) {
          setRedirect(true)
          return
        }
        setCurrentUser(data)
      } else {
        setRedirect(true)
      }
    } catch (err) {
      setRedirect(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (redirect) {
      router.replace("/signin")
    }
  }, [redirect, router])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading chat...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null 
  }

  return (
    <div className="chat-page">
      <ChatLayout currentUser={currentUser} targetUserId={targetUserId} targetUserName={targetUserName} />
    </div>
  )
}
