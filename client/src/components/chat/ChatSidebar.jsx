"use client";

import { useState, useMemo } from "react";
import { Search, Smartphone, Wifi, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NewConversationModal } from "./NewConversationModal";
import { useTheme } from "@/contexts/ThemeContext";
import { useWebSocket } from "@/contexts/WebSocketContext";

import { useAuth } from "@/contexts/AuthProvider";
import axios from "axios";

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
  const { isConnected, isUserOnline } = useWebSocket();
    const { accessToken } = useAuth();


  // Create unique conversations with proper keys
  // const processedConversations = useMemo(() => {
  //   if (!conversations || !Array.isArray(conversations)) return [];
  //   console.log("conversations : ",conversations)

  //   return conversations.map((conv, index) => {
  //     // Create a truly unique key using multiple fallbacks
  //     const uniqueId =
  //       // conv.id ||
  //       conv.id
  //       // || `${conv.otherUser?.id || "unknown"}_${index}` ||
  //       // `conversation_${index}_${Date.now()}`;

  //     return {
  //       ...conv,
  //       uniqueKey: `conv_${uniqueId}_${index}`, // Ensure absolute uniqueness
  //       otherUser: conv.user || {
  //         id: `user_${index}`,
  //         name: "Unknown User",
  //         avatar: null,
  //         isOnline: false,
  //       },
  //     };
  //   });
  // }, [conversations]);

  // Helper: convert proto-style timestamp or ISO to ms
  const toMillis = (ts) => {
    if (!ts) return 0;
    // { seconds: number, nanoseconds: number }
    if (typeof ts === "object" && ts.seconds != null) {
      return ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6);
    }
    // ISO string or date
    const parsed = Date.parse(ts);
    if (!isNaN(parsed)) return parsed;
    return 0;
  };

  const processedConversations = useMemo(() => {
    if (!conversations || !Array.isArray(conversations)) return [];

    const currentUserId = currentUser?.id || currentUser?._id || null;
    const map = new Map(); // key -> normalized conversation (we'll keep the newest)

    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i];

      // Determine a canonical chat key:
      // Prefer conv.chatId (server thread id). If not present, use other participant id.
      const chatKey = conv.chatId || conv.id;

      // Determine other user:
      let otherUser = conv.user || conv.otherUser || null;

      // If participantIds exists, derive other user's id (exclude current user)
      if (
        (!otherUser || !otherUser._id) &&
        Array.isArray(conv.participantIds)
      ) {
        const otherId =
          conv.participantIds.find((p) => p !== currentUserId) ||
          conv.participantIds[0];
        // create minimal otherUser placeholder so UI has an id
        otherUser = { id: otherId, _id: otherId };
      }

      // Normalize id/name/avatar fields
      const otherUserId = otherUser?.id || otherUser?._id || otherUser?._id;
      const otherUserName =
        otherUser?.name || otherUser?.displayName || "Unknown User";
      const otherUserAvatar = otherUser?.avatar || otherUser?.photo || null;

      // Compute a numeric timestamp for sorting: prefer lastMessage.timestamp, then conv.timestamp, then updatedAt
      const lastMessageTs =
        conv.lastMessage?.timestamp ||
        conv.timestamp ||
        conv.updatedAt ||
        conv.createdAt;
      const timeMs = toMillis(lastMessageTs);

      // Compose normalized conversation object
      const normalized = {
        ...conv,
        chatKey,
        timeMs,
        otherUser: {
          id: otherUserId,
          name: otherUserName,
          avatar: otherUserAvatar,
        },
      };

      // If already have an entry for this chatKey, keep the newest one
      const existing = map.get(chatKey);
      if (!existing || normalized.timeMs > existing.timeMs) {
        map.set(chatKey, normalized);
      }
    }

    // Return array sorted by newest first
    return Array.from(map.values()).sort((a, b) => b.timeMs - a.timeMs);
  }, [conversations, currentUser]);

  // const filteredConversations = processedConversations.filter((conv) => {
  //   if (!conv || !conv.otherUser) return false;
  //   return conv.otherUser.name
  //     ?.toLowerCase()
  //     .includes(searchQuery.toLowerCase());
  // });

  const filteredConversations = processedConversations.filter((conv) => {
    if (!conv || !conv.otherUser) return false;
    return conv.otherUser.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  // const formatTime = (timestamp) => {
  //   if (!timestamp) return "";
  //   const date = new Date(timestamp);
  //   const now = new Date();
  //   const diff = now.getTime() - date.getTime();
  //   const hours = Math.floor(diff / (1000 * 60 * 60));
  //   const minutes = Math.floor(diff / (1000 * 60));

  //   if (minutes < 1) return "now";
  //   if (minutes < 60) return `${minutes}m`;
  //   if (hours < 24) return `${hours}h`;
  //   return date.toLocaleDateString();
  // };

  const formatTime = (timestampOrMs) => {
    if (!timestampOrMs) return "";
    const ms =
      typeof timestampOrMs === "number"
        ? timestampOrMs
        : toMillis(timestampOrMs);
    if (!ms) return "";
    const date = new Date(ms);
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
      await onRefresh();
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Messages
              </h1>
              {/* Small WebSocket Status Dot */}
              {/* <div
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                title={isConnected ? "Connected" : "Disconnected"}
              ></div> */}
            </div>

            {/* Connection Status Icon on Right */}
            <div className="flex items-center space-x-2">
              <div
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                  isConnected
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                }`}
                title={
                  isConnected ? "WebSocket Connected" : "WebSocket Disconnected"
                }
              >
                {isConnected ? (
                  <Wifi className="h-3 w-3" />
                ) : (
                  <WifiOff className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">
                  {isConnected ? "Connected" : "Offline"}
                </span>
              </div>
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
        <div className="flex-1 overflow-y-auto" >
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {processedConversations.length === 0 ? (
                <>
                  <p>No conversations yet</p>
                  <p className="text-sm mt-1">
                    Click the + button to start a new conversation
                  </p>
                </>
              ) : (
                <>
                  <p>No conversations match your search</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </>
              )}
            </div>
          ) : 
          (
            filteredConversations.map((conversation,idx) => {
              const otherUser = conversation.otherUser;
              const isSelected = selectedConversation?.id === conversation.id;
              const userOnline = isUserOnline(otherUser.id);
              const key = conversation.id

              return (
                <div
                  key={key}
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
                      {/* Real-time Online Status */}
                      <div
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 ${
                          userOnline
                            ? "bg-green-500 border-white dark:border-gray-800"
                            : "bg-gray-400 border-white dark:border-gray-700"
                        }`}
                      ></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {otherUser.name || "Unknown User"}
                          </p>
                          {/* Online indicator text */}
                          {/* {userOnline && <span className="text-xs text-green-600 dark:text-green-400">●</span>} */}
                        </div>
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
                            conversation.lastMessage ||
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

        {/* Compact Mobile Notice */}
        <div className="border-t border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <div className="px-3 py-2">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-3 w-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <span className="font-medium">
                    Currently best viewed on desktop.{" "}
                  </span>{" "}
                  Mobile support is in progress.
                </p>
              </div>
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></div>
                <div
                  className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0.3s" }}
                ></div>
                <div
                  className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0.6s" }}
                ></div>
              </div>
            </div>
          </div>
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
