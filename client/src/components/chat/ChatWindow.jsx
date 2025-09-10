"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle,  Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/contexts/ThemeContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { MessageContent } from "./MessageContent";
import { MessageSkeleton } from "./MessageSkeleton";
import { ThemeLoader } from "./ThemeLoader";

export function ChatWindow({
  conversation,
  messages,
  currentUser,
  onSendMessage,
  onBack,
  loading = false,
}) {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { isDarkMode } = useTheme();
  const { getTypingUsers } = useWebSocket();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus input when conversation is selected
  useEffect(() => {
    if (conversation && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [conversation]);

  // Check for typing users
  useEffect(() => {
    if (conversation?.id) {
      const typingUsers = getTypingUsers(conversation.id);
      setOtherUserTyping(typingUsers.size > 0);
    }
  }, [conversation?.id, getTypingUsers]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && !sending) {
      setSending(true);
      try {
        await onSendMessage(newMessage.trim());
        setNewMessage("");
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      } catch (error) {
        console.error("Failed to send message:", error);
        alert(`Failed to send message: ${error.message || "Unknown error"}`);
      } finally {
        setSending(false);
      }
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // If message is from today, show time only
    if (diff < 86400000 && date.getDate() === now.getDate()) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    
    // If message is from yesterday, show "Yesterday"
    if (diff < 172800000 && date.getDate() === now.getDate() - 1) {
      return "Yesterday";
    }
    
    // If message is older, show date
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  const shouldGroupWithPrevious = (currentMessage, previousMessage) => {
    if (!previousMessage) return false;

    const timeDiff = new Date(currentMessage.timestamp) - new Date(previousMessage.timestamp);
    const sameUser = String(currentMessage.senderId) === String(previousMessage.senderId);
    const withinTimeLimit = timeDiff < 2 * 60 * 1000; // 2 minutes

    return sameUser && withinTimeLimit;
  };

  if (!conversation) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 p-8">
        <div className="text-center max-w-md">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Mail className="h-16 w-16 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Welcome to ITER Social Connect
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
            Start conversations with your peers and stay connected
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Ready to chat?
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Select a conversation from the sidebar to start messaging
            </p>
          </div>
        </div>
      </div>
    );
  }

  const otherUser = conversation.otherUser || {
    id: "unknown",
    name: "Unknown User",
    avatar: null,
    isOnline: false,
  };

  return (
    <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 h-full max-h-full overflow-hidden">
      {/* Desktop Chat Header - Hidden on mobile */}
      <div className="hidden lg:flex flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="relative">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage
                  src={otherUser.avatar || "https://res.cloudinary.com/dkjsi6iwm/image/upload/v1734123569/profile.jpg"}
                  alt={otherUser.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-blue-600 dark:bg-blue-500 text-white text-sm">
                  {otherUser.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {otherUser.name || "Unknown User"}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-4 mb-14 bg-gray-50 dark:bg-gray-900 min-h-0 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8 px-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium">Start your conversation</p>
            <p className="text-xs mt-1">Send a message to {otherUser.name} to begin chatting</p>
          </div>
        ) : loading ? (
          <MessageSkeleton />
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => {
              if (!message || !message.id) return null;

              const isMyMessage = String(message.senderId) === String(currentUser?.id);
              const previousMessage = index > 0 ? messages[index - 1] : null;
              const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

              const isGroupedWithPrevious = shouldGroupWithPrevious(message, previousMessage);
              const isGroupedWithNext = nextMessage ? shouldGroupWithPrevious(nextMessage, message) : false;

              const marginTop = isGroupedWithPrevious ? "mt-0.5" : "mt-3";
              const marginBottom = isGroupedWithNext ? "mb-0.5" : "mb-2";

              return (
                <div
                  key={message.id}
                  className={`flex w-full ${isMyMessage ? "justify-end" : "justify-start"} ${marginTop} ${marginBottom}`}
                >
                  <div
                    className={`flex flex-col max-w-[85%] lg:max-w-[70%] ${isMyMessage ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`px-4 py-2 max-w-full break-words break-all transition-all duration-200 hover:shadow-md ${
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
                    <p className="whitespace-pre-wrap break-all">
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
              );
            })}
          </div>
        )}
        
        {/* Typing Indicator - Only show when other user is typing */}
        {otherUserTyping && (
          <div className="flex items-center space-x-2 p-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-xs text-gray-500">{conversation?.otherUser?.name || 'Someone'} is typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - sticky to bottom */}
      <div className="sticky bottom-16 md:bottom-14 flex-shrink-0 p-3 lg:p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2 lg:space-x-3">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={handleInputChange}
              placeholder={`Message ${otherUser.name}...`}
              className="pr-12 rounded-2xl border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 min-h-[44px] text-base"
              disabled={sending}
              style={{ fontSize: '16px' }} // Prevents zoom on iOS
            />
          </div>
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="rounded-full w-11 h-11 lg:w-10 lg:h-10 p-0 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 flex-shrink-0"
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
  );
}