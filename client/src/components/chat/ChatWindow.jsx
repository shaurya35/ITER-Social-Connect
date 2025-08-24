


"use client"

import { useState, useRef, useEffect } from "react"
import { Send, MoreVertical, Phone, Video, Settings, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import avatarCache from "@/utils/avatarCache"
import { useTheme } from "@/contexts/ThemeContext"
import { useWebSocket } from "@/contexts/WebSocketContext"
import { ChatInfoModal } from "./ChatInfoModal"

export function ChatWindow({
  conversation,
  messages,
  currentUser,
  onSendMessage,
  onRefreshMessages,
  isFirebase,
  userInfo,
}) {
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [avatarLoadStates, setAvatarLoadStates] = useState({})
  const [showChatInfo, setShowChatInfo] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const { isDarkMode } = useTheme()

  // ✅ WebSocket integration with all features
  const { isConnected, joinConversation, handleTyping, isUserOnline, getTypingUsers } = useWebSocket()

  // Join conversation room when conversation changes
  useEffect(() => {
    if (conversation?.id && isConnected) {
      joinConversation(conversation.id)
    }
  }, [conversation?.id, isConnected, joinConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-focus input when conversation is selected
  useEffect(() => {
    if (conversation && inputRef.current) {
      // Small delay to ensure the component is fully rendered
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [conversation])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "nearest",
    })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (newMessage.trim() && !sending) {
      setSending(true)
      try {
        await onSendMessage(newMessage.trim())
        setNewMessage("")
        // Focus back on input after sending
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      } catch (error) {
        alert(`Failed to send message: ${error.message || "Unknown error"}`)
      } finally {
        setSending(false)
      }
    }
  }

  const handleInputChange = (e) => {
    setNewMessage(e.target.value)

    // ✅ Send typing indicator
    if (conversation?.id && e.target.value.trim()) {
      handleTyping(conversation.id)
    }
  }

  const handleRefresh = async () => {
    if (refreshing || !onRefreshMessages) return

    setRefreshing(true)
    try {
      await onRefreshMessages()
    } catch (error) {
      console.error("Failed to refresh messages:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleAvatarLoad = (userId, context = "") => {
    setAvatarLoadStates((prev) => ({
      ...prev,
      [userId]: { loaded: true, error: false },
    }))
  }

  const handleAvatarError = (userId, context = "") => {
    setAvatarLoadStates((prev) => ({
      ...prev,
      [userId]: { loaded: false, error: true },
    }))
  }

  const getAvatarForUser = (userId, fallbackAvatar = null) => {
    const cachedAvatar = avatarCache.getAvatar(userId)
    if (cachedAvatar) {
      return cachedAvatar
    }

    if (fallbackAvatar) {
      avatarCache.setAvatar(userId, fallbackAvatar)
      return fallbackAvatar
    }

    return "/placeholder.svg"
  }

  const shouldGroupWithPrevious = (currentMessage, previousMessage) => {
    if (!previousMessage) return false

    const timeDiff = new Date(currentMessage.timestamp) - new Date(previousMessage.timestamp)
    const sameUser = String(currentMessage.senderId) === String(previousMessage.senderId)
    const withinTimeLimit = timeDiff < 2 * 60 * 1000

    return sameUser && withinTimeLimit
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Welcome to ITER Social Connect Chat
          </h3>
          <p className="text-gray-600 dark:text-gray-400">Select a conversation to start messaging</p>
          {/* WebSocket Status Indicator */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className="text-xs text-gray-500">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>
      </div>
    )
  }

  const otherUser = conversation.otherUser || {
    id: "unknown",
    name: "Unknown User",
    avatar: null,
    isOnline: false,
  }

  const headerLoadState = avatarLoadStates[otherUser.id] || {
    loaded: false,
    error: false,
  }

  // ✅ Get typing users for this conversation
  const typingUsers = getTypingUsers(conversation.id)
  const isOtherUserTyping = typingUsers.has(otherUser.id)

  // ✅ Check if other user is online
  const otherUserOnline = isUserOnline(otherUser.id)

  return (
    <>
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 h-full max-h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-4rem)]">
        {/* Chat Header */}
        <div className="flex-shrink-0 p-3 lg:p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 lg:space-x-3 min-w-0 flex-1">
              <div className="relative">
                <Avatar className="h-8 w-8 lg:h-10 lg:w-10 flex-shrink-0">
                  {otherUser.avatar ? (
                    <AvatarImage
                      src={getAvatarForUser(otherUser.id, otherUser.avatar) || "/placeholder.svg"}
                      alt={otherUser.name}
                      className="object-cover"
                      crossOrigin="anonymous"
                      onLoad={() => handleAvatarLoad(otherUser.id, "Chat header")}
                      onError={() => handleAvatarError(otherUser.id, "Chat header")}
                      style={{
                        display: headerLoadState.error ? "none" : "block",
                      }}
                    />
                  ) : null}
                  <AvatarFallback className="bg-blue-600 dark:bg-blue-500 text-white text-xs lg:text-sm">
                    {otherUser.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {/* ✅ Online Status Indicator */}
                {otherUserOnline && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {otherUser.name || "Unknown User"}
                </h2>
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                  {/* ✅ Show typing indicator or online status */}
                  {isOtherUserTyping ? "Typing..." : otherUserOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 lg:space-x-2 flex-shrink-0">
              {/* ✅ WebSocket Status */}
              {/* <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
                <span className="text-xs text-gray-600 dark:text-gray-400 hidden sm:inline">
                  {isConnected ? "Live" : "Offline"}
                </span>
              </div> */}
{/* 
              {!isFirebase && (
                <Button
                  variant="ghost"
                  size="sm"
                  title="Refresh Messages"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 hidden sm:flex"
                >
                  <RefreshCw
                    className={`h-4 w-4 text-gray-600 dark:text-gray-400 ${refreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              )} */}
              <Button
                variant="ghost"
                size="sm"
                title="Voice Call"
                className="hover:bg-gray-100 dark:hover:bg-gray-700 hidden sm:flex"
                disabled
              >
                <Phone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                title="Video Call"
                className="hover:bg-gray-100 dark:hover:bg-gray-700 hidden sm:flex"
                disabled
              >
                <Video className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
              {/* <Button
                variant="ghost"
                size="sm"
                title="Chat Settings"
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowChatInfo(true)}
              >
                <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button> */}
              <Button
                variant="ghost"
                size="sm"
                title="Chat Info"
                className="hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowChatInfo(true)}
              >
                <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </div>
          </div>

          {/* Status indicator */}
          {/* <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 hidden lg:block">
            <span>💬 Start your conversation with {otherUser.name}</span>
          </div> */}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 lg:p-4 bg-gray-50 dark:bg-gray-900 min-h-0">
          {!messages || messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm lg:text-base font-medium">Start your conversation</p>
              <p className="text-xs lg:text-sm mt-1">Send a message to {otherUser.name} to begin chatting</p>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((message, index) => {
                if (!message || !message.id) {
                  return null
                }

                const isMyMessage = String(message.senderId) === String(currentUser?.id)
                const previousMessage = index > 0 ? messages[index - 1] : null
                const nextMessage = index < messages.length - 1 ? messages[index + 1] : null

                const isGroupedWithPrevious = shouldGroupWithPrevious(message, previousMessage)
                const isGroupedWithNext = nextMessage ? shouldGroupWithPrevious(nextMessage, message) : false

                const marginTop = isGroupedWithPrevious ? "mt-0.5" : "mt-3"
                const marginBottom = isGroupedWithNext ? "mb-0.5" : "mb-2"

                return (
                  <div
                    key={message.id}
                    className={`flex w-full ${isMyMessage ? "justify-end" : "justify-start"} ${marginTop} ${marginBottom}`}
                  >
                    <div
                      className={`flex flex-col max-w-[85%] lg:max-w-[70%] ${isMyMessage ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`px-3 lg:px-4 py-2 max-w-full break-words transition-all duration-200 hover:shadow-md ${
                          isMyMessage
                            ? `bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white shadow-sm ${
                                isGroupedWithPrevious && isGroupedWithNext
                                  ? "rounded-lg"
                                  : isGroupedWithPrevious
                                    ? "rounded-t-lg rounded-bl-2xl rounded-br-lg"
                                    : isGroupedWithNext
                                      ? "rounded-b-lg rounded-tl-2xl rounded-tr-lg"
                                      : "rounded-2xl"
                              }`
                            : `bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-200 dark:border-gray-600 ${
                                isGroupedWithPrevious && isGroupedWithNext
                                  ? "rounded-lg"
                                  : isGroupedWithPrevious
                                    ? "rounded-t-lg rounded-br-2xl rounded-bl-lg"
                                    : isGroupedWithNext
                                      ? "rounded-b-lg rounded-tr-2xl rounded-tl-lg"
                                      : "rounded-2xl"
                              }`
                        }`}
                      >
                        <p className="text-sm lg:text-base leading-relaxed whitespace-pre-wrap">
                          {message.content || message.text || "No content"}
                        </p>
                      </div>

                      {!isGroupedWithNext && (
                        <p
                          className={`text-xs text-gray-500 dark:text-gray-400 mt-1 px-1 ${
                            isMyMessage ? "text-right" : "text-left"
                          }`}
                        >
                          {message.timestamp ? formatMessageTime(message.timestamp) : ""}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* ✅ Typing Indicator */}
              {isOtherUserTyping && (
                <div className="flex justify-start mt-2">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex-shrink-0 p-3 lg:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2 lg:space-x-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={handleInputChange}
                placeholder={`Message ${otherUser.name}...`}
                className="pr-12 rounded-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 text-sm lg:text-base"
                disabled={sending || !isConnected}
              />
            </div>
            <Button
              type="submit"
              disabled={!newMessage.trim() || sending || !isConnected}
              className="rounded-full w-9 h-9 lg:w-10 lg:h-10 p-0 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-3 w-3 lg:h-4 lg:w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-3 w-3 lg:h-4 lg:w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>

      <ChatInfoModal isOpen={showChatInfo} onClose={() => setShowChatInfo(false)} otherUser={otherUser} />
    </>
  )
}
