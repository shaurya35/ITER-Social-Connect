"use client";

import { useState } from "react";
import { MessageCircle, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConversationSkeleton } from "./ConversationSkeleton";

export function MobileChatNavigation({
  conversations,
  selectedConversation,
  onSelectConversation,
  currentUser,
  onRefresh,
  onCreateNew,
  loading = false,
}) {
  const [activeTab, setActiveTab] = useState("conversations");

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

  const renderConversations = () => (
    <div className="space-y-2 p-4">
      {conversations.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">No conversations yet</p>
          <p className="text-sm text-gray-400">Start a conversation with someone</p>
        </div>
      ) : (
        conversations.map((conversation) => {
          const otherUser = conversation.otherUser || {};
          const isSelected = selectedConversation?.id === conversation.id;
          const lastMessage = conversation.lastMessage;
          
          return (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={`p-3 rounded-xl cursor-pointer transition-colors active:scale-95 ${
                isSelected
                  ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
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
                  {otherUser.isOnline && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  )}
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
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate leading-relaxed">
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
        })
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {loading ? <ConversationSkeleton /> : renderConversations()}
    </div>
  );
}
