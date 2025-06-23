"use client";

import { useState } from "react";
import { Search, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NewConversationModal } from "./NewConversationModal";
import { useTheme } from "@/contexts/ThemeContext";

export function ChatSidebar({
  conversations,
  selectedConversation,
  onSelectConversation,
  currentUser,
  onNewConversation,
  onRefresh,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewConversationModal, setShowNewConversationModal] =
    useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { isDarkMode } = useTheme();

  const filteredConversations = (conversations || []).filter((conv) => {
    if (!conv || !conv.otherUser) return false;
    return conv.otherUser.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString();
  };

  const handleNewConversation = (conversation) => {
    onNewConversation(conversation);
    onSelectConversation(conversation);
  };

  const handleRefresh = async () => {
    if (refreshing || !onRefresh) return;

    setRefreshing(true);

    try {
      const success = await onRefresh();
    } catch (error) {
      console.error("❌ Sidebar refresh failed:", error);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 500);
    }
  };

  const handleConversationClick = (conversation) => {
    onSelectConversation(conversation);
  };

  return (
    <>
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Messages
            </h1>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh all conversations"
                className={`hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 ${
                  refreshing
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : ""
                }`}
              >
                <RotateCcw
                  className={`h-4 w-4 transition-transform duration-300 ${
                    refreshing
                      ? "animate-spin text-blue-600 dark:text-blue-400"
                      : ""
                  }`}
                />
              </Button>
              <Button
                size="sm"
                className="hidden bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                onClick={() => setShowNewConversationModal(true)}
                title="Start new conversation"
                disabled
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p>No conversations yet</p>
              <p className="text-sm mt-1">
                Click the + button to start a new conversation
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const otherUser = conversation.otherUser || {
                id: "unknown",
                name: "Unknown User",
                avatar: null,
                isOnline: false,
              };
              const isSelected = selectedConversation?.id === conversation.id;

              return (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation)}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        {otherUser.avatar && (
                          <AvatarImage
                            src={otherUser.avatar || "/placeholder.svg"}
                            alt={otherUser.name}
                            className="object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        )}
                        <AvatarFallback className="bg-blue-600 dark:bg-blue-500 text-white">
                          {otherUser.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {otherUser.isOnline && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {otherUser.name || "Unknown User"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(
                            conversation.lastMessage?.timestamp ||
                              conversation.updatedAt
                          )}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {conversation.lastMessage?.content ||
                            conversation.lastMessage?.text ||
                            "No messages yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onCreateConversation={handleNewConversation}
      />
    </>
  );
}
