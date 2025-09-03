"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatWindow } from "./ChatWindow";
import { useTheme } from "@/contexts/ThemeContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { BACKEND_URL } from "@/configs/index";
import { API_CONFIG, getAuthHeaders } from "@/configs/api";
import { useAuth } from "@/contexts/AuthProvider";
import axios from "axios";

export function ChatLayout({ currentUser, targetUserId, targetUserName }) {
  const hasInitialized = useRef(false);
  const { onMessage } = useWebSocket();
  const { accessToken } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInfo, setUserInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchUserInfo = useCallback(async (userId, retries = 2) => {
    if (!userId) return null;

    const url = `${BACKEND_URL}/api/user/${userId}`;
    const maxAttempts = Math.max(1, retries + 1);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await axios.get(url, {
          withCredentials: true,
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : { "Content-Type": "application/json" },
          timeout: 5000, // optional: fail fast if backend is unresponsive
        });

        console.log(
          `fetchUserInfo: attempt ${attempt} status`,
          response.status
        );
        // support both shapes: { user: {...} } or {...}
        const userData = response.data?.user || response.data;

        // If backend returns an empty object/array, treat as failure to trigger retry
        if (
          userData &&
          typeof userData === "object" &&
          Object.keys(userData).length > 0
        ) {
          return userData;
        }

        // If payload is unexpectedly empty, throw to go to retry logic
        throw new Error("Empty user payload");
      } catch (err) {
        const status = err?.response?.status;
        console.warn(
          `fetchUserInfo: attempt ${attempt} failed for ${userId}.`,
          "status:",
          status,
          "error:",
          err.message || err
        );

        if (attempt === maxAttempts) {
          return null;
        }
        // incremental backoff: 1s, 2s, 3s...
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }

    return null;
  }, []);

  // Helper function to find conversation by user ID
  const findConversationByUserId = useCallback(
    (conversations, userId) => {
      return conversations.find((conv) => {
        // Check multiple possible matches
        return (
          conv.id === userId ||
          conv.otherUser?.id === userId ||
          conv.chatId === `chat_${currentUser?.id}_${userId}` ||
          conv.chatId === `chat_${userId}_${currentUser?.id}` ||
          // Also check participants array
          conv.participants?.some(
            (p) => p.id === userId && p.id !== currentUser?.id
          )
        );
      });
    },
    [currentUser?.id]
  );

  // Helper function to create a standardized conversation ID
  const createConversationId = useCallback((userId1, userId2) => {
    // Always use the same order to ensure consistency
    const sortedIds = [userId1, userId2].sort();
    return `chat_${sortedIds[0]}_${sortedIds[1]}`;
  }, []);

  // ✅ IMPROVED: WebSocket message handling with better user info resolution
  useEffect(() => {
    const unsubscribe = onMessage((data) => {
      if (data.type === "new_message") {
        const messageData = {
          id: data.messageId || `msg_${data.senderId}_${Date.now()}`,
          conversationId: data.conversation._id,
          senderId: data.senderId || data.userId,
          content: data.content,
          timestamp: data.timestamp || new Date().toISOString(),
          type: "text",
          receiverId: data.receiverId,
        };

        // Check if this message is for the current user
        const isForCurrentUser =
          messageData.senderId === currentUser?.id ||
          messageData.receiverId === currentUser?.id;

        if (!isForCurrentUser) {
          return;
        }

        // Determine the other user ID
        const otherUserId =
          messageData.senderId === currentUser?.id
            ? messageData.receiverId
            : messageData.senderId;

        // Add message to current conversation if it matches
        if (selectedConversation) {
          const isForCurrentConversation =
            selectedConversation.id === otherUserId ||
            selectedConversation.otherUser?.id === otherUserId ||
            selectedConversation.chatId ===
              createConversationId(currentUser.id, otherUserId);

          if (isForCurrentConversation) {
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

              if (exists) {
                return prev;
              }

              return [...prev, messageData];
            });
          }
        }

        // ✅ IMPROVED: Update or create conversation with proper user info fetching
        setConversations((prev) => {
          const currentConversations = Array.isArray(prev) ? prev : [];

          // Use the helper function to find existing conversation
          const existingConversation = findConversationByUserId(
            currentConversations,
            otherUserId
          );

          if (existingConversation) {
            // Update existing conversation

            const updatedConversations = currentConversations.map((conv) => {
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
                };
              }
              return conv;
            });

            // Move updated conversation to top
            const updatedConv = updatedConversations.find(
              (conv) =>
                conv === existingConversation ||
                conv.id === existingConversation.id
            );
            const otherConversations = updatedConversations.filter(
              (conv) => conv !== updatedConv
            );

            return [updatedConv, ...otherConversations];
          } else {
            // ✅ IMPROVED: Always fetch user info first before creating conversation

            // Fetch user info and create conversation with proper name
            fetchUserInfo(otherUserId)
              .then((fetchedUserInfo) => {
                if (fetchedUserInfo) {
                  setConversations((prevConversations) => {
                    const currentConvs = Array.isArray(prevConversations)
                      ? prevConversations
                      : [];

                    // Check again if conversation was created in the meantime
                    const stillExists = findConversationByUserId(
                      currentConvs,
                      otherUserId
                    );
                    if (stillExists) {
                      return currentConvs.map((conv) => {
                        if (conv === stillExists) {
                          return {
                            ...conv,
                            // ✅ Update with proper user name from API
                            otherUser: {
                              ...conv.otherUser,
                              name: fetchedUserInfo.name, // Use fetched name
                              email:
                                fetchedUserInfo.email || conv.otherUser.email,
                              avatar:
                                fetchedUserInfo.avatar || conv.otherUser.avatar,
                            },
                            lastMessage: {
                              id: messageData.id,
                              content: messageData.content,
                              timestamp: messageData.timestamp,
                              senderId: messageData.senderId,
                            },
                            updatedAt: messageData.timestamp,
                          };
                        }
                        return conv;
                      });
                    }

                    // Create standardized conversation ID
                    const standardConversationId = createConversationId(
                      currentUser.id,
                      otherUserId
                    );

                    const newConversation = {
                      id: otherUserId,
                      chatId: standardConversationId,
                      participants: [
                        {
                          id: currentUser.id,
                          name: currentUser.name || "You",
                          email: currentUser.email,
                          avatar: currentUser.avatar,
                          isOnline: true,
                        },
                        {
                          id: fetchedUserInfo.id,
                          name: fetchedUserInfo.name, // ✅ Use actual name from API
                          email: fetchedUserInfo.email,
                          avatar: fetchedUserInfo.avatar,
                          isOnline: false,
                        },
                      ],
                      otherUser: {
                        id: fetchedUserInfo.id,
                        name: fetchedUserInfo.name, // ✅ Use actual name from API
                        email: fetchedUserInfo.email,
                        avatar: fetchedUserInfo.avatar,
                        isOnline: false,
                      },
                      lastMessage: {
                        id: messageData.id,
                        content: messageData.content,
                        timestamp: messageData.timestamp,
                        senderId: messageData.senderId,
                      },
                      unreadCount:
                        messageData.senderId !== currentUser?.id ? 1 : 0,
                      createdAt: messageData.timestamp,
                      updatedAt: messageData.timestamp,
                    };

                    return [newConversation, ...currentConvs];
                  });
                } else {
                  console.warn(
                    "⚠️ Could not fetch user info for:",
                    otherUserId
                  );
                  // Use senderName from WebSocket data as fallback
                  const fallbackName =
                    data.senderName || `User ${otherUserId.substring(0, 8)}`;

                  setConversations((prevConversations) => {
                    const currentConvs = Array.isArray(prevConversations)
                      ? prevConversations
                      : [];

                    const stillExists = findConversationByUserId(
                      currentConvs,
                      otherUserId
                    );
                    if (stillExists) return currentConvs;

                    const standardConversationId = createConversationId(
                      currentUser.id,
                      otherUserId
                    );

                    const fallbackConversation = {
                      id: otherUserId,
                      chatId: standardConversationId,
                      participants: [
                        {
                          id: currentUser.id,
                          name: currentUser.name || "You",
                          email: currentUser.email,
                          avatar: currentUser.avatar,
                          isOnline: true,
                        },
                        {
                          id: otherUserId,
                          name: fallbackName, // ✅ Use senderName if available
                          email: `user${otherUserId.substring(
                            0,
                            8
                          )}@example.com`,
                          avatar: data.senderAvatar || null,
                          isOnline: false,
                        },
                      ],
                      otherUser: {
                        id: otherUserId,
                        name: fallbackName, // ✅ Use senderName if available
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
                      unreadCount:
                        messageData.senderId !== currentUser?.id ? 1 : 0,
                      createdAt: messageData.timestamp,
                      updatedAt: messageData.timestamp,
                    };

                    return [fallbackConversation, ...currentConvs];
                  });
                }
              })
              .catch((error) => {
                console.error("❌ Error fetching user info:", error);
              });

            // Return current conversations unchanged for now
            return currentConversations;
          }
        });
      }
    });

    return unsubscribe;
  }, [
    onMessage,
    selectedConversation,
    currentUser,
    fetchUserInfo,
    findConversationByUserId,
    createConversationId,
  ]);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {

      const response = await axios.get(
        `${BACKEND_URL}/api/chat/conversations`,
        {
          withCredentials: true,
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
        }
      );

      // Debug: inspect the exact axios response shape
      // console.log("axios response.status:", response.status);
      // console.log(
      //   "axios response.data:",
      //   JSON.stringify(response.data, null, 2)
      // );

      // axios returns payload in response.data
      const data = response.data;
      // support both shapes: { conversations: [...] } or direct array
      const conversationsData = Array.isArray(data?.conversations)
        ? data.conversations
        : Array.isArray(data)
        ? data
        : [];

      // console.log("parsed conversationsData:", conversationsData);

      // fetch user info / dedupe logic (kept from your code, but made defensive)
      const conversationsWithUserInfo = await Promise.all(
        conversationsData.map(async (conv) => {
          const otherUserId = conv.otherUser?.id || conv.id;

          if (
            conv.otherUser?.name &&
            !conv.otherUser.name.startsWith("User ")
          ) {
            return conv;
          }

          const userInfo = otherUserId
            ? await fetchUserInfo(otherUserId)
            : null;
          if (userInfo) {
            return {
              ...conv,
              otherUser: {
                ...conv.otherUser,
                name: userInfo.name,
                email: userInfo.email,
                avatar: userInfo.avatar,
              },
            };
          }
          return conv;
        })
      );

      // Deduplicate by otherUserId (defensive checks)
      const deduplicatedConversations = conversationsWithUserInfo.reduce(
        (acc, conv) => {
          const otherUserId = conv.otherUser?.id || conv.id;
          if (!otherUserId) {
            // if no id available, just include it
            acc.push(conv);
            return acc;
          }
          const existingIndex = acc.findIndex(
            (c) => (c.otherUser?.id || c.id) === otherUserId
          );
          if (existingIndex === -1) {
            acc.push(conv);
          } else {
            const existing = acc[existingIndex];
            const existingTime = new Date(
              existing.updatedAt || existing.createdAt || 0
            );
            const currentTime = new Date(conv.updatedAt || conv.createdAt || 0);
            if (currentTime > existingTime) acc[existingIndex] = conv;
          }
          return acc;
        },
        []
      );

      setConversations(deduplicatedConversations);
      return deduplicatedConversations;
    } catch (err) {
      console.warn("⚠️ Frontend fetch error:", err);

      // axios error object may contain useful info
      const serverMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Unknown error";

      setError(`Network/server error: ${serverMessage}`);
      setConversations([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchUserInfo, accessToken]);

  const fetchMessages = useCallback(async (conversationId) => {
    try {
      // const response = await fetch(
      //   `${API_CONFIG.ENDPOINTS.CHAT.MESSAGES}?receiverId=${conversationId}`,
      //   {
      //     credentials: "include",
      //     headers: getAuthHeaders(accessToken),
      //   }
      // );

      const response = await axios.get(
        `${BACKEND_URL}/api/chat/messages?receiverId=${conversationId}`,
        {
          withCredentials: true,
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
        }
      );

      if (response.ok) {
        const data = response.data()
        const messagesData = data.messages || [];
        const userInfoData = data.userInfo || {};
        setMessages([...messagesData]);
        setUserInfo(userInfoData);
      } else {
        console.error("Failed to fetch messages:", response.status);
        setMessages([]);
        setUserInfo({});
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
      setUserInfo({});
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const updatedConversations = await fetchConversations();

      if (selectedConversation) {
        await fetchMessages(selectedConversation.id);

        const updatedSelected = updatedConversations.find(
          (c) => c.id === selectedConversation.id
        );
        if (updatedSelected) {
          setSelectedConversation(updatedSelected);
        }
      }
    } catch (error) {
      console.warn("⚠️ Refresh failed:", error.message);
      setError(`Refresh failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [fetchConversations, fetchMessages, selectedConversation]);

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

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation, fetchMessages]);

  const handleDirectChat = async (userId, userName) => {
    // Use the helper function to find existing conversation
    const existing = findConversationByUserId(conversations, userId);

    if (existing) {
      setSelectedConversation(existing);
    } else {
      await createNewConversation(userId, userName);
    }
  };

  const createNewConversation = async (userId, userName) => {
    if (creatingConversation) {
      return;
    }

    setCreatingConversation(true);
    try {
      // ✅ IMPROVED: Fetch actual user info instead of using URL parameter
      const userInfo = await fetchUserInfo(userId);
      const actualUserName = userInfo?.name || userName;
      const actualUserEmail =
        userInfo?.email ||
        `${userName.toLowerCase().replace(/\s+/g, "")}@example.com`;
      const actualUserAvatar = userInfo?.avatar || null;

      // Use standardized conversation ID
      const standardConversationId = createConversationId(
        currentUser.id,
        userId
      );

      const newConversation = {
        id: userId, // Use other user ID as conversation ID
        chatId: standardConversationId,
        participants: [
          {
            id: currentUser.id,
            name: currentUser.name || "You",
            email: currentUser.email,
            avatar: currentUser.avatar,
            isOnline: true,
          },
          {
            id: userId,
            name: actualUserName, // ✅ Use fetched name
            email: actualUserEmail,
            avatar: actualUserAvatar,
            isOnline: false,
          },
        ],
        otherUser: {
          id: userId,
          name: actualUserName, // ✅ Use fetched name
          email: actualUserEmail,
          avatar: actualUserAvatar,
          isOnline: false,
        },
        lastMessage: null,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setConversations((prev) => {
        const currentConversations = Array.isArray(prev) ? prev : [];

        // Check if conversation already exists before adding
        const existing = findConversationByUserId(currentConversations, userId);
        if (existing) {
          return currentConversations;
        }

        return [newConversation, ...currentConversations];
      });
      setSelectedConversation(newConversation);
      setMessages([]);
      setUserInfo({});
    } catch (error) {
      console.error("❌ Error creating conversation:", error);
      setError(`Failed to create conversation: ${error.message}`);
    } finally {
      setCreatingConversation(false);
    }
  };

  const sendMessage = async (content) => {
    if (!selectedConversation) {
      console.error("❌ No conversation selected");
      return;
    }

    try {
      const response = await axios.get(`${BACKEND_URL}/api/chat/messages`, {
        withCredentials: true,
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : { "Content-Type": "application/json" },
      });

      console.log("chat layout : ", response);
      if (response.ok) {
        const newMessage = response.data;

        // Add message locally for immediate feedback
        setMessages((prev) => {
          // Check for duplicates
          const exists = prev.some((msg) => msg.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage];
        });

        // Update conversation's last message
        setConversations((prev) => {
          const currentConversations = Array.isArray(prev) ? prev : [];
          return currentConversations.map((conv) =>
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
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to send message");
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      throw error;
    }
  };

  const handleNewConversation = (conversation) => {
    setConversations((prev) => {
      const currentConversations = Array.isArray(prev) ? prev : [];

      // Check for duplicates before adding
      const existing = findConversationByUserId(
        currentConversations,
        conversation.otherUser?.id || conversation.id
      );
      if (existing) {
        return currentConversations;
      }

      return [conversation, ...currentConversations];
    });
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading conversations...
          </p>
          {targetUserId && targetUserName && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Preparing chat with {targetUserName}...
            </p>
          )}
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
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 max-w-6xl mx-auto p-4">
      <ChatSidebar
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={handleConversationSelect}
        currentUser={currentUser}
        onNewConversation={handleNewConversation}
        onRefreshMessages={handleRefresh}
        onRefresh={fetchConversations}
      />
      <ChatWindow
        conversation={selectedConversation}
        messages={messages}
        currentUser={currentUser}
        userInfo={userInfo}
        onSendMessage={sendMessage}
        onRefreshMessages={handleRefresh}
      />
    </div>
  );
}
