"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Phone, Video, Info, MoreVertical } from "lucide-react"
import { getAuthHeaders, getCurrentUser } from "../utils/auth"
import { formatMessageTime } from "../utils/timeFormat"
import { useAuth } from "@/contexts/AuthProvider";
import axios from "axios";

export function ChatInterface({ selectedUser, selectedConversation }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const currentUser = getCurrentUser()
    const { accessToken } = useAuth();


  // Determine receiverId from either selectedUser or selectedConversation
  const receiverId = selectedUser?.id || selectedConversation?.otherUser?.id
  const otherUser = selectedUser || selectedConversation?.otherUser

 

  useEffect(() => {
    if (receiverId) {
      fetchMessages()
    } else {
      setMessages([]) // Clear messages when no conversation selected
    }
  }, [receiverId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchMessages = async () => {
    if (!receiverId) return

    setLoading(true)
    try {
      // const response = await fetch(`/api/chat/messages?receiverId=${receiverId}`, {
      //   headers: getAuthHeaders(),
      //   credentials: "include",
      // })

      const response = await axios.get(`/api/chat/messages?receiverId=${receiverId}`, {
        withCredentials: true,
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : { "Content-Type": "application/json" },
      });


        const data = response.data
        console.log("chat interface ",data)
        setMessages(data)
      
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !receiverId || sending) return

    setSending(true)
    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          receiverId,
          text: newMessage.trim(),
        }),
      })

      if (response.ok) {
        const sentMessage = await response.json()
        setMessages((prev) => [...prev, sentMessage])
        setNewMessage("")

        // Refresh messages to get the latest state
        setTimeout(fetchMessages, 100)
      } else {
        console.error("Failed to send message:", response.status)
      }
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  if (!otherUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
          <p className="text-gray-600">Choose a user or conversation to start messaging</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser.avatar || "https://res.cloudinary.com/dkjsi6iwm/image/upload/v1734123569/profile.jpg"} />
              <AvatarFallback className="bg-blue-600 text-white">
                {otherUser.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{otherUser.name || "Unknown User"}</h2>
              <p className="text-sm text-gray-600">{otherUser.isOnline ? "Online" : "Offline"}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" title="Voice Call">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" title="Video Call">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" title="Chat Info">
              <Info className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" title="More Options">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMyMessage = message.senderId === currentUser?.id

           

            return (
              <div key={message.id} className={`flex w-full mb-4 ${isMyMessage ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-end max-w-xs lg:max-w-md ${isMyMessage ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar for received messages */}
                  {!isMyMessage && (
                    <Avatar className="h-8 w-8 flex-shrink-0 mr-2">
                      <AvatarImage src={otherUser.avatar || "https://res.cloudinary.com/dkjsi6iwm/image/upload/v1734123569/profile.jpg"} />
                      <AvatarFallback className="bg-gray-400 text-white text-xs">
                        {otherUser.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`px-4 py-2 rounded-2xl max-w-full ${
                      isMyMessage
                        ? "bg-blue-600 text-white rounded-br-md shadow-md"
                        : "bg-gray-100 text-gray-900 rounded-bl-md shadow-sm"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-xs ${isMyMessage ? "text-blue-100" : "text-gray-500"}`}>
                        {formatMessageTime(message.timestamp)}
                      </p>
                      {/* Delivery status for sent messages */}
                      {isMyMessage && (
                        <span className={`text-xs ml-2 ${message.seen ? "text-blue-200" : "text-blue-300"}`}>
                          {message.seen ? "✓✓" : "✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={sendMessage} className="flex items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
