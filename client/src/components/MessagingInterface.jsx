"use client"

import { useState, useEffect } from "react"
import { UserList } from "./UserList"
import { ConversationList } from "./ConversationList"
import { ChatInterface } from "./ChatInterface"
import { Button } from "@/components/ui/button"
import { Users, MessageCircle } from "lucide-react"
import { getCurrentUser } from "../utils/auth"

export function MessagingInterface() {
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [activeTab, setActiveTab] = useState("conversations") // 'conversations' or 'users'
  const [currentUser, setCurrentUser] = useState(null)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    // Get current user info
    const user = getCurrentUser()

    if (user) {
      setCurrentUser(user)
      setAuthError(null)
    } else {
      setAuthError("Authentication required. Please make sure you're logged in.")
    }
  }, [])

  // Clear selections when switching tabs
  useEffect(() => {
    setSelectedUser(null)
    setSelectedConversation(null)
  }, [activeTab])

  const handleUserSelect = (user) => {
    setSelectedUser(user)
    setSelectedConversation(null)
  }

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation)
    setSelectedUser(null)
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">{authError}</p>
          <div className="text-sm text-gray-500">
            <p>Make sure you have a valid JWT token in your cookies:</p>
            <ul className="mt-2 text-left">
              <li>• refreshToken</li>
              <li>• accessToken</li>
              <li>• token</li>
              <li>• authToken</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Tab Navigation */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex space-x-2">
            <Button
              variant={activeTab === "conversations" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("conversations")}
              className="flex-1"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chats
            </Button>
            <Button
              variant={activeTab === "users" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("users")}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "conversations" ? (
            <ConversationList
              onConversationSelect={handleConversationSelect}
              selectedConversationId={selectedConversation?.id}
            />
          ) : (
            <UserList onUserSelect={handleUserSelect} selectedUserId={selectedUser?.id} />
          )}
        </div>
      </div>

      {/* Chat Interface */}
      <ChatInterface selectedUser={selectedUser} selectedConversation={selectedConversation} />
    </div>
  )
}
