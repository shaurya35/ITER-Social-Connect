"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { getAuthHeaders, getCurrentUser } from "../utils/auth";
import { formatConversationTime } from "../utils/timeFormat";
import { API_CONFIG } from "@/configs/api";

export function ConversationList({
  onConversationSelect,
  selectedConversationId,
}) {
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUser = getCurrentUser();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const headers = getAuthHeaders();

      // const response = await fetch("/api/chat/conversations", {
      //   headers,
      //   credentials: "include", // Include cookies
      // });

      // const response = await fetch(
      //   `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/conversations`,
      //   {
      //     headers,
      //     credentials: "include",
      //   }
      // );
      
      const response = await fetch(API_CONFIG.ENDPOINTS.CHAT.CONVERSATIONS, {
        headers,
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        setError(null);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error(
          "❌ Failed to fetch conversations:",
          response.status,
          errorData
        );
        setError(`Failed to load conversations (${response.status})`);
      }
    } catch (error) {
      console.error("❌ Error fetching conversations:", error);
      setError("Network error - please check your connection");
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4">
        <div className="text-center text-red-500">
          <p className="mb-2">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchConversations();
            }}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No conversations yet</p>
            <p className="text-sm mt-1">Start a new conversation</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onConversationSelect(conversation)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConversationId === conversation.id
                  ? "bg-blue-50 border-blue-200"
                  : ""
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={conversation.otherUser?.avatar || "https://res.cloudinary.com/dkjsi6iwm/image/upload/v1734123569/profile.jpg"}
                    />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {conversation.otherUser?.name?.charAt(0)?.toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.otherUser?.isOnline && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conversation.otherUser?.name || "Unknown User"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {conversation.lastMessage?.timestamp
                        ? formatConversationTime(
                            conversation.lastMessage.timestamp
                          )
                        : ""}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage?.senderId === currentUser?.id
                        ? "You: "
                        : ""}
                      {conversation.lastMessage?.text || "No messages yet"}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <Badge className="bg-blue-600 text-white text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
