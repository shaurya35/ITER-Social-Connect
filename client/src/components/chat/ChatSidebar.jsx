"use client";

import { useState } from "react";
import { Search, MessageCircle, Users, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/contexts/ThemeContext";

export function ChatSidebar({
  conversations,
  selectedConversation,
  onSelectConversation,
  currentUser,
  onRefresh,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const { isDarkMode } = useTheme();

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = conv.otherUser || {};
    const name = otherUser.name || "";
    const email = otherUser.email || "";
    const query = searchQuery.toLowerCase();
    
    return (
      name.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query)
    );
  });

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Messages
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Mail className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-base"
            style={{ fontSize: '16px' }} // Prevents zoom on iOS
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {searchQuery ? "Try a different search term" : "Start a conversation with someone"}
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => {
              const otherUser = conversation.otherUser || {};
              const isSelected = selectedConversation?.id === conversation.id;
              const lastMessage = conversation.lastMessage;
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors active:bg-gray-100 dark:active:bg-gray-700 ${
                    isSelected
                      ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={otherUser.avatar || "https://res.cloudinary.com/dkjsi6iwm/image/upload/v1734123569/profile.jpg"} 
                          alt={otherUser.name}
                        />
                        <AvatarFallback className="bg-blue-600 text-white text-sm">
                          {otherUser.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {otherUser.name || "Unknown User"}
                        </h3>
                        {lastMessage && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                            {formatTime(lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      
                      {lastMessage ? (
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed break-words break-all">
                          {lastMessage.senderId === currentUser?.id ? "You: " : ""}
                          {lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No messages yet
                        </p>
                      )}
                      
                      {conversation.unreadCount > 0 && (
                        <div className="flex justify-end mt-1">
                          <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                            {conversation.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}