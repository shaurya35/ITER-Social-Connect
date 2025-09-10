"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatWindow } from "./ChatWindow";
import { MobileChatNavigation } from "./MobileChatNavigation";
import { ConversationSkeleton } from "./ConversationSkeleton";
import { ThemeLoader } from "./ThemeLoader";
import { useTheme } from "@/contexts/ThemeContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { BACKEND_URL } from "@/configs/index";
import { useAuth } from "@/contexts/AuthProvider";
import { ArrowLeft,Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";

export function ChatLayout({ currentUser, targetUserId, targetUserName }) {
  const { onMessage, isConnected } = useWebSocket();
  const { accessToken } = useAuth();
  const hasInitialized = useRef(false);

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMobileConversations, setShowMobileConversations] = useState(false);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${BACKEND_URL}/api/chat/conversations`, {
        withCredentials: true,
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      const conversationsData = response.data.conversations || [];
      
      // Transform conversations to match expected format and deduplicate
      const conversationMap = new Map();
      
      conversationsData.forEach(conv => {
        const userId = conv.user?._id || conv.id;
        if (!userId) return;
        
        // Use userId as the key to prevent duplicates
        if (!conversationMap.has(userId)) {
          conversationMap.set(userId, {
            id: userId,
            otherUser: {
              id: userId,
              name: conv.user?.name || "Unknown User",
              email: conv.user?.email || "user@example.com",
              avatar: conv.user?.avatar || null,
              isOnline: false,
            },
            lastMessage: conv.lastMessage ? {
              id: `msg_${Date.now()}_${userId}`,
              content: conv.lastMessage,
              timestamp: conv.timestamp?.seconds ? 
                new Date(conv.timestamp.seconds * 1000).toISOString() : 
                new Date().toISOString(),
              senderId: userId,
            } : null,
            unreadCount: 0,
            createdAt: conv.timestamp?.seconds ? 
              new Date(conv.timestamp.seconds * 1000).toISOString() : 
              new Date().toISOString(),
            updatedAt: conv.timestamp?.seconds ? 
              new Date(conv.timestamp.seconds * 1000).toISOString() : 
              new Date().toISOString(),
          });
        }
      });
      
      const transformedConversations = Array.from(conversationMap.values());
      setConversations(transformedConversations);
    } catch (err) {
      setError(`Failed to load conversations: ${err.message}`);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/chat/messages?receiverId=${conversationId}`,
        {
          withCredentials: true,
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        }
      );
      
      if (response.status === 200) {
        const data = response.data;
        const messagesData = data.messages || [];
        
        // Transform messages to ensure consistent format
        const transformedMessages = messagesData.map(msg => ({
          id: msg.id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          content: msg.text || msg.content,
          text: msg.text || msg.content,
          timestamp: msg.timestamp?.seconds ? 
            new Date(msg.timestamp.seconds * 1000).toISOString() : 
            msg.timestamp || new Date().toISOString(),
          type: msg.type || "text",
          isRead: msg.isRead || false,
        }));
        
        setMessages(transformedMessages);
      }
    } catch (error) {
      setMessages([]);
    }
  }, [accessToken]);

  // Send message
  const sendMessage = async (content) => {
    if (!selectedConversation || !content?.trim()) {
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/chat/message`, {
        receiverId: selectedConversation.id,
        text: content.trim()
      }, {
        withCredentials: true,
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      
      if (response.data && response.data.status === "sent") {
        const newMessage = {
          id: `msg_${currentUser.id}_${Date.now()}`,
          senderId: currentUser.id,
          receiverId: selectedConversation.id,
          content: content.trim(),
          text: content.trim(),
          timestamp: new Date().toISOString(),
          type: "text",
          isRead: false,
        };

        // Add message locally for immediate feedback
        setMessages((prev) => {
          const exists = prev.some((msg) => 
            msg.id === newMessage.id || 
            (msg.senderId === newMessage.senderId && 
             msg.content === newMessage.content && 
             Math.abs(new Date(msg.timestamp) - new Date(newMessage.timestamp)) < 1000)
          );
          if (exists) return prev;
          return [...prev, newMessage];
        });

        // Update conversation's last message
        setConversations((prev) => {
          return prev.map((conv) =>
            conv.id === selectedConversation.id
              ? {
                  ...conv,
                  lastMessage: {
                    id: newMessage.id,
                    content: newMessage.content,
                    timestamp: newMessage.timestamp,
                    senderId: newMessage.senderId,
                  },
                  updatedAt: newMessage.timestamp,
                }
              : conv
          );
        });
      }
    } catch (error) {
      throw error;
    }
  };

  // Handle WebSocket messages
  useEffect(() => {
    const unsubscribe = onMessage((data) => {
      if (data.type === "new_message") {
        const messageData = {
          id: data.messageId || `msg_${data.senderId}_${Date.now()}`,
          senderId: data.senderId || data.userId,
          receiverId: data.receiverId,
          content: data.content,
          text: data.content,
          timestamp: data.timestamp || new Date().toISOString(),
          type: "text",
          isRead: false,
        };

        // Check if this message is for the current user
        const isForCurrentUser =
          messageData.senderId === currentUser?.id ||
          messageData.receiverId === currentUser?.id;

        if (!isForCurrentUser) {
          return;
        }

        // Add message to current conversation if it matches
        if (selectedConversation && 
            (selectedConversation.id === messageData.senderId || 
             selectedConversation.id === messageData.receiverId)) {
          setMessages((prev) => {
            const exists = prev.some(
              (msg) =>
                msg.id === messageData.id ||
                (msg.senderId === messageData.senderId &&
                 msg.content === messageData.content &&
                 Math.abs(
                   new Date(msg.timestamp) - new Date(messageData.timestamp)
                 ) < 1000)
            );

            if (exists) return prev;
            return [...prev, messageData];
          });
        }

        // Update or create conversation
        setConversations((prev) => {
          const otherUserId = messageData.senderId === currentUser?.id
            ? messageData.receiverId
            : messageData.senderId;

          const existingConversation = prev.find(conv => 
            conv.id === otherUserId || 
            conv.otherUser?.id === otherUserId
          );

          if (existingConversation) {
            // Update existing conversation
            return prev.map((conv) => {
              if (conv === existingConversation) {
                return {
                  ...conv,
                  lastMessage: {
                    id: messageData.id,
                    content: messageData.content,
                    timestamp: messageData.timestamp,
                    senderId: messageData.senderId,
                  },
                  updatedAt: messageData.timestamp,
                  unreadCount: messageData.senderId !== currentUser?.id ? 
                    (conv.unreadCount || 0) + 1 : conv.unreadCount || 0,
                };
              }
              return conv;
            });
          } else {
            // Create new conversation only if it doesn't exist
            const newConversation = {
              id: otherUserId,
              otherUser: {
                id: otherUserId,
                name: data.senderName || `User ${otherUserId.substring(0, 8)}`,
                email: `user${otherUserId.substring(0, 8)}@example.com`,
                avatar: data.senderAvatar || null,
                isOnline: false,
              },
              lastMessage: {
                id: messageData.id,
                content: messageData.content,
                timestamp: messageData.timestamp,
                senderId: messageData.senderId,
              },
              unreadCount: messageData.senderId !== currentUser?.id ? 1 : 0,
              createdAt: messageData.timestamp,
              updatedAt: messageData.timestamp,
            };

            // Check if conversation already exists before adding
            const alreadyExists = prev.some(conv => conv.id === otherUserId);
            if (alreadyExists) {
              return prev; // Don't add duplicate
            }

            return [newConversation, ...prev];
          }
        });
      }
    });

    return unsubscribe;
  }, [onMessage, selectedConversation, currentUser]);

  // Handle direct chat creation when URL parameters are provided
  useEffect(() => {
    if (
      targetUserId &&
      targetUserName &&
      currentUser &&
      !loading &&
      !hasInitialized.current
    ) {
      hasInitialized.current = true;
      handleDirectChat(targetUserId, targetUserName);
    }
  }, [targetUserId, targetUserName, currentUser, loading, conversations]);

  const handleDirectChat = async (userId, userName) => {
    // Find existing conversation
    const existing = conversations.find(conv => 
      conv.id === userId || 
      conv.otherUser?.id === userId
    );

    if (existing) {
      setSelectedConversation(existing);
    } else {
      // Create new conversation and add to list
      const newConversation = {
        id: userId,
        otherUser: {
          id: userId,
          name: userName || `User ${userId.substring(0, 8)}`,
          email: `user${userId.substring(0, 8)}@example.com`,
          avatar: null,
          isOnline: false,
        },
        lastMessage: null,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to conversations list with deduplication
      setConversations((prev) => {
        const currentConversations = Array.isArray(prev) ? prev : [];
        const exists = currentConversations.find(conv => conv.id === userId);
        if (exists) {
          // If conversation exists, select it instead of creating duplicate
          setSelectedConversation(exists);
          return currentConversations;
        }
        return [newConversation, ...currentConversations];
      });
      
      setSelectedConversation(newConversation);
      setMessages([]);
    }
  };


  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Clean up any duplicate conversations
  useEffect(() => {
    if (conversations.length > 0) {
      const uniqueConversations = conversations.reduce((acc, conv) => {
        const key = conv.id || conv.otherUser?.id;
        if (key && !acc.find(existing => existing.id === key)) {
          acc.push(conv);
        }
        return acc;
      }, []);
      
      if (uniqueConversations.length !== conversations.length) {
        setConversations(uniqueConversations);
      }
    }
  }, [conversations]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, fetchMessages]);

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    // On mobile, hide sidebar when conversation is selected
    setShowSidebar(false);
    setShowMobileConversations(false);
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchConversations();
    } catch (error) {
      setError(`Refresh failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const toggleMobileConversations = () => {
    setShowMobileConversations(!showMobileConversations);
  };

  const handleCreateNew = () => {
    // For now, just show conversations
    setShowMobileConversations(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
        <div className="text-center flex flex-col items-center justify-center">
          <ThemeLoader size="xl" type="spinner" />
          <p className="text-gray-600 dark:text-gray-300 mt-4 text-lg">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Chat Error
            </h3>
            <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full fixed w-full bg-gray-50 dark:bg-gray-900 max-w-6xl mx-auto overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80">
        <ChatSidebar
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleConversationSelect}
          currentUser={currentUser}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Mobile Layout - Show conversations by default */}
      <div className="lg:hidden flex-1 flex flex-col">
        {!selectedConversation ? (
          // Mobile: Show conversations list by default
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Messages
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="p-2"
              >
                <Mail className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Mobile Conversations */}
            <MobileChatNavigation
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleConversationSelect}
              currentUser={currentUser}
              onRefresh={handleRefresh}
              onCreateNew={handleCreateNew}
              loading={loading}
            />
          </div>
        ) : (
          // Mobile: Show chat window when conversation is selected
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Mobile Chat Header - Sticky */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConversation(null)}
                  className="p-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {selectedConversation.otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.otherUser?.name || 'Unknown User'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedConversation.otherUser?.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Window Content */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <ChatWindow
                conversation={selectedConversation}
                messages={messages}
                currentUser={currentUser}
                onSendMessage={sendMessage}
                onBack={() => setSelectedConversation(null)}
                loading={loading}
              />
            </div>
          </div>
        )}
      </div>

      {/* Desktop Chat Window */}
      <div className="hidden lg:flex flex-1 h-full flex-col min-w-0">
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatWindow
            conversation={selectedConversation}
            messages={messages}
            currentUser={currentUser}
            onSendMessage={sendMessage}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}